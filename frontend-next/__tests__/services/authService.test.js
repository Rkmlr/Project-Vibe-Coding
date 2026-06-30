/**
 * SERVICE TESTS — Auth Service
 *
 * Menguji business rules autentikasi dan onboarding.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase } from '../helpers/supabaseMock';

vi.mock('@/repositories/profileRepository', () => ({
  getProfileById: vi.fn(),
}));

vi.mock('@/repositories/familyRepository', () => ({
  getFamilyById: vi.fn(),
  createFamilyAndSetAdmin: vi.fn(),
  joinFamilyByCode: vi.fn(),
}));

import { getProfileById } from '@/repositories/profileRepository';
import {
  getFamilyById,
  createFamilyAndSetAdmin,
  joinFamilyByCode,
} from '@/repositories/familyRepository';

import {
  loginUser,
  logoutUser,
  getCurrentUser,
  registerUser,
} from '@/services/authService';

let mockSupabase;

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = createMockSupabase({
    auth: {
      signOut: vi.fn(),
    }
  });
});

describe('authService', () => {
  // ─── loginUser ──────────────────────────────────────────────────────────────

  describe('loginUser', () => {
    it('harus menolak jika email atau password kosong', async () => {
      const result = await loginUser(mockSupabase, { email: '', password: '123' });
      expect(result.error).toBe('Email and password are required');
      expect(result.status).toBe(400);
    });

    it('harus berhasil login jika credentials benar', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: 'u-1' }, session: { access_token: 'tok' } },
        error: null,
      });

      const result = await loginUser(mockSupabase, { email: 't@ex.com', password: '123' });
      expect(result.success).toBe(true);
      expect(result.user.id).toBe('u-1');
    });
  });

  // ─── logoutUser ─────────────────────────────────────────────────────────────

  describe('logoutUser', () => {
    it('harus berhasil sign out', async () => {
      mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });
      const result = await logoutUser(mockSupabase);
      expect(result.success).toBe(true);
    });
  });

  // ─── getCurrentUser ─────────────────────────────────────────────────────────

  describe('getCurrentUser', () => {
    it('harus mengambil profile dan detail keluarga', async () => {
      getProfileById.mockResolvedValue({ data: { display_name: 'Bob', family_id: 'fam-1', role: 'member' }, error: null });
      getFamilyById.mockResolvedValue({ data: { name: 'Bob Family' }, error: null });

      const result = await getCurrentUser(mockSupabase, 'u-1', 'bob@ex.com');
      expect(result.data.display_name).toBe('Bob');
      expect(result.data.family.name).toBe('Bob Family');
    });
  });

  // ─── registerUser ───────────────────────────────────────────────────────────

  describe('registerUser', () => {
    it('harus membuat keluarga baru jika mode create', async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'u-1' }, session: null },
        error: null,
      });
      createFamilyAndSetAdmin.mockResolvedValue({ error: null });

      const result = await registerUser(mockSupabase, {
        email: 'a@ex.com',
        password: '123',
        displayName: 'Alice',
        mode: 'create',
        familyName: 'Alice Fam',
      });

      expect(result.success).toBe(true);
      expect(createFamilyAndSetAdmin).toHaveBeenCalled();
    });

    it('harus bergabung dengan keluarga jika mode join', async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'u-1' }, session: null },
        error: null,
      });
      joinFamilyByCode.mockResolvedValue({ error: null });

      const result = await registerUser(mockSupabase, {
        email: 'a@ex.com',
        password: '123',
        displayName: 'Alice',
        mode: 'join',
        inviteCode: 'ALICE-1234',
      });

      expect(result.success).toBe(true);
      expect(joinFamilyByCode).toHaveBeenCalledWith(mockSupabase, { inviteCode: 'ALICE-1234' });
    });
  });
});
