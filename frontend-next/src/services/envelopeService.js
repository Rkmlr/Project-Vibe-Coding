/**
 * BUSINESS LAYER — Envelope Service
 *
 * Mengandung seluruh business rules untuk fitur Envelopes.
 * Fungsi-fungsi di sini menerima data MURNI (bukan objek request HTTP).
 * Service memanggil Repository untuk akses data.
 */

import { getProfileById } from '@/repositories/profileRepository';
import {
  getEnvelopesByFamilyId,
  getEnvelopeById as repoGetEnvelopeById,
  createEnvelope as repoCreateEnvelope,
  updateEnvelope as repoUpdateEnvelope,
  deleteEnvelopeAndReallocate,
  closeBook as repoCloseBook,
  closeBookSavings as repoCloseBookSavings,
  insertAuditLog,
} from '@/repositories/envelopeRepository';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Mengambil profil dan memvalidasi bahwa user merupakan admin.
 * Mengembalikan { profile } jika valid, atau { error, status } jika tidak.
 * @private
 */
async function _requireAdminProfile(supabase, userId) {
  const { data: profile, error } = await getProfileById(supabase, userId);

  if (error || !profile) {
    return { error: 'Profil pengguna tidak ditemukan.', status: 404 };
  }
  if (!profile.family_id) {
    return { error: 'Pengguna belum tergabung dalam keluarga.', status: 404 };
  }
  if (profile.role !== 'admin') {
    return { error: null, profile, isAdmin: false };
  }
  return { profile, isAdmin: true };
}

/**
 * Mengambil profil dan memvalidasi bahwa user memiliki keluarga (tidak harus admin).
 * @private
 */
