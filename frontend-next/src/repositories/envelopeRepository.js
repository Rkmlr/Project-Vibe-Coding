/**
 * PERSISTENCE LAYER — Envelope Repository
 *
 * Bertanggung jawab atas semua query ke tabel "envelopes" dan "audit_logs"
 * yang berkaitan dengan envelope.
 * Tidak mengandung business logic — hanya akses data murni.
 */

/**
 * Mengambil semua amplop milik sebuah keluarga, diurutkan berdasarkan nama.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} familyId
 * @returns {Promise<{data: object[]|null, error: object|null}>}
 */
export async function getEnvelopesByFamilyId(supabase, familyId) {
  return supabase
    .from('envelopes')
    .select('*')
    .eq('family_id', familyId)
    .order('name', { ascending: true });
}

/**
 * Mengambil satu amplop berdasarkan ID, memvalidasi kepemilikan keluarga.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} envelopeId
 * @param {string} familyId
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getEnvelopeById(supabase, envelopeId, familyId) {
  return supabase
    .from('envelopes')
    .select('*')
    .eq('id', envelopeId)
    .eq('family_id', familyId)
    .single();
}

/**
 * Membuat amplop baru.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} envelopeData
 * @param {string} envelopeData.name
 * @param {string} envelopeData.category
 * @param {number|null} envelopeData.limit_amount
 * @param {number} envelopeData.balance
 * @param {string} envelopeData.family_id
 * @param {string} envelopeData.created_by
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createEnvelope(supabase, envelopeData) {
  return supabase
    .from('envelopes')
    .insert(envelopeData)
    .select()
    .single();
}

/**
 * Memperbarui data amplop.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} envelopeId
 * @param {object} updates - Field yang akan diupdate
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateEnvelope(supabase, envelopeId, updates) {
  return supabase
    .from('envelopes')
    .update(updates)
    .eq('id', envelopeId)
    .select()
    .single();
}

/**
 * Menghapus amplop dan merealokasi saldo via RPC (database function).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} params
 * @param {string} params.familyId
 * @param {string} params.userId
 * @param {string} params.envelopeId
 * @param {string|null} params.reallocateToId
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function deleteEnvelopeAndReallocate(supabase, { familyId, userId, envelopeId, reallocateToId }) {
  return supabase.rpc('delete_envelope_and_reallocate', {
    p_family_id: familyId,
    p_user_id: userId,
    p_envelope_id: envelopeId,
    p_reallocate_to_id: reallocateToId || null,
  });
}

/**
 * Menutup buku bulan (sweep semua saldo amplop ke kas utama) via RPC.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} params
 * @param {string} params.familyId
 * @param {string} params.userId
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function closeBook(supabase, { familyId, userId }) {
  return supabase.rpc('close_book', {
    p_family_id: familyId,
    p_user_id: userId,
  });
}

/**
 * Menutup buku bulan dengan memindahkan saldo ke amplop tabungan via RPC.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} params
 * @param {string} params.familyId
 * @param {string} params.userId
 * @param {string} params.savingsEnvelopeId
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function closeBookSavings(supabase, { familyId, userId, savingsEnvelopeId }) {
  return supabase.rpc('close_book_savings', {
    p_family_id: familyId,
    p_user_id: userId,
    p_savings_envelope_id: savingsEnvelopeId,
  });
}

/**
 * Memasukkan satu baris log audit.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} logData
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function insertAuditLog(supabase, logData) {
  return supabase.from('audit_logs').insert(logData);
}
