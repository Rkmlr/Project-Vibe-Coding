/**
 * SERVICE TESTS — Settings Service
 *
 * Menguji business logic pengaturan keluarga.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase } from '../helpers/supabaseMock';

vi.mock('@/repositories/profileRepository', () => ({
  getProfileById: vi.fn(),
}));

vi.mock('@/repositories/familyRepository', () => ({
  getFamilyById: vi.fn(),
  updateFamilyName: vi.fn(),
}));

vi.mock('@/repositories/envelopeRepository', () => ({
  insertAuditLog: vi.fn(),
}));

import { getProfileById } from '@/repositories/profileRepository';
import { getFamilyById, updateFamilyName } from '@/repositories/familyRepository';
import { insertAuditLog } from '@/repositories/envelopeRepository';
import { getSettings, updateSettings } from '@/services/settingsService';

let mockSupabase;

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = createMockSupabase();
});

describe('settingsService', () => {
  const ADMIN_PROFILE = { id: 'admin-1', role: 'admin', family_id: 'fam-123' };
  const MEMBER_PROFILE = { id: 'member-1', role: 'member', family_id: 'fam-123' };

  // ─── getSettings ────────────────────────────────────────────────────────────

  describe('getSettings', () => {
    it('harus menolak jika user bukan admin', async () => {
      getProfileById.mockResolvedValue({ data: MEMBER_PROFILE, error: null });

      const result = await getSettings(mockSupabase, 'member-1');
      expect(result.error).toBe('Forbidden');
      expect(result.status).toBe(403);
    });

    it('harus mengembalikan settings keluarga jika admin', async () => {
      getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
      getFamilyById.mockResolvedValue({ data: { name: 'Cemara' }, error: null });

      const result = await getSettings(mockSupabase, 'admin-1');
      expect(result.data.name).toBe('Cemara');
    });
  });

  // ─── updateSettings ─────────────────────────────────────────────────────────

  describe('updateSettings', () => {
    it('harus menolak jika name kosong', async () => {
      const result = await updateSettings(mockSupabase, 'admin-1', { name: '' });
      expect(result.error).toBe('Family name is required');
      expect(result.status).toBe(400);
    });

    it('harus berhasil merubah nama keluarga dan mencatat audit log jika admin', async () => {
      getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
      getFamilyById.mockResolvedValue({ data: { name: 'Cemara Lama' }, error: null });
      updateFamilyName.mockResolvedValue({ data: { name: 'Cemara Baru' }, error: null });
      insertAuditLog.mockResolvedValue({ error: null });

      const result = await updateSettings(mockSupabase, 'admin-1', { name: 'Cemara Baru' });
      expect(result.data.name).toBe('Cemara Baru');
      expect(updateFamilyName).toHaveBeenCalledWith(mockSupabase, 'fam-123', 'Cemara Baru');
      expect(insertAuditLog).toHaveBeenCalledWith(mockSupabase, expect.objectContaining({
        action: 'UPDATE_FAMILIES',
      }));
    });
  });
});
