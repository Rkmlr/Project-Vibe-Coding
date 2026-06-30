# FamFi - Pelacak Keuangan Keluarga

FamFi adalah sebuah aplikasi manajemen keuangan keluarga modern yang menggunakan sistem **Amplop Digital (Envelope Budgeting)**. Aplikasi ini memungkinkan sebuah keluarga (suami, istri, dan anak) untuk mencatat, mengalokasikan, dan melacak pengeluaran mereka secara kolaboratif dalam satu dasbor yang terpusat dan *real-time*.

---

## 🛠 Technology Stack

Aplikasi FamFi dibangun dengan *stack* modern terkini:
- **Framework Utama**: [Next.js (App Router)](https://nextjs.org/) v14/15
- **Library UI**: [React](https://reactjs.org/)
- **Bahasa**: JavaScript / JSX
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) dengan Vanilla CSS (`index.css`)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL & Supabase Auth)

### 📦 Library yang Digunakan
- **`@supabase/supabase-js`** & **`@supabase/ssr`**: Mengelola otentikasi dan transaksi database.
- **`recharts`**: Rendering grafik keuangan (Visualisasi Finansial).
- **`date-fns`**: Manipulasi dan format tanggal (kalender & riwayat transaksi).
- **`lucide-react`**: Ikon UI bergaya modern.
- **`vitest`** & **`@testing-library/react`**: Framework untuk pengujian (*Unit* dan *UI Testing*).

---

## 🏗 Arsitektur & Struktur Folder

Aplikasi ini menerapkan **Strict Layered Architecture** untuk memisahkan logika bisnis dari antarmuka pengguna dan infrastruktur (*routing*).

```text
frontend-next/
├── __tests__/             # Kumpulan file Unit Test (vitest)
├── src/
│   ├── app/               # 1. INFRASTRUCTURE LAYER (Router, Page Utama, & API Endpoint)
│   ├── presentation/      # 2. PRESENTATION LAYER (Hanya UI React Component, Client/Server Component)
│   ├── actions/           # 3. ACTION LAYER (Server Actions untuk form submission, menjembatani UI ke API)
│   ├── services/          # 4. BUSINESS LOGIC LAYER (Pusat logika dan aturan bisnis, dipanggil oleh API/Actions)
│   ├── repositories/      # 5. DATA ACCESS LAYER (Fungsi query tunggal ke Supabase Database)
│   └── lib/               # 6. UTILITY LAYER (Konfigurasi Client Supabase, dsb)
└── public/                # Aset statis (gambar, font, dll)
```

**Penamaan File:**
- `PascalCase.js/jsx`: Untuk komponen UI di dalam `src/presentation` (contoh: `LoginForm.jsx`, `DashboardView.js`).
- `camelCase.js`: Untuk file utilitas, actions, services, repository, dan test (contoh: `authService.js`, `envelopeActions.js`).
- `page.js` / `route.js`: Standar bawaan Next.js untuk rute halaman dan API.

---

## 🗄 Schema Database (Supabase PostgreSQL)

| Tabel | Deskripsi | Field Utama |
|---|---|---|
| **`profiles`** | Menyimpan profil pengguna yang mendaftar. | `id` (PK, Auth ID), `email`, `display_name`, `family_id` (FK), `role` |
| **`families`** | Grup kolaborasi per rumah tangga. | `id` (PK), `name`, `invite_code` |
| **`envelopes`** | Amplop anggaran (pos keuangan). | `id` (PK), `family_id` (FK), `name`, `balance`, `limit_amount`, `category`, `assigned_to` |
| **`transactions`**| Rekaman mutasi (pemasukan/pengeluaran). | `id` (PK), `family_id` (FK), `envelope_id` (FK), `type`, `amount`, `description`, `source`, `created_by` |
| **`audit_logs`** | Catatan aktivitas sistem/keamanan. | `id` (PK), `family_id` (FK), `user_id` (FK), `action`, `details`, `created_at` |

---

## 🔌 API yang Tersedia

Seluruh API berada di dalam direktori `src/app/api/`.

### Otentikasi (`/api/auth`)
- `POST /api/auth/register` : Mendaftarkan *user* baru dan membuat/bergabung dengan keluarga.
- `POST /api/auth/login` : Masuk menggunakan email & kata sandi (mengembalikan token *session*).
- `POST /api/auth/logout` : Menghapus sesi otentikasi.
- `GET /api/auth/me` : Mengambil data profil *user* yang sedang *login*.

### Keluarga & Anggota (`/api/family`, `/api/members`)
- `GET /api/family` : Mendapatkan detail nama keluarga dan kode undangan (invite code).
- `GET /api/members` : Menampilkan daftar seluruh anggota dalam keluarga.

### Anggaran / Amplop (`/api/envelopes`)
- `GET /api/envelopes` : Mendapatkan seluruh daftar amplop keluarga saat ini.
- `POST /api/envelopes` : Membuat amplop pengeluaran baru.
- `PUT /api/envelopes/[id]` : Mengubah data amplop (nama, limit, penanggung jawab).
- `DELETE /api/envelopes/[id]` : Menghapus amplop (saldo bisa dialihkan ke Kas Utama/Amplop lain).
- `POST /api/envelopes/close-book` : Fitur Tutup Buku bulanan (rollover sisa saldo atau pindah ke Tabungan).

### Transaksi (`/api/transactions`)
- `GET /api/transactions` : Menampilkan riwayat transaksi (mendukung paginasi/filter).
- `POST /api/transactions` : Mencatat pengeluaran/pemasukan baru pada amplop tertentu.
- `POST /api/transactions/transfer` : Mengalihkan/memindahkan saldo antar amplop.

### Pengaturan (`/api/settings`)
- `GET /api/settings` : Mengambil metadata konfigurasi keluarga (misal: siklus bulanan, zona waktu).

---

## 🚀 Cara Setup Project

Ikuti langkah-langkah di bawah untuk menyiapkan proyek secara lokal:

1. **Clone repositori**
   ```bash
   git clone https://github.com/Rkmlr/Project-Vibe-Coding.git
   cd "Project Vibe Coding/frontend-next"
   ```

2. **Buat file environment variables**
   Salin dari contoh yang ada atau buat file `.env.local` baru di dalam folder root `frontend-next/`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://[PROYEK_ID].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[KUNCI_ANON_ANDA]
   ```

3. **Install Dependensi**
   Anda bisa menggunakan `npm`:
   ```bash
   npm install
   ```

---

## 💻 Cara Menjalankan Aplikasi

Jalankan Development Server Next.js dengan perintah berikut:

```bash
npm run dev
```
Buka browser dan arahkan ke [http://localhost:3000](http://localhost:3000). Aplikasi akan dimuat (hot-reload diaktifkan).

Untuk mem-build versi **Production**:
```bash
npm run build
npm run start
```

---

## 🧪 Cara Melakukan Pengujian (Testing)

Proyek ini dipersenjatai dengan lebih dari **150+ Skenario Unit Test & UI Test** menggunakan **Vitest**.

Untuk menjalankan semua pengujian:
```bash
npm test
```

Perintah di atas akan mengeksekusi tes secara menyeluruh (Mencakup *Repositories*, *Services*, *Server Actions*, *API Routes*, dan interaksi *UI Presentation Component* menggunakan JSDOM).

Untuk mengawasi pengujian secara *real-time* saat menulis kode baru (*Watch Mode*):
```bash
npx vitest
```
