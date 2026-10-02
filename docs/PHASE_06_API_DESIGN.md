# PHASE 6: API Specification & OpenAPI Design
**Project**: StatisticaPro Enterprise  
**Document Ref**: API-STAT-2026-V2  
**Format**: RESTful JSON / Multipart OpenAPI 3.1  
**Status**: APPROVED  

---

## 1. Konvensi Global API
- **Base URL**: `/api/v1`
- **Header Autentikasi**: `Authorization: Bearer <access_token>`
- **Format Respon Sukses**:
  ```json
  {
    "success": true,
    "data": {},
    "meta": { "timestamp": "2026-10-02T10:45:00Z", "version": "v1" }
  }
  ```
- **Format Respon Error**:
  ```json
  {
    "success": false,
    "error": { "code": "VALIDATION_ERROR", "message": "Detail pesan error...", "details": [] }
  }
  ```

---

## 2. Rincian Endpoint API Utama

### 2.1 Autentikasi & Akun (`/auth`)
| Method | Endpoint | Deskripsi | Request Body / Payload |
|---|---|---|---|
| `POST` | `/auth/register` | Mendaftarkan peneliti baru | `{ email, username, password, full_name }` |
| `POST` | `/auth/login` | Login & set HttpOnly refresh cookie | `{ username_or_email, password }` |
| `POST` | `/auth/refresh` | Rotasi Access Token via Refresh Token | *(Cookie)* |
| `GET` | `/auth/me` | Profil pengguna aktif saat ini | - |

### 2.2 Proyek & Manajemen Dataset (`/projects`, `/datasets`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/projects` | Mengambil daftar proyek riset pengguna |
| `POST` | `/projects` | Membuat proyek baru |
| `POST` | `/datasets/import` | Mengunggah dan mem-parsing berkas data (`multipart/form-data`) |
| `GET` | `/datasets/{id}` | Mengambil metadata dan baris dataset (dengan parameter `offset` & `limit`) |
| `PATCH`| `/datasets/{id}/cells` | Edit batch nilai sel spreadsheet |
| `PUT` | `/datasets/{id}/columns`| Memperbarui konfigurasi metadata 11 kolom SPSS |
| `POST` | `/datasets/{id}/sort` | Mengurutkan dataset berdasarkan variabel tertentu |
| `POST` | `/datasets/{id}/select-cases` | Filter data menggunakan kondisi logika |

### 2.3 Mesin Analisis Statistik (`/analysis`)

#### A. `POST /analysis/descriptive`
Menghitung statistik deskriptif parametrik.
- **Request**:
  ```json
  {
    "dataset_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "variables": ["salary", "salbegin", "educ"],
    "statistics": ["mean", "std_dev", "variance", "min", "max", "range", "se_mean", "skewness", "kurtosis"]
  }
  ```
- **Response**: Tabel ringkasan SPSS dengan Valid N, Mean, Std. Error, Std. Deviation, Variance, Min, Max.

#### B. `POST /analysis/frequencies`
Menghasilkan tabel frekuensi dan persentase valid.
- **Request**:
  ```json
  {
    "dataset_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "variables": ["gender", "jobcat"]
  }
  ```
- **Response**: Array tabel frekuensi per variabel dengan perhitungan *Percent*, *Valid Percent*, dan *Cumulative Percent*.

#### C. `POST /analysis/crosstabs`
Menghasilkan tabel kontingensi dan uji Chi-Square.
- **Request**:
  ```json
  {
    "dataset_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "row_variable": "gender",
    "column_variable": "jobcat",
    "options": { "expected_count": true, "row_percent": true, "column_percent": true, "chi_square": true }
  }
  ```

#### D. `POST /analysis/t-test`
Menjalankan uji One-Sample, Independent Samples, atau Paired Samples T-Test.
- **Request**:
  ```json
  {
    "type": "INDEPENDENT_SAMPLES",
    "dataset_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "test_variables": ["salary"],
    "grouping_variable": "gender",
    "group_values": ["m", "f"]
  }
  ```

#### E. `POST /analysis/anova`
Menjalankan One-Way atau Factorial ANOVA dengan uji perbandingan berganda Post-Hoc Tukey HSD.
- **Request**:
  ```json
  {
    "dataset_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "dependent_variable": "salary",
    "factor_variable": "jobcat",
    "post_hoc": ["TUKEY_HSD"]
  }
  ```

#### F. `POST /analysis/regression`
Menjalankan analisis regresi linier berganda dengan uji multikolinearitas (VIF & Tolerance).
- **Request**:
  ```json
  {
    "dataset_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "dependent_variable": "salary",
    "independent_variables": ["salbegin", "educ", "jobtime"],
    "method": "ENTER"
  }
  ```

#### G. `POST /analysis/reliability`
Menghitung koefisien reliabilitas instrumen kuesioner dengan Cronbach's Alpha.
- **Request**:
  ```json
  {
    "dataset_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "items": ["q1", "q2", "q3", "q4", "q5"]
  }
  ```

#### H. `POST /analysis/nonparametric`
Menjalankan uji Mann-Whitney U, Wilcoxon Signed-Rank, atau Kruskal-Wallis H Test.
- **Request**:
  ```json
  {
    "test": "MANN_WHITNEY",
    "dataset_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "test_variable": "salary",
    "group_variable": "minority"
  }
  ```

### 2.4 Syntax Runner & Pelaporan (`/scripts`, `/outputs`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/scripts/run` | Menjalankan batch teks perintah sintaks SPSS dan mengembalikan hasil analisis |
| `POST` | `/outputs` | Menyimpan seluruh dokumen Output Viewer ke database |
| `GET` | `/outputs/{id}` | Mengambil dokumen output tersimpan berdasarkan ID |
| `POST` | `/outputs/export` | Menghasilkan berkas PDF / XLSX / DOCX terkompilasi |
