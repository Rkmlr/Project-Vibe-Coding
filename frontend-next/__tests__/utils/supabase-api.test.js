import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApiClient } from '@/utils/supabase/api';
import { createMockRequest } from '../helpers/requestMock';
import { createServerClient } from '@supabase/ssr';
import { createClient as createJSClient } from '@supabase/supabase-js';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn().mockReturnValue({ clientType: 'ssr' }),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({ clientType: 'js' }),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    set: () => {},
  }),
}));

describe('createApiClient Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
  });

  it('should create JS Client (Mobile App) when Authorization header is present', async () => {
    const req = createMockRequest({
      headers: {
        authorization: 'Bearer my-bearer-token',
      },
    });

    const client = await createApiClient(req);
    
    expect(createJSClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'mock-anon-key',
      expect.objectContaining({
        global: {
          headers: {
            Authorization: 'Bearer my-bearer-token',
          },
        },
      })
    );
    expect(client.clientType).toBe('js');
  });

  it('should create SSR Client (Web App) when Authorization header is missing', async () => {
    const req = createMockRequest({});

    const client = await createApiClient(req);

    expect(createServerClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'mock-anon-key',
      expect.any(Object)
    );
    expect(client.clientType).toBe('ssr');
  });
});
