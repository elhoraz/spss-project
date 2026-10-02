# SPECIFICATION 03: WORKSPACE & WINDOW DOCKING SPECIFICATION
**Spatial Topology, Dimensional Constraints, Docking Mechanisms & Viewport State Engine**
**Standard Reference:** IBM SPSS Statistics 28/29 Professional Desktop  
**Version:** 3.0.0-PRO  

---

## 1. Tata Letak Workspace Desktop (Visual Wireframe Topology)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Title Bar] IBM SPSS Statistics - [DataSet1.sav - Data Editor]                             [-] [o] [x] │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Menu Bar] File   Edit   View   Data   Transform   Analyze   Graphs   Utilities   Window   Help         │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Toolbar] [Open] [Save] [Print] | [Undo] [Redo] | [Data] [Var] [Out] [Syn] | [1<->A] [Quick Stats]      │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Active Cell Bar] 1 : salary   [ Formula Box: 57000.00                                  ] [40 Cases]  │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Main Viewport: Virtualized Data / Variable Viewport / Output Splitter]                                 │
│ ┌─────┬────────────────┬────────────────┬────────────────┬────────────────┬──────────────────────────┐ │
│ │     │ 📏 id          │ 🔘 gender      │ 📏 salary      │ 📏 salbegin    │ + new var...             │ │
│ ├─────┼────────────────┼────────────────┼────────────────┼────────────────┼──────────────────────────┤ │
│ │ 1   │ 1              │ Male           │ $57,000.00     │ $27,000.00     │                          │ │
│ │ 2   │ 2              │ Male           │ $40,200.00     │ $18,750.00     │                          │ │
│ │ 3   │ 3              │ Female         │ $21,450.00     │ $12,000.00     │                          │ │
│ └─────┴────────────────┴────────────────┴────────────────┴────────────────┴──────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Tab Bar]  [ Data View ]  [ Variable View ]  |  [ Output Viewer (6) ]  [ Syntax Editor (1) ]           │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Status Bar] IBM SPSS Statistics Processor is ready | Cases: 40 | Variables: 9 | Filter: OFF | Wgt: OFF │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tabel Spesifikasi Komponen Workspace

| Komponen Workspace | Posisi Default | Ukuran Default | Perilaku Resize | Perilaku Docking | Perilaku Floating | Perilaku Collapse | Perilaku Restore |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Title Bar** | Paling atas layar (Top edge: 0px) | Tinggi: `30px`, Lebar: `100vw` | Lebar mengikuti ukuran browser window | Fixed permanen di bagian atas | Tidak dapat mengambang | Tombol Minimize `[-]` mengecilkan ke taskbar/baris bawah | Tombol Restore `[o]` mengembalikan ke ukuran sebelumnya |
| **Menu Bar** | Di bawah Title Bar | Tinggi: `26px`, Lebar: `100vw` | Lebar mengikuti window | Fixed permanen di bawah Title Bar | Tidak mengambang | Dapat disembunyikan via `View > Menu Bar` | Dimunculkan kembali via tombol trigger `Alt` |
| **Toolbar** | Di bawah Menu Bar | Tinggi: `34px`, Lebar: `100vw` | Lebar fleksibel dengan auto-overflow icons jika layar sempit | Fixed docked di bawah Menu Bar | Dapat di-undock menjadi toolbar mengambang (*Floating palette*) | Dapat disembunyikan via `View > Toolbar` | Dimunculkan kembali via `View > Toolbar` |
| **Active Cell Bar** | Di bawah Toolbar | Tinggi: `26px`, Lebar: `100vw` | Koordinat lebar tetap `90px`, kotak input meluas dinamis | Fixed docked di atas grid | Tidak mengambang | Menyatu dengan grid | Selalu aktif saat tab Data View dibuka |
| **Data Editor Grid** | Main viewport tengah | Tinggi: `calc(100vh - 144px)`, Lebar: `100vw` | Virtualized grid menyesuaikan tinggi dan lebar viewport seketika | Docked sebagai lembar kerja utama | Dapat dibuka di jendela tab browser terpisah (*Pop-out*) | Tertutup saat berpindah tab ke Output atau Syntax | Dipulihkan seketika dengan posisi scroll tetap terjaga |
| **Variable Editor Grid** | Main viewport tengah (Tab 2) | Tinggi: `calc(100vh - 144px)`, Lebar: `100vw` | Kolom terbagi 11 atribut terformat, lebar tabel responsif | Docked sebagai lembar kerja utama kedua | Dapat dibuka di jendela tab terpisah | Tertutup saat pindah tab | Dipulihkan instan saat tab Variable View diklik (`Ctrl+2`) |
| **Output Viewer Split** | Main viewport atau Panel Samping | Mode Full: `100vw`, Mode Split: `50%` kanan | Pemisah layar (*Splitter bar*) dapat diseret bebas secara horizontal | Dapat di-dock di sisi kanan grid atau jendela mandiri | Mengambang sebagai jendela output independen | Dapat di-minimize ke tab bawah | Dipulihkan ke posisi semula dengan riwayat scroll terjaga |
| **Syntax Editor Panel** | Main viewport atau Panel Bawah | Mode Full: `100vw`, Mode Bottom: `35vh` | Pemisah horizontal dapat diubah ukurannya secara dinamis | Docked di bawah atau berdampingan dengan Output | Mengambang sebagai jendela sintaks mandiri | Dapat di-collapse hingga tinggi header `24px` | Dipulihkan ke tinggi default `35vh` |
| **Bottom Tab Bar** | Tepat di atas Status Bar | Tinggi: `28px`, Lebar: `100vw` | Lebar tetap `100vw`, tombol tab bergaya desktop folder tabs | Docked permanen di kaki viewport data | Tidak mengambang | Tidak dapat di-collapse | Selalu terlihat untuk memudahkan perpindahan mode instan |
| **Status Bar** | Paling bawah layar (Bottom edge) | Tinggi: `22px`, Lebar: `100vw` | 4 segmen info terpisah garis vertikal dengan flex layout | Fixed docked permanen di paling bawah | Tidak mengambang | Dapat disembunyikan via `View > Status Bar` | Dimunculkan kembali via menu View |

