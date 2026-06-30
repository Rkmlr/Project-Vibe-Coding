/**
 * SERVICE TESTS — Family Service
 *
 * Menguji business rules keluarga dari dashboard onboarding.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase } from '../helpers/supabaseMock';

vi.mock('@/repositories/familyRepository', () => ({
  createFamilyAndSetAdmin: vi.fn(),
  joinFamilyByCode: vi.fn(),
}));

import { createFamilyAndSetAdmin, joinFamilyByCode } from '@/repositories/familyRepository';
import { createFamily, joinFamily } from '@/services/familyService';

let mockSupabase;

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = createMockSupabase();
});

describe('familyService', () => {
  describe('createFamily', () => {
    it('harus menolak jika familyName atau inviteCode kosong', async () => {
      const result = await createFamily(mockSupabase, 'user-1', { familyName: '', inviteCode: 'C-1' });
      expect(result.error).toBe('Nama keluarga dan kode undangan wajib diisi');
      expect(result.status).toBe(400);
    });

    it('harus memanggil repository untuk membuat keluarga jika valid', async () => {
      createFamilyAndSetAdmin.mockResolvedValue({ data: { id: 'fam-1' }, error: null });

      const result = await createFamily(mockSupabase, 'user-1', { familyName: 'Cemara', inviteCode: 'CODE-123' });
      expect(result.data.id).toBe('fam-1');
      expect(createFamilyAndSetAdmin).toHaveBeenCalledWith(mockSupabase, {
        familyName: 'Cemara',
        inviteCode: 'CODE-123',
      });
    });
  });

  describe('joinFamily', () => {
    it('harus menolak jika inviteCode kosong', async () => {
      const result = await joinFamily(mockSupabase, 'user-1', { inviteCode: '' });
      expect(result.error).toBe('Kode undangan wajib diisi');
      expect(result.status).toBe(400);
    });

    it('harus memanggil repository untuk bergabung jika valid', async () => {
      joinFamilyByCode.mockResolvedValue({ data: { id: 'fam-1' }, error: null });

      const result = await joinFamily(mockSupabase, 'user-1', { inviteCode: 'CODE-123' });
      expect(result.data.id).toBe('fam-1');
      expect(joinFamilyByCode).toHaveBeenCalledWith(mockSupabase, {
        inviteCode: 'CODE-123',
      });
    });
  });
});
