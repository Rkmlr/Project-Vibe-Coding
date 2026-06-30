/**
 * PERSISTENCE LAYER — Member Repository
 *
 * Bertanggung jawab atas query ke profiles untuk manajemen anggota keluarga.
 * Tidak mengandung business logic.
 */

/**
 * Mengambil semua anggota keluarga berdasarkan familyId.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} familyId
 * @returns {Promise<{data: object[]|null, error: object|null}>}
 */
export async function getMembersByFamilyId(supabase, familyId) {
  return supabase
    .from('profiles')
    .select('id, display_name, role, family_id')
    .eq('family_id', familyId);
}

/**
 * Mengambil satu profil anggota berdasarkan memberId.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} memberId
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getMemberById(supabase, memberId) {
  return supabase
    .from('profiles')
    .select('id, display_name, role, family_id')
    .eq('id', memberId)
    .single();
}

/**
 * Memperbarui role anggota keluarga.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} memberId
 * @param {string} role
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateMemberRole(supabase, memberId, role) {
  return supabase
    .from('profiles')
    .update({ role })
    .eq('id', memberId)
    .select()
    .single();
}

/**
 * Menghapus/mengeluarkan anggota dari keluarga (set family_id menjadi null).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} memberId
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function removeMemberFromFamily(supabase, memberId) {
  return supabase
    .from('profiles')
    .update({ family_id: null })
    .eq('id', memberId)
    .select()
    .single();
}
