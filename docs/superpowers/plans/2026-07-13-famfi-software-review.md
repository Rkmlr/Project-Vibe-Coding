# FamFi Software Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghasilkan laporan review perangkat lunak FamFi yang komprehensif, mendalam, dan terstruktur sesuai dengan spesifikasi audit holistik 360 derajat.

**Architecture:** Melakukan audit file per file untuk menilai Supabase RLS, kepatuhan Strict Layered Architecture, penanganan error, Tailwind v4, dan cakupan uji Vitest.

**Tech Stack:** Next.js 16, React 19, Supabase, Tailwind v4, Vitest.

## Global Constraints

- Laporan tidak boleh mengandung placeholder (seperti TODO atau TBD).
- Referensi temuan wajib menunjuk ke file spesifik dengan tautan absolut atau relatif yang dapat diklik.
- Menilai berdasarkan 6 pilar utama dengan klasifikasi tingkat keparahan (High, Medium, Low).

---

### Task 1: Audit Database & Keamanan (Supabase & RLS)

**Files:**
- Audit: `supabase/schema.sql`
- Audit: `frontend-next/src/middleware.js`
- Audit: `frontend-next/src/lib/` (Supabase Client Init)
- Output: Draft Catatan Pilar RLS & Keamanan

**Interfaces:**
- Produces: Analisis mendalam tentang kebijakan RLS (SELECT, INSERT, UPDATE, DELETE) pada tabel `profiles`, `envelopes`, `transactions`, `audit_logs`, dan validasi parameter fungsi `SECURITY DEFINER`.

- [ ] **Step 1: Analisis RLS di `supabase/schema.sql`**
  Periksa baris 194-252 untuk memastikan:
  - Apakah RLS diaktifkan di semua tabel utama.
  - Apakah fungsi `get_user_family_id()` dan `is_user_admin()` aman dari eksploitasi.
  - Apakah ada kebijakan RLS yang berpotensi meloloskan data lintas keluarga (*cross-family data leakage*).
- [ ] **Step 2: Analisis Keamanan Fungsi `SECURITY DEFINER`**
  Periksa implementasi fungsi:
  - `add_transaction` (baris 306-381)
  - `transfer_funds` (baris 384-476)
  - `close_book` dan `close_book_savings` (baris 479-549)
  - `delete_envelope_and_reallocate` (baris 552-597)
  Verifikasi penanganan input parameter, validasi kepemilikan family_id, dan mitigasi SQL Injection.
- [ ] **Step 3: Analisis Middleware Proteksi Sesi**
  Periksa `frontend-next/src/middleware.js` untuk memastikan cookie sesi divalidasi dengan aman sebelum mengizinkan rute dashboard.
- [ ] **Step 4: Commit Draft Catatan Keamanan**
  ```bash
  git status
  ```

---

### Task 2: Audit Batasan Lapisan & Aliran Data (Architecture Integrity)

**Files:**
- Audit: `frontend-next/src/repositories/`
- Audit: `frontend-next/src/services/`
- Audit: `frontend-next/src/actions/`
- Audit: `frontend-next/src/app/`
- Output: Draft Catatan Kepatuhan Arsitektur

**Interfaces:**
- Produces: Analisis kesesuaian implementasi kode terhadap Strict Layered Architecture.

- [ ] **Step 1: Audit Lapisan Repositori**
  Periksa semua file di `src/repositories/` untuk memastikan:
  - Hanya repositori yang memanggil Supabase client.
  - Repositori tidak memproses logika bisnis/aturan validasi tingkat tinggi.
- [ ] **Step 2: Audit Lapisan Layanan (Services)**
  Periksa semua file di `src/services/` untuk memastikan:
  - Seluruh logika bisnis (seperti pengecekan saldo sebelum transaksi, validasi limit) berada di sini.
  - Tidak ada service yang memanggil Supabase client langsung; semua data harus diakses melalui repository.
- [ ] **Step 3: Audit Lapisan Server Actions**
  Periksa semua file di `src/actions/` untuk memastikan:
  - Server Actions hanya bertindak sebagai jembatan (controller) dari UI ke Services.
  - Server Actions mengelola sesi pengguna dan menangani autentikasi sebelum memanggil service.
- [ ] **Step 4: Audit Halaman/Page Routing**
  Periksa file `page.js` dan subfolder di `src/app/` untuk memastikan file page sangat tipis (*thin wrappers*) dan memindahkan seluruh rendering ke `src/presentation/`.

