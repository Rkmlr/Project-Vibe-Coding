/**
 * PERSISTENCE LAYER — Family Repository
 *
 * Bertanggung jawab atas query ke tabel "families" dan RPC terkait keluarga.
 * Tidak mengandung business logic.
 */

/**
 * Mengambil data keluarga berdasarkan ID.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} familyId
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getFamilyById(supabase, familyId) {
  return supabase
    .from('families')
    .select('name, invite_code, cash_pool_balance')
    .eq('id', familyId)
    .single();
}

/**
 * Membuat keluarga baru dan set pembuat sebagai admin via RPC.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} params
 * @param {string} params.familyName
 * @param {string} params.inviteCode
 * @returns {Promise<{data: any, error: any}>}
 */
export async function createFamilyAndSetAdmin(supabase, { familyName, inviteCode }) {
  return supabase.rpc('create_family_and_set_admin', {
    family_name: familyName,
    invite_code: inviteCode,
  });
}

/**
 * Bergabung dengan keluarga menggunakan kode undangan via RPC.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} params
 * @param {string} params.inviteCode
 * @returns {Promise<{data: any, error: any}>}
 */
export async function joinFamilyByCode(supabase, { inviteCode }) {
  return supabase.rpc('join_family_by_code', {
    p_invite_code: inviteCode,
  });
}

/**
 * Memperbarui nama keluarga.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} familyId
 * @param {string} name
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateFamilyName(supabase, familyId, name) {
  return supabase
    .from('families')
    .update({ name })
    .eq('id', familyId)
    .select()
    .single();
}

