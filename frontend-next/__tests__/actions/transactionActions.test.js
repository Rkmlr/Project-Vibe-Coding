import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addTransaction, transferBalance } from '@/actions/transactionActions';

global.fetch = vi.fn();

describe('transactionActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addTransaction', () => {
    it('calls API and returns success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const payload = { type: 'EXPENSE', amount: 100, description: 'Test', envelopeId: 1, category: 'NEEDS' };
      const result = await addTransaction(payload);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/transactions', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ type: 'EXPENSE', amount: 100, description: 'Test', source: 'APP', envelope_id: 1, category: 'NEEDS' })
      }));
    });

    it('returns error when API fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Insufficient funds' })
      });

      const payload = { type: 'EXPENSE', amount: 100 };
      const result = await addTransaction(payload);

      expect(result.error).toBe('Insufficient funds');
    });
  });

  describe('transferBalance', () => {
    it('calls transfer API and returns success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const payload = { sourceEnvelopeId: null, targetEnvelopeId: 2, amount: 50, description: 'Topup' };
      const result = await transferBalance(payload);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/transactions/transfer', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ from_envelope_id: null, to_envelope_id: 2, amount: 50, description: 'Topup' })
      }));
    });
  });
});
