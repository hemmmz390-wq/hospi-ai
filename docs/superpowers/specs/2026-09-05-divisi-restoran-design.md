# Divisi Restoran & Alur Pemesanan Makanan — Desain

**Tanggal:** 2026-09-05
**Status:** disetujui, siap dikerjakan

## Konteks

Hospi AI adalah prototype untuk dipamerkan. Pesan utama yang ingin ditinggalkan:
tamu tidak perlu menelepon atau turun ke lobi.

### Keadaan sekarang

Pesanan makanan sudah dibuat dengan `dept: "Food & Beverage"` — baik dari kartu
1-ketuk "Air Mineral & F&B" di Beranda maupun dari keranjang di halaman Restoran.
Masalahnya ada tiga:

1. **Tidak ada divisi yang menerima.** `Role` hanya berisi lima peran
   (`tourist`, `front_office`, `housekeeping`, `maintenance`, `duty_manager`);
   tidak ada peran untuk restoran dan tidak ada dashboard-nya. Tiket F&B dibuat
   tetapi tidak punya tujuan.
2. **Akibatnya pesanan terlihat "masuk ke Front Office".** Papan Front Office
   menampilkan seluruh tiket dari semua departemen (`deptFilter` bawaan `"All"`,
   dan daftar yang dirender tidak menyaring departemen), jadi pesanan makanan
   nongol di sana bersama tiket handuk dan AC.
3. **Kartu "Air Mineral & F&B" tidak pernah membuka menu.** Ia langsung membuat
   tiket kaleng "Pesan 2 botol air mineral ekstra untuk kamar" lewat layar
   konfirmasi, sehingga tamu tidak pernah sampai ke Room Order Summary.

Tidak ada pula cara menyatakan "makanan sudah jadi", dan tidak ada pilihan antara
makan di restoran atau diantar ke kamar.

## Ruang lingkup

### Dikerjakan

- Peran keenam **`food_beverage`** dengan dashboard sendiri di bar peran atas.
- Kartu "Air Mineral & F&B" di Beranda membuka tab Restoran, bukan membuat tiket.
- Pilihan tujuan di Room Order Summary: **antar ke kamar** atau **makan di restoran**.
- Nomor meja diberikan sistem seketika saat tamu memilih makan di restoran.
- Status tiket baru **`SIAP`** beserta aksi dapur untuk menandainya.
- Notifikasi ke tamu saat pesanan siap, berbeda bunyinya untuk kamar dan meja.

### Tidak dikerjakan

- Front Office tetap menampilkan seluruh tiket. Itu memang perannya sebagai
  pengawas lintas divisi; yang berubah adalah pesanan makanan kini punya rumah.
- Papan tugas staf bersama (spesifikasi 2026-09-04) tidak disentuh.
- Tidak ada pelacakan "sudah diantar". Alur berhenti di `SIAP` lalu `SELESAI`.
- Tidak ada denah meja atau pengecekan meja terisi di dunia nyata.

## Kenapa status `SIAP`, bukan memakai ulang `SELESAI`

`SELESAI` adalah pemicu tamu diminta memberi penilaian 👍/👎
(`rateAndConfirmTicket`). Bila dapur menekan `SELESAI` untuk arti "makanan siap",
tamu akan diminta menilai layanan sebelum makanannya sampai, dan tiket langsung
terhitung tuntas padahal belum diantar.

Menambah status kini aman karena `isTicketClosed` di `types.ts` sudah menjadi
satu-satunya sumber kebenaran tentang "tiket ini sudah tidak berjalan". `SIAP`
cukup tidak dimasukkan ke `CLOSED_STATUSES`, dan otomatis tetap terhitung aktif
di seluruh layar tanpa menyentuh belasan pemeriksaan status yang tersebar.

## Perubahan tipe

```ts
export type Role =
  | "tourist" | "front_office" | "housekeeping"
  | "maintenance" | "duty_manager" | "food_beverage";

export type TicketStatus =
  | "BARU" | "DITERIMA" | "DIKERJAKAN" | "SIAP" | "SELESAI"
  | "DIKONFIRMASI" | "DITUTUP" | "DITUNDA" | "DIALIHKAN" | "DIBATALKAN";

/** Ke mana pesanan makanan diantar. */
export type DiningDestination = "room" | "table";
```

`ServiceTicket` bertambah dua field opsional, keduanya hanya terisi pada tiket
berkategori `dining`:

```ts
diningDestination?: DiningDestination;
tableNumber?: string;   // hanya bila diningDestination === "table"
```

Keduanya opsional supaya seluruh tiket lama dan data contoh tetap sah.

## Alur tamu

1. Beranda → tekan **"Air Mineral & F&B"** → `setActiveTab("dining")`.
   Kartu ini berhenti membuat tiket kaleng air mineral.
