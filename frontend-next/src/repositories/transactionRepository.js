/**
 * PERSISTENCE LAYER — Transaction Repository
 *
 * Bertanggung jawab atas semua query ke tabel "transactions" dan pemanggilan RPC terkait transaksi.
 * Tidak mengandung business logic — hanya akses data murni.
 */

/**
 * Mengambil semua transaksi milik keluarga pengguna, diurutkan berdasarkan tanggal terbaru.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} familyId
 * @returns {Promise<{data: object[]|null, error: object|null}>}
 */
export async function getTransactionsByFamilyId(supabase, familyId) {
  return supabase
    .from('transactions')
    .select('*')
    .eq('family_id', familyId)
    .order('date', { ascending: false });
}

/**
 * Menambahkan transaksi baru (pemasukan/pengeluaran) via RPC.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} params
 * @param {string} params.familyId
 * @param {string} params.userId
 * @param {string} params.type - INCOME / EXPENSE
 * @param {number} params.amount
 * @param {string} params.description
 * @param {string} params.source
 * @param {string|null} params.envelopeId
 * @param {string} params.date
 * @returns {Promise<{data: any, error: any}>}
 */
export async function addTransaction(supabase, { familyId, userId, type, amount, description, source, envelopeId, date }) {
  return supabase.rpc('add_transaction', {
    p_family_id: familyId,
    p_user_id: userId,
    p_type: type,
    p_amount: amount,
    p_description: description,
    p_source: source,
    p_envelope_id: envelopeId || null,
    p_date: date || new Date().toISOString()
  });
}

/**
 * Memindahkan dana antar amplop (atau dari Kas Utama ke amplop) via RPC.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} params
 * @param {string} params.familyId
 * @param {string} params.userId
 * @param {string|null} params.fromEnvelopeId
 * @param {string} params.toEnvelopeId
 * @param {number} params.amount
 * @param {string} params.description
 * @returns {Promise<{data: any, error: any}>}
 */
export async function transferFunds(supabase, { familyId, userId, fromEnvelopeId, toEnvelopeId, amount, description }) {
  return supabase.rpc('transfer_funds', {
    p_family_id: familyId,
    p_user_id: userId,
    p_from_envelope_id: fromEnvelopeId || null,
    p_to_envelope_id: toEnvelopeId,
    p_amount: amount,
    p_description: description || "Realokasi Dana"
  });
}