---

## 3. Aturan Desain Visual & Layout Constraints (CSS Tokens)

```css
:root {
  /* Workspace Dimensions */
  --desktop-titlebar-height: 30px;
  --desktop-menubar-height: 26px;
  --desktop-toolbar-height: 34px;
  --desktop-cellbar-height: 26px;
  --desktop-tabbar-height: 28px;
  --desktop-statusbar-height: 22px;
  --desktop-grid-row-height: 24px;
  --desktop-grid-header-height: 26px;

  /* Palette Warna SPSS Classic Desktop */
  --desktop-bg-canvas: #ECE9D8;        /* Classic Windows Slate */
  --desktop-bg-panel: #F1F5F9;         /* Modern Slate 100 */
  --desktop-border-subtle: #CBD5E1;    /* Slate 300 */
  --desktop-border-grid: #D1D5DB;      /* Table cell border */
  --desktop-border-header: #94A3B8;    /* Header border */
  --desktop-cell-active-border: #1D4ED8; /* Selected cell outline */
  --desktop-cell-selection-bg: rgba(59, 130, 246, 0.12); /* Selection rectangle */
  --desktop-header-bg: #E2E8F0;       /* Column & Row header background */
  --desktop-header-hover: #CBD5E1;     /* Header hover */
  --desktop-header-active: #94A3B8;    /* Header selected */

  /* Typography */
  --desktop-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --desktop-font-mono: "Consolas", "Courier New", monospace;
  --desktop-font-size-cell: 12px;
  --desktop-font-size-header: 11px;
  --desktop-font-size-status: 11px;
}
```

---

## 4. Mekanisme Multi-Window & Modal Dialog System
1. **Window Stacking Context (Z-Index Hierarchy)**:
   - Base Workspace Canvas: `z-index: 1`
   - Active Cell Outline & Selection Box: `z-index: 10`
   - Sticky Column & Row Headers: `z-index: 20`
   - Context Menus & Dropdowns: `z-index: 100`
   - Floating Tool Palettes: `z-index: 500`
   - Modal Analysis Dialogs: `z-index: 1000`
   - Nested Sub-Dialogs (`[Statistics...]`, `[Options...]`): `z-index: 1100`
   - Critical Error / Alert Overlays: `z-index: 2000`

2. **Perilaku Dialog Dua Kotak (Two-Box Dialogs)**:
   - Posisi default: Tepat di tengah (*dead center*) layar komputer.
   - Perilaku Drag: Pengguna dapat mengklik dan menyeret title bar dialog untuk memindahkan dialog ke mana saja di layar tanpa merusak form state.
   - Backdrop semi-transparan (`rgba(0, 0, 0, 0.25)`) mengunci interaksi dengan spreadsheet di belakangnya hingga dialog diselesaikan (OK/Paste) atau dibatalkan (Cancel/Esc).
