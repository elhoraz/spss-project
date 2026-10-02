# SPECIFICATION 12: PERFORMANCE & LARGE DATASET SPECIFICATION
**100k+ Rows Virtualization, Dual-Engine Architecture, Memory Footprint & Asynchronous Streaming Pipeline**
**Standard Reference:** IBM SPSS Statistics 28/29 Professional Desktop  
**Version:** 3.0.0-PRO  

---

## 1. Target Kinerja Kuantitatif (Performance SLA)

| Parameter Kinerja | Target Ambang Batas (SLA) | Kondisi Pengujian |
| :--- | :--- | :--- |
| **Kapasitas Dataset Maksimum** | **100.000+ Baris $\times$ 500 Kolom** | Browser Chrome / Edge / Firefox modern |
| **Waktu Pemuatan Awal Grid (Initial Render)** | **$< 1.2$ Detik** | Dataset 50.000 baris dari file `.sav` lokal |
| **Frame Rate Saat Menggulir (Scroll FPS)** | **Stabil 60 FPS** | Pengguliran cepat vertikal dan horizontal |
| **Latensi Respons Edit Sel (In-Cell Commit)** | **$< 16$ ms** (1 frame time budget) | Pengetikan dan navigasi antar sel |
| **Waktu Eksekusi Analisis Deskriptif** | **$< 350$ ms** | N = 50.000 kasus, 5 variabel simultan |
| **Konsumsi Memori RAM Browser** | **$< 150$ MB** | Dataset 100.000 baris berkat windowing DOM |
| **Ukuran Bundle JavaScript Produksi** | **$< 3.5$ MB** (Gzip/Brotli compressed) | Inisialisasi aplikasi pertama kali |

---

## 2. Strategi Arsitektur & Optimasi Teknis

### 1. Grid Windowing & DOM Virtualization (TanStack Virtual)
* **Permasalahan**: Jika browser mencoba me-render 100.000 baris $\times$ 20 kolom secara langsung, browser akan membuat 2.000.000 elemen DOM, yang langsung menyebabkan browser crash karena kehabisan memori.
* **Solusi**: Hanya me-render elemen yang tampak di dalam viewport fisik layar:
  - Jumlah baris yang dirender secara bersamaan: $\approx 35 \text{ baris}$ (tinggi viewport 800px / 24px baris) ditambah buffer atas 5 baris dan buffer bawah 5 baris (Total $\approx 45 \text{ elemen `tr`}$).
  - Sisa baris direpresentasikan oleh elemen container virtual dengan tinggi total $R \times 24\text{px}$ dan transformasi CSS `translateY()`.
  - Virtualisasi dua dimensi: Kolom juga divirtualisasi secara horizontal jika jumlah variabel melampaui 30 kolom.

### 2. Dual-Engine Computation Splitting Strategy
Sistem secara cerdas membagi beban kerja komputasi antara browser (klien) dan backend (server):

```
                                [ Analisis Diminta ]
                                         │
                        Jumlah Kasus $N \le 5.000$ dan
                       Analisis Ringan (Frequencies /
                         Descriptives / Crosstabs)?
                                         │
                        ├─── YA ─────────────────── TIDAK ───┐
                        ▼                                    ▼
          [ CLIENT-SIDE ENGINE (TS) ]           [ SERVER-SIDE ENGINE (Python) ]
          - Berjalan di Web Worker              - NumPy Vectorized Linear Algebra
          - Latensi Jaringan: 0 ms              - SciPy Distribution Functions
          - Sangat responsif                    - Streaming via Server-Sent Events
```

### 3. Asynchronous Web Worker Offloading
* Operasi transformasi data massal (Compute Variable, Recode, Filter, Sort) pada dataset $> 10.000$ baris dieksekusi di dalam **Dedicated Web Worker** terpisah.
* Benang pemrosesan utama (*UI Main Thread*) tidak pernah terblokir; spreadsheet tetap dapat di-scroll dan responsif dengan mulus selama komputasi berlangsung.

### 4. Chunked Lazy Loading & Streaming
* Saat mengimpor berkas besar dari server cloud, data dimuat dalam bentuk paket *chunks* berukuran 2.500 baris per batch.
* Pengguna dapat langsung melihat dan mengedit 2.500 baris pertama seketika, sementara sisa baris dimuat di latar belakang.

### 5. Memory Management & Garbage Collection Guards
* Struktur data matriks menggunakan `Float64Array` bertipe data rendah (*TypedArrays*) untuk data numerik guna menghemat memori heap V8 hingga 70% dibanding objek JavaScript biasa.
* Menggunakan teknik *Object Pooling* untuk event handler sel agar tidak memicu Garbage Collection spikes saat scrolling cepat.

---

## 3. Sistem Pemantauan Kinerja & Telemetri (Performance Monitoring)
1. **Built-in FPS Meter**: Indikator opsional di status bar yang menampilkan frame rate rendering grid secara real-time.
2. **Benchmark Profiling Suite**: Script pengujian terotomasi yang mengukur kecepatan operasi dasar (Copy, Paste 10.000 baris, Sort 50.000 kasus, Eksekusi Regresi).
3. **Execution Timestamping**: Setiap tabel output di Output Viewer mencatat metadata waktu eksekusi presisi dalam milidetik (misal: `Total processing time: 42.6 ms`).
