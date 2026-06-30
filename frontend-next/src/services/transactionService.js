/**
 * BUSINESS LAYER — Transaction Service
 *
 * Mengandung seluruh business rules untuk fitur Transactions.
 * Fungsi-fungsi di sini menerima data MURNI (bukan objek request/response HTTP).
 * Service memanggil Repository untuk akses data.
 */

import { getProfileById } from '@/repositories/profileRepository';
import {
  getTransactionsByFamilyId,
  addTransaction as repoAddTransaction,
  transferFunds as repoTransferFunds
} from '@/repositories/transactionRepository';

/**
 * Mengambil profil dan memvalidasi bahwa user memiliki keluarga.
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

/**
 * Mengambil daftar semua transaksi keluarga pengguna.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @returns {Promise<{data?: object[], error?: string, status?: number}>}
 */
export async function getTransactions(supabase, userId) {
  const profileResult = await _requireFamilyProfile(supabase, userId);
  if (profileResult.error) return profileResult;

  const { data: transactions, error } = await getTransactionsByFamilyId(supabase, profileResult.profile.family_id);
  if (error) return { error: error.message, status: 400 };

  return { data: transactions };
}

/**
 * Mencatat transaksi baru (INCOME atau EXPENSE).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {object} input
 * @param {string} input.type - INCOME / EXPENSE
 * @param {number|string} input.amount
 * @param {string} input.description
 * @param {string} input.source
 * @param {string|null} [input.envelopeId]
 * @param {string} [input.date]
 * @returns {Promise<{success?: boolean, message?: string, error?: string, status?: number}>}
 */
export async function createTransaction(supabase, userId, { type, amount, description, source, envelopeId, date }) {
  if (!type || !amount || !description || !source) {
    return { error: 'Missing required fields', status: 400 };
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return { error: 'Nominal harus lebih dari 0', status: 400 };
  }

  const profileResult = await _requireFamilyProfile(supabase, userId);
  if (profileResult.error) return profileResult;

  const { profile } = profileResult;

  // Business rule: Hanya admin yang dapat mencatat pemasukan (INCOME)
  if (type === 'INCOME' && profile.role !== 'admin') {
    return { error: 'Hanya pengelola yang dapat mencatat pemasukan', status: 403 };
  }

  const { error: rpcError } = await repoAddTransaction(supabase, {
    familyId: profile.family_id,
    userId,
    type,
    amount: numericAmount,
    description,
    source,
    envelopeId: envelopeId || null,
    date: date || new Date().toISOString()
  });

  if (rpcError) {
    return { error: `Transaksi gagal: ${rpcError.message}`, status: 400 };
  }

  return { success: true, message: 'Transaksi berhasil dicatat' };
}

/**
 * Memindahkan dana antar amplop (atau dari Kas Utama ke amplop).
 * Hanya admin yang diperbolehkan.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {object} input
 * @param {string|null} [input.fromEnvelopeId]
 * @param {string} input.toEnvelopeId
 * @param {number|string} input.amount
 * @param {string} [input.description]
 * @returns {Promise<{success?: boolean, message?: string, error?: string, status?: number}>}
 */
export async function transferFunds(supabase, userId, { fromEnvelopeId, toEnvelopeId, amount, description }) {
  if (!toEnvelopeId || !amount) {
    return { error: 'Tujuan dan nominal harus diisi', status: 400 };
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return { error: 'Nominal harus lebih dari 0', status: 400 };
  }

  const profileResult = await _requireFamilyProfile(supabase, userId);
  if (profileResult.error) return profileResult;

  const { profile } = profileResult;

  // Business rule: Hanya admin/pengelola yang dapat memindahkan dana
  if (profile.role !== 'admin') {
    return { error: 'Hanya admin yang dapat memindahkan dana', status: 403 };
  }

  const { error: rpcError } = await repoTransferFunds(supabase, {
    familyId: profile.family_id,
    userId,
    fromEnvelopeId: fromEnvelopeId || null,
    toEnvelopeId,
    amount: numericAmount,
    description: description || 'Realokasi Dana'
  });

  if (rpcError) {
    return { error: `Transfer gagal: ${rpcError.message}`, status: 400 };
  }

  return { success: true, message: 'Dana berhasil dipindahkan' };
}
