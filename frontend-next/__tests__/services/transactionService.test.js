/**
 * SERVICE TESTS — Transaction Service
 *
 * Menguji business rules secara murni.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase } from '../helpers/supabaseMock';

vi.mock('@/repositories/profileRepository', () => ({
  getProfileById: vi.fn(),
}));

vi.mock('@/repositories/transactionRepository', () => ({
  getTransactionsByFamilyId: vi.fn(),
  addTransaction: vi.fn(),
  transferFunds: vi.fn(),
}));

import { getProfileById } from '@/repositories/profileRepository';
import {
  getTransactionsByFamilyId,
  addTransaction as repoAddTransaction,
  transferFunds as repoTransferFunds,
} from '@/repositories/transactionRepository';

import {
  getTransactions,
  createTransaction,
  transferFunds,
} from '@/services/transactionService';

const ADMIN_PROFILE = { id: 'admin-1', role: 'admin', family_id: 'fam-123', display_name: 'Admin' };
const MEMBER_PROFILE = { id: 'member-1', role: 'member', family_id: 'fam-123', display_name: 'Member' };
const MOCK_TXS = [
  { id: 'tx-1', amount: 5000, description: 'Kopi', family_id: 'fam-123' }
];

let mockSupabase;

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = createMockSupabase();
});

describe('transactionService', () => {
  // ─── getTransactions ──────────────────────────────────────────────────────────

  describe('getTransactions', () => {
    it('harus mengembalikan daftar transaksi jika user punya keluarga', async () => {
      getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
      getTransactionsByFamilyId.mockResolvedValue({ data: MOCK_TXS, error: null });

      const result = await getTransactions(mockSupabase, 'admin-1');

      expect(result.data).toEqual(MOCK_TXS);
      expect(getTransactionsByFamilyId).toHaveBeenCalledWith(mockSupabase, 'fam-123');
    });

    it('harus mengembalikan error jika profile tidak punya keluarga', async () => {
      getProfileById.mockResolvedValue({ data: { ...ADMIN_PROFILE, family_id: null }, error: null });

      const result = await getTransactions(mockSupabase, 'admin-1');

      expect(result.error).toBe('Pengguna belum tergabung dalam keluarga.');
      expect(result.status).toBe(404);
    });
  });

  // ─── createTransaction ───────────────────────────────────────────────────────

  describe('createTransaction', () => {
    it('harus menolak jika field wajib kosong', async () => {
      const result = await createTransaction(mockSupabase, 'admin-1', {
        type: '',
        amount: 5000,
        description: 'Test',
        source: 'CASH'
      });

      expect(result.error).toBe('Missing required fields');
      expect(result.status).toBe(400);
    });

    it('harus menolak jika amount <= 0', async () => {
      const result = await createTransaction(mockSupabase, 'admin-1', {
        type: 'EXPENSE',
        amount: -100,
        description: 'Test',
        source: 'CASH'
      });

      expect(result.error).toBe('Nominal harus lebih dari 0');
      expect(result.status).toBe(400);
    });

    it('harus mencegah non-admin mencatat INCOME', async () => {
      getProfileById.mockResolvedValue({ data: MEMBER_PROFILE, error: null });

      const result = await createTransaction(mockSupabase, 'member-1', {
        type: 'INCOME',
        amount: 500000,
        description: 'Gaji',
        source: 'BANK'
      });

      expect(result.error).toBe('Hanya pengelola yang dapat mencatat pemasukan');
      expect(result.status).toBe(403);
      expect(repoAddTransaction).not.toHaveBeenCalled();
    });

    it('harus mengizinkan member mencatat EXPENSE', async () => {
      getProfileById.mockResolvedValue({ data: MEMBER_PROFILE, error: null });
      repoAddTransaction.mockResolvedValue({ error: null });

      const result = await createTransaction(mockSupabase, 'member-1', {
        type: 'EXPENSE',
        amount: 5000,
        description: 'Bakso',
        source: 'CASH'
      });

      expect(result.success).toBe(true);
      expect(repoAddTransaction).toHaveBeenCalledWith(mockSupabase, expect.objectContaining({
        familyId: 'fam-123',
        userId: 'member-1',
        type: 'EXPENSE',
        amount: 5000
      }));
    });
  });

  // ─── transferFunds ──────────────────────────────────────────────────────────

  describe('transferFunds', () => {
    it('harus menolak jika non-admin mencoba memindahkan dana', async () => {
      getProfileById.mockResolvedValue({ data: MEMBER_PROFILE, error: null });

      const result = await transferFunds(mockSupabase, 'member-1', {
        toEnvelopeId: 'env-2',
        amount: 50000
      });

      expect(result.error).toBe('Hanya admin yang dapat memindahkan dana');
      expect(result.status).toBe(403);
      expect(repoTransferFunds).not.toHaveBeenCalled();
    });

    it('harus berhasil memindahkan dana jika admin', async () => {
      getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
      repoTransferFunds.mockResolvedValue({ error: null });

      const result = await transferFunds(mockSupabase, 'admin-1', {
        fromEnvelopeId: 'env-1',
        toEnvelopeId: 'env-2',
        amount: 15000,
        description: 'Saku anak'
      });

      expect(result.success).toBe(true);
      expect(repoTransferFunds).toHaveBeenCalledWith(mockSupabase, {
        familyId: 'fam-123',
        userId: 'admin-1',
        fromEnvelopeId: 'env-1',
        toEnvelopeId: 'env-2',
        amount: 15000,
        description: 'Saku anak'
      });
    });
  });
});
