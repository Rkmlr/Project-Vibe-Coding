/**
 * REPOSITORY TESTS — Family Repository
 *
 * Memvalidasi query/RPC ke tabel families.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getFamilyById,
  createFamilyAndSetAdmin,
  joinFamilyByCode,
} from '@/repositories/familyRepository';
import { createMockSupabase } from '../helpers/supabaseMock';

let mockSupabase;

describe('familyRepository', () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  describe('getFamilyById', () => {
    it('harus memanggil from("families"), select, eq, dan single()', async () => {
      const mockFamily = { id: 'fam-123', name: 'Cemara Family' };
      const qb = mockSupabase.from();
      qb.single.mockResolvedValueOnce({ data: mockFamily, error: null });

      const result = await getFamilyById(mockSupabase, 'fam-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('families');
      expect(qb.select).toHaveBeenCalledWith('name, invite_code, cash_pool_balance');
      expect(qb.eq).toHaveBeenCalledWith('id', 'fam-123');
      expect(result.data).toEqual(mockFamily);
    });
  });

  describe('createFamilyAndSetAdmin', () => {
    it('harus memanggil rpc create_family_and_set_admin', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: { id: 'fam-new' }, error: null });

      await createFamilyAndSetAdmin(mockSupabase, {
        familyName: 'Keluarga Baru',
        inviteCode: 'KB-1234',
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_family_and_set_admin', {
        family_name: 'Keluarga Baru',
        invite_code: 'KB-1234',
      });
    });
  });

  describe('joinFamilyByCode', () => {
    it('harus memanggil rpc join_family_by_code', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      await joinFamilyByCode(mockSupabase, { inviteCode: 'KB-1234' });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('join_family_by_code', {
        p_invite_code: 'KB-1234',
      });
    });
  });
});
