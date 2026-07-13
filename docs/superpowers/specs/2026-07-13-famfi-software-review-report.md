# Laporan Review Perangkat Lunak FamFi (Holistic 360-Degree Review)

**Tanggal**: 2026-07-13  
**Status**: Selesai Audit  
**Target Proyek**: FamFi (Family Finance)  
**Skor Kesehatan Kode**: **B- (Perlu Perbaikan Keamanan Kritis)**

---

## 1. Ringkasan Eksekutif (Executive Summary)

Aplikasi **FamFi** dirancang dengan fondasi arsitektur yang sangat terstruktur. Pemisahan tanggung jawab (*Separation of Concerns*) menggunakan pendekatan **Strict Layered Architecture** diimplementasikan dengan sangat baik pada kode Next.js. Logika database dipusatkan pada PostgreSQL functions (RPC) yang menjamin atomisitas transaksi keuangan. Dukungan pengujian otomatis sebanyak 155 tes Vitest memberikan jaminan fungsionalitas yang tinggi pada level JavaScript.

Namun, audit keamanan mendalam menemukan **celah keamanan kritis (High/Critical Vulnerability)** pada lapisan database dan kebijakan *Row Level Security* (RLS). Karena RPC database diset sebagai `SECURITY DEFINER` tanpa adanya pemeriksaan identitas pemanggil (`auth.uid()`) di dalam fungsi PostgreSQL, pengguna dari keluarga lain berpotensi memanipulasi dana keluarga lain jika mengetahui UUID mereka. Selain itu, terdapat ketidaksesuaian antara fungsionalitas visual dashboard Member (anak) dengan batasan hak akses yang tercantum di PRD.

---

## 2. Audit Mendalam per Pilar

### Pilar 1: Kepatuhan Arsitektur (*Layer Boundary Checks*)
*   **Status**: Sangat Baik (9/10)
*   **Analisis**:
    *   Lapisan Repositori (`src/repositories/`) hanya mengurusi data akses murni.
    *   Lapisan Layanan (`src/services/`) memuat logika bisnis terpusat.
    *   API Routes (`src/app/api/`) bertindak sebagai jembatan HTTP.
