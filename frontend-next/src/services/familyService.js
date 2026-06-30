/**
 * BUSINESS LAYER — Family Service
 *
 * Mengandung business rules untuk aksi pembentukan dan penggabungan keluarga.
 * Fungsi menerima data murni.
 */

import { createFamilyAndSetAdmin, joinFamilyByCode } from '@/repositories/familyRepository';

/**
 * Membuat keluarga baru.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {object} input
 * @param {string} input.familyName
 * @param {string} input.inviteCode
 * @returns {Promise<{data?: object, error?: string, status?: number}>}
 */
export async function createFamily(supabase, userId, { familyName, inviteCode }) {
  if (!familyName || !inviteCode) {
    return { error: 'Nama keluarga dan kode undangan wajib diisi', status: 400 };
  }

  const { data: family, error: rpcError } = await createFamilyAndSetAdmin(supabase, {
    familyName,
    inviteCode,
  });

  if (rpcError) {
    return { error: `Gagal membuat keluarga: ${rpcError.message}`, status: 400 };
  }

  return { data: family };
}

/**
 * Bergabung dengan keluarga menggunakan invite code.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {object} input
 * @param {string} input.inviteCode
 * @returns {Promise<{data?: object, error?: string, status?: number}>}
 */
export async function joinFamily(supabase, userId, { inviteCode }) {
  if (!inviteCode) {
    return { error: 'Kode undangan wajib diisi', status: 400 };
  }

  const { data: family, error: rpcError } = await joinFamilyByCode(supabase, {
    inviteCode,
  });

  if (rpcError) {
    return { error: `Gagal bergabung dengan keluarga: ${rpcError.message}`, status: 400 };
  }

  return { data: family };
}
