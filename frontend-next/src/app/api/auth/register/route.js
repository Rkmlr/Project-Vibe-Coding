import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/apiClient';
import { registerUser } from '@/services/authService';
import { rateLimit } from '@/utils/rate-limit';

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Mendaftarkan user baru
 *     description: Mendaftarkan user baru dan menghubungkannya dengan keluarga (mode create atau join).
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: budi@email.com
 *               password:
 *                 type: string
 *                 example: rahasia123
 *               displayName:
 *                 type: string
 *                 example: Ayah
 *               mode:
 *                 type: string
 *                 example: create
 *               familyName:
 *                 type: string
 *                 example: Keluarga Budi
 *               inviteCode:
 *                 type: string
 *                 example: ABC123XYZ
 *     responses:
 *       201:
 *         description: Registrasi berhasil
 *       400:
 *         description: Input tidak valid
 *       429:
 *         description: Terlalu banyak request (Rate limit)
 */
export async function POST(request) {
  try {
    if (!rateLimit(request, 5, 60000)) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan, coba lagi nanti.' }, { status: 429 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body tidak valid atau kosong' }, { status: 400 });
    }
    const { email, password, displayName, mode, familyName, inviteCode } = body;

    const supabase = await createApiClient(request);
    const result = await registerUser(supabase, {
      email,
      password,
      displayName,
      mode,
      familyName,
      inviteCode,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      requiresEmailConfirmation: result.requiresEmailConfirmation,
      tokens: result.session ? {
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      } : null
    }, { status: 201 });

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
