import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/transactions/transfer/route';
import { createMockRequest } from '../../helpers/requestMock';
import { createMockSupabase } from '../../helpers/supabaseMock';

let mockSupabase;

vi.mock('@/lib/supabase/apiClient', () => ({
  createApiClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}));

describe('Transactions Transfer API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
  });

  it('should return 403 if non-admin tries to transfer funds', async () => {
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
      body: { to_envelope_id: 'env-2', amount: 50000 }
    });
    const response = await POST(req);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('Hanya admin yang dapat memindahkan dana');
  });

  it('should successfully transfer funds using RPC', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-123' } },
      error: null,
    });
    const queryBuilderMock = mockSupabase.from();
    queryBuilderMock.single.mockResolvedValueOnce({
      data: { role: 'admin', family_id: 'fam-123' },
      error: null
    });
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: null
    });

    const req = createMockRequest({
      method: 'POST',
      body: { from_envelope_id: 'env-1', to_envelope_id: 'env-2', amount: 5000, description: 'Saku' }
    });
    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(mockSupabase.rpc).toHaveBeenCalledWith('transfer_funds', expect.objectContaining({
      p_family_id: 'fam-123',
      p_user_id: 'admin-123',
      p_from_envelope_id: 'env-1',
      p_to_envelope_id: 'env-2',
      p_amount: 5000
    }));
  });

  it('should return 400 if RPC fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-123' } },
      error: null,
    });
    const queryBuilderMock = mockSupabase.from();
    queryBuilderMock.single.mockResolvedValueOnce({
      data: { role: 'admin', family_id: 'fam-123' },
      error: null
    });
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Insufficient funds' }
    });

    const req = createMockRequest({
      method: 'POST',
      body: { from_envelope_id: 'env-1', to_envelope_id: 'env-2', amount: 5000 }
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Transfer gagal: Insufficient funds');
  });
});
