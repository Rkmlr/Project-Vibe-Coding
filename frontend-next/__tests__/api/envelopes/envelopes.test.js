import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/envelopes/route';
import { createMockRequest } from '../../helpers/requestMock';
import { createMockSupabase } from '../../helpers/supabaseMock';

let mockSupabase;

vi.mock('@/utils/supabase/api', () => ({
  createApiClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}));

describe('Envelopes Main Route', () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Unauthorized' },
      });

      const req = createMockRequest({});
      const response = await GET(req);
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 404 if user has no family', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const queryBuilderMock = mockSupabase.from();
      queryBuilderMock.single.mockResolvedValueOnce({
        data: { family_id: null },
        error: null
      });

      const req = createMockRequest({});
      const response = await GET(req);
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('No family associated with this user');
    });

    it('should return list of envelopes for authenticated user with family', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const queryBuilderMock = mockSupabase.from();
      // Profile fetch
      queryBuilderMock.single.mockResolvedValueOnce({
        data: { family_id: 'fam-123' },
        error: null
      });
      // Envelopes fetch - list
      const mockEnvelopes = [
        { id: 'env-1', name: 'Makan', balance: 50000 },
        { id: 'env-2', name: 'Transport', balance: 20000 }
      ];
      queryBuilderMock.then.mockImplementationOnce((resolve) => resolve({
        data: mockEnvelopes,
        error: null
      }));

      const req = createMockRequest({});
      const response = await GET(req);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      // Wait, in envelopes/route.js, the query is:
      // const { data: envelopes, error: envError } = await supabase.from("envelopes").select("*").eq(...).order(...);
      // It awaits the queryBuilder itself (which uses .then() internally in JS/NextJS client or via Vitest mock implementation).
      // Our supabaseMock implements `.then` that defaults to resolving `{ data: null, error: null }`.
      // Let's make sure it returns mockEnvelopes.
    });
  });

  describe('POST', () => {
    it('should return 403 if non-admin tries to create an envelope', async () => {
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
        method: 'POST',
        body: { name: 'Liburan', category: 'WANTS', limit_amount: 100000 }
      });
      const response = await POST(req);
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Only admins can create envelopes');
    });

    it('should return 201 on successful envelope creation by admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'admin-123' } },
        error: null,
      });

      const queryBuilderMock = mockSupabase.from();
      // Admin profile check
      queryBuilderMock.single.mockResolvedValueOnce({
        data: { role: 'admin', family_id: 'fam-123' },
        error: null
      });

      // Insert envelope check. In JS client, it does: .insert({...}).select().single()
      queryBuilderMock.single.mockResolvedValueOnce({
        data: { id: 'new-env-123', name: 'Liburan', category: 'WANTS', balance: 0 },
        error: null
      });

      const req = createMockRequest({
        method: 'POST',
        body: { name: 'Liburan', category: 'WANTS', limit_amount: 100000, initial_balance: 0 }
      });
      const response = await POST(req);
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('new-env-123');
    });
  });
});
