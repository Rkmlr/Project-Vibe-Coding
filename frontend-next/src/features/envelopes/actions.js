"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Helper to check if current user is admin and get their family_id
 */
async function getAdminProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized: Tidak terautentikasi.");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("family_id, role")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.role !== "admin" || !profile.family_id) {
    throw new Error("Unauthorized: Hanya orang tua yang memiliki akses.");
  }

  return profile;
}

/**
 * Create a new envelope
 */
export async function createEnvelope(name, limitAmount, category) {
  try {
    const profile = await getAdminProfile();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("envelopes")
      .insert({
        family_id: profile.family_id,
        name,
        limit_amount: parseFloat(limitAmount),
        category,
        balance: 0, // Initial balance is 0
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard");
    return { success: true, data };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Update an envelope's name, limit, and category
 */
export async function updateEnvelope(envelopeId, name, limitAmount, category) {
  try {
    await getAdminProfile();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("envelopes")
      .update({
        name,
        limit_amount: parseFloat(limitAmount),
        category,
      })
      .eq("id", envelopeId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard");
    return { success: true, data };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Delete an envelope and handle remaining balance (reallocate or return to Cash Pool)
 */
export async function deleteEnvelope(envelopeId, reallocateToId = null) {
  try {
    const profile = await getAdminProfile();
    const supabase = await createClient();

    // 1. Get the envelope's current balance
    const { data: envelope, error: fetchError } = await supabase
      .from("envelopes")
      .select("balance, name")
      .eq("id", envelopeId)
      .single();

    if (fetchError) throw new Error("Amplop tidak ditemukan.");

    const balanceToMove = parseFloat(envelope.balance);

    if (balanceToMove > 0) {
      if (reallocateToId) {
        // Reallocate to another envelope
        const { data: targetEnv, error: targetError } = await supabase
          .from("envelopes")
          .select("balance, name")
          .eq("id", reallocateToId)
          .single();

        if (targetError) throw new Error("Amplop target realokasi tidak ditemukan.");

        // Update target envelope balance
        await supabase
          .from("envelopes")
          .update({ balance: parseFloat(targetEnv.balance) + balanceToMove })
          .eq("id", reallocateToId);

        // Record transfer transaction
        await supabase.from("transactions").insert({
          family_id: profile.family_id,
          envelope_id: reallocateToId,
          source_envelope_id: envelopeId,
          amount: balanceToMove,
          type: "TRANSFER",
          description: `Realokasi saldo dari penghapusan amplop '${envelope.name}'`,
          source: "APP",
        });
      } else {
        // Return to Cash Pool (Default)
        const { data: family, error: familyError } = await supabase
          .from("families")
          .select("cash_pool_balance")
          .eq("id", profile.family_id)
          .single();

        if (familyError) throw new Error("Grup keluarga tidak ditemukan.");

        // Add back to family cash pool
        await supabase
          .from("families")
          .update({ cash_pool_balance: parseFloat(family.cash_pool_balance) + balanceToMove })
          .eq("id", profile.family_id);

        // Record income transaction to Cash Pool
        await supabase.from("transactions").insert({
          family_id: profile.family_id,
          amount: balanceToMove,
          type: "INCOME",
          description: `Pengembalian sisa dana dari penghapusan amplop '${envelope.name}' ke Kas Utama`,
          source: "APP",
        });
      }
    }

    // 2. Delete the envelope
    const { error: deleteError } = await supabase
      .from("envelopes")
      .delete()
      .eq("id", envelopeId);

    if (deleteError) throw new Error(deleteError.message);

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Rollover (Close Monthly Book)
 */
export async function closeMonthlyBook(method, savingsEnvelopeId = null) {
  try {
    const profile = await getAdminProfile();
    const supabase = await createClient();

    // 1. Fetch all envelopes in the family
    const { data: envelopes, error: fetchError } = await supabase
      .from("envelopes")
      .select("*")
      .eq("family_id", profile.family_id);

    if (fetchError) throw new Error("Gagal mengambil data amplop.");

    let totalRemaining = 0;
    const envelopeUpdates = [];

    // Filter envelopes with balance > 0
    envelopes.forEach((env) => {
      if (parseFloat(env.balance) > 0) {
        // Skip the target savings envelope if moving to savings
        if (method === "savings" && env.id === savingsEnvelopeId) {
          return;
        }
        totalRemaining += parseFloat(env.balance);
        envelopeUpdates.push(env);
      }
    });

    if (totalRemaining <= 0) {
      return { success: true, message: "Semua amplop sudah kosong. Tidak ada saldo untuk dipindahkan." };
    }

    if (method === "sweep") {
      // Option A: Sweep all back to Cash Pool
      const { data: family } = await supabase
        .from("families")
        .select("cash_pool_balance")
        .eq("id", profile.family_id)
        .single();

      await supabase
        .from("families")
        .update({ cash_pool_balance: parseFloat(family.cash_pool_balance) + totalRemaining })
        .eq("id", profile.family_id);

      // Set all envelope balances to 0
      for (const env of envelopeUpdates) {
        await supabase.from("envelopes").update({ balance: 0 }).eq("id", env.id);
      }

      // Log transaction
      await supabase.from("transactions").insert({
        family_id: profile.family_id,
        amount: totalRemaining,
        type: "INCOME",
        description: "Tutup Buku Bulanan: Tarik semua sisa saldo amplop ke Kas Utama",
        source: "APP",
      });
    } else if (method === "savings") {
      // Option B: Move to savings envelope
      if (!savingsEnvelopeId) throw new Error("Harap pilih amplop tabungan tujuan.");

      const { data: savingsEnv } = await supabase
        .from("envelopes")
        .select("balance, name")
        .eq("id", savingsEnvelopeId)
        .single();

      // Add to savings envelope
      await supabase
        .from("envelopes")
        .update({ balance: parseFloat(savingsEnv.balance) + totalRemaining })
        .eq("id", savingsEnvelopeId);

      // Set other envelope balances to 0
      for (const env of envelopeUpdates) {
        await supabase.from("envelopes").update({ balance: 0 }).eq("id", env.id);
        
        // Log transaction for each
        await supabase.from("transactions").insert({
          family_id: profile.family_id,
          envelope_id: savingsEnvelopeId,
          source_envelope_id: env.id,
          amount: parseFloat(env.balance),
          type: "TRANSFER",
          description: `Tutup Buku Bulanan: Pindahan sisa saldo dari '${env.name}' ke Tabungan '${savingsEnv.name}'`,
          source: "APP",
        });
      }
    } else if (method === "rollover") {
      // Option C: Accumulate (Do nothing to balance, just let it carry over)
      // Balance is kept, so we just log a system event in audit logs
      // No envelope updates are needed.
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}
