import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/register/route';
import { createMockRequest } from '../../helpers/requestMock';
import { createMockSupabase } from '../../helpers/supabaseMock';

let mockSupabase;

vi.mock('@/lib/supabase/apiClient', () => ({
  createApiClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}));

// Mock rateLimit utility
const mockRateLimit = vi.fn().mockReturnValue(true);
vi.mock('@/utils/rate-limit', () => ({
  rateLimit: (...args) => mockRateLimit(...args),
}));

describe('Register API Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
    mockRateLimit.mockReturnValue(true);
  });

  it('should return 429 if rate limit is exceeded', async () => {
    mockRateLimit.mockReturnValueOnce(false);

    const req = createMockRequest({
      method: 'POST',
      body: { email: 'test@example.com', password: 'password', displayName: 'Test', mode: 'create' },
    });

    const response = await POST(req);
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toBe('Terlalu banyak permintaan, coba lagi nanti.');
  });

  it('should return 400 if required fields are missing', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: { email: 'test@example.com' } // other fields missing
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Missing required fields');
  });

  it('should return 400 if signUp in Supabase auth fails', async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Email already registered' },
    });

    const req = createMockRequest({
      method: 'POST',
      body: { email: 'test@example.com', password: 'password', displayName: 'Test', mode: 'create', familyName: 'Cemara' },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Email already registered');
  });

  it('should return 400 if mode is create and familyName is missing', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: { email: 'test@example.com', password: 'password', displayName: 'Test', mode: 'create' },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Family name is required for mode create');
  });

  it('should successfully sign up and create family', async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'user-123' }, session: { access_token: 'tok' } },
      error: null,
    });
    mockSupabase.rpc.mockResolvedValueOnce({
      data: { id: 'fam-123' },
      error: null,
    });

    const req = createMockRequest({
      method: 'POST',
      body: { email: 'test@example.com', password: 'password', displayName: 'Test', mode: 'create', familyName: 'Cemara' },
    });

    const response = await POST(req);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.requiresEmailConfirmation).toBe(false);
  });

  it('should return 400 if create family RPC fails', async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'user-123' }, session: { access_token: 'tok' } },
      error: null,
    });
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database constraint failed' },
    });

    const req = createMockRequest({
      method: 'POST',
      body: { email: 'test@example.com', password: 'password', displayName: 'Test', mode: 'create', familyName: 'Cemara' },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Gagal membuat keluarga: Database constraint failed');
  });

  it('should return 400 if mode is join and inviteCode is missing', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: { email: 'test@example.com', password: 'password', displayName: 'Test', mode: 'join' },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invite code is required for mode join');
  });

  it('should successfully sign up and join family', async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'user-123' }, session: { access_token: 'tok' } },
      error: null,
    });
    mockSupabase.rpc.mockResolvedValueOnce({
      data: { id: 'fam-123' },
      error: null,
    });

    const req = createMockRequest({
      method: 'POST',
      body: { email: 'test@example.com', password: 'password', displayName: 'Test', mode: 'join', inviteCode: 'CEMARA-1234' },
    });

    const response = await POST(req);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('should return 400 if join family RPC fails', async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'user-123' }, session: { access_token: 'tok' } },
      error: null,
    });
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid invite code' },
    });

    const req = createMockRequest({
      method: 'POST',
      body: { email: 'test@example.com', password: 'password', displayName: 'Test', mode: 'join', inviteCode: 'INVALID-CODE' },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Gagal bergabung: Invalid invite code');
  });

  it('should handle registration with 300 characters displayName and familyName', async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { session: { access_token: 'valid_token' } },
      error: null,
    });
    mockSupabase.rpc.mockResolvedValueOnce({ error: null });

    const longString = 'A'.repeat(300);
    const req = createMockRequest({
      method: 'POST',
      body: { 
        email: 'long@example.com', 
        password: 'password123', 
        displayName: longString, 
        mode: 'create', 
        familyName: longString 
      },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: {
          data: {
            display_name: longString,
          },
        },
      })
    );
  });
});
