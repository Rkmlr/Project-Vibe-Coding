"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Helper to get the logged-in user profile
 */
async function getUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized: Anda belum login.");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, family_id, role")
    .eq("id", user.id)
    .single();

  if (error || !profile || !profile.family_id) {
    throw new Error("Unauthorized: Profil keluarga tidak ditemukan.");
  }

  return profile;
}

/**
 * Add a new transaction (Income or Expense)
 */
export async function addTransaction(payload) {
  try {
    const profile = await getUserProfile();
    const supabase = await createClient();
    const { envelopeId, amount, type, description, category } = payload;
    
    const parsedAmount = Math.abs(parseFloat(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("Jumlah transaksi tidak valid.");
    }

    if (type === "INCOME") {
      // 1. Verification: Only Admins (Parents) can add Income
      if (profile.role !== "admin") {
        throw new Error("Unauthorized: Hanya orang tua yang dapat mencatat pemasukan.");
      }

      // 2. Fetch current family cash pool balance
      const { data: family, error: famError } = await supabase
        .from("families")
        .select("cash_pool_balance")
        .eq("id", profile.family_id)
        .single();

      if (famError) throw new Error("Grup keluarga tidak ditemukan.");

      // 3. Update family cash pool
      const { error: updateFamError } = await supabase
        .from("families")
        .update({ cash_pool_balance: parseFloat(family.cash_pool_balance) + parsedAmount })
        .eq("id", profile.family_id);

      if (updateFamError) throw new Error("Gagal memperbarui Kas Utama.");

      // 4. Insert transaction record (no envelope_id)
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          family_id: profile.family_id,
          profile_id: profile.id,
          envelope_id: null,
          amount: parsedAmount,
          type: "INCOME",
          description: description || "Pemasukan Keluarga",
          source: "APP",
        });

      if (txError) throw new Error(txError.message);

    } else if (type === "EXPENSE") {
      if (!envelopeId) throw new Error("Harap pilih pos amplop anggaran.");

      // 1. Fetch current envelope details
      const { data: envelope, error: envError } = await supabase
        .from("envelopes")
        .select("balance, name, limit_amount")
        .eq("id", envelopeId)
        .single();

      if (envError) throw new Error("Amplop anggaran tidak ditemukan.");

      const currentBalance = parseFloat(envelope.balance);

      // 2. Check if envelope balance is sufficient
      if (currentBalance < parsedAmount) {
        throw new Error(`Saldo amplop '${envelope.name}' tidak mencukupi (Sisa: Rp${currentBalance.toLocaleString('id-ID')}). Harap minta Orang Tua melakukan realokasi dana.`);
      }

      // 3. Update envelope balance (decrement)
      const { error: updateEnvError } = await supabase
        .from("envelopes")
        .update({ balance: currentBalance - parsedAmount })
        .eq("id", envelopeId);

      if (updateEnvError) throw new Error("Gagal memperbarui saldo amplop.");

      // 4. Insert transaction record
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          family_id: profile.family_id,
          profile_id: profile.id,
          envelope_id: envelopeId,
          amount: -parsedAmount, // Negative for expenses
          type: "EXPENSE",
          description: description || "Pengeluaran Harian",
          source: "APP",
        });

      if (txError) throw new Error(txError.message);
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Transfer funds between envelopes or from Main Cash Pool to an envelope
 */
export async function transferBalance(payload) {
  try {
    const profile = await getUserProfile();
    const supabase = await createClient();
    const { sourceEnvelopeId, targetEnvelopeId, amount } = payload;

    if (profile.role !== "admin") {
      throw new Error("Unauthorized: Hanya orang tua yang dapat mentransfer anggaran.");
    }

    const parsedAmount = Math.abs(parseFloat(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("Jumlah transfer tidak valid.");
    }

    if (!targetEnvelopeId) {
      throw new Error("Harap pilih amplop target transfer.");
    }

    if (sourceEnvelopeId === targetEnvelopeId) {
      throw new Error("Amplop sumber dan target tidak boleh sama.");
    }

    // 1. Handle source deduction
    if (!sourceEnvelopeId) {
      // Transferring from Kas Utama (Main Cash Pool)
      const { data: family, error: famError } = await supabase
        .from("families")
        .select("cash_pool_balance")
        .eq("id", profile.family_id)
        .single();

      if (famError) throw new Error("Keluarga tidak ditemukan.");

      const currentCashPool = parseFloat(family.cash_pool_balance);
      if (currentCashPool < parsedAmount) {
        throw new Error(`Saldo Kas Utama tidak mencukupi (Sisa: Rp${currentCashPool.toLocaleString('id-ID')}).`);
      }

      // Deduct from family cash pool
      await supabase
        .from("families")
        .update({ cash_pool_balance: currentCashPool - parsedAmount })
        .eq("id", profile.family_id);

      // Increment target envelope balance
      const { data: targetEnv, error: targetError } = await supabase
        .from("envelopes")
        .select("balance, name")
        .eq("id", targetEnvelopeId)
        .single();

      if (targetError) throw new Error("Amplop target tidak ditemukan.");

      await supabase
        .from("envelopes")
        .update({ balance: parseFloat(targetEnv.balance) + parsedAmount })
        .eq("id", targetEnvelopeId);

      // Record transaction
      await supabase.from("transactions").insert({
        family_id: profile.family_id,
        profile_id: profile.id,
        envelope_id: targetEnvelopeId,
        source_envelope_id: null,
        amount: parsedAmount,
        type: "TRANSFER",
        description: `Alokasi dana dari Kas Utama ke amplop '${targetEnv.name}'`,
        source: "APP",
      });

    } else {
      // Transferring from Envelope A to Envelope B
      const { data: sourceEnv, error: sourceError } = await supabase
        .from("envelopes")
        .select("balance, name")
        .eq("id", sourceEnvelopeId)
        .single();

      if (sourceError) throw new Error("Amplop sumber tidak ditemukan.");

      const sourceBalance = parseFloat(sourceEnv.balance);
      if (sourceBalance < parsedAmount) {
        throw new Error(`Saldo amplop '${sourceEnv.name}' tidak mencukupi (Sisa: Rp${sourceBalance.toLocaleString('id-ID')}).`);
      }

      // Deduct from source envelope
      await supabase
        .from("envelopes")
        .update({ balance: sourceBalance - parsedAmount })
        .eq("id", sourceEnvelopeId);

      // Increment target envelope balance
      const { data: targetEnv, error: targetError } = await supabase
        .from("envelopes")
        .select("balance, name")
        .eq("id", targetEnvelopeId)
        .single();

      if (targetError) throw new Error("Amplop target tidak ditemukan.");

      await supabase
        .from("envelopes")
        .update({ balance: parseFloat(targetEnv.balance) + parsedAmount })
        .eq("id", targetEnvelopeId);

      // Record transaction
      await supabase.from("transactions").insert({
        family_id: profile.family_id,
        profile_id: profile.id,
        envelope_id: targetEnvelopeId,
        source_envelope_id: sourceEnvelopeId,
        amount: parsedAmount,
        type: "TRANSFER",
        description: `Pemindahan saldo dari amplop '${sourceEnv.name}' ke '${targetEnv.name}'`,
        source: "APP",
      });
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}
