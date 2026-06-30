/**
 * BUSINESS LAYER — Audit Log Service
 *
 * Mengandung business rules untuk mengambil log audit keluarga.
 * Hanya admin yang diizinkan mengakses.
 * Fungsi menerima data murni.
 */

import { getProfileById } from '@/repositories/profileRepository';
import { getAuditLogsByFamilyId } from '@/repositories/auditLogRepository';

/**
 * Mengambil log audit keluarga. Hanya untuk admin.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @returns {Promise<{data?: object[], error?: string, status?: number}>}
 */
export async function getAuditLogs(supabase, userId) {
  const { data: profile, error: profileError } = await getProfileById(supabase, userId);

  if (profileError || !profile) {
    return { error: 'Profil tidak ditemukan.', status: 404 };
  }

  if (profile.role !== 'admin') {
    return { error: 'Forbidden. Only admins can access audit logs.', status: 403 };
  }

  if (!profile.family_id) {
    return { error: 'Belum bergabung dengan keluarga.', status: 404 };
  }

  const { data: logs, error: logsError } = await getAuditLogsByFamilyId(supabase, profile.family_id);

  if (logsError) {
    return { error: logsError.message, status: 400 };
  }

  // Format data log agar menyertakan user_name dari relasi profiles
  const formattedLogs = (logs || []).map((log) => ({
    ...log,
    user_name: log.profiles ? log.profiles.display_name : 'System',
  }));

  return { data: formattedLogs };
}
