# PHASE 9: UI Design System & Component Library
**Project**: StatisticaPro Enterprise  
**Design Paradigm**: Professional Desktop Statistics Chrome  
**Aesthetics**: SPSS Desktop High-Fidelity with Modern Refinements  
**Status**: APPROVED  

---

## 1. Sistem Warna & Tema Desktop (Color System)

Aplikasi mendukung 3 tema desktop terkurasi:

| Token CSS | SPSS Classic Light (Default) | Modern Slate Light | Academic Dark |
|---|---|---|---|
| `--bg-app` | `#e0e4e8` (Slate Silver) | `#f1f5f9` (Cool Slate) | `#0b0f19` (Obsidian) |
| `--bg-surface` | `#ffffff` (Pure White) | `#ffffff` (Pure White) | `#1e293b` (Dark Slate) |
| `--bg-header` | `#e4e7eb` (Classic Gray) | `#e2e8f0` (Soft Zinc) | `#1e293b` (Dark Surface) |
| `--border-app` | `#b0b8c0` (Chrome Border) | `#cbd5e1` (Subtle Slate)| `#334155` (Border Dark) |
| `--border-cell` | `#d0d7de` (Grid Lines) | `#e2e8f0` (Grid Lines) | `#293548` (Cell Lines) |
| `--accent` | `#0b57d0` (SPSS Blue) | `#2563eb` (Indigo Blue) | `#38bdf8` (Cyan Blue) |
| `--table-border-spss`| `#000000` (APA Black) | `#1e293b` (Slate Black)| `#94a3b8` (Slate Gray) |

---

## 2. Tipografi (Typography Tokens)

- **UI Font**: `'Inter', 'Segoe UI', -apple-system, sans-serif`
  - Body: 12px / 400 (Kompak seperti aplikasi desktop profesional)
  - Headers: 12px / 600
  - Window Title: 13px / 600
- **Monospace Font**: `'JetBrains Mono', Consolas, Monaco, monospace`
  - Formula Bar: 12px / 500
  - Syntax Editor: 13px / 400 (Line-height 1.6)
  - Output Log: 11px / 400

---

## 3. Ikon Pengukuran Variabel SPSS (Measurement Scale Icons)

1. **Scale**: Ikon Penggaris (*Ruler*) dengan garis skala metrik (Warna: Biru `#2563eb`).
2. **Ordinal**: Ikon 3 Bar Tingkatan Bertingkat (Warna: Hijau `#16a34a`).
3. **Nominal**: Ikon 3 Lingkaran Kategori Terpisah (Warna: Oranye-Biru-Hijau `#ea580c`).

---

## 4. Standar Visual Tabel Pivot APA / SPSS

```
══════════════════════════════════════════════════════════════════════════ (Garis Ganda Atas: 2px)
Judul Kolom Kategori (Kiri)        Header Numerik (Kanan)    Header Numerik
────────────────────────────────────────────────────────────────────────── (Garis Tunggal Header: 1px)
Baris Data Kategori 1                             40              39,890.62
Baris Data Kategori 2                             25              18,393.75
──────────────────────────────────────────────────────────────────────────
Total Kasus Valid (Tebal)                         65              58,284.37
══════════════════════════════════════════════════════════════════════════ (Garis Ganda Bawah: 2px)
*. Signifikan pada level 0.05 (2-tailed).
```
Tabel pivot menggunakan font tabular (`font-variant-numeric: tabular-nums`) sehingga angka desimal sejajar vertikal secara sempurna.
