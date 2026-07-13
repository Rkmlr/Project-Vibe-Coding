import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEnvelope, updateEnvelope, deleteEnvelope, closeMonthlyBook } from '@/api-clients/envelopeClient';

global.fetch = vi.fn();

describe('envelopeClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createEnvelope', () => {
    it('returns success and data on valid creation', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 1, name: 'Food' } })
      });

      const result = await createEnvelope('Food', 500, 'NEEDS', null);

      expect(result).toEqual({ success: true, data: { id: 1, name: 'Food' } });
      expect(global.fetch).toHaveBeenCalledWith('/api/envelopes', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Food', limit_amount: 500, category: 'NEEDS', assigned_to: null })
      }));
    });

    it('returns error on failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid data' })
      });

      const result = await createEnvelope('', 0, 'WANTS');
      expect(result).toEqual({ error: 'Invalid data' });
    });
  });

  describe('updateEnvelope', () => {
    it('calls API PUT and returns success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 1 } })
      });

      const result = await updateEnvelope(1, 'Updated Food', 600, 'NEEDS');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/envelopes/1', expect.objectContaining({
        method: 'PUT'
      }));
    });
  });

  describe('deleteEnvelope', () => {
    it('calls API DELETE and returns success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await deleteEnvelope(1, 2);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/envelopes/1', expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify({ reallocateToId: 2 })
      }));
    });
  });

  describe('closeMonthlyBook', () => {
    it('calls close-book API', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await closeMonthlyBook('SAVINGS', 3);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/envelopes/close-book', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ method: 'SAVINGS', savingsEnvelopeId: 3 })
      }));
    });
  });
});
