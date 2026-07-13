# Rencana Desain Evaluasi Perangkat Lunak FamFi (Holistic 360-Degree Review)

**Tanggal**: 2026-07-13  
**Status**: Spesifikasi Desain Disetujui  
**Target Proyek**: FamFi (Family Finance) - Next.js & Supabase

---

## 1. Latar Belakang & Tujuan
Tujuan dari dokumen ini adalah merancang spesifikasi untuk melakukan audit komprehensif (360 derajat) terhadap aplikasi **FamFi**. Review ini bertujuan mengidentifikasi potensi celah keamanan (RLS bypass), pelanggaran batas arsitektur (*Strict Layered Architecture*), kelemahan integritas database, kesalahan kualitas kode, ketidaksesuaian desain UI/UX, serta celah pengujian (*testing gaps*). 

---

## 2. Kriteria & Metrik Evaluasi (6 Pilar)

Evaluasi akan berfokus pada 6 pilar utama dengan kriteria sebagai berikut:

### A. Pilar 1: Kepatuhan Arsitektur (*Layer Boundary Checks*)
*   **Target**: Menjaga kebersihan *Strict Layered Architecture* (Presentation -> Business -> Persistence -> Database).
*   **Kriteria Kelayakan**:
    *   Presentation Layer (`src/presentation` & `src/app`) hanya menangani UI, state lokal React, dan Server Actions sebagai kontroler. Tidak boleh ada query database langsung.
    *   Business Layer (`src/services` & `src/actions`) menampung logika bisnis terpusat tanpa menyentuh UI atau Supabase Client secara langsung.
    *   Persistence Layer (`src/repositories`) adalah satu-satunya lapisan yang menggunakan Supabase Client untuk berinteraksi dengan tabel database.
    *   Mendeteksi adanya impor melingkar (*circular imports*) atau bypass layer.

### B. Pilar 2: Keamanan & RLS (Row Level Security)
*   **Target**: Memastikan isolasi data antar keluarga berfungsi 100% aman dan tidak dapat dibajak.
*   **Kriteria Kelayakan**:
    *   Setiap tabel di Supabase memiliki RLS aktif (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
    *   Kebijakan SELECT, INSERT, UPDATE, dan DELETE diproteksi menggunakan fungsi pembatas keluarga (`get_user_family_id()`).
    *   Middleware Next.js memvalidasi sesi pengguna sebelum merender halaman `/dashboard`.
    *   Token JWT/cookie aman terproteksi dari serangan XSS dan CSRF.

### C. Pilar 3: Integritas & Efisiensi Database
*   **Target**: Mencegah kegagalan data, transaksi tidak valid, atau *race conditions* pada pengelolaan kas/amplop.
*   **Kriteria Kelayakan**:
    *   Fungsi database PostgreSQL (`SECURITY DEFINER` seperti `add_transaction`, `transfer_funds`, `close_book`, `delete_envelope_and_reallocate`) dieksekusi secara atomik menggunakan transaksi SQL.
    *   Trigger logger `process_audit_log` berjalan dengan efisien tanpa memperlambat penulisan data.
    *   Skema database memiliki indeks dan kendala (*constraints*) yang memadai (contoh: limit nominal > 0).

### D. Pilar 4: Kualitas & Performa Kode
*   **Target**: Memastikan kode terstruktur, mudah dipelihara, dan mutakhir.
*   **Kriteria Kelayakan**:
    *   Penerapan validasi input (seperti pustaka Zod atau validasi tipe manual) pada Server Actions dan API.
    *   Penanganan error yang aman di mana error sensitif database tidak dibocorkan langsung ke pengguna akhir.
    *   Pemisahan yang optimal antara React Server Components (RSC) dan Client Components.
    *   Kesesuaian dengan spesifikasi React 19 dan Next.js 16.

### E. Pilar 5: UI/UX & Polesan Visual
*   **Target**: Memastikan antarmuka premium, responsif, dan dinamis.
*   **Kriteria Kelayakan**:
    *   Kesesuaian dengan konfigurasi tema gelap glassmorphic di Tailwind v4.
    *   Pencegahan terjadinya tata letak yang berantakan (*layout shift*) saat render data dinamis atau chart.
    *   Penyediaan *loading states* yang halus dan *micro-animations* pada interaksi tombol/form.
    *   Responsivitas antarmuka pada perangkat mobile.

### F. Pilar 6: Kesenjangan Pengujian (*Testing Gaps*)
*   **Target**: Menilai keandalan uji otomatis yang ada.
*   **Kriteria Kelayakan**:
    *   Menilai apakah 155 test Vitest yang sudah ada mencakup pengujian jalur kegagalan (*error path*), penanganan hak akses peran (*role restrictions*), dan *edge cases* rollover sisa saldo amplop.
    *   Mengidentifikasi file atau fungsionalitas kritis yang belum memiliki unit test atau integration test.

---

## 3. Rencana Aksi Eksekusi

Proses review akan dijalankan dalam langkah-langkah berikut:
1.  **Langkah 1**: Menganalisis skema dan kebijakan database di `supabase/schema.sql`.
2.  **Langkah 2**: Memeriksa file kode program Next.js di folder `frontend-next/src/` per lapisan (Repository, Service, Actions, App Router, dan Presentation Components).
3.  **Langkah 3**: Memeriksa test cases yang ada di `frontend-next/__tests__/` untuk menilai cakupan pengujian.
4.  **Langkah 4**: Mengompilasi seluruh temuan, kelebihan, kelemahan, serta contoh/panduan perbaikan ke dalam dokumen laporan akhir.

---

## 4. Struktur Output Laporan Akhir

Laporan akhir di `docs/superpowers/specs/2026-07-13-famfi-software-review-report.md` akan memiliki bab:
1.  **Ringkasan Eksekutif**: Skor kesehatan perangkat lunak secara keseluruhan dan temuan utama.
2.  **Audit Mendalam per Pilar**: Pembahasan terperinci kelebihan dan temuan masalah (kategori `High`, `Medium`, `Low`) dilengkapi referensi baris kode yang terdampak.
3.  **Daftar Tindakan Rekomendasi**: Checklist terurut prioritas untuk memperbaiki temuan masalah.
