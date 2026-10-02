# SPECIFICATION 04: DATA VIEW SPECIFICATION
**High-Performance Virtualized Grid, Range Selection Matrix, Clipboard Engine & Keyboard State Machine**
**Standard Reference:** IBM SPSS Statistics 28/29 Professional Desktop  
**Version:** 3.0.0-PRO  

---

## 1. Arsitektur State Grid & Ruang Koordinat Data View
Data View memetakan array dua dimensi observasi kasus:
$$\text{Matrix } \mathbf{D} \in \mathbb{R}^{R \times C}$$
Di mana $R$ adalah jumlah baris kasus ($1 \le r \le 100.000+$) dan $C$ adalah jumlah variabel ($1 \le c \le 500+$).

Setiap sel diidentifikasi oleh tuple:
$$\text{Cell}(r, c) \quad \text{dengan } r \in [0, R-1], \, c \in [0, C-1]$$

---

## 2. Inventaris Lengkap Interaksi Data View

### 1. Cell Selection (Single Cell)
* **Event**: `mousedown` pada elemen sel data `(r, c)`.
* **Input**: Koordinat sel target `(targetRow, targetCol)`.
* **Output**:
  - `activeCell` di-set ke `(targetRow, targetCol)`.
  - `selectionRange` di-set ke `{ startRow: r, startCol: c, endRow: r, endCol: c }`.
  - Kotak formula di atas menampilkan koordinat `(r+1) : varName` dan nilai sel aktual.
  - Border tebal biru `#1D4ED8` muncul di sekeliling sel aktif dengan pegangan seleksi (*fill handle*) di pojok kanan bawah.
* **Edge Cases**: Mengklik sel yang sedang dalam proses pengeditan sel lain akan melakukan commit nilai sel lama terlebih dahulu sebelum memindahkan seleksi.

### 2. Multi Selection & Drag Selection
* **Event**: `mousedown` pada `(r1, c1)` $\rightarrow$ `mousemove` menahan tombol kiri mouse $\rightarrow$ `mouseup` pada `(r2, c2)`.
* **Input**: Titik awal jangkar (*anchor*) `(r1, c1)` dan titik akhir kursor (*focus*) `(r2, c2)`.
* **Output**:
  - `selectionRange` diperbarui menjadi kotak tertutup:
    $$\text{Bounding Box} = [\min(r1, r2), \max(r1, r2)] \times [\min(c1, c2), \max(c1, c2)]$$
  - Seluruh sel dalam rentang mendapatkan overlay warna biru semi-transparan `rgba(59, 130, 246, 0.12)`.
  - Border luar rentang diberi garis putus-putus atau solid biru tebal.
* **Edge Cases**: Dragging melebihi batas viewport memicu *Auto-Scroll* otomatis.

### 3. Column Selection (Full Column)
* **Event**: Klik kiri pada elemen header kolom variabel di bagian atas grid.
* **Input**: Indeks kolom `c`.
* **Output**:
  - `selectionRange` mencakup seluruh baris kasus: `{ startRow: 0, startCol: c, endRow: R-1, endCol: c }`.
  - Header kolom berubah warna menjadi abu-abu gelap aktif `#94A3B8`.
  - Seluruh kolom tersorot aktif.
* **Edge Cases**: Shift+Click pada header kolom lain memperluas seleksi kolom secara kontigu dari kolom awal ke kolom tujuan.

### 4. Row Selection (Full Row / Case)
* **Event**: Klik kiri pada header nomor baris di sisi kiri grid.
* **Input**: Indeks baris kasus `r`.
* **Output**:
  - `selectionRange` mencakup seluruh variabel: `{ startRow: r, startCol: 0, endRow: r, endCol: C-1 }`.
  - Header baris berubah warna menjadi abu-abu aktif.
  - Seluruh baris tersorot aktif.
* **Edge Cases**: Klik dan seret pada header nomor baris memilih beberapa baris utuh secara berurutan.

### 5. Clipboard Copy (`Ctrl + C`)
* **Event**: Tombol `keydown` kombinasi `Ctrl+C` atau `Cmd+C`.
* **Input**: Nilai sel-sel yang tercakup dalam `selectionRange`.
* **Output**:
  - Menghasilkan representasi string Tab-Separated Values (TSV): kolom dipisahkan oleh karakter `\t`, baris dipisahkan oleh `\r\n`.
  - Menulis string TSV ke OS System Clipboard melalui `navigator.clipboard.writeText()`.
  - Animasi visual garis putus-putus berkedip (*marching ants*) mengelilingi rentang yang disalin.
* **Edge Cases**: Nilai `null` atau System-missing disalin sebagai string kosong atau tanda titik `.` sesuai standar SPSS.

### 6. Clipboard Paste (`Ctrl + V`)
* **Event**: Tombol `keydown` kombinasi `Ctrl+V` atau `Cmd+V`.
* **Input**: Teks dari clipboard OS (format TSV atau CSV).
* **Output**:
  - Melakukan parsing teks clipboard menjadi matriks 2D string.
  - Memetakan nilai mulai dari posisi sel aktif `(activeRow, activeCol)`.
  - **Auto-expand rows**: Jika baris yang ditempel melampaui jumlah baris $R$, secara otomatis membuat baris kasus baru di dataset.
  - **Auto-expand cols**: Jika kolom yang ditempel melampaui jumlah variabel $C$, secara otomatis membuat variabel baru (`VAR00001`, `VAR00002`..).
  - Melakukan type casting: nilai yang tidak sesuai dengan tipe kolom numerik diubah menjadi `null` / System-missing (`.`).
