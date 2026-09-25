# Papan Tugas Staf Bersama — Desain

**Tanggal:** 2026-09-04
**Status:** menunggu persetujuan

## Konteks

Hospi AI adalah prototype untuk dipamerkan dan dipitch ke pengunjung stand. Pengunjung
mampir 1–3 menit dan tidak punya konteks operasional hotel. Selama pitch, satu orang
berpindah peran di depan pengunjung memakai tombol peran di bar atas ("sekarang kita
lihat dari sisi housekeeping"), jadi tiap layar peran harus terbaca dalam hitungan detik
tanpa perlu dijelaskan tata letaknya lebih dulu.

Pesan utama yang ingin ditinggalkan: **tamu tidak perlu menelepon atau turun ke lobi**.
Layar staf berperan sebagai bukti bahwa permintaan tamu benar-benar sampai.

### Masalah yang diselesaikan

Tiga layar staf punya bentuk kerja yang sama — daftar tugas lalu ubah status — tetapi
ditulis tiga kali dengan tata letak berbeda:

| Peran | Kontrol di layar | Baris kode |
|---|---|---|
| Housekeeping | 2 tab + 3 filter + pencarian | 311 |
| Maintenance | 3 filter + pencarian | 344 |
| Duty Manager | 4 tab + 5 filter departemen + pencarian | 489 |

Akibatnya penyaji harus menjelaskan tata letak tiga kali dalam satu demo, dan pengunjung
yang sudah paham satu layar tidak otomatis paham layar berikutnya.

Maintenance juga menampilkan **Tunda** dan **Selesai** sebagai dua tombol sederajat,
memaksa penyaji berhenti menjelaskan pilihan di tengah alur.

Pencarian ada di ketiga layar padahal data contoh hanya 12 tiket — tidak ada yang akan
mencari di stand, dan kotak pencarian hanya menambah kesan rumit.

## Ruang lingkup

### Dikerjakan

- Komponen `StaffTaskBoard` baru yang dipakai bersama tiga peran staf.
- `HousekeepingDashboard`, `MaintenanceDashboard`, `DutyManagerDashboard` ditulis ulang
  menjadi file tipis yang menyuplai konfigurasi ke papan.
- Satu tombol aksi utama per kartu; aksi lain pindah ke menu "⋯".
- Filter dipangkas menjadi dua per peran.
- Pencarian dihapus dari ketiga layar.
- Tab "Status Kamar" milik Housekeeping menjadi tombol alih di header papan.

### Tidak dikerjakan

- **Sisi tamu tidak disentuh sama sekali**, termasuk layar konfirmasi permintaan.
- **Front Office tidak disentuh** (`FrontOfficeDashboard`, `FrontOfficeDetailDrawer`,
  `FrontOfficeRoomsView`, `FrontOfficeAnalyticsView`, `FrontOfficeEscalationView`,
  `FrontOfficeIntegrationView`).
- `AppContext` tidak diubah. Seluruh 30 fungsi aksi tetap apa adanya, hanya dipanggil
  dari tempat baru.
- `server.ts`, `mockData.ts`, dan berkas kamus `src/i18n/locales/*` tidak diubah.
- Tidak ada sinkronisasi antar perangkat. Aplikasi tetap satu halaman dengan tombol
  ganti peran, sama seperti sebelumnya.

## Arsitektur

### Pembagian tanggung jawab

`StaffTaskBoard` **murni tampilan**. Ia tidak tahu apa itu housekeeping, sparepart, atau
kompensasi. Yang ia tahu: cara menggambar header, dua tombol filter, daftar kartu tugas,
satu tombol utama, dan menu "⋯".

Setiap file peran memegang:

- tiket mana yang menjadi miliknya,
- tombol utama apa untuk status apa,
- isi menu "⋯",
- modal khususnya sendiri (Tunda milik Maintenance, Kompensasi milik Duty Manager) dan
  state yang mengendalikan modal itu.

Papan memanggil `onSelect` sebuah aksi dan berhenti di situ; ia tidak tahu bahwa sebuah
modal terbuka. Karena itu isi modal bisa diubah tanpa menyentuh papan, dan tata letak
papan bisa diubah tanpa menyentuh modal.

### Antarmuka komponen

Berkas: `src/components/common/StaffTaskBoard.tsx`

```ts
export interface TaskAction {
  /** Kunci kamus untuk label tombol. */
  labelKey: TranslationKey;
  icon: LucideIcon;
  /** Dipanggil saat ditekan. Papan tidak peduli apa yang terjadi setelahnya. */
  onSelect: (ticket: Ticket) => void;
  /** "danger" memberi warna merah pada entri di menu "⋯". */
  tone?: "normal" | "danger";
}

export interface BoardFilter {
  id: string;
  labelKey: TranslationKey;
  /** Menentukan tiket mana yang tampil saat filter ini aktif. */
  match: (ticket: Ticket) => boolean;
}

/**
 * Aksen dibatasi pada daftar tetap, bukan string bebas. Tailwind memindai kode
 * sumber sebagai teks, jadi kelas yang dirangkai saat berjalan seperti
 * `bg-${accent}-500` tidak pernah ikut terbangun dan warnanya diam-diam hilang.
 * Papan memetakan nilai ini ke string kelas utuh yang tertulis apa adanya.
 */
export type BoardAccent = "emerald" | "orange" | "purple";

export interface StaffTaskBoardProps {
  /** Emerald untuk Housekeeping, orange untuk Maintenance, purple untuk Duty Manager. */
  accent: BoardAccent;
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  /** Tiket milik peran ini, belum difilter. */
  tickets: Ticket[];
  /** Tepat dua filter. Yang pertama menjadi filter awal. */
  filters: [BoardFilter, BoardFilter];
  /** Nama petugas yang tampil di header. */
  staffName: string;
  onStaffNameChange: (name: string) => void;
  /** Kembalikan null bila tiket tidak punya langkah berikutnya. */
  primaryAction: (ticket: Ticket) => TaskAction | null;
  /** Kembalikan array kosong bila tidak ada aksi lanjutan. */
  moreActions: (ticket: Ticket) => TaskAction[];
  /** Konten tambahan di pojok kanan header, mis. tombol alih Status Kamar. */
  headerExtra?: React.ReactNode;
  /** Dirender di bawah papan. Dipakai peran untuk menaruh modalnya sendiri. */
  children?: React.ReactNode;
}
```

`primaryAction` dan `moreActions` sengaja berupa fungsi, bukan array, karena aksi yang
tersedia bergantung pada status tiap tiket.

### Anatomi kartu tugas

Sama persis di ketiga peran:

```
┌──────────────────────────────────────────────────────────────┐
│ [812]  Minta 2x Handuk Mandi              [Dikerjakan]        │
│        Tamu: Bpk. Hendra • Housekeeping • stf_rina • sisa 8m  │
│                                        [ Selesai ]  [ ⋯ ]     │
└──────────────────────────────────────────────────────────────┘
```

Badge departemen berwarna menggantikan lima tombol filter departemen di Duty Manager —
informasinya tetap ada tanpa memakan sebaris tombol.

## Aturan tombol utama

Status diturunkan sama seperti kode sekarang, agar perilaku tidak berubah diam-diam:

| Kelompok | Status tiket |
|---|---|
| Baru | `BARU`, `DITERIMA`, `DIALIHKAN` |
| Dikerjakan | `DIKERJAKAN` |
| Ditunda | `DITUNDA` |
| Selesai | `SELESAI`, `DIKONFIRMASI`, `DITUTUP` |

### Housekeeping

| Kelompok | Tombol utama | Menu "⋯" |
|---|---|---|
| Baru | **Terima & Mulai** → `acceptTicket` | — |
| Dikerjakan | **Selesai** → `completeTicket` | — |
| Ditunda | **Lanjutkan** → `resumeTicket` | — |
| Selesai | tidak ada, badge saja | — |

### Maintenance

| Kelompok | Tombol utama | Menu "⋯" |
|---|---|---|
| Baru | **Mulai** → `startTicket` | — |
| Dikerjakan | **Selesai** → `completeTicket` | **Tunda** → buka modal Tunda |
| Ditunda | **Lanjutkan** → `resumeTicket` | — |
| Selesai | tidak ada, badge saja | — |

Tiket yang ditunda tampil di filter **Aktif** dengan badge "Ditunda" berwarna dan baris
alasan penundaannya, bukan disembunyikan di filter tersendiri. Cerita "menunggu sparepart
dari vendor" justru salah satu yang paling menarik saat pitch, jadi ia harus terlihat
tanpa pengunjung perlu menekan apa pun.

Memindahkan **Tunda** ke menu "⋯" adalah satu-satunya perubahan perilaku yang terlihat:
menunda kini butuh satu ketukan tambahan. Itu disengaja — menunda adalah pengecualian,
bukan alur normal, dan alur normal tidak boleh memaksa memilih.

### Duty Manager

Duty Manager tidak mengubah status tiket; ia menanggapi.

| Tiket | Tombol utama | Menu "⋯" |
|---|---|---|
| Status `DITUNDA` | **Instruksi Lanjut** → kirim instruksi ke teknisi | — |
| Masuk hitungan eskalasi atau komplain | **Kompensasi** → buka modal Kompensasi | — |
| Selain itu | tidak ada, badge saja | — |

Tiket rutin yang berjalan normal tidak menampilkan tombol apa pun. Menawarkan
"Kompensasi" pada permintaan handuk yang baik-baik saja hanya menambah derau — Duty
Manager hanya perlu bertindak pada yang bermasalah, dan papan harus menunjukkan itu
tanpa perlu dibaca satu per satu.

## Filter

Tepat dua per peran. Filter pertama aktif saat layar dibuka.

| Peran | Filter 1 (awal) | Filter 2 |
|---|---|---|
| Housekeeping | **Aktif** — bukan kelompok Selesai | **Selesai** — kelompok Selesai |
| Maintenance | **Aktif** — bukan kelompok Selesai | **Selesai** — kelompok Selesai |
| Duty Manager | **Perlu Perhatian** — gabungan eskalasi, komplain, dan ditunda | **Semua** — seluruh tiket |

Housekeeping dan Maintenance sengaja memakai pasangan filter yang persis sama. Tiket yang
ditunda ikut masuk **Aktif** karena ia memang masih pekerjaan berjalan, hanya sedang
menunggu sesuatu.

"Perlu Perhatian" menggabungkan tiga tab lama Duty Manager memakai kondisi yang sudah ada
di kode sekarang: SLA terlampaui, prioritas `EMERGENCY`, departemen `Duty Manager`,
`guest_rating === "thumbs_down"`, `isAngryComplaint`, kategori `complaint`, atau status
`DITUNDA`.

Tiket milik tiap peran ditentukan persis seperti kode sekarang:

- Housekeeping: `dept === "Housekeeping"` atau kategori `towel`, `cleaning`, `linen`.
- Maintenance: `dept === "Maintenance"` atau kategori `ac`, `engineering`.
- Duty Manager: seluruh tiket.

## Status Kamar

Tab "Status Kamar" milik Housekeeping menjadi tombol alih kecil di pojok kanan header
papan, dikirim lewat `headerExtra`. Saat aktif, papan diganti kisi status kamar; saat
tidak aktif, papan tampil seperti biasa. Housekeeping tetap punya bentuk yang sama dengan
dua peran lain karena tombol itu tidak menambah baris tab.

## Penanganan kondisi tidak biasa

- **Tidak ada tiket pada filter aktif** — papan menampilkan pesan kosong memakai kunci
  yang sudah ada (`hk.allDone`, `hk.noTasks`, `mt.noTasks`, `mt.allHandled`,
  `dm.noEscalations`, `dm.noComplaints`, `dm.noDeferred`).
- **`primaryAction` mengembalikan `null`** — kartu hanya menampilkan badge status.
- **`moreActions` mengembalikan array kosong** — tombol "⋯" tidak dirender sama sekali,
  bukan dirender lalu dinonaktifkan.
- **Menu "⋯" terbuka** — menutup saat salah satu entri dipilih dan saat papan berpindah
  filter. Hanya satu menu boleh terbuka pada satu waktu.

## Terjemahan

Tidak ada kunci kamus baru. Seluruh kunci yang dibutuhkan sudah ada: `hk.*`, `mt.*`,
`dm.*`, `label.*`, `status.*`, `dept.*`, `sla.*`. Kunci `action.search` menjadi tidak
terpakai setelah pencarian dihapus, dan itu tidak apa-apa — kunci menganggur tidak
merusak apa pun.

Nama fungsi terjemahan di file peran tetap `tr`, bukan `t`, karena variabel tiket di
dalam `.map((t) => ...)` memakai nama `t` dan akan menutupinya.

## Rencana verifikasi

1. `npx tsc --noEmit` bersih.
2. Jalankan dev server, lalu untuk tiap peran staf dan tiap filter:
   - audit setiap elemen bisa diklik — tidak ada yang tertimpa elemen lain, berukuran
     nol, ber-`pointer-events: none`, atau posisinya di luar layar;
   - tidak ada wadah `overflow-x` yang isinya terpotong.
3. Ulangi audit pada lebar 375 px dan 1280 px.
4. Telusuri satu tiket dari `BARU` sampai `SELESAI` di Housekeeping dan di Maintenance,
   memakai klik tetikus sungguhan, dan pastikan status berubah di setiap langkah.
5. Buka modal Tunda dan modal Kompensasi, pastikan keduanya masih berfungsi.
6. Ganti bahasa ke satu bahasa non-Latin dan pastikan tidak ada teks Indonesia tersisa
   di ketiga layar staf.

## Risiko

- **Duty Manager paling banyak berubah** (489 baris, 4 tab jadi 2 filter). Di situ
  kemungkinan salah paling besar. Kerjakan paling akhir, setelah bentuk papan terbukti
  di dua peran yang lebih sederhana.
- **Menunda jadi satu ketukan lebih jauh.** Bila saat dicoba ternyata mengganggu alur
  demo, kembalikan **Tunda** menjadi tombol sederajat khusus di Maintenance.
- **Tidak ada tes otomatis di proyek ini.** Verifikasi bergantung pada audit di peramban,
  jadi langkah verifikasi di atas wajib dijalankan, bukan opsional.
