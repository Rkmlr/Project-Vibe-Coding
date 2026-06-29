import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/transactions/route';
import { createMockRequest } from '../../helpers/requestMock';
import { createMockSupabase } from '../../helpers/supabaseMock';

const mockSupabase = createMockSupabase();

vi.mock('@/utils/supabase/api', () => ({
  createApiClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}));

describe('Transactions Main Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    });

    it('should return 404 if profile has no family_id', async () => {
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
    });

    it('should return 200 with list of transactions', async () => {
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
      // Fetch transactions list
      const mockTx = [
        { id: 'tx-1', amount: 5000, description: 'Beli Jajan' }
      ];
      queryBuilderMock.then.mockImplementationOnce((resolve) => resolve({
        data: mockTx,
        error: null
      }));

      const req = createMockRequest({});
      const response = await GET(req);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data[0].id).toBe('tx-1');
    });
  });

  describe('POST', () => {
    it('should prevent non-admin from recording INCOME', async () => {
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
        body: { type: 'INCOME', amount: 100000, description: 'Gaji', source: 'CASH' }
      });
      const response = await POST(req);
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Hanya pengelola yang dapat mencatat pemasukan');
    });

    it('should record transaction successfully using RPC', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      const queryBuilderMock = mockSupabase.from();
      queryBuilderMock.single.mockResolvedValueOnce({
        data: { role: 'member', family_id: 'fam-123' },
        error: null
      });
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { id: 'tx-123' },
        error: null
      });

      const req = createMockRequest({
        method: 'POST',
        body: { type: 'EXPENSE', amount: 5000, description: 'Beli Kopi', source: 'CASH', envelope_id: 'env-123' }
      });
      const response = await POST(req);
      expect(response.status).toBe(201);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('add_transaction', expect.objectContaining({
        p_family_id: 'fam-123',
        p_user_id: 'user-123',
        p_type: 'EXPENSE',
        p_amount: 5000
      }));
    });
  });
});