* **Edge Cases**: Menempelkan tabel jutaan karakter dipecah menjadi batch parsing asinkron menggunakan `requestIdleCallback` agar tidak menyebabkan browser freeze.

### 7. Clear / Delete
* **Event**: Tombol `keydown` `Delete` atau `Backspace` saat grid berada dalam *Navigational Mode*.
* **Input**: Rentang `selectionRange`.
* **Output**:
  - Seluruh nilai sel dalam rentang diset menjadi `null` (System Missing).
  - Struktur baris dan kolom tidak dihapus, hanya isinya yang dikosongkan.
  - Snapshot state didaftarkan ke Undo Stack.
* **Edge Cases**: Jika seluruh baris dipilih via row header dan pengguna memilih *Edit > Clear Case*, maka baris tersebut dihapus total dari array dataset.

### 8. Fill Down (`Ctrl + D`) & Fill Right (`Ctrl + R`)
* **Event**: Shortcut `Ctrl+D` (Fill Down) atau menu `Edit > Fill`.
* **Input**: `selectionRange` yang mencakup 2 baris atau lebih.
* **Output**:
  - Nilai pada baris paling atas rentang (`startRow`) disalin ke seluruh baris di bawahnya (`startRow+1` s/d `endRow`) untuk setiap kolom dalam rentang.
* **Edge Cases**: Kolom read-only atau calculated dilompati tanpa error.

### 9. Keyboard Navigation State Machine

```
                   ┌────────────────────────────────────────┐
                   │           NAVIGATIONAL MODE            │
                   └────────────────────────────────────────┘
                        │                              ▲
       [F2 / Enter /    │                              │ [Enter / Tab /
     Ketik Karakter]    │                              │  Commit Edit]
                        ▼                              │
                   ┌────────────────────────────────────────┐
                   │          IN-CELL EDITING MODE          │
                   └────────────────────────────────────────┘
                        │
                        │ [Escape] -> Cancel edit & restore original
                        ▼
                   ┌────────────────────────────────────────┐
                   │           NAVIGATIONAL MODE            │
                   └────────────────────────────────────────┘
```

* **Navigational Mode**:
  - `Arrow Up` $\rightarrow$ Pindah ke `(r-1, c)`.
  - `Arrow Down` $\rightarrow$ Pindah ke `(r+1, c)`.
  - `Arrow Left` $\rightarrow$ Pindah ke `(r, c-1)`.
  - `Arrow Right` $\rightarrow$ Pindah ke `(r, c+1)`.
  - `Tab` $\rightarrow$ Pindah ke `(r, c+1)`.
  - `Shift + Tab` $\rightarrow$ Pindah ke `(r, c-1)`.
  - `Enter` $\rightarrow$ Mengaktifkan mode edit; jika langsung ditekan lagi, pindah ke `(r+1, c)`.
  - `Home` $\rightarrow$ Pindah ke kolom pertama pada baris aktif `(r, 0)`.
  - `End` $\rightarrow$ Pindah ke kolom terakhir pada baris aktif `(r, C-1)`.
  - `Page Up` $\rightarrow$ Melompat 20 baris ke atas `(r-20, c)`.
  - `Page Down` $\rightarrow$ Melompat 20 baris ke bawah `(r+20, c)`.
  - `Ctrl + Home` $\rightarrow$ Melompat ke sel pertama tabel `(0, 0)`.
  - `Ctrl + End` $\rightarrow$ Melompat ke sel terakhir tabel `(R-1, C-1)`.
* **In-Cell Editing Mode**:
  - Tombol panah kanan/kiri menggeser kursor teks di dalam kotak input.
  - `Enter` $\rightarrow$ Commit nilai baru dan pindah ke baris berikutnya `(r+1, c)`.
  - `Tab` $\rightarrow$ Commit nilai baru dan pindah ke kolom berikutnya `(r, c+1)`.
  - `Escape` $\rightarrow$ Membatalkan pengetikan dan mengembalikan nilai sel semula.

### 10. Mouse Navigation, Scroll & Auto-Scroll
* **Wheel Scroll**: Menggulir vertikal dan horizontal dengan akselerasi halus (*smooth scrolling*).
* **Auto-Scroll Behavior**: Saat melakukan drag-selection dan mouse bergerak mendekati margin 30px dari batas viewport grid, grid secara otomatis menggulir dengan kecepatan linier proporsional terhadap jarak kursor dari tepi.
* **Virtualization Window**: Virtual DOM hanya merender `viewportHeight / 24px + 10` baris buffer.

### 11. Context Menu (Klik Kanan Desktop)
* **Event**: `contextmenu` pada sel grid atau header.
* **Item Menu yang Ditampilkan**:
  1. `Cut` (`Ctrl+X`)
  2. `Copy` (`Ctrl+C`)
  3. `Paste` (`Ctrl+V`)
  4. `Insert Variable` (Menyisipkan kolom baru di kiri)
  5. `Insert Cases` (Menyisipkan baris baru di atas)
  6. `Clear` (`Delete`)
  7. `Sort Ascending` (Urutkan kolom dari kecil ke besar)
  8. `Sort Descending` (Urutkan kolom dari besar ke kecil)
  9. `Descriptive Statistics...` (Langsung membuka ringkasan cepat variabel kolom ini)
* **Output**: Menu pop-up desktop berlatar belakang `#F8FAFC` dengan drop-shadow Windows muncul tepat di koordinat mouse `(clientX, clientY)`. Klik di luar menu menutup pop-up.
