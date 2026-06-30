import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/login/route';
import { createMockRequest } from '../../helpers/requestMock';
import { createMockSupabase } from '../../helpers/supabaseMock';

let mockSupabase;

vi.mock('@/lib/supabase/apiClient', () => ({
  createApiClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}));

describe('Login API Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
  });

  it('should return 400 if email or password is missing', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: { email: 'test@example.com' } // password missing
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    
    const body = await response.json();
    expect(body.error).toBe('Email and password are required');
  });

  it('should return 200 on successful login', async () => {
    const mockSession = {
      access_token: 'valid_access_token',
      refresh_token: 'valid_refresh_token',
    };
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'user-123', email: 'test@example.com' }, session: mockSession },
      error: null,
    });

    const req = createMockRequest({
      method: 'POST',
      body: { email: 'test@example.com', password: 'password123' }
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.user.id).toBe('user-123');
    expect(body.tokens.access_token).toBe('valid_access_token');
  });

  it('should return 401 if login fails in Supabase auth', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });

    const req = createMockRequest({
      method: 'POST',
      body: { email: 'wrong@example.com', password: 'wrongpassword' }
    });

    const response = await POST(req);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe('Invalid login credentials');
  });
});