*   **Temuan Masalah**:
    *   [**LOW**] **Kebingungan Istilah Server Actions**:  
        File di dalam folder [src/actions](file:///d:/Belajar/Vibe%20Coding/GITHUB/Project%20Vibe%20Coding/frontend-next/src/actions/) menggunakan nama seperti `authActions.js` dan `envelopeActions.js`. Namun, fungsi-fungsi ini dieksekusi di sisi client karena memanggil `fetch()` secara langsung (contoh pada [authActions.js:L9](file:///d:/Belajar/Vibe%20Coding/GITHUB/Project%20Vibe%20Coding/frontend-next/src/actions/authActions.js#L9)). Dalam Next.js App Router, istilah "Actions" biasanya diasosiasikan dengan *Server Actions* (`'use server'`).
        *   *Rekomendasi*: Ubah nama folder menjadi `src/api-clients/` atau refaktor kode tersebut agar menggunakan Server Actions Next.js yang sesungguhnya.

---

### Pilar 2: Keamanan & RLS (Row Level Security)
*   **Status**: Perlu Perbaikan Kritis (5/10)
*   **Analisis**:  
    Meskipun RLS diaktifkan di semua tabel utama di [schema.sql:L195-199](file:///d:/Belajar/Vibe%20Coding/GITHUB/Project%20Vibe%20Coding/supabase/schema.sql#L195-L199), implementasi fungsi PostgreSQL RPC mem-bypass pembatasan tersebut tanpa verifikasi memadai.
*   **Temuan Masalah**:
    1.  [**HIGH**] **Direct Bypass RLS via RPC (Cross-Family Data Leak/Manipulation)**:  
        Fungsi database seperti `transfer_funds`, `close_book`, dan `delete_envelope_and_reallocate` dideklarasikan menggunakan `SECURITY DEFINER` (contoh pada [schema.sql:L476](file:///d:/Belajar/Vibe%20Coding/GITHUB/Project%20Vibe%20Coding/supabase/schema.sql#L476)). Fungsi ini berjalan dengan hak akses superuser (melewati RLS). Namun, tidak ada validasi di dalam SQL body untuk mencocokkan `p_family_id` dengan keluarga pemanggil yang terautentikasi (`auth.uid()`). Pengguna dari keluarga A dapat langsung memicu RPC ini melalui Supabase SDK client-side untuk memanipulasi dana milik keluarga B jika menebak UUID-nya.
    2.  [**HIGH**] **Bypass Batasan Peran Admin (Role Bypass)**:  
        PRD menyatakan bahwa Member (anak) tidak boleh memindahkan dana, menghapus amplop, atau melakukan tutup buku. Namun, fungsi RPC PostgreSQL `transfer_funds`, `close_book`, `close_book_savings`, dan `delete_envelope_and_reallocate` tidak memeriksa peran admin (`public.is_user_admin()`) di dalam fungsi SQL-nya. Siapa pun (termasuk anak/Member) dapat memanggil fungsi ini langsung dari client-side via Supabase RPC.
    3.  [**HIGH**] **Celah Kebocoran Data Transaksi Keluarga (Transactions Leakage)**:  
        Kebijakan RLS `select_family_transactions` pada [schema.sql:L243-244](file:///d:/Belajar/Vibe%20Coding/GITHUB/Project%20Vibe%20Coding/supabase/schema.sql#L243-L244) menggunakan aturan:
        ```sql
        CREATE POLICY select_family_transactions ON public.transactions 
            FOR SELECT USING (family_id = public.get_user_family_id());
        ```
        Aturan ini memperbolehkan seluruh anggota keluarga (termasuk anak/Member) membaca *semua* baris di tabel `transactions`. Padahal, menurut PRD Bagian 2.B, anak hanya diperbolehkan melihat pengeluaran yang dicatat oleh akunnya sendiri (*Riwayat Pribadi*).
    4.  [**MEDIUM**] **Akses Amplop Tanpa Delegasi**:  
        Kebijakan RLS `select_family_envelopes` pada [schema.sql:L236-237](file:///d:/Belajar/Vibe%20Coding/GITHUB/Project%20Vibe%20Coding/supabase/schema.sql#L236-L237) memperbolehkan Member melihat amplop yang `assigned_to IS NULL`. Jika orang tua membuat amplop anggaran rahasia (misalnya, untuk tabungan pribadi) tanpa mengasosiasikannya ke user tertentu (`assigned_to = NULL`), amplop tersebut secara otomatis dapat dilihat oleh semua anak.

---

### Pilar 3: Integritas & Efisiensi Database
*   **Status**: Baik (8/10)
*   **Analisis**:  
    Penggunaan `FOR UPDATE` untuk mengunci baris data saldo saat transfer dana pada [schema.sql:L434](file:///d:/Belajar/Vibe%20Coding/GITHUB/Project%20Vibe%20Coding/supabase/schema.sql#L434) berhasil mencegah kondisi *race condition*. Audit logger otomatis bekerja dengan baik menggunakan trigger paska-modifikasi data.
*   **Temuan Masalah**:
    *   [**MEDIUM**] **Ketiadaan Constraint Batasan Nilai Maksimum (Numeric Overflow)**:  
        Kolom `amount`, `balance`, dan `limit_amount` menggunakan tipe data `NUMERIC` tanpa batas atas. Kurangnya pemeriksaan panjang nominal maksimum pada query atau skema database berisiko memicu error kegagalan database (*numeric overflow*) jika pengguna menginput angka yang terlalu besar.
    *   [**LOW**] **Audit Log Null User ID pada Direct Database Write**:  
        Pada trigger [schema.sql:L158-162](file:///d:/Belajar/Vibe%20Coding/GITHUB/Project%20Vibe%20Coding/supabase/schema.sql#L158-L162), `profile_id` didapatkan dari JWT claims. Jika admin melakukan perubahan langsung lewat dashboard Supabase/SQL editor, `v_profile_id` akan bernilai NULL di tabel `audit_logs`.

---

### Pilar 4: Kualitas & Performa Kode
*   **Status**: Cukup (7/10)
*   **Analisis**:  
    Kode Next.js ditulis dengan rapi menggunakan clean code. Pemisahan client-side logic menggunakan `'use client'` dilakukan pada komponen yang memang membutuhkan interaksi.
*   **Temuan Masalah**:
    1.  [**MEDIUM**] **Crash Potensial pada API Route Parsing**:  
        Di API Routes seperti [route.js:L88](file:///d:/Belajar/Vibe%20Coding/GITHUB/Project%20Vibe%20Coding/frontend-next/src/app/api/envelopes/%5Bid%5D/route.js#L88), kode memanggil `const body = await request.json()` secara langsung tanpa memeriksa apakah request body kosong atau tidak. Jika client mengirim request DELETE atau POST tanpa body, server akan membuang exception unhandled JSON parse dan menghasilkan response error 500 (Internal Server Error) alih-alih 400 (Bad Request).
    2.  [**MEDIUM**] **Validasi Input Menggunakan Validasi Manual**:  
        Pemeriksaan input tipe data pada [transactionService.js:L64-71](file:///d:/Belajar/Vibe%20Coding/GITHUB/Project%20Vibe%20Coding/frontend-next/src/services/transactionService.js#L64-L71) menggunakan logika `if` manual. Hal ini berisiko memunculkan celah jika parameter bertambah. Menggunakan pustaka skema validasi seperti **Zod** akan membuat kode validasi lebih deklaratif, aman, dan mudah dikelola.

---

### Pilar 5: UI/UX & Polesan Visual
*   **Status**: Baik (8/10)
*   **Analisis**:  
    Gaya visual gelap dengan background radial gradient dan card glassmorphism memberikan estetika premium yang sangat baik. 
*   **Temuan Masalah**:
    *   [**HIGH**] **Ketidaksesuaian Data Transaksi Member (UI/UX Mismatch)**:  
        Pada dashboard Member di [DashboardView.js:L237](file:///d:/Belajar/Vibe%20Coding/GITHUB/Project%20Vibe%20Coding/frontend-next/src/presentation/dashboard/DashboardView.js#L237), tertulis judul **"Aktivitas Pribadi"**. Namun, karena API `/api/transactions` dan RLS database mengembalikan seluruh transaksi keluarga, tabel tersebut menampilkan seluruh data pengeluaran dan pemasukan keluarga, bukan aktivitas pribadi anak. Hal ini membingungkan dari sisi UX dan melanggar privasi finansial orang tua.

---

### Pilar 6: Kesenjangan Pengujian (*Testing Gaps*)
*   **Status**: Cukup (7/10)
*   **Analisis**:  
    Total 155 test suite menggunakan Vitest berjalan dengan sukses, menguji fungsionalitas repository dan action di level Javascript.
*   **Temuan Masalah**:
    1.  [**HIGH**] **Tidak Ada Pengujian Integrasi Database & RLS**:  
        Seluruh unit test di folder [__tests__/repositories](file:///d:/Belajar/Vibe%20Coding/GITHUB/Project%20Vibe%20Coding/frontend-next/__tests__/repositories/) menggunakan mock Supabase client (contoh pada [transactionRepository.test.js:L20](file:///d:/Belajar/Vibe%20Coding/GITHUB/Project%20Vibe%20Coding/frontend-next/__tests__/repositories/transactionRepository.test.js#L20)). Kita tidak menguji secara riil ke database PostgreSQL untuk memverifikasi apakah trigger SQL dan kebijakan RLS benar-benar menolak data ilegal. Jika skema database diubah secara salah, tes Vitest akan tetap sukses karena query hanya di-mock.

---

## 3. Daftar Rekomendasi Tindakan (Actionable Recommendations)

Berikut adalah checklist tugas perbaikan yang diurutkan berdasarkan tingkat kepentingannya:

*   [ ] **1. Perbaikan Kebijakan Keamanan Fungsi RPC PostgreSQL (HIGH)**  
    Tambahkan verifikasi identitas pemanggil dan validasi kepemilikan keluarga di dalam fungsi-fungsi `SECURITY DEFINER` di `supabase/schema.sql`.
    *   *Kode Contoh (untuk `transfer_funds`):*
        ```sql
        -- Di dalam body fungsi public.transfer_funds:
        IF p_family_id != public.get_user_family_id() THEN
          RAISE EXCEPTION 'Akses tidak sah untuk keluarga ini.';
        END IF;
        IF p_user_id != auth.uid() THEN
          RAISE EXCEPTION 'User ID tidak cocok dengan sesi aktif.';
        END IF;
        IF NOT public.is_user_admin() THEN
          RAISE EXCEPTION 'Hanya pengelola (admin) yang dapat memindahkan dana.';
        END IF;
        ```

*   [ ] **2. Perbaikan Kebijakan RLS Tabel `transactions` (HIGH)**  
    Ubah kebijakan SELECT pada tabel `transactions` agar Member hanya dapat membaca transaksi milik mereka sendiri, sementara Admin tetap dapat membaca seluruh transaksi keluarga.
    *   *Perubahan Kebijakan RLS:*
        ```sql
        DROP POLICY IF EXISTS select_family_transactions ON public.transactions;
        CREATE POLICY select_family_transactions ON public.transactions 
            FOR SELECT USING (
                family_id = public.get_user_family_id() AND 
                (public.is_user_admin() OR profile_id = auth.uid())
            );
        ```

*   [ ] **3. Perbaikan Kebijakan RLS Tabel `envelopes` (MEDIUM)**  
    Ubah kebijakan agar Member tidak dapat mengakses amplop yang tidak didelegasikan (`assigned_to IS NULL`).
    *   *Perubahan Kebijakan RLS:*
        ```sql
        DROP POLICY IF EXISTS select_family_envelopes ON public.envelopes;
        CREATE POLICY select_family_envelopes ON public.envelopes 
            FOR SELECT USING (
                family_id = public.get_user_family_id() AND 
                (public.is_user_admin() OR assigned_to = auth.uid())
            );
        ```

*   [ ] **4. Penanganan Safe JSON Parsing di API Routes (MEDIUM)**  
    Bungkus parsing `request.json()` dalam blok `try-catch` di seluruh API routes Next.js untuk mencegah crash server 500 saat body kosong.
    *   *Kode Contoh (di `src/app/api/envelopes/[id]/route.js`):*
        ```javascript
        let reallocateToId = null;
        try {
          const body = await request.json();
          reallocateToId = body.reallocateToId || null;
        } catch {
          // Abaikan jika body kosong
        }
        ```

*   [ ] **5. Penggantian Nama Folder `actions` untuk Menghindari Kebingungan (LOW)**  
    Ganti nama folder `/src/actions` menjadi `/src/api-clients` atau `/src/utils/api` karena file tersebut memuat fungsi-fungsi client-side `fetch()`, bukan Server Actions Next.js.
