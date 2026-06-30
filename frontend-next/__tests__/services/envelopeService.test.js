/**
 * SERVICE TESTS — Envelope Service
 *
 * Menguji business rules secara murni:
 * - Tidak perlu mock HTTP (tidak ada request/response)
 * - Repository di-mock untuk isolasi
 * - Setiap test memvalidasi satu business rule
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase } from '../helpers/supabaseMock';

// Mock semua repository — service tidak boleh menyentuh DB asli
vi.mock('@/repositories/profileRepository', () => ({
  getProfileById: vi.fn(),
}));

vi.mock('@/repositories/envelopeRepository', () => ({
  getEnvelopesByFamilyId: vi.fn(),
  getEnvelopeById: vi.fn(),
  createEnvelope: vi.fn(),
  updateEnvelope: vi.fn(),
  deleteEnvelopeAndReallocate: vi.fn(),
  closeBook: vi.fn(),
  closeBookSavings: vi.fn(),
  insertAuditLog: vi.fn(),
}));

import { getProfileById } from '@/repositories/profileRepository';
import {
  getEnvelopesByFamilyId,
  getEnvelopeById as repoGetEnvelopeById,
  createEnvelope as repoCreateEnvelope,
  updateEnvelope as repoUpdateEnvelope,
  deleteEnvelopeAndReallocate,
  closeBook as repoCloseBook,
  closeBookSavings as repoCloseBookSavings,
  insertAuditLog,
} from '@/repositories/envelopeRepository';

import {
  getEnvelopes,
  getEnvelopeById,
  createEnvelope,
  updateEnvelope,
  deleteEnvelope,
  closeMonthlyBook,
} from '@/services/envelopeService';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ADMIN_PROFILE = { id: 'admin-1', role: 'admin', family_id: 'fam-123', display_name: 'Admin' };
const MEMBER_PROFILE = { id: 'member-1', role: 'member', family_id: 'fam-123', display_name: 'Member' };
const MOCK_ENVELOPES = [
  { id: 'env-1', name: 'Makan', balance: 500000, limit_amount: 1000000, category: 'NEEDS', family_id: 'fam-123' },
  { id: 'env-2', name: 'Transport', balance: 200000, limit_amount: 500000, category: 'NEEDS', family_id: 'fam-123' },
];

let mockSupabase;

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = createMockSupabase();
});

// ─── getEnvelopes ─────────────────────────────────────────────────────────────

describe('getEnvelopes', () => {
  it('harus mengembalikan daftar amplop jika pengguna memiliki keluarga', async () => {
    getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
    getEnvelopesByFamilyId.mockResolvedValue({ data: MOCK_ENVELOPES, error: null });

    const result = await getEnvelopes(mockSupabase, 'admin-1');

    expect(result.data).toEqual(MOCK_ENVELOPES);
    expect(getEnvelopesByFamilyId).toHaveBeenCalledWith(mockSupabase, 'fam-123');
  });

  it('harus mengembalikan error 404 jika pengguna tidak punya keluarga', async () => {
    getProfileById.mockResolvedValue({
      data: { ...ADMIN_PROFILE, family_id: null },
      error: null,
    });

    const result = await getEnvelopes(mockSupabase, 'admin-1');

    expect(result.error).toBe('Pengguna belum tergabung dalam keluarga.');
    expect(result.status).toBe(404);
    expect(getEnvelopesByFamilyId).not.toHaveBeenCalled();
  });

  it('harus mengembalikan error jika profil tidak ditemukan', async () => {
    getProfileById.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const result = await getEnvelopes(mockSupabase, 'unknown-user');

    expect(result.error).toBe('Profil pengguna tidak ditemukan.');
    expect(result.status).toBe(404);
  });
});

// ─── createEnvelope ───────────────────────────────────────────────────────────

describe('createEnvelope', () => {
  it('harus menolak dengan 403 jika user bukan admin', async () => {
    getProfileById.mockResolvedValue({ data: MEMBER_PROFILE, error: null });

    const result = await createEnvelope(mockSupabase, 'member-1', {
      name: 'Liburan',
      category: 'WANTS',
    });

    expect(result.error).toBe('Hanya admin yang dapat membuat amplop.');
    expect(result.status).toBe(403);
    expect(repoCreateEnvelope).not.toHaveBeenCalled();
  });

  it('harus menolak dengan 400 jika nama kosong', async () => {
    getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });

    const result = await createEnvelope(mockSupabase, 'admin-1', {
      name: '',
      category: 'WANTS',
    });

    expect(result.error).toBe('Nama dan kategori amplop wajib diisi.');
    expect(result.status).toBe(400);
    expect(repoCreateEnvelope).not.toHaveBeenCalled();
  });

  it('harus berhasil membuat amplop jika admin dan input valid', async () => {
    getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
    const newEnv = { id: 'env-new', name: 'Liburan', category: 'WANTS', balance: 0, family_id: 'fam-123' };
    repoCreateEnvelope.mockResolvedValue({ data: newEnv, error: null });

    const result = await createEnvelope(mockSupabase, 'admin-1', {
      name: 'Liburan',
      category: 'WANTS',
      limitAmount: 2000000,
    });

    expect(result.data).toEqual(newEnv);
    expect(repoCreateEnvelope).toHaveBeenCalledWith(mockSupabase, {
      name: 'Liburan',
      category: 'WANTS',
      limit_amount: 2000000,
      balance: 0,
      family_id: 'fam-123',
      created_by: 'admin-1',
    });
  });
});

// ─── updateEnvelope ───────────────────────────────────────────────────────────

describe('updateEnvelope', () => {
  it('harus menolak dengan 403 jika user bukan admin', async () => {
    getProfileById.mockResolvedValue({ data: MEMBER_PROFILE, error: null });

    const result = await updateEnvelope(mockSupabase, 'member-1', 'env-1', { name: 'Baru' });

    expect(result.error).toBe('Hanya admin yang dapat mengubah amplop.');
    expect(result.status).toBe(403);
  });

  it('harus mengembalikan 404 jika amplop tidak ditemukan di keluarga ini', async () => {
    getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
    repoGetEnvelopeById.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const result = await updateEnvelope(mockSupabase, 'admin-1', 'env-alien', { name: 'Test' });

    expect(result.error).toBe('Amplop tidak ditemukan atau tidak memiliki akses.');
    expect(result.status).toBe(404);
  });

  it('harus mempertahankan nilai lama jika field tidak diberikan', async () => {
    getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
    const oldEnv = MOCK_ENVELOPES[0];
    repoGetEnvelopeById.mockResolvedValue({ data: oldEnv, error: null });
    const updatedEnv = { ...oldEnv, name: 'Makan Baru' };
    repoUpdateEnvelope.mockResolvedValue({ data: updatedEnv, error: null });
    insertAuditLog.mockResolvedValue({ error: null });

    const result = await updateEnvelope(mockSupabase, 'admin-1', 'env-1', { name: 'Makan Baru' });

    expect(result.data).toEqual(updatedEnv);
    // category dan limit_amount seharusnya diambil dari oldEnv
    expect(repoUpdateEnvelope).toHaveBeenCalledWith(mockSupabase, 'env-1', {
      name: 'Makan Baru',
      category: oldEnv.category,
      limit_amount: oldEnv.limit_amount,
    });
  });

  it('harus mencatat audit log setelah update berhasil', async () => {
    getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
    const oldEnv = MOCK_ENVELOPES[0];
    repoGetEnvelopeById.mockResolvedValue({ data: oldEnv, error: null });
    const updatedEnv = { ...oldEnv, name: 'Makan Siang' };
    repoUpdateEnvelope.mockResolvedValue({ data: updatedEnv, error: null });
    insertAuditLog.mockResolvedValue({ error: null });

    await updateEnvelope(mockSupabase, 'admin-1', 'env-1', { name: 'Makan Siang' });

    expect(insertAuditLog).toHaveBeenCalledWith(
      mockSupabase,
      expect.objectContaining({
        action: 'UPDATE_ENVELOPES',
        family_id: 'fam-123',
        profile_id: 'admin-1',
      })
    );
  });
});

// ─── deleteEnvelope ───────────────────────────────────────────────────────────

describe('deleteEnvelope', () => {
  it('harus menolak dengan 403 jika user bukan admin', async () => {
    getProfileById.mockResolvedValue({ data: MEMBER_PROFILE, error: null });

    const result = await deleteEnvelope(mockSupabase, 'member-1', 'env-1');

    expect(result.error).toBe('Hanya admin yang dapat menghapus amplop.');
    expect(result.status).toBe(403);
  });

  it('harus mengembalikan success jika admin dan RPC berhasil', async () => {
    getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
    deleteEnvelopeAndReallocate.mockResolvedValue({ error: null });
    insertAuditLog.mockResolvedValue({ error: null });

    const result = await deleteEnvelope(mockSupabase, 'admin-1', 'env-1', 'env-2');

    expect(result.success).toBe(true);
    expect(deleteEnvelopeAndReallocate).toHaveBeenCalledWith(mockSupabase, {
      familyId: 'fam-123',
      userId: 'admin-1',
      envelopeId: 'env-1',
      reallocateToId: 'env-2',
    });
  });

  it('harus mengembalikan error jika RPC gagal', async () => {
    getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
    deleteEnvelopeAndReallocate.mockResolvedValue({ error: { message: 'RPC failed' } });

    const result = await deleteEnvelope(mockSupabase, 'admin-1', 'env-1');

    expect(result.error).toContain('RPC failed');
    expect(result.status).toBe(400);
  });
});

// ─── closeMonthlyBook ─────────────────────────────────────────────────────────

describe('closeMonthlyBook', () => {
  it('harus menolak dengan 403 jika user bukan admin', async () => {
    getProfileById.mockResolvedValue({ data: MEMBER_PROFILE, error: null });

    const result = await closeMonthlyBook(mockSupabase, 'member-1', { method: 'sweep' });

    expect(result.error).toBe('Hanya admin yang dapat menutup buku.');
    expect(result.status).toBe(403);
  });

  it('harus mengembalikan success jika semua amplop sudah kosong', async () => {
    getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
    getEnvelopesByFamilyId.mockResolvedValue({
      data: [
        { id: 'env-1', balance: '0', family_id: 'fam-123' },
        { id: 'env-2', balance: '0', family_id: 'fam-123' },
      ],
      error: null,
    });

    const result = await closeMonthlyBook(mockSupabase, 'admin-1', { method: 'sweep' });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Semua amplop sudah kosong');
    expect(repoCloseBook).not.toHaveBeenCalled();
  });

  it('harus menolak dengan 400 jika method savings tanpa savingsEnvelopeId', async () => {
    getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
    getEnvelopesByFamilyId.mockResolvedValue({ data: MOCK_ENVELOPES, error: null });

    const result = await closeMonthlyBook(mockSupabase, 'admin-1', {
      method: 'savings',
      savingsEnvelopeId: null,
    });

    expect(result.error).toBe('Harap pilih amplop tabungan tujuan.');
    expect(result.status).toBe(400);
  });

  it('harus memanggil rpc sweep jika method sweep', async () => {
    getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
    getEnvelopesByFamilyId.mockResolvedValue({ data: MOCK_ENVELOPES, error: null });
    repoCloseBook.mockResolvedValue({ error: null });

    const result = await closeMonthlyBook(mockSupabase, 'admin-1', { method: 'sweep' });

    expect(result.success).toBe(true);
    expect(repoCloseBook).toHaveBeenCalledWith(mockSupabase, {
      familyId: 'fam-123',
      userId: 'admin-1',
    });
  });

  it('harus memanggil rpc savings dengan savingsEnvelopeId yang benar', async () => {
    getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
    getEnvelopesByFamilyId.mockResolvedValue({ data: MOCK_ENVELOPES, error: null });
    repoCloseBookSavings.mockResolvedValue({ error: null });

    const result = await closeMonthlyBook(mockSupabase, 'admin-1', {
      method: 'savings',
      savingsEnvelopeId: 'env-savings',
    });

    expect(result.success).toBe(true);
    expect(repoCloseBookSavings).toHaveBeenCalledWith(mockSupabase, {
      familyId: 'fam-123',
      userId: 'admin-1',
      savingsEnvelopeId: 'env-savings',
    });
  });

  it('harus berhasil rollover tanpa memanggil RPC apapun', async () => {
    getProfileById.mockResolvedValue({ data: ADMIN_PROFILE, error: null });
    getEnvelopesByFamilyId.mockResolvedValue({ data: MOCK_ENVELOPES, error: null });

    const result = await closeMonthlyBook(mockSupabase, 'admin-1', { method: 'rollover' });

    expect(result.success).toBe(true);
    expect(repoCloseBook).not.toHaveBeenCalled();
    expect(repoCloseBookSavings).not.toHaveBeenCalled();
  });
});
