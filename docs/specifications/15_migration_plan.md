# SPECIFICATION 15: MIGRATION & DEPLOYMENT VERIFICATION PLAN
**Zero-Downtime Cloud Deployment, State Schema Versioning & Automated Verification Pipeline**
**Standard Reference:** IBM SPSS Statistics 28/29 Professional Desktop  
**Version:** 3.0.0-PRO  

---

## 1. Jaminan Deployment Tanpa Henti (Zero-Downtime Guarantee)

Karena aplikasi saat ini telah aktif dan digunakan pada platform cloud publik:
* **Frontend**: Vercel Edge Hosting (`https://frontend-*.vercel.app`)
* **Backend**: Render Web Service (`https://spss-project-backend.onrender.com`)

Seluruh proses migrasi, refactoring, dan penambahan fitur desktop **wajib mempertahankan uptime 100%** tanpa merusak sesi pengguna yang sedang berjalan.

```
[ Local Development & Phased Refactor ]
                  │
                  ▼
[ Automated Quality Gate 1: pytest backend/tests ] (Must PASS 100%, Coverage >= 80%)
                  │
                  ▼
[ Automated Quality Gate 2: npm run build ]        (Must PASS Zero Errors, Clean Bundle)
                  │
                  ▼
[ Git Atomic Commit & Push to origin/main ]
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
 [ Vercel CI/CD ]     [ Render CI/CD ]
 - Static Analysis    - Poetry / Pip Install
 - Edge Prerender     - Python Service Restart
 - Zero-Downtime Swap - Zero-Downtime Container Swap
```

---

## 2. Backward Compatibility State & Data Migration Rules

### 1. Kompatibilitas Skema Dataset Store:
* State management di `frontend/src/store/useDatasetStore.ts` diperluas dengan penambahan properti baru secara opsional (*optional chaining*):
  ```typescript
  interface DatasetState {
    // Properti eksisting (wajib dipertahankan):
    variables: VariableMeta[];
    data: Record<string, any>[];
    activeTab: 'data' | 'variable' | 'output' | 'syntax';
    
    // Properti baru Wave 1-2 (Backward Compatible):
    selectionRange?: {
      startRow: number;
      startCol: number;
      endRow: number;
      endCol: number;
    } | null;
    activeFilters?: string[];
  }
  ```
* Jika pengguna memuat sesi lama yang belum memiliki `selectionRange`, sistem secara otomatis menginisialisasinya dengan nilai default `null` tanpa memicu crash.

### 2. Kompatibilitas Payload API Backend:
* Seluruh endpoint API analitik FastAPI (`/api/stats/descriptives`, `/api/stats/frequencies`, `/api/stats/regression`, dll.) mempertahankan parameter JSON eksisting.
* Penambahan parameter baru (seperti opsi sub-dialog tambahan) didefinisikan dengan nilai default (`Optional[List[str]] = None`), sehingga panggilan API dari frontend versi lama tetap berfungsi 100%.

---

## 3. Gerbang Validasi Pra-Deployment (Pre-Deployment Validation Gates)

Sebelum setiap perubahan kode dikirim ke repositori produksi GitHub (`origin/main`), pengembang wajib menjalankan dua gerbang pengujian lokal:

### Gerbang 1: Pengujian Backend Engine
```bash
python -m pytest backend/tests/test_enterprise_suite.py --cov=backend/stats
```
* **Kriteria Kelulusan**:
  - Seluruh pengujian (12/12) berstatus `PASSED`.
  - Cakupan kode (*code coverage*) pada modul mesin statistik minimal **$\ge 80\%$**.
  - Waktu eksekusi pengujian total $< 3$ detik.

### Gerbang 2: Validasi Kompilasi & Tipe Data Frontend
```bash
cd frontend && npm run build
```
* **Kriteria Kelulusan**:
  - Nol error TypeScript (`tsc -b`).
  - Nol error sintaks bundler Vite.
  - Waktu kompilasi $< 5$ detik dengan output bundle aset teroptimasi.

---

## 4. Prosedur Rollback Cepat (Emergency Rollback Protocol)
Jika terjadi anomali tak terduga setelah deployment ke cloud:
1. **Frontend (Vercel)**:
   - Masuk ke Vercel Dashboard $\rightarrow$ Pilih Deployments $\rightarrow$ Klik menu titik tiga pada commit stabil sebelumnya $\rightarrow$ Klik *Instant Rollback*. Pengalihan rute DNS selesai dalam waktu $< 5$ detik.
2. **Backend (Render)**:
   - Masuk ke Render Dashboard $\rightarrow$ Pilih Service $\rightarrow$ Buka tab Deploys $\rightarrow$ Klik *Rollback to this deploy*. Container docker versi sebelumnya akan langsung dihidupkan ulang.
3. **Repositori Git**:
   - Menjalankan `git revert HEAD` dan mendorong commit revert ke `origin/main` untuk menyinkronkan kembali branch kerja dengan kondisi stabil cloud.
