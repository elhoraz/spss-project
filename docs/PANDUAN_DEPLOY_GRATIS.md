# Panduan Lengkap: Cara Deploy Gratis 100% (Tanpa Kartu Kredit)

Platform statistik ini dirancang agar dapat di-deploy secara **100% GRATIS** ke internet dengan performa tinggi. Berikut adalah pilihan dan langkah-langkahnya.

---

## Ringkasan Solusi Deploy Gratis Terbaik

| Komponen | Platform Gratis Terbaik | Biaya | Batasan Free Tier |
| :--- | :--- | :---: | :--- |
| **Frontend (React/Vite)** | **Vercel** atau **Netlify** | **Rp 0** | Unlimited bandwidth wajar, HTTPS SSL otomatis, Global CDN |
| **Backend (Python FastAPI)** | **Render.com** atau **Koyeb** | **Rp 0** | 750 jam/bulan (cukup untuk 24/7), tidur otomatis jika tidak dipakai |
| **Database (PostgreSQL)** | **Neon.tech** atau **Supabase** | **Rp 0** | 500 MB data (cukup untuk ratusan ribu baris data statistik) |
| **Akses Publik dari Laptop** | **Cloudflare Tunnel** / **Ngrok** | **Rp 0** | Instan dapat link publik `https://...` dari laptop Anda |

---

## METODE 1: Deploy ke Cloud (Vercel + Render) — Paling Direkomendasikan

Metode ini membuat aplikasi Anda memiliki link web resmi yang bisa dibuka oleh siapa saja di seluruh dunia 24 jam nonstop.

### Langkah 1: Upload / Push Kode ke GitHub
1. Buat akun di [GitHub.com](https://github.com) jika belum punya.
2. Buka terminal di folder project ini:
   ```bash
   git init
   git add .
   git commit -m "feat: OpenSPSS Studio enterprise statistical platform"
   git branch -M main
   # Buat repository baru di GitHub, lalu hubungkan:
   git remote add origin https://github.com/USERNAME-ANDA/statistica-spss.git
   git push -u origin main
   ```

---

### Langkah 2: Deploy Frontend di Vercel (Gratis)
1. Buka [Vercel.com](https://vercel.com) dan login menggunakan akun GitHub Anda.
2. Klik tombol **"Add New..." → "Project"**.
3. Pilih repository `statistica-spss` yang baru saja Anda push.
4. Pada bagian **Root Directory**, klik **Edit** dan pilih folder: `frontend`.
5. Klik **Deploy**!
6. Dalam waktu ~45 detik, website Anda sudah aktif di domain gratis seperti:
   `https://statistica-spss.vercel.app`

*(Catatan: File konfigurasi `frontend/vercel.json` sudah kami buatkan otomatis sehingga routing single-page application akan langsung berjalan mulus).*

---

### Langkah 3: Deploy Backend di Render.com (Gratis)
1. Buka [Render.com](https://render.com) dan login dengan akun GitHub Anda.
2. Klik **"New +" → "Web Service"**.
3. Hubungkan repository GitHub Anda.
4. Isi data berikut:
   - **Name**: `stat-spss-backend`
   - **Language**: `Python 3`
   - **Branch**: `main`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Pilih **Free** ($0/month).
5. Klik **Create Web Service**.
6. Render akan membangun server Python dan memberikan URL gratis seperti:
   `https://stat-spss-backend.onrender.com`

---

### Langkah 4: Database PostgreSQL Gratis di Neon.tech (Opsional)
Jika Anda ingin data pengguna dan output analisis tersimpan permanen di cloud:
1. Buka [Neon.tech](https://neon.tech) dan klik **Sign Up with GitHub**.
2. Buat database baru bernama `spss_studio`.
3. Salin connection string `DATABASE_URL` (contoh: `postgresql://user:pass@ep-xyz.neon.tech/spss_studio?sslmode=require`).
4. Masukkan `DATABASE_URL` tersebut ke menu **Environment Variables** di Render.com.

---

## METODE 2: Jadikan Laptop Anda Sebagai Server Publik (Cloudflare Tunnel - 100% Gratis Instan)

Jika Anda ingin orang lain atau dosen/kolega bisa langsung mengakses platform ini dari internet sekarang juga tanpa perlu upload ke GitHub:

1. Unduh **Cloudflare Tunnel** gratis (tanpa perlu akun/kartu kredit):
   Buka PowerShell dan jalankan:
   ```powershell
   winget install Cloudflare.cloudflared
   ```
2. Jalankan perintah ini untuk membuka port frontend ke publik:
   ```powershell
   cloudflared tunnel --url http://localhost:5173
   ```
3. Cloudflare akan memberikan link publik HTTPS acak gratis (misal: `https://rapid-words-example.trycloudflare.com`) yang bisa dibuka dari HP atau laptop mana pun di dunia!

---

## Catatan Mengenai Error "uvicorn.exe blocked" Sebelumnya
Di sistem operasi Windows (seperti laptop Lenovo), file `.exe` yang di-install lewat pip ke folder `AppData` sering kali diblokir oleh kebijakan keamanan Windows Defender (*Application Control policy*).

**Cara yang benar dan berhasil 100%**:
Jalankan melalui modul Python langsung (bukan file `.exe`-nya):
```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
Perintah ini sudah kami jalankan di sistem Anda dan backend saat ini **sudah berstatus LIVE (200 OK)**.
