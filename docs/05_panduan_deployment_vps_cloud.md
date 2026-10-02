# 5. Panduan Deployment: VPS, Cloud, dan Docker

Dokumen ini menyediakan panduan instalasi dan deployment ke lingkungan produksi (*production ready*) untuk server VPS (Ubuntu/Debian) maupun penyedia Cloud (AWS, DigitalOcean, GCP, Railway, Render).

---

## 5.1 Opsi 1: Deployment Cepat Menggunakan Docker Compose (Direkomendasikan)

Metode ini mengemas seluruh stack aplikasi (Database PostgreSQL 16, Python FastAPI Backend, dan Nginx Frontend) dalam container yang terisolasi.

### Prasyarat
- Server dengan Docker $\ge$ 24.0 dan Docker Compose $\ge$ 2.20 terpasang.
- Port 80 dan 443 terbuka.

### Langkah-langkah:
1. Clone repositori ke server:
   ```bash
   git clone <URL_REPOSITORI> spss-studio
   cd spss-studio
   ```
2. Jalankan perintah build dan start:
   ```bash
   docker compose up -d --build
   ```
3. Verifikasi status container yang berjalan:
   ```bash
   docker compose ps
   ```
   Output:
   ```
   NAME            IMAGE                  COMMAND                  SERVICE      STATUS
   spss_db         postgres:16-alpine     "docker-entrypoint.s…"   db           running (healthy)
   spss_backend    spss-studio-backend    "uvicorn backend.mai…"   backend      running
   spss_frontend   spss-studio-frontend   "/docker-entrypoint.…"   frontend     running
   ```
4. Buka alamat IP atau domain server di browser (contoh: `http://ip-server-anda`). Aplikasi langsung siap digunakan!

---

## 5.2 Opsi 2: Deployment Manual pada VPS Ubuntu Linux 22.04 / 24.04 LTS

Jika ingin menjalankan service langsung pada sistem operasi host VPS tanpa Docker:

### Langkah 1: Update & Install Dependensi Sistem
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv nodejs npm postgresql postgresql-contrib nginx git curl
```

### Langkah 2: Konfigurasi Database PostgreSQL
```bash
sudo -u postgres psql
```
Di dalam console PostgreSQL:
```sql
CREATE DATABASE spss_studio;
CREATE USER spss_user WITH ENCRYPTED PASSWORD 'PasswordKuatAnda123!';
GRANT ALL PRIVILEGES ON DATABASE spss_studio TO spss_user;
\q
```

### Langkah 3: Setup Backend FastAPI & Systemd Service
1. Pindah ke direktori backend dan buat virtual environment:
   ```bash
   cd /var/www/spss-studio/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
2. Buat file konfigurasi `.env`:
   ```bash
   DATABASE_URL=postgresql://spss_user:PasswordKuatAnda123!@localhost:5432/spss_studio
   ```
3. Buat file service systemd `/etc/systemd/system/spss-backend.service`:
   ```ini
   [Unit]
   Description=OpenSPSS FastAPI Backend Service
   After=network.target postgresql.service

   [Service]
   User=www-data
   Group=www-data
   WorkingDirectory=/var/www/spss-studio
   Environment="PATH=/var/www/spss-studio/backend/venv/bin"
   Environment="DATABASE_URL=postgresql://spss_user:PasswordKuatAnda123!@localhost:5432/spss_studio"
   ExecStart=/var/www/spss-studio/backend/venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8000 --workers 4
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
4. Jalankan dan aktifkan service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable spss-backend
   sudo systemctl start spss-backend
   sudo systemctl status spss-backend
   ```

### Langkah 4: Build Frontend React & Nginx Setup
1. Pindah ke direktori frontend, pasang paket, dan lakukan build produksi:
   ```bash
   cd /var/www/spss-studio/frontend
   npm install
   npm run build
   ```
2. Buat konfigurasi virtual host Nginx `/etc/nginx/sites-available/spss-studio`:
   ```nginx
   server {
       listen 80;
       server_name domain-anda.com www.domain-anda.com;

       root /var/www/spss-studio/frontend/dist;
       index index.html index.htm;

       # Frontend Single Page App routing
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Reverse Proxy ke Backend FastAPI
       location /api/ {
           proxy_pass http://127.0.0.1:8000/api/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }

       # Optimasi kompresi Gzip
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   }
   ```
3. Aktifkan konfigurasi Nginx dan reload:
   ```bash
   sudo ln -s /etc/nginx/sites-available/spss-studio /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Langkah 5: Pasang Sertifikat SSL Gratis (HTTPS) dengan Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d domain-anda.com -d www.domain-anda.com
```

---

## 5.3 Opsi 3: Deployment ke Cloud Platform (Railway / Render / AWS)

### A. Railway.app
1. Hubungkan repositori GitHub Anda ke akun Railway.
2. Tambahkan resource **PostgreSQL** dari panel Railway.
3. Tambahkan resource service baru dari Dockerfile:
   - Pilih `Dockerfile.backend` untuk backend.
   - Sambungkan variabel `DATABASE_URL` ke database PostgreSQL Railway.
4. Tambahkan service frontend dari `Dockerfile.frontend` dan arahkan proxy Nginx ke URL service backend.

### B. Render.com
1. Buat **Web Service** baru untuk Backend:
   - Environment: `Python`
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
2. Buat **Static Site** untuk Frontend:
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`
   - Rewrite rule: `/*` $\rightarrow$ `/index.html` (Status 200).

---

## 5.4 Backup & Pemeliharaan Database PostgreSQL

### 1. Backup Otomatis Harian:
Jalankan script `pg_dump` dengan cron:
```bash
crontab -e
```
Tambahkan baris berikut untuk backup setiap pukul 02:00 pagi:
```cron
0 2 * * * pg_dump -U spss_user -d spss_studio | gzip > /var/backups/spss_studio_$(date +\%Y\%m\%d).sql.gz
```

### 2. Restore Database dari Backup:
```bash
gunzip -c /var/backups/spss_studio_20261002.sql.gz | psql -U spss_user -d spss_studio
```
