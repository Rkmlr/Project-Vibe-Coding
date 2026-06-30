/**
 * SERVICE TESTS — Audit Log Service
 *
 * Menguji business logic penarikan audit logs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase } from '../helpers/supabaseMock';

vi.mock('@/repositories/profileRepository', () => ({
  getProfileById: vi.fn(),
}));

vi.mock('@/repositories/auditLogRepository', () => ({
  getAuditLogsByFamilyId: vi.fn(),
}));

import { getProfileById } from '@/repositories/profileRepository';
import { getAuditLogsByFamilyId } from '@/repositories/auditLogRepository';
import { getAuditLogs } from '@/services/auditLogService';

let mockSupabase;

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = createMockSupabase();
});

describe('auditLogService', () => {
  it('harus menolak jika user bukan admin', async () => {
    getProfileById.mockResolvedValue({ data: { role: 'member', family_id: 'fam-1' }, error: null });

    const result = await getAuditLogs(mockSupabase, 'user-1');
    expect(result.error).toContain('Only admins can access audit logs');
    expect(result.status).toBe(403);
  });

  it('harus mengembalikan log dengan user_name dari profile display_name jika admin', async () => {
    getProfileById.mockResolvedValue({ data: { role: 'admin', family_id: 'fam-1' }, error: null });
    getAuditLogsByFamilyId.mockResolvedValue({
      data: [
        { id: 'log-1', action: 'UPDATE_ENVELOPES', profiles: { display_name: 'Alice' } },
        { id: 'log-2', action: 'DELETE_ENVELOPES', profiles: null }
      ],
      error: null
    });

    const result = await getAuditLogs(mockSupabase, 'admin-1');
    expect(result.data).toHaveLength(2);
    expect(result.data[0].user_name).toBe('Alice');
    expect(result.data[1].user_name).toBe('System');
  });
});
