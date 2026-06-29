import { describe, it, expect, vi, beforeEach } from 'vitest';
import { middleware } from '@/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

describe('App Middleware', () => {
  let mockSupabase;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
    };
    createServerClient.mockReturnValue(mockSupabase);
  });

  const createRequestMock = (pathname) => {
    const url = new URL(`http://localhost${pathname}`);
    return {
      nextUrl: {
        clone() {
          return url;
        },
        pathname,
      },
      cookies: {
        getAll: () => [],
        set: () => {},
      },
      url: url.toString(),
    };
  };

  it('should redirect logged-in user from / to /dashboard', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const req = createRequestMock('/');
    const res = await middleware(req);

    // NextResponse.redirect returns a redirect response
    expect(res).toBeDefined();
    // In Next.js test environments, a redirect is characterized by status 307/308
    expect(res.status).toBe(307);
  });

  it('should redirect guest user from /dashboard to /', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const req = createRequestMock('/dashboard');
    const res = await middleware(req);

    expect(res).toBeDefined();
    expect(res.status).toBe(307);
  });

  it('should allow logged-in user to access /dashboard', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const req = createRequestMock('/dashboard');
    const res = await middleware(req);

    // Should return standard NextResponse.next() response (status 200 or defined)
    expect(res).toBeDefined();
    expect(res.status).not.toBe(307); // Not redirected
  });

  it('should allow guest user to access /', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const req = createRequestMock('/');
    const res = await middleware(req);

    expect(res).toBeDefined();
    expect(res.status).not.toBe(307); // Not redirected
  });
});
