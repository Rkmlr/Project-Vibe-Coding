/**
 * PERSISTENCE LAYER — Profile Repository
 *
 * Bertanggung jawab atas semua query ke tabel "profiles".
 * Tidak mengandung business logic — hanya akses data murni.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */

/**
 * Mengambil profil pengguna berdasarkan ID.
 * @param {object} supabase
 * @param {string} userId
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getProfileById(supabase, userId) {
  return supabase
    .from('profiles')
    .select('id, role, family_id, display_name')
    .eq('id', userId)
    .single();
}

/**
 * Memperbarui data profil pengguna.
 * @param {object} supabase
 * @param {string} userId
 * @param {object} updates - Field yang akan diupdate
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateProfile(supabase, userId, updates) {
  return supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
}
