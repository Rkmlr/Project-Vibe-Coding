import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, PUT } from '@/app/api/family/route';
import { createMockRequest } from '../../helpers/requestMock';
import { createMockSupabase } from '../../helpers/supabaseMock';

let mockSupabase;

vi.mock('@/lib/supabase/apiClient', () => ({
  createApiClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}));

describe('Family Onboarding API Route', () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  describe('POST (Create Family)', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Unauthorized' },
      });

      const req = createMockRequest({ method: 'POST' });
      const response = await POST(req);
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 400 if fields are missing', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const req = createMockRequest({
        method: 'POST',
        body: { familyName: 'Cemara' } // inviteCode missing
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Nama keluarga dan kode undangan wajib diisi');
    });

    it('should return 201 on success', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { id: 'fam-123', name: 'Cemara', invite_code: 'CODE-123' },
        error: null,
      });

      const req = createMockRequest({
        method: 'POST',
        body: { familyName: 'Cemara', inviteCode: 'CODE-123' }
      });
      const response = await POST(req);
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('fam-123');
    });

    it('should return 400 if RPC fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database constraint error' },
      });

      const req = createMockRequest({
        method: 'POST',
        body: { familyName: 'Cemara', inviteCode: 'CODE-123' }
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Gagal membuat keluarga: Database constraint error');
    });
  });

  describe('PUT (Join Family)', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Unauthorized' },
      });

      const req = createMockRequest({ method: 'PUT' });
      const response = await PUT(req);
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 400 if inviteCode is missing', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const req = createMockRequest({
        method: 'PUT',
        body: {}
      });
      const response = await PUT(req);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Kode undangan wajib diisi');
    });

    it('should return 200 on successful join', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { id: 'fam-123', name: 'Cemara' },
        error: null,
      });

      const req = createMockRequest({
        method: 'PUT',
        body: { inviteCode: 'CODE-123' }
      });
      const response = await PUT(req);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('fam-123');
    });

    it('should return 400 if join RPC fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid code' },
      });

      const req = createMockRequest({
        method: 'PUT',
        body: { inviteCode: 'CODE-INVALID' }
      });
      const response = await PUT(req);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Gagal bergabung dengan keluarga: Invalid code');
    });
  });
});
