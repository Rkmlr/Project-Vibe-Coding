# Product Requirement Document (PRD) - FamFi (Family Finance)
**Tanggal**: 2026-06-26  
**Status**: Draf Spesifikasi Disetujui  
**Target Arsitektur**: Next.js App Router (Server-Side SSR & Server Actions) & Supabase (Auth, PostgreSQL DB, RLS)

---

## 1. Ringkasan & Tujuan (Overview & Goals)
**FamFi** adalah aplikasi pencatatan pengeluaran dan pemasukan keuangan rumah tangga berbasis web yang dirancang khusus untuk membantu keluarga mengelola uang dengan disiplin menggunakan metode **Envelope Budgeting** (Sistem Amplop). 

Aplikasi ini bertujuan untuk:
- Mencegah pengeluaran berlebih (*overspending*) dengan membatasi dana per pos kebutuhan.
- Memfasilitasi kolaborasi antara Bapak dan Ibu sebagai pengelola keuangan utama keluarga.
- Memberikan wadah bagi anak-anak untuk mencatat pengeluaran mereka secara disiplin di bawah pengawasan orang tua.
- Menyediakan transparansi keuangan keluarga melalui laporan visual dan log audit tindakan administratif.

---

## 2. Peran Pengguna & Hak Akses (User Roles & Permissions)
Aplikasi mendukung multi-role dengan hak akses yang terdefinisi dengan jelas:

### A. Admin / Pengelola (Bapak & Ibu / Orang Tua)
Peran ini setara dan memiliki kendali penuh atas sistem keuangan keluarga:
- **Manajemen Keluarga**: Mengedit nama grup keluarga, melihat kode undangan, dan menghapus/menambah anggota keluarga.
- **Pencatatan Pemasukan**: Mencatat pemasukan keluarga ke dalam **Dompet Kas Utama** (*Family Cash Pool*).
- **Manajemen Amplop**: Membuat amplop baru, mengatur kategori (Needs/Wants/Savings), mengubah limit bulanan, menghapus amplop, dan mentransfer saldo antar-amplop ("Gali Lubang Tutup Lubang").
- **Tutup Buku Bulanan (Rollover)**: Menentukan nasib sisa uang amplop di akhir bulan (kembali ke Kas Utama, diakumulasikan, atau dipindahkan ke Tabungan).
- **Laporan & Log**: Melihat semua laporan grafik visual, melihat riwayat transaksi semua anggota, dan membaca tab Log Audit.

### B. Member / Anggota (Anak / Sarah)
Peran dengan hak akses terbatas:
- **Melihat Amplop**: Hanya dapat melihat amplop yang didelegasikan/diberikan akses oleh Orang Tua.
- **Pencatatan Pengeluaran**: Mencatat transaksi pengeluaran (debit) pada amplop yang dapat diaksesnya.
- **Riwayat Pribadi**: Melihat daftar pengeluaran yang pernah dicatat oleh akunnya sendiri.
- **Batasan**: Tidak dapat membuat amplop, tidak dapat mentransfer saldo antar-amplop, tidak dapat mencatat pemasukan, tidak dapat melihat log audit, dan tidak dapat mengubah peran atau mengundang anggota lain.

---

## 3. Fitur Utama & Kebutuhan Fungsional (Core Features)

### Fitur 1: Autentikasi Pengguna & Grup Keluarga (Supabase Auth)
- **Registrasi (Sign Up)**: 
  - Pengguna baru mendaftar menggunakan Email & Password.
  - Setelah sign up, pengguna diberi pilihan:
    1. **Buat Keluarga Baru**: Mengisi nama keluarga (cth: "Keluarga Adhi") -> Sistem menghasilkan grup keluarga baru dengan `invite_code` acak unik -> Peran di-set menjadi Admin.
    2. **Gabung Keluarga**: Mengisi `invite_code` keluarga yang valid -> Sistem menghubungkan user ke `family_id` yang cocok -> Peran secara default di-set menjadi Member (Anak) yang dapat ditingkatkan ke Admin oleh Orang Tua nanti.
- **Login (Sign In)**: Menggunakan email & password terdaftar.
- **Keamanan Sesi**: Sesi disimpan menggunakan cookie aman melalui `@supabase/ssr` dan diverifikasi di `middleware.js` Next.js untuk mencegah akses dashboard tanpa login.

### Fitur 2: Sistem Kas Utama & Manajemen Amplop (Envelope Budgeting)
- **Dompet Kas Utama (Family Cash Pool)**:
  - Saldo penampung pemasukan sebelum dialokasikan.
  - Hanya dapat diubah melalui transaksi pemasukan (`INCOME`) atau pemindahan dana ke amplop.
- **Manajemen Amplop**:
  - Formulir input pembuatan/pembaruan amplop: Nama Amplop, Limit Bulanan, dan Kategori.
  - Kategori Amplop wajib dipilih dari:
    - `NEEDS` (Kebutuhan Pokok - cth: Belanja Dapur, Token Listrik).
    - `WANTS` (Keinginan - cth: Hiburan, Kopi, Gadget).
    - `SAVINGS` (Tabungan - cth: Dana Darurat, Emas, Reksa Dana).
  - Penghapusan amplop: Jika amplop dihapus, saldo yang tersisa wajib dikembalikan ke Dompet Kas Utama terlebih dahulu.
