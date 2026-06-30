import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/envelopes/[id]/route';
import { createMockRequest } from '../../helpers/requestMock';
import { createMockSupabase } from '../../helpers/supabaseMock';

let mockSupabase;

// Update path sesuai lokasi baru Database Layer.
vi.mock('@/lib/supabase/apiClient', () => ({
  createApiClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}));

describe('Envelope Detail API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
  });

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Unauthorized' },
      });

      const req = createMockRequest({});
      const response = await GET(req, { params: Promise.resolve({ id: 'env-123' }) });
      expect(response.status).toBe(401);
    });

    it('should return 404 if user has no family', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      const queryBuilderMock = mockSupabase.from();
      queryBuilderMock.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'No family' }
      });

      const req = createMockRequest({});
      const response = await GET(req, { params: Promise.resolve({ id: 'env-123' }) });
      expect(response.status).toBe(404);
    });

    it('should return 200 with envelope details', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      const queryBuilderMock = mockSupabase.from();
      // Profile
      queryBuilderMock.single.mockResolvedValueOnce({
        data: { family_id: 'fam-123' },
        error: null
      });
      // Envelope
      queryBuilderMock.single.mockResolvedValueOnce({
        data: { id: 'env-123', name: 'Makan', family_id: 'fam-123', balance: 1000 },
        error: null
      });

      const req = createMockRequest({});
      const response = await GET(req, { params: Promise.resolve({ id: 'env-123' }) });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('env-123');
    });
  });

  describe('PUT', () => {
    it('should prevent non-admin from updating', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      const queryBuilderMock = mockSupabase.from();
      queryBuilderMock.single.mockResolvedValueOnce({
        data: { role: 'member', family_id: 'fam-123' },
        error: null
      });

      const req = createMockRequest({
        method: 'PUT',
        body: { name: 'Makan Baru' }
      });
      const response = await PUT(req, { params: Promise.resolve({ id: 'env-123' }) });
      expect(response.status).toBe(403);
    });

    it('should successfully update envelope if admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'admin-123' } },
        error: null,
      });
      const queryBuilderMock = mockSupabase.from();
      // 1. getProfileById → admin profile
      queryBuilderMock.single.mockResolvedValueOnce({
        data: { role: 'admin', family_id: 'fam-123' },
        error: null
      });
      // 2. repoGetEnvelopeById → old envelope data
      queryBuilderMock.single.mockResolvedValueOnce({
        data: { id: 'env-123', name: 'Makan', family_id: 'fam-123', limit_amount: 1000, category: 'NEEDS' },
        error: null
      });
      // 3. repoUpdateEnvelope → updated envelope
      queryBuilderMock.single.mockResolvedValueOnce({
        data: { id: 'env-123', name: 'Makan Baru', family_id: 'fam-123', limit_amount: 1000, category: 'NEEDS' },
        error: null
      });
      // 4. insertAuditLog → uses insert(), not single() — default mock is sufficient

      const req = createMockRequest({
        method: 'PUT',
        body: { name: 'Makan Baru' }
      });
      const response = await PUT(req, { params: Promise.resolve({ id: 'env-123' }) });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Makan Baru');
    });

  });

  describe('DELETE', () => {
    it('should successfully delete envelope using RPC', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'admin-123' } },
        error: null,
      });
      const queryBuilderMock = mockSupabase.from();
      // Profile
      queryBuilderMock.single.mockResolvedValueOnce({
        data: { role: 'admin', family_id: 'fam-123' },
        error: null
      });
      // RPC delete call
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const req = createMockRequest({
        method: 'DELETE',
        body: { reallocateToId: 'env-456' }
      });
      const response = await DELETE(req, { params: Promise.resolve({ id: 'env-123' }) });
      expect(response.status).toBe(200);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('delete_envelope_and_reallocate', expect.objectContaining({
        p_envelope_id: 'env-123',
        p_reallocate_to_id: 'env-456'
      }));
    });
  });
});
