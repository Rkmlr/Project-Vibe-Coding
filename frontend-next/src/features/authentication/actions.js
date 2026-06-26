"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

/**
 * Login user
 */
export async function login(formData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

/**
 * Logout user
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Register and onboard user (create or join family)
 */
export async function signup(state, formData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const displayName = formData.get("displayName");
  const mode = formData.get("mode"); // "create" or "join"
  const familyName = formData.get("familyName");
  const inviteCode = formData.get("inviteCode");

  const supabase = await createClient();

  // 1. Sign up the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  // 2. Perform onboarding (Create or Join family)
  if (mode === "create") {
    // Auto-generate invite code based on family name
    const generatedCode = `${familyName.replace(/\s+/g, "-").toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { error: rpcError } = await supabase.rpc("create_family_and_set_admin", {
      family_name: familyName,
      invite_code: generatedCode,
    });

    if (rpcError) {
      return { error: `Gagal membuat keluarga: ${rpcError.message}` };
    }
  } else if (mode === "join") {
    const { error: rpcError } = await supabase.rpc("join_family_by_code", {
      p_invite_code: inviteCode.trim(),
    });

    if (rpcError) {
      return { error: `Gagal bergabung: ${rpcError.message}` };
    }
  }

  redirect("/dashboard");
}