---

### Task 3: Audit Kualitas Kode, Penanganan Error & Kesiapan React 19

**Files:**
- Audit: `frontend-next/src/actions/`
- Audit: `frontend-next/src/services/`
- Audit: `frontend-next/src/app/error.jsx` (atau component error boundary)
- Output: Draft Catatan Kualitas Kode & Error Handling

**Interfaces:**
- Produces: Evaluasi penanganan eksepsi database, validasi input data, pemisahan Server vs Client Components, dan integrasi React 19.

- [ ] **Step 1: Audit Validasi Parameter Input**
  Menganalisis apakah Server Actions menggunakan skema validasi tipe data (Zod atau manual) sebelum mengeksekusi operasi.
- [ ] **Step 2: Audit Kebocoran Error Database**
  Memeriksa apakah ada eksepsi internal database PostgreSQL/Supabase yang diteruskan langsung ke antarmuka client (kebocoran informasi internal).
- [ ] **Step 3: Pemeriksaan React 19 & Next.js 16**
  Memverifikasi penggunaan React Hooks baru (seperti `useActionState` atau `useOptimistic`), penanganan form, dan pemisahan direktif `'use client'` secara optimal.

---

### Task 4: Audit UI/UX & Polesan Visual (Tailwind v4)

**Files:**
- Audit: `frontend-next/src/app/globals.css`
- Audit: `frontend-next/src/presentation/`
- Output: Draft Catatan UI/UX

**Interfaces:**
- Produces: Evaluasi estetika desain gelap, glassmorphism, responsivitas, dan micro-animations.

- [ ] **Step 1: Audit globals.css & Tailwind v4 Config**
  Menganalisis konfigurasi tema di `@theme` globals.css, penamaan warna brand, dan validasi kegunaan utilitas CSS.
- [ ] **Step 2: Audit Glassmorphic Components**
  Memeriksa konsistensi implementasi kelas `.glass-card` dan `.glass-nav` pada form login, dashboard, grafik alokasi, dan dialog transfer.
- [ ] **Step 3: Audit Layout Shift & Responsivitas**
  Mengevaluasi rendering chart dan card di dashboard pada ukuran layar mobile untuk memastikan tidak ada *layout overflow* atau teks terpotong.

---

### Task 5: Evaluasi Pengujian & Kesenjangan Test (Testing Gaps)

**Files:**
- Audit: `frontend-next/__tests__/`
- Output: Draft Catatan Evaluasi Testing

**Interfaces:**
- Produces: Pemetaan kesenjangan uji (testing gaps) dari 155 test Vitest yang ada.

- [ ] **Step 1: Pemetaan Test Coverage**
  Periksa sebaran file pengujian di folder `__tests__/` untuk memetakan bagian program mana yang belum dicakup.
- [ ] **Step 2: Validasi Mocking & Edge Cases**
  Menganalisis apakah pengujian menguji kasus gagal (*fail paths*), pembatasan peran Admin/Member secara memadai, dan simulasi penolakan RLS dari database.

---

### Task 6: Kompilasi & Penyusunan Laporan Review Akhir

**Files:**
- Create: `docs/superpowers/specs/2026-07-13-famfi-software-review-report.md`
- Output: Laporan Review Akhir yang Lengkap

**Interfaces:**
- Consumes: Seluruh draft catatan pilar hasil audit dari Task 1 sampai Task 5.
- Produces: Laporan lengkap dengan Executive Summary, skor, temuan mendalam berdasarkan tingkat keparahan, tautan kode, dan checklist rekomendasi tindakan prioritas.

- [ ] **Step 1: Menulis Dokumen Laporan Review Akhir**
  Tulis dokumen laporan lengkap di `docs/superpowers/specs/2026-07-13-famfi-software-review-report.md` dengan detail lengkap tanpa placeholder.
- [ ] **Step 2: Melakukan Validasi Mandiri (Self-Review)**
  Pastikan seluruh tautan baris kode akurat, tidak ada placeholder, dan rekomendasi tindakan tertulis secara konkret.
- [ ] **Step 3: Commit dan Push Laporan Akhir**
  ```bash
  git add docs/superpowers/specs/2026-07-13-famfi-software-review-report.md
  git commit -m "docs: compile software review report for FamFi"
  ```
