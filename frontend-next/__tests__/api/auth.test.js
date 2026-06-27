import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/auth/login/route';

// Mock the dependencies
vi.mock('@/utils/supabase/api', () => ({
  createApiClient: vi.fn().mockResolvedValue({
    auth: {
      signInWithPassword: vi.fn().mockImplementation(({ email, password }) => {
        if (email === 'test@example.com' && password === 'correct-password') {
          return { data: { user: { id: '1', email }, session: { access_token: 'mock-token' } }, error: null };
        }
        return { data: null, error: { message: 'Invalid login credentials' } };
      })
    }
  })
}));

describe('Auth Login API', () => {
  
  it('should return 400 if email or password is missing', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }) // missing password
    });

    const response = await POST(req);
    const json = await response.json();
    
    expect(response.status).toBe(400);
    expect(json.error).toBe('Email and password are required');
  });

  it('should return 401 if credentials are wrong', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'wrong' })
    });

    const response = await POST(req);
    const json = await response.json();
    
    expect(response.status).toBe(401);
    expect(json.error).toBe('Invalid login credentials');
  });

  it('should return 200 and tokens if successful', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'correct-password' })
    });

    const response = await POST(req);
    const json = await response.json();
    
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.tokens.access_token).toBe('mock-token');
  });
  
});
