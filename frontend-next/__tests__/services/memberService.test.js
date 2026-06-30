/**
 * SERVICE TESTS — Member Service
 *
 * Menguji manajemen anggota keluarga.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase } from '../helpers/supabaseMock';

vi.mock('@/repositories/profileRepository', () => ({
  getProfileById: vi.fn(),
}));

vi.mock('@/repositories/memberRepository', () => ({
  getMembersByFamilyId: vi.fn(),
  getMemberById: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMemberFromFamily: vi.fn(),
}));

vi.mock('@/repositories/envelopeRepository', () => ({
  insertAuditLog: vi.fn(),
}));

import { getProfileById } from '@/repositories/profileRepository';
import {
  getMembersByFamilyId,
  getMemberById,
  updateMemberRole as repoUpdateMemberRole,
  removeMemberFromFamily,
} from '@/repositories/memberRepository';
import { insertAuditLog } from '@/repositories/envelopeRepository';

import {
  getMembers,
  updateMemberRole,
  removeMember,
} from '@/services/memberService';

let mockSupabase;

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = createMockSupabase();
});

describe('memberService', () => {
  const ADMIN_PROFILE = { id: 'admin-1', role: 'admin', family_id: 'fam-123' };
  const MEMBER_PROFILE = { id: 'member-1', role: 'member', family_id: 'fam-123' };
  const TARGET_MEMBER = { id: 'target-1', display_name: 'Target User', role: 'member', family_id: 'fam-123' };

  // ─── getMembers ─────────────────────────────────────────────────────────────

  describe('getMembers', () => {
    it('harus menolak jika user bukan admin', async () => {
      getProfileById.mockResolvedValue({ data: MEMBER_PROFILE, error: null });

      const result = await getMembers(mockSupabase, 'member-1');
      expect(result.error).toBe('Forbidden');
      expect(result.status).toBe(403);
    });

    it('harus mengembalikan anggota keluarga jika user admin', async () => {
      getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
      getMembersByFamilyId.mockResolvedValue({ data: [TARGET_MEMBER], error: null });

      const result = await getMembers(mockSupabase, 'admin-1');
      expect(result.data).toEqual([TARGET_MEMBER]);
    });
  });

  // ─── updateMemberRole ───────────────────────────────────────────────────────

  describe('updateMemberRole', () => {
    it('harus menolak jika mencoba merubah role diri sendiri', async () => {
      const result = await updateMemberRole(mockSupabase, 'admin-1', { memberId: 'admin-1', role: 'member' });
      expect(result.error).toBe('Tidak dapat mengubah role diri sendiri');
      expect(result.status).toBe(400);
    });

    it('harus menolak jika member target beda keluarga', async () => {
      getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
      getMemberById.mockResolvedValue({ data: { ...TARGET_MEMBER, family_id: 'fam-alien' }, error: null });

      const result = await updateMemberRole(mockSupabase, 'admin-1', { memberId: 'target-1', role: 'admin' });
      expect(result.error).toBe('Anggota tidak ditemukan di keluarga ini');
      expect(result.status).toBe(404);
    });

    it('harus berhasil mengubah role dan mencatat audit log', async () => {
      getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
      getMemberById.mockResolvedValue({ data: TARGET_MEMBER, error: null });
      repoUpdateMemberRole.mockResolvedValue({ error: null });
      insertAuditLog.mockResolvedValue({ error: null });

      const result = await updateMemberRole(mockSupabase, 'admin-1', { memberId: 'target-1', role: 'admin' });
      expect(result.success).toBe(true);
      expect(repoUpdateMemberRole).toHaveBeenCalledWith(mockSupabase, 'target-1', 'admin');
      expect(insertAuditLog).toHaveBeenCalledWith(mockSupabase, expect.objectContaining({
        action: 'UPDATE_PROFILES',
      }));
    });
  });

  // ─── removeMember ───────────────────────────────────────────────────────────

  describe('removeMember', () => {
    it('harus menolak jika mencoba menghapus diri sendiri', async () => {
      const result = await removeMember(mockSupabase, 'admin-1', { memberId: 'admin-1' });
      expect(result.error).toBe('Tidak dapat menghapus diri sendiri dari keluarga');
      expect(result.status).toBe(400);
    });

    it('harus menolak jika member target berstatus admin', async () => {
      getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
      getMemberById.mockResolvedValue({ data: { ...TARGET_MEMBER, role: 'admin' }, error: null });

      const result = await removeMember(mockSupabase, 'admin-1', { memberId: 'target-1' });
      expect(result.error).toBe('Tidak dapat menghapus admin dari keluarga');
      expect(result.status).toBe(403);
    });

    it('harus berhasil mengeluarkan anggota dan mencatat audit log', async () => {
      getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
      getMemberById.mockResolvedValue({ data: TARGET_MEMBER, error: null });
      removeMemberFromFamily.mockResolvedValue({ error: null });
      insertAuditLog.mockResolvedValue({ error: null });

      const result = await removeMember(mockSupabase, 'admin-1', { memberId: 'target-1' });
      expect(result.success).toBe(true);
      expect(removeMemberFromFamily).toHaveBeenCalledWith(mockSupabase, 'target-1');
      expect(insertAuditLog).toHaveBeenCalledWith(mockSupabase, expect.objectContaining({
        action: 'DELETE_PROFILES',
      }));
    });
  });
});
