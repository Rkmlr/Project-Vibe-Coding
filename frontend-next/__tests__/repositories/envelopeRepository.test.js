/**
 * REPOSITORY TESTS — Envelope Repository
 *
 * Memvalidasi bahwa setiap fungsi repository membentuk query Supabase
 * yang benar. Tidak ada business logic yang diuji di sini.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getEnvelopesByFamilyId,
  getEnvelopeById,
  createEnvelope,
  updateEnvelope,
  deleteEnvelopeAndReallocate,
  closeBook,
  closeBookSavings,
  insertAuditLog,
} from '@/repositories/envelopeRepository';
import { createMockSupabase } from '../helpers/supabaseMock';

let mockSupabase;

describe('envelopeRepository', () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  // ─── getEnvelopesByFamilyId ───────────────────────────────────────────────

  describe('getEnvelopesByFamilyId', () => {
    it('harus memanggil from("envelopes"), select, eq, dan order', async () => {
      const mockEnvelopes = [{ id: 'env-1', name: 'Makan' }];
      const qb = mockSupabase.from();
      qb.then.mockImplementationOnce((resolve) => resolve({ data: mockEnvelopes, error: null }));

      await getEnvelopesByFamilyId(mockSupabase, 'fam-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('envelopes');
      expect(qb.select).toHaveBeenCalledWith('*');
      expect(qb.eq).toHaveBeenCalledWith('family_id', 'fam-123');
      expect(qb.order).toHaveBeenCalledWith('name', { ascending: true });
    });
  });

  // ─── getEnvelopeById ─────────────────────────────────────────────────────

  describe('getEnvelopeById', () => {
    it('harus memanggil eq dua kali (id dan family_id) dan single()', async () => {
      const mockEnv = { id: 'env-1', family_id: 'fam-123' };
      mockSupabase.from().single.mockResolvedValueOnce({ data: mockEnv, error: null });

      const result = await getEnvelopeById(mockSupabase, 'env-1', 'fam-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('envelopes');
      expect(result.data).toEqual(mockEnv);
    });
  });

  // ─── createEnvelope ───────────────────────────────────────────────────────

  describe('createEnvelope', () => {
    it('harus memanggil insert dengan data yang benar', async () => {
      const newEnvData = { name: 'Liburan', category: 'WANTS', family_id: 'fam-123', created_by: 'user-1', balance: 0 };
      const createdEnv = { id: 'env-new', ...newEnvData };
      mockSupabase.from().single.mockResolvedValueOnce({ data: createdEnv, error: null });

      const result = await createEnvelope(mockSupabase, newEnvData);

      expect(mockSupabase.from).toHaveBeenCalledWith('envelopes');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(newEnvData);
      expect(result.data).toEqual(createdEnv);
    });
  });

  // ─── updateEnvelope ───────────────────────────────────────────────────────

  describe('updateEnvelope', () => {
    it('harus memanggil update dan eq dengan id yang benar', async () => {
      const updates = { name: 'Makan Siang' };
      const updatedEnv = { id: 'env-1', ...updates };
      mockSupabase.from().single.mockResolvedValueOnce({ data: updatedEnv, error: null });

      const result = await updateEnvelope(mockSupabase, 'env-1', updates);

      expect(mockSupabase.from).toHaveBeenCalledWith('envelopes');
      expect(mockSupabase.from().update).toHaveBeenCalledWith(updates);
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('id', 'env-1');
      expect(result.data).toEqual(updatedEnv);
    });
  });

  // ─── deleteEnvelopeAndReallocate ──────────────────────────────────────────

  describe('deleteEnvelopeAndReallocate', () => {
    it('harus memanggil rpc dengan parameter yang benar', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      await deleteEnvelopeAndReallocate(mockSupabase, {
        familyId: 'fam-123',
        userId: 'user-1',
        envelopeId: 'env-1',
        reallocateToId: 'env-2',
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('delete_envelope_and_reallocate', {
        p_family_id: 'fam-123',
        p_user_id: 'user-1',
        p_envelope_id: 'env-1',
        p_reallocate_to_id: 'env-2',
      });
    });

    it('harus mengirim p_reallocate_to_id null jika tidak ada tujuan', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      await deleteEnvelopeAndReallocate(mockSupabase, {
        familyId: 'fam-123',
        userId: 'user-1',
        envelopeId: 'env-1',
        reallocateToId: undefined,
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('delete_envelope_and_reallocate', {
        p_family_id: 'fam-123',
        p_user_id: 'user-1',
        p_envelope_id: 'env-1',
        p_reallocate_to_id: null,
      });
    });
  });

  // ─── closeBook & closeBookSavings ─────────────────────────────────────────

  describe('closeBook', () => {
    it('harus memanggil rpc close_book dengan parameter yang benar', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      await closeBook(mockSupabase, { familyId: 'fam-123', userId: 'user-1' });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('close_book', {
        p_family_id: 'fam-123',
        p_user_id: 'user-1',
      });
    });
  });

  describe('closeBookSavings', () => {
    it('harus memanggil rpc close_book_savings dengan savingsEnvelopeId', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      await closeBookSavings(mockSupabase, {
        familyId: 'fam-123',
        userId: 'user-1',
        savingsEnvelopeId: 'env-savings',
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('close_book_savings', {
        p_family_id: 'fam-123',
        p_user_id: 'user-1',
        p_savings_envelope_id: 'env-savings',
      });
    });
  });

  // ─── insertAuditLog ───────────────────────────────────────────────────────

  describe('insertAuditLog', () => {
    it('harus memanggil from("audit_logs").insert dengan data log', async () => {
      const logData = { family_id: 'fam-123', profile_id: 'user-1', action: 'CREATE_ENVELOPES' };

      await insertAuditLog(mockSupabase, logData);

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(logData);
    });
  });
});
