/**
 * BUSINESS LAYER — Member Service
 *
 * Mengandung business rules untuk manajemen anggota keluarga (ambil, ubah role, hapus anggota).
 * Fungsi menerima data murni.
 */

import { getProfileById } from '@/repositories/profileRepository';
import {
  getMembersByFamilyId,
  getMemberById,
  updateMemberRole as repoUpdateMemberRole,
  removeMemberFromFamily
} from '@/repositories/memberRepository';
import { insertAuditLog } from '@/repositories/envelopeRepository';

/**
 * Mengambil profil dan memvalidasi role admin.
 * @private
 */
async function _requireAdminProfile(supabase, userId) {
  const { data: profile, error } = await getProfileById(supabase, userId);
  if (error || !profile) {
    return { error: 'Profil pengguna tidak ditemukan.', status: 404 };
  }
  if (!profile.family_id) {
    return { error: 'Pengguna belum bergabung dengan keluarga.', status: 404 };
  }
  if (profile.role !== 'admin') {
    return { error: 'Forbidden', status: 403 };
  }
  return { profile };
}

/**
 * Mengambil semua anggota keluarga. Hanya admin yang diperbolehkan.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @returns {Promise<{data?: object[], error?: string, status?: number}>}
 */
export async function getMembers(supabase, userId) {
  const adminCheck = await _requireAdminProfile(supabase, userId);
  if (adminCheck.error) return adminCheck;

  const { data: members, error } = await getMembersByFamilyId(supabase, adminCheck.profile.family_id);
  if (error) return { error: error.message, status: 400 };

  return { data: members };
}

/**
 * Mengubah role anggota keluarga. Hanya admin yang diperbolehkan.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId - ID admin yang sedang login
 * @param {object} input
 * @param {string} input.memberId - ID anggota yang diupdate
 * @param {'admin'|'member'} input.role
 * @returns {Promise<{success?: boolean, message?: string, error?: string, status?: number}>}
 */
export async function updateMemberRole(supabase, userId, { memberId, role }) {
  if (!memberId || !role) {
    return { error: 'member_id and role are required', status: 400 };
  }

  if (!['admin', 'member'].includes(role)) {
    return { error: "Role must be 'admin' or 'member'", status: 400 };
  }

  if (memberId === userId) {
    return { error: 'Tidak dapat mengubah role diri sendiri', status: 400 };
  }

  const adminCheck = await _requireAdminProfile(supabase, userId);
  if (adminCheck.error) return adminCheck;

  const { profile: adminProfile } = adminCheck;

  // Ambil data anggota target dan pastikan satu keluarga
  const { data: targetMember, error: fetchError } = await getMemberById(supabase, memberId);
  if (fetchError || !targetMember || targetMember.family_id !== adminProfile.family_id) {
    return { error: 'Anggota tidak ditemukan di keluarga ini', status: 404 };
  }

  const { error: updateError } = await repoUpdateMemberRole(supabase, memberId, role);
  if (updateError) {
    return { error: updateError.message, status: 400 };
  }

  // Catat audit log
  await insertAuditLog(supabase, {
    family_id: adminProfile.family_id,
    profile_id: userId,
    action: 'UPDATE_PROFILES',
    target_table: 'profiles',
    old_values: { role: targetMember.role },
    new_values: { role, member_id: memberId, _description: `Mengubah role ${targetMember.display_name} menjadi ${role}` },
  });

  return { success: true, message: `Role berhasil diubah menjadi ${role}` };
}

/**
 * Menghapus/mengeluarkan anggota dari keluarga. Hanya admin yang diperbolehkan.
 * Anggota berstatus admin tidak bisa dihapus dengan cara ini.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {object} input
 * @param {string} input.memberId
 * @returns {Promise<{success?: boolean, message?: string, error?: string, status?: number}>}
 */
export async function removeMember(supabase, userId, { memberId }) {
  if (!memberId) {
    return { error: 'member_id is required', status: 400 };
  }

  if (memberId === userId) {
    return { error: 'Tidak dapat menghapus diri sendiri dari keluarga', status: 400 };
  }

  const adminCheck = await _requireAdminProfile(supabase, userId);
  if (adminCheck.error) return adminCheck;

  const { profile: adminProfile } = adminCheck;

  // Ambil data anggota target
  const { data: targetMember, error: fetchError } = await getMemberById(supabase, memberId);
  if (fetchError || !targetMember || targetMember.family_id !== adminProfile.family_id) {
    return { error: 'Anggota tidak ditemukan di keluarga ini', status: 404 };
  }

  // Business rule: Tidak dapat menghapus admin lain
  if (targetMember.role === 'admin') {
    return { error: 'Tidak dapat menghapus admin dari keluarga', status: 403 };
  }

  const { error: updateError } = await removeMemberFromFamily(supabase, memberId);
  if (updateError) {
    return { error: updateError.message, status: 400 };
  }

  // Catat audit log
  await insertAuditLog(supabase, {
    family_id: adminProfile.family_id,
    profile_id: userId,
    action: 'DELETE_PROFILES',
    target_table: 'profiles',
    old_values: { member_id: memberId, display_name: targetMember.display_name },
    new_values: { _description: `Menghapus akses ${targetMember.display_name} dari keluarga` },
  });

  return { success: true, message: 'Anggota berhasil dihapus dari keluarga' };
}
