import { vi } from 'vitest';

export const createMockSupabase = (overrides = {}) => {
  const queryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve({ data: null, error: null })),
    then: vi.fn().mockImplementation((resolve) => resolve({ data: null, error: null })),
    ...overrides.queryBuilder,
  };

  // Implement self-chaining
  queryBuilder.select.mockImplementation(() => queryBuilder);
  queryBuilder.insert.mockImplementation(() => queryBuilder);
  queryBuilder.update.mockImplementation(() => queryBuilder);
  queryBuilder.delete.mockImplementation(() => queryBuilder);
  queryBuilder.eq.mockImplementation(() => queryBuilder);
  queryBuilder.order.mockImplementation(() => queryBuilder);

  const auth = {
    getUser: vi.fn().mockResolvedValue({ 
      data: { user: { id: 'mock-user-id', email: 'test@example.com' } }, 
      error: null 
    }),
    signUp: vi.fn().mockResolvedValue({ 
      data: { user: { id: 'mock-user-id' }, session: null }, 
      error: null 
    }),
    signInWithPassword: vi.fn().mockResolvedValue({ 
      data: { user: { id: 'mock-user-id' }, session: { access_token: 'access_tok', refresh_token: 'refresh_tok' } }, 
      error: null 
    }),
    ...overrides.auth,
  };

  const client = {
    auth,
    from: vi.fn().mockReturnValue(queryBuilder),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides.client,
  };

  return client;
};
