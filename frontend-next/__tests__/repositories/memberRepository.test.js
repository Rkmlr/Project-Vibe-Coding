/**
 * REPOSITORY TESTS — Member Repository
 *
 * Memvalidasi query ke tabel profiles.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getMembersByFamilyId,
  getMemberById,
  updateMemberRole,
  removeMemberFromFamily,
} from '@/repositories/memberRepository';
import { createMockSupabase } from '../helpers/supabaseMock';

let mockSupabase;

describe('memberRepository', () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  describe('getMembersByFamilyId', () => {
    it('harus memanggil from("profiles"), select, dan eq', async () => {
      const mockMembers = [{ id: 'user-1', display_name: 'Member 1' }];
      const qb = mockSupabase.from();
      qb.then.mockImplementationOnce((resolve) => resolve({ data: mockMembers, error: null }));

      const result = await getMembersByFamilyId(mockSupabase, 'fam-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(qb.select).toHaveBeenCalledWith('id, display_name, role, family_id');
      expect(qb.eq).toHaveBeenCalledWith('family_id', 'fam-123');
      expect(result.data).toEqual(mockMembers);
    });
  });

  describe('getMemberById', () => {
    it('harus memanggil eq dan single()', async () => {
      const mockMember = { id: 'user-1' };
      mockSupabase.from().single.mockResolvedValueOnce({ data: mockMember, error: null });

      const result = await getMemberById(mockSupabase, 'user-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('id', 'user-1');
      expect(result.data).toEqual(mockMember);
    });
  });

  describe('updateMemberRole', () => {
    it('harus memanggil update, eq, dan single()', async () => {
      const updatedProfile = { id: 'user-1', role: 'admin' };
      mockSupabase.from().single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      const result = await updateMemberRole(mockSupabase, 'user-1', 'admin');

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.from().update).toHaveBeenCalledWith({ role: 'admin' });
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('id', 'user-1');
      expect(result.data).toEqual(updatedProfile);
    });
  });

  describe('removeMemberFromFamily', () => {
    it('harus memanggil update family_id null, eq, dan single()', async () => {
      const updatedProfile = { id: 'user-1', family_id: null };
      mockSupabase.from().single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      const result = await removeMemberFromFamily(mockSupabase, 'user-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.from().update).toHaveBeenCalledWith({ family_id: null });
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('id', 'user-1');
      expect(result.data).toEqual(updatedProfile);
    });
  });
});
