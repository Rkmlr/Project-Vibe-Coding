/**
 * BUSINESS LAYER — Auth Service
 *
 * Mengandung seluruh business rules untuk fitur Autentikasi dan Registrasi/Onboarding.
 * Fungsi-fungsi di sini menerima data MURNI (bukan objek request/response HTTP).
 * Service memanggil Repository untuk akses data.
 */

import crypto from 'crypto';
import { getProfileById } from '@/repositories/profileRepository';
import {
  getFamilyById,
  createFamilyAndSetAdmin,
  joinFamilyByCode
} from '@/repositories/familyRepository';

/**
 * Melakukan login pengguna menggunakan email dan password.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} input
 * @param {string} input.email
 * @param {string} input.password
 * @returns {Promise<{success?: boolean, message?: string, user?: object, session?: object, error?: string, status?: number}>}
 */
export async function loginUser(supabase, { email, password }) {
  if (!email || !password) {
    return { error: 'Email and password are required', status: 400 };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message, status: 401 };
  }

  return {
    success: true,
    message: 'Login successful',
    user: data.user,
    session: data.session
  };
}

/**
 * Melakukan logout/sign out pengguna.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<{success?: boolean, message?: string, error?: string, status?: number}>}
 */
export async function logoutUser(supabase) {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message, status: 500 };
  }

  return { success: true, message: 'Logged out successfully' };
}

/**
 * Mengambil data user yang sedang login beserta profile dan data keluarga (jika ada).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {string} email
 * @returns {Promise<{data?: object, error?: string, status?: number}>}
 */
export async function getCurrentUser(supabase, userId, email) {
  const { data: profile, error: profileError } = await getProfileById(supabase, userId);

  if (profileError || !profile) {
    return { error: 'Profile not found', status: 404 };
  }

  let family = null;

  if (profile.family_id) {
    const { data: familyData } = await getFamilyById(supabase, profile.family_id);
    if (familyData) {
      family = familyData;
    }
  }

  return {
    data: {
      id: userId,
      email: email,
      display_name: profile.display_name,
      family_id: profile.family_id,
      role: profile.role,
      family
    }
  };
}

/**
 * Melakukan registrasi user baru dan onboarding keluarga (buat baru atau gabung).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} input
 * @param {string} input.email
 * @param {string} input.password
 * @param {string} input.displayName
 * @param {'create'|'join'} input.mode
 * @param {string} [input.familyName]
 * @param {string} [input.inviteCode]
 * @returns {Promise<{success?: boolean, message?: string, requiresEmailConfirmation?: boolean, session?: object, error?: string, status?: number}>}
 */
export async function registerUser(supabase, { email, password, displayName, mode, familyName, inviteCode }) {
  if (!email || !password || !displayName || !mode) {
    return { error: 'Missing required fields', status: 400 };
  }

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
    return { error: authError.message, status: 400 };
  }

  // 2. Onboarding (Create atau Join family)
  if (mode === 'create') {
    if (!familyName) {
      return { error: 'Family name is required for mode create', status: 400 };
    }

    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const generatedCode = `${familyName.replace(/\s+/g, '-').toUpperCase()}-${randomHex}`;

    const { error: rpcError } = await createFamilyAndSetAdmin(supabase, {
      familyName,
      inviteCode: generatedCode
    });

    if (rpcError) {
      return { error: `Gagal membuat keluarga: ${rpcError.message}`, status: 400 };
    }
  } else if (mode === 'join') {
    if (!inviteCode) {
      return { error: 'Invite code is required for mode join', status: 400 };
    }

    const { error: rpcError } = await joinFamilyByCode(supabase, {
      inviteCode
    });

    if (rpcError) {
      return { error: `Gagal bergabung: ${rpcError.message}`, status: 400 };
    }
  }

  const session = authData.session;

  return {
    success: true,
    message: 'Registration successful',
    requiresEmailConfirmation: !session,
    session
  };
}