2. Pilih menu apa pun dengan jumlah berapa pun → masuk keranjang.
3. Di **Room Order Summary**, sebelum tombol konfirmasi, ada dua pilihan tujuan:
   - **Antar ke Kamar {nomor}** — pilihan awal
   - **Makan di Restoran** — begitu dipilih, nomor meja langsung muncul
4. Nomor meja diambil dari kumpulan meja 1–20, memilih yang belum dipakai tiket
   dining yang masih aktif. Bila semua terpakai, ambil acak — ini prototype, dan
   berhenti total lebih buruk daripada meja bentrok saat demo.
5. Tombol konfirmasi menyesuaikan: "Konfirmasi Pesanan ke Kamar 812" atau
   "Konfirmasi Pesanan untuk Meja 12".

## Alur restoran

Dashboard menampilkan kartu pesanan berisi:

- nomor pesanan (`#A-2417`)
- **tujuan**: `Kamar 812` atau `Meja 12`, ditonjolkan sebagai badge
- daftar menu beserta jumlah
- catatan dapur bila ada
- bahasa asli tamu

Aksi berurutan mengikuti status:

| Status | Tombol utama |
|---|---|
| `BARU`, `DITERIMA`, `DIALIHKAN` | **Terima Pesanan** → `DITERIMA` lalu `DIKERJAKAN` |
| `DIKERJAKAN` | **Tandai Siap** → `SIAP` |
| `SIAP` | **Selesai** → `SELESAI` |
| `SELESAI`, `DIKONFIRMASI`, `DITUTUP` | tidak ada, badge saja |

Filter: **Aktif** (bukan status tertutup) dan **Selesai**. Tanpa pencarian,
sejalan dengan arah menyederhanakan layar staf.

## Notifikasi ke tamu

Saat dapur menekan **Tandai Siap**, dua hal terjadi:

1. **Notifikasi seketika** lewat `showToast`, berbeda bunyinya:
   - antar ke kamar: "Makanan untuk Kamar 812 sudah siap dan segera diantar."
   - makan di restoran: "Pesanan Anda siap disantap di Meja 12."
2. **Tanda menetap di layar tamu.** Notifikasi hilang setelah 4,5 detik,
   sedangkan saat demo penyaji baru berpindah ke peran tamu beberapa detik
   kemudian. Karena itu status `SIAP` juga tampil sebagai badge menonjol di
   "Status Pesanan" tamu. Tanpa ini, momen paling penting dalam cerita justru
   sudah lenyap ketika layar tamu dibuka.

## Terjemahan

Kunci baru di kamus, seluruhnya delapan bahasa:

- `status.SIAP`
- `role.food_beverage`
- `dining.destination`, `dining.toRoom`, `dining.dineIn`, `dining.tableAssigned`,
  `dining.confirmToTable`
- `fb.title`, `fb.subtitle`, `fb.accept`, `fb.markReady`, `fb.complete`,
  `fb.noOrders`, `fb.allServed`, `fb.destination`, `fb.items`
- `toast.foodReadyRoom`, `toast.foodReadyTable`

## Rencana verifikasi

1. `npx tsc --noEmit` bersih.
2. Alur utuh dengan klik sungguhan: Beranda → kartu F&B membuka tab Restoran →
   tambah dua menu → pilih **Antar ke Kamar** → konfirmasi → tiket muncul di
   dashboard Restoran dengan nomor kamar dan daftar menu yang benar.
3. Ulangi dengan **Makan di Restoran**, pastikan nomor meja muncul di layar tamu
   dan nomor yang sama tampil di tiket dapur.
4. Dapur: Terima → Tandai Siap. Pastikan notifikasi muncul dan berbunyi sesuai
   tujuan, lalu berpindah ke peran tamu dan pastikan badge `SIAP` masih terlihat.
5. Pastikan tiket berstatus `SIAP` **tetap terhitung aktif**: tidak hilang dari
   daftar aktif dan tidak dianggap tertutup oleh `isTicketClosed`.
6. Audit seluruh peran dan tab pada 375 px dan 1280 px: tidak ada tombol yang
   tertutup, berukuran nol, atau berada di luar layar.
7. Ganti bahasa ke satu bahasa non-Latin, pastikan layar restoran ikut berubah.

## Risiko

- **Menambah status menyentuh banyak pemeriksaan.** Sudah diredam oleh
  `isTicketClosed`, tetapi tetap perlu dicek bahwa `SIAP` muncul benar di daftar
  aktif Front Office, Duty Manager, dan Status Pesanan tamu.
- **Peran keenam menambah lebar bar atas.** Bar itu sudah membungkus sejak
  perbaikan sebelumnya, jadi tombol keenam akan turun baris dengan sendirinya,
  bukan terdorong keluar layar. Wajib diverifikasi ulang pada 375 px.
- **Nomor meja bisa bentrok** bila lebih dari 20 pesanan dine-in aktif. Diterima
  apa adanya untuk prototype.
