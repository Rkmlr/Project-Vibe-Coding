import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, logout, signup } from '@/actions/authActions';

// Mock global fetch
global.fetch = vi.fn();

describe('authActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('returns success: true when API call is successful', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 1 } })
      });

      const formData = new FormData();
      formData.append('email', 'test@test.com');
      formData.append('password', 'password123');

      const result = await login(formData);

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: 'password123' })
      }));
    });

    it('returns error message when API call fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' })
      });

      const formData = new FormData();
      formData.append('email', 'test@test.com');
      formData.append('password', 'wrong');

      const result = await login(formData);

      expect(result).toEqual({ error: 'Invalid credentials' });
    });
  });

  describe('logout', () => {
    it('calls logout API and returns success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
      });

      const result = await logout();
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
    });
  });

  describe('signup', () => {
    it('returns success: true on successful registration', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 1 } })
      });

      const formData = new FormData();
      formData.append('email', 'new@test.com');
      formData.append('password', 'pass123');
      formData.append('displayName', 'New User');
      formData.append('mode', 'create');
      formData.append('familyName', 'New Family');

      const result = await signup(null, formData);

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
        method: 'POST'
      }));
    });

    it('returns error when API call fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email already exists' })
      });

      const formData = new FormData();
      const result = await signup(null, formData);

      expect(result).toEqual({ error: 'Email already exists' });
    });
  });
});
