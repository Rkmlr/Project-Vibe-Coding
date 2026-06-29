import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/envelopes/close-book/route';
import { createMockRequest } from '../../helpers/requestMock';
import { createMockSupabase } from '../../helpers/supabaseMock';

const mockSupabase = createMockSupabase();

vi.mock('@/utils/supabase/api', () => ({
  createApiClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}));

describe('Close Book API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 403 if user is not an admin', async () => {
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
      body: { method: 'sweep' }
    });
    const response = await POST(req);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('Only admins can close book');
  });

  it('should successfully sweep balance to cash pool', async () => {
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
    // Fetch envelopes (close-book route fetches envelopes first to check if they are already empty)
    // The query is: const { data: envelopes } = await supabase.from("envelopes").select("*").eq("family_id", ...)
    // In JS client, it returns a list. Our supabaseMock's single() implementation defaults to resolving {data: null, error: null}.
    // But since it's a list fetch, the client just awaits the queryBuilder itself (which uses .then() in JS, which we mocked).
    // Let's explicitly mock .then() to return a list of envelopes with balances > 0 so it doesn't shortcut with "Semua amplop sudah kosong".
    queryBuilderMock.then.mockImplementationOnce((resolve) => resolve({
      data: [{ id: 'env-1', name: 'Makan', balance: 50000 }],
      error: null
    }));

    // RPC close_book call
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: null
    });

    const req = createMockRequest({
      method: 'POST',
      body: { method: 'sweep' }
    });
    const response = await POST(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(mockSupabase.rpc).toHaveBeenCalledWith('close_book', expect.objectContaining({
      p_family_id: 'fam-123',
      p_user_id: 'admin-123'
    }));
  });

  it('should successfully move balance to savings envelope', async () => {
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
    // Fetch envelopes
    queryBuilderMock.then.mockImplementationOnce((resolve) => resolve({
      data: [{ id: 'env-1', name: 'Makan', balance: 50000 }],
      error: null
    }));
    // RPC close_book_savings call
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: null
    });

    const req = createMockRequest({
      method: 'POST',
      body: { method: 'savings', savingsEnvelopeId: 'env-savings-123' }
    });
    const response = await POST(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(mockSupabase.rpc).toHaveBeenCalledWith('close_book_savings', expect.objectContaining({
      p_family_id: 'fam-123',
      p_user_id: 'admin-123',
      p_savings_envelope_id: 'env-savings-123'
    }));
  });

  it('should return 400 if method is savings and target savings envelope is missing', async () => {
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
    // Fetch envelopes
    queryBuilderMock.then.mockImplementationOnce((resolve) => resolve({
      data: [{ id: 'env-1', name: 'Makan', balance: 50000 }],
      error: null
    }));

    const req = createMockRequest({
      method: 'POST',
      body: { method: 'savings' } // savingsEnvelopeId missing
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
