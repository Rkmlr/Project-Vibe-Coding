import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/auth/me/route';
import { createMockRequest } from '../../helpers/requestMock';
import { createMockSupabase } from '../../helpers/supabaseMock';

let mockSupabase;

vi.mock('@/lib/supabase/apiClient', () => ({
  createApiClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}));

describe('Me API Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Auth session missing' }
    });

    const req = createMockRequest({});
    const response = await GET(req);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should return 404 if profile is not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null
    });

    // Mock profiles table query to return error/empty
    const queryBuilderMock = mockSupabase.from();
    queryBuilderMock.single.mockResolvedValueOnce({ data: null, error: { message: 'Profile not found' } });

    const req = createMockRequest({});
    const response = await GET(req);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Profile not found');
  });

  it('should return profile and family data if user is fully set up', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null
    });

    const queryBuilderMock = mockSupabase.from();
    // 1st call for profiles table
    queryBuilderMock.single.mockResolvedValueOnce({ 
      data: { display_name: 'Test User', family_id: 'fam-123', role: 'admin' }, 
      error: null 
    });
    // 2nd call for families table
    queryBuilderMock.single.mockResolvedValueOnce({ 
      data: { name: 'Cemara Family', invite_code: 'CEMARA-123', cash_pool_balance: 50000 }, 
      error: null 
    });

    const req = createMockRequest({});
    const response = await GET(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.user.display_name).toBe('Test User');
    expect(body.user.family.name).toBe('Cemara Family');
    expect(body.user.family.cash_pool_balance).toBe(50000);
  });

  it('should return user with family null if family_id is not set', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null
    });

    const queryBuilderMock = mockSupabase.from();
    queryBuilderMock.single.mockResolvedValueOnce({ 
      data: { display_name: 'Solo User', family_id: null, role: 'member' }, 
      error: null 
    });

    const req = createMockRequest({});
    const response = await GET(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.user.family).toBeNull();
  });
});
