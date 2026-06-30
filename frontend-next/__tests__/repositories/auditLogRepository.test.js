/**
 * REPOSITORY TESTS — Audit Log Repository
 *
 * Memvalidasi query ke tabel audit_logs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuditLogsByFamilyId } from '@/repositories/auditLogRepository';
import { createMockSupabase } from '../helpers/supabaseMock';

let mockSupabase;

describe('auditLogRepository', () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  describe('getAuditLogsByFamilyId', () => {
    it('harus memanggil from("audit_logs"), select, eq, dan order', async () => {
      const mockLogs = [{ id: 'log-1', action: 'LOGIN' }];
      const qb = mockSupabase.from();
      qb.then.mockImplementationOnce((resolve) => resolve({ data: mockLogs, error: null }));

      const result = await getAuditLogsByFamilyId(mockSupabase, 'fam-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
      expect(qb.select).toHaveBeenCalledWith('*, profiles(display_name)');
      expect(qb.eq).toHaveBeenCalledWith('family_id', 'fam-123');
      expect(qb.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result.data).toEqual(mockLogs);
    });
  });
});