async function _requireFamilyProfile(supabase, userId) {
  const { data: profile, error } = await getProfileById(supabase, userId);

  if (error || !profile) {
    return { error: 'Profil pengguna tidak ditemukan.', status: 404 };
  }
  if (!profile.family_id) {
    return { error: 'Pengguna belum tergabung dalam keluarga.', status: 404 };
  }
  return { profile };
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Mengambil semua amplop untuk keluarga pengguna.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId - ID pengguna yang sedang login
 * @returns {Promise<{data?: object[], error?: string, status?: number}>}
 */
export async function getEnvelopes(supabase, userId) {
  const profileResult = await _requireFamilyProfile(supabase, userId);
  if (profileResult.error) return profileResult;

  const { data: envelopes, error } = await getEnvelopesByFamilyId(supabase, profileResult.profile.family_id);
  if (error) return { error: error.message, status: 400 };

  return { data: envelopes };
}

/**
 * Mengambil satu amplop berdasarkan ID, memvalidasi kepemilikan keluarga.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {string} envelopeId
 * @returns {Promise<{data?: object, error?: string, status?: number}>}
 */
export async function getEnvelopeById(supabase, userId, envelopeId) {
  const profileResult = await _requireFamilyProfile(supabase, userId);
  if (profileResult.error) return profileResult;

  const { data: envelope, error } = await repoGetEnvelopeById(
    supabase,
    envelopeId,
    profileResult.profile.family_id
  );

  if (error || !envelope) {
    return { error: 'Amplop tidak ditemukan.', status: 404 };
  }

  return { data: envelope };
}

/**
 * Membuat amplop baru. Hanya admin yang diperbolehkan.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {object} input
 * @param {string} input.name
 * @param {string} input.category
 * @param {number|null} input.limitAmount
 * @param {number} [input.initialBalance=0]
 * @returns {Promise<{data?: object, error?: string, status?: number}>}
 */
export async function createEnvelope(supabase, userId, { name, category, limitAmount, initialBalance = 0 }) {
  // Validasi input
  if (!name || !category) {
    return { error: 'Nama dan kategori amplop wajib diisi.', status: 400 };
  }

  // Business rule: hanya admin
  const profileResult = await _requireAdminProfile(supabase, userId);
  if (profileResult.error) return profileResult;
  if (!profileResult.isAdmin) return { error: 'Hanya admin yang dapat membuat amplop.', status: 403 };

  const { profile } = profileResult;

  const { data: newEnvelope, error } = await repoCreateEnvelope(supabase, {
    name,
    category,
    limit_amount: limitAmount || null,
    balance: initialBalance,
    family_id: profile.family_id,
    created_by: userId,
  });

  if (error) return { error: error.message, status: 400 };

  return { data: newEnvelope };
}

/**
 * Memperbarui amplop. Hanya admin yang diperbolehkan.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {string} envelopeId
 * @param {object} input
 * @param {string} [input.name]
 * @param {string} [input.category]
 * @param {number|null} [input.limitAmount]
 * @returns {Promise<{data?: object, error?: string, status?: number}>}
 */
export async function updateEnvelope(supabase, userId, envelopeId, { name, category, limitAmount }) {
  // Business rule: hanya admin
  const profileResult = await _requireAdminProfile(supabase, userId);
  if (profileResult.error) return profileResult;
  if (!profileResult.isAdmin) return { error: 'Hanya admin yang dapat mengubah amplop.', status: 403 };

  const { profile } = profileResult;

  // Ambil data lama untuk validasi kepemilikan & audit log
  // Gunakan repoGetEnvelopeById langsung (bukan service getEnvelopeById)
  // agar tidak memanggil profile check kedua kali.
  const { data: oldEnvelope, error: fetchError } = await repoGetEnvelopeById(supabase, envelopeId, profile.family_id);
  if (fetchError || !oldEnvelope) {
    return { error: 'Amplop tidak ditemukan atau tidak memiliki akses.', status: 404 };
  }

  const updates = {
    name: name !== undefined ? name : oldEnvelope.name,
    category: category !== undefined ? category : oldEnvelope.category,
    limit_amount: limitAmount !== undefined ? limitAmount : oldEnvelope.limit_amount,
  };

  const { data: updatedEnvelope, error: updateError } = await repoUpdateEnvelope(supabase, envelopeId, updates);
  if (updateError) return { error: updateError.message, status: 400 };

  // Catat ke audit log
  await insertAuditLog(supabase, {
    family_id: profile.family_id,
    profile_id: userId,
    action: 'UPDATE_ENVELOPES',
    target_table: 'envelopes',
    old_values: oldEnvelope,
    new_values: { ...updatedEnvelope, _description: `Mengubah data amplop: ${updatedEnvelope.name}` },
  });

  return { data: updatedEnvelope };
}

/**
 * Menghapus amplop. Hanya admin yang diperbolehkan.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {string} envelopeId
 * @param {string|null} reallocateToId - ID amplop tujuan realokasi saldo (opsional)
 * @returns {Promise<{success?: boolean, error?: string, status?: number}>}
 */
export async function deleteEnvelope(supabase, userId, envelopeId, reallocateToId = null) {
  // Business rule: hanya admin
  const profileResult = await _requireAdminProfile(supabase, userId);
  if (profileResult.error) return profileResult;
  if (!profileResult.isAdmin) return { error: 'Hanya admin yang dapat menghapus amplop.', status: 403 };

  const { profile } = profileResult;

  const { error: rpcError } = await deleteEnvelopeAndReallocate(supabase, {
    familyId: profile.family_id,
    userId,
    envelopeId,
    reallocateToId,
  });

  if (rpcError) return { error: `Gagal menghapus amplop: ${rpcError.message}`, status: 400 };

  // Catat ke audit log
  await insertAuditLog(supabase, {
    family_id: profile.family_id,
    profile_id: userId,
    action: 'DELETE_ENVELOPES',
    target_table: 'envelopes',
    old_values: { id: envelopeId, _description: `Menghapus amplop dengan ID ${envelopeId}` },
    new_values: null,
  });

  return { success: true };
}

/**
 * Menutup buku bulan. Hanya admin yang diperbolehkan.
 *
 * Business rules:
 * - Method "sweep"    → semua saldo amplop kembali ke kas utama
 * - Method "savings"  → semua saldo dipindah ke amplop tabungan tertentu
 * - Method "rollover" → saldo dibiarkan (carry over), tidak ada perubahan
 * - Jika total saldo semua amplop = 0, tidak ada yang perlu dilakukan
 * - Jika method "savings" dipilih, savingsEnvelopeId wajib diisi
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {object} input
 * @param {'sweep'|'savings'|'rollover'} input.method
 * @param {string|null} [input.savingsEnvelopeId]
 * @returns {Promise<{success?: boolean, message?: string, error?: string, status?: number}>}
 */
export async function closeMonthlyBook(supabase, userId, { method, savingsEnvelopeId }) {
  // Business rule: hanya admin
  const profileResult = await _requireAdminProfile(supabase, userId);
  if (profileResult.error) return profileResult;
  if (!profileResult.isAdmin) return { error: 'Hanya admin yang dapat menutup buku.', status: 403 };

  const { profile } = profileResult;

  // Ambil semua amplop untuk cek total saldo
  const { data: envelopes, error: fetchError } = await getEnvelopesByFamilyId(supabase, profile.family_id);
  if (fetchError) return { error: 'Gagal mengambil data amplop.', status: 400 };

  // Business rule: hitung total saldo yang perlu dipindahkan
  const totalRemaining = envelopes.reduce((sum, env) => {
    // Jika method savings, lewati amplop tujuan
    if (method === 'savings' && env.id === savingsEnvelopeId) return sum;
    return sum + parseFloat(env.balance || 0);
  }, 0);

  if (totalRemaining <= 0) {
    return { success: true, message: 'Semua amplop sudah kosong. Tidak ada saldo untuk dipindahkan.' };
  }

  if (method === 'sweep') {
    const { error } = await repoCloseBook(supabase, { familyId: profile.family_id, userId });
    if (error) return { error: `Gagal tutup buku: ${error.message}`, status: 400 };

  } else if (method === 'savings') {
    // Business rule: savingsEnvelopeId wajib ada
    if (!savingsEnvelopeId) {
      return { error: 'Harap pilih amplop tabungan tujuan.', status: 400 };
    }
    const { error } = await repoCloseBookSavings(supabase, {
      familyId: profile.family_id,
      userId,
      savingsEnvelopeId,
    });
    if (error) return { error: `Gagal pindah ke tabungan: ${error.message}`, status: 400 };

  } else if (method === 'rollover') {
    // Rollover: biarkan saldo carry over, tidak ada aksi database
    // Hanya catat bahwa tutup buku telah dilakukan
  } else {
    return { error: `Method tidak dikenal: ${method}`, status: 400 };
  }

  return { success: true, message: 'Tutup buku berhasil' };
}
