/**
 * PERSISTENCE LAYER — Audit Log Repository
 *
 * Bertanggung jawab atas query ke tabel "audit_logs".
 * Tidak mengandung business logic.
 */

/**
 * Mengambil log audit berdasarkan familyId, diurutkan dari terbaru.
 * Menyertakan join ke profiles untuk mengambil display_name pembuat log.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} familyId
 * @returns {Promise<{data: object[]|null, error: object|null}>}
 */
export async function getAuditLogsByFamilyId(supabase, familyId) {
  return supabase
    .from('audit_logs')
    .select('*, profiles(display_name)')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });
}
