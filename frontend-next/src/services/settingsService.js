/**
 * BUSINESS LAYER — Settings Service
 *
 * Mengandung business rules untuk pengaturan keluarga (baca detail pengaturan, ubah nama keluarga).
 * Hanya admin yang diizinkan melakukan ini.
 * Fungsi menerima data murni.
 */

import { getProfileById } from '@/repositories/profileRepository';
import { getFamilyById, updateFamilyName } from '@/repositories/familyRepository';
import { insertAuditLog } from '@/repositories/envelopeRepository';

/**
 * Validasi otorisasi admin dan keberadaan keluarga.
 * @private
 */
async function _requireAdminWithFamily(supabase, userId) {
  const { data: profile, error } = await getProfileById(supabase, userId);
  if (error || !profile) {
    return { error: 'Profil pengguna tidak ditemukan.', status: 404 };
  }
  if (profile.role !== 'admin') {
    return { error: 'Forbidden', status: 403 };
  }
  if (!profile.family_id) {
    return { error: 'No family associated', status: 404 };
  }
  return { profile };
}

/**
 * Mengambil detail informasi keluarga untuk pengaturan.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @returns {Promise<{data?: object, error?: string, status?: number}>}
 */
export async function getSettings(supabase, userId) {
  const authCheck = await _requireAdminWithFamily(supabase, userId);
  if (authCheck.error) return authCheck;

  const { data: family, error: familyError } = await getFamilyById(supabase, authCheck.profile.family_id);
  if (familyError || !family) {
    return { error: 'Family not found', status: 404 };
  }

  return { data: family };
}

/**
 * Memperbarui nama keluarga.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {object} input
 * @param {string} input.name - Nama baru keluarga
 * @returns {Promise<{data?: object, error?: string, status?: number}>}
 */
export async function updateSettings(supabase, userId, { name }) {
  if (!name || name.trim().length === 0) {
    return { error: 'Family name is required', status: 400 };
  }

  const authCheck = await _requireAdminWithFamily(supabase, userId);
  if (authCheck.error) return authCheck;

  const { profile } = authCheck;

  // Ambil nama lama untuk audit log
  const { data: oldFamily } = await getFamilyById(supabase, profile.family_id);

  const { data: updatedFamily, error: updateError } = await updateFamilyName(supabase, profile.family_id, name.trim());
  if (updateError) {
    return { error: updateError.message, status: 400 };
  }

  // Catat ke audit log
  await insertAuditLog(supabase, {
    family_id: profile.family_id,
    profile_id: userId,
    action: 'UPDATE_FAMILIES',
    target_table: 'families',
    old_values: oldFamily ? { name: oldFamily.name } : null,
    new_values: { name: updatedFamily.name, _description: `Mengubah nama keluarga menjadi: ${updatedFamily.name}` },
  });

  return { data: updatedFamily };
}
