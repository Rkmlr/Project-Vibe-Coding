/**
 * REPOSITORY TESTS — Transaction Repository
 *
 * Memvalidasi bahwa setiap fungsi repository membentuk query Supabase
 * yang benar.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getTransactionsByFamilyId,
  addTransaction,
  transferFunds,
} from '@/repositories/transactionRepository';
import { createMockSupabase } from '../helpers/supabaseMock';

let mockSupabase;

describe('transactionRepository', () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  describe('getTransactionsByFamilyId', () => {
    it('harus memanggil from("transactions"), select, eq, dan order', async () => {
      const mockTx = [{ id: 'tx-1', amount: 5000 }];
      const qb = mockSupabase.from();
      qb.then.mockImplementationOnce((resolve) => resolve({ data: mockTx, error: null }));

      await getTransactionsByFamilyId(mockSupabase, 'fam-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('transactions');
      expect(qb.select).toHaveBeenCalledWith('*');
      expect(qb.eq).toHaveBeenCalledWith('family_id', 'fam-123');
      expect(qb.order).toHaveBeenCalledWith('date', { ascending: false });
    });
  });

  describe('addTransaction', () => {
    it('harus memanggil rpc add_transaction dengan parameter yang benar', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: { id: 'tx-123' }, error: null });

      const txDate = new Date().toISOString();
      await addTransaction(mockSupabase, {
        familyId: 'fam-123',
        userId: 'user-1',
        type: 'EXPENSE',
        amount: 5000,
        description: 'Beli kopi',
        source: 'CASH',
        envelopeId: 'env-1',
        date: txDate,
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('add_transaction', {
        p_family_id: 'fam-123',
        p_user_id: 'user-1',
        p_type: 'EXPENSE',
        p_amount: 5000,
        p_description: 'Beli kopi',
        p_source: 'CASH',
        p_envelope_id: 'env-1',
        p_date: txDate,
      });
    });
  });

  describe('transferFunds', () => {
    it('harus memanggil rpc transfer_funds dengan parameter yang benar', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      await transferFunds(mockSupabase, {
        familyId: 'fam-123',
        userId: 'admin-1',
        fromEnvelopeId: 'env-1',
        toEnvelopeId: 'env-2',
        amount: 50000,
        description: 'Transfer bulanan',
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('transfer_funds', {
        p_family_id: 'fam-123',
        p_user_id: 'admin-1',
        p_from_envelope_id: 'env-1',
        p_to_envelope_id: 'env-2',
        p_amount: 50000,
        p_description: 'Transfer bulanan',
      });
    });
  });
});