- **Sistem Sisa Amplop (Rollover / Tutup Buku Bulanan)**:
  - Menu khusus bagi Admin untuk memicu tutup buku di akhir bulan.
  - Pilihan untuk sisa saldo amplop:
    1. **Tarik ke Kas**: Sisa saldo ditarik ke Dompet Kas Utama.
    2. **Rollover**: Sisa saldo digabungkan ke limit bulan depan.
    3. **Pindahkan ke Tabungan**: Sisa saldo dipindahkan ke salah satu amplop berkategori `SAVINGS`.

### Fitur 3: Pencatatan Transaksi & Transfer Antar Amplop
- **Pencatatan Pemasukan**: 
  - Formulir input: Jumlah, Sumber, Deskripsi, Tanggal.
  - Mengubah saldo `cash_pool_balance` di tabel `families`.
- **Pencatatan Pengeluaran**:
  - Formulir input: Pilihan Amplop, Jumlah, Deskripsi, Tanggal.
  - Memotong saldo `balance` di tabel `envelopes`.
- **Transfer Saldo Antar Amplop (Gali Lubang Tutup Lubang)**:
  - Hanya dapat diakses oleh Admin (Bapak & Ibu).
  - Memindahkan dana dari Amplop A ke Amplop B atau dari Kas Utama ke Amplop B.
  - Aksi ini memicu pencatatan transaksi khusus bertipe `TRANSFER` dan terekam di Log Audit.

### Fitur 4: Grafik Analisis Finansial (Visual Analytics)
- **Visualisasi Anggaran**: Grafik donat alokasi anggaran saat ini berdasarkan kategori `NEEDS`, `WANTS`, dan `SAVINGS` untuk memantau proporsi kesehatan finansial keluarga (cth: evaluasi rasio 50/30/20).
- **Tren Bulanan**: Grafik batang perbandingan antara Limit Anggaran vs Pengeluaran Riil per amplop di bulan berjalan.

### Fitur 5: Log Audit Transparansi Keuangan
- Pencatatan otomatis setiap tindakan administratif:
  - Perubahan limit amplop.
  - Penghapusan amplop.
  - Transfer saldo antar amplop (siapa yang memindahkan, dari mana, ke mana, berapa jumlahnya).
  - Pendaftaran anggota keluarga baru.

---

## 4. Desain Skema Database (Tabel Supabase)

### A. Tabel `families`
```sql
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    cash_pool_balance NUMERIC DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### B. Tabel `profiles`
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member' NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### C. Tabel `envelopes`
```sql
CREATE TABLE envelopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    balance NUMERIC DEFAULT 0 NOT NULL,
    limit_amount NUMERIC NOT NULL,
    category TEXT CHECK (category IN ('NEEDS', 'WANTS', 'SAVINGS')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### E. Tabel `transactions`
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    envelope_id UUID REFERENCES envelopes(id) ON DELETE CASCADE, -- Null jika transaksi Kas Utama
    source_envelope_id UUID REFERENCES envelopes(id) ON DELETE CASCADE, -- Digunakan hanya untuk tipe TRANSFER
    amount NUMERIC NOT NULL,
    type TEXT CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER')) NOT NULL,
    description TEXT NOT NULL,
    source TEXT DEFAULT 'APP' NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### F. Tabel `audit_logs`
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_table TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

---

## 5. Rencana Verifikasi (Verification Plan)

### Pengujian Alur Fungsional (Manual & E2E)
1. **Registrasi & Pembentukan Grup**:
   - Mendaftar user "Adhi" -> Pilih "Buat Keluarga baru" -> Terbentuk keluarga "Keluarga Adhi".
   - Salin kode undangan.
   - Mendaftar user "Sarah" -> Pilih "Gabung Keluarga" -> Input kode undangan -> Akun terhubung ke keluarga Adhi sebagai `member`.
2. **Pengisian Kas & Alokasi Anggaran**:
   - Log in sebagai Adhi (Admin).
   - Masukkan pemasukan Rp10.000.000 -> Verifikasi saldo Kas Utama bertambah.
   - Buat amplop "Dapur" (Category: `NEEDS`, Limit: Rp3.000.000).
   - Buat amplop "Transportasi" (Category: `NEEDS`, Limit: Rp1.000.000).
   - Alokasikan Rp1.000.000 dari Kas Utama ke "Transportasi" -> Verifikasi Kas Utama berkurang jadi Rp9.000.000 and saldo "Transportasi" bertambah jadi Rp1.000.000.
3. **Pencatatan Pengeluaran & Peringatan Saldo (Rollover/Warning)**:
   - Log in sebagai Sarah (Member).
   - Catat pengeluaran bensin Rp900.000 -> Saldo Transportasi sisa Rp100.000 (10% dari limit). Verifikasi status amplop berubah menjadi `warning` (warna kuning/oranye).
4. **Skenario "Gali Lubang Tutup Lubang" (Transfer)**:
   - Sarah mencoba mengeluarkan dana Rp150.000 untuk bensin (gagal karena saldo Rp100.000).
   - Log in sebagai Adhi (atau akun Ibu yang bertindak sebagai Admin).
   - Lakukan transfer saldo Rp100.000 dari amplop "Dapur" ke amplop "Transportasi".
   - Verifikasi saldo "Transportasi" bertambah jadi Rp200.000 dan "Dapur" terpotong.
   - Sarah mencatat pengeluaran bensin Rp150.000 -> Transaksi berhasil.
   - Periksa tab Log Audit untuk memverifikasi pencatatan transfer saldo oleh Admin.
5. **Log Audit & Laporan Grafik**:
   - Verifikasi halaman Grafik menampilkan proporsi pengeluaran berdasarkan kategori `NEEDS`, `WANTS`, dan `SAVINGS`.
   - Verifikasi log audit mencatat semua transaksi transfer saldo dengan detail nama pelaku.
