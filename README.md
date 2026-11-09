# Nomor Nota Pencairan Dana Keuangan

Aplikasi penomoran Nota Pencairan Dana (NPD) Bagian Program dan Keuangan, Sekretariat DPRD Provinsi Jawa Timur. Pendamping aplikasi [Nomor Nodin Keuangan](https://setwangpt-hub.github.io/nomor-nodin-keuangan/).

## Fitur

- **Buat NPD**: panggil nomor urut nota dinas. Sub kegiatan dan kode rekening diambil dari data nodin, lalu Anda isi nilai, uraian realisasi, dan nama penginput. Nomor NPD otomatis melanjutkan nomor terakhir dengan format `000/KPA/KEU/2026`, dan tanggalnya otomatis hari ini.
- **Arsip NPD 2026**: semua NPD sejak 001 (Januari 2026) dengan filter bulan, sub kegiatan dan pencarian, total nilai, dan tombol salin ke Excel. NPD yang baru disimpan langsung tercatat di sini dan terbaca di semua browser.
- **NPD Siap Cetak**: pratinjau NPD ukuran A4. Tombol Cetak langsung membuka dialog printer, dan beberapa NPD bisa dicetak sekaligus.

## Sumber data

Aplikasi ini tidak lagi tersambung ke sheet `NPD 2026` maupun `NODIN 2026`.

- **Arsip bawaan**: NPD 001–110 dan nodin 001–378 disalin dari spreadsheet per 9 November 2026 dan disimpan di dalam `index.html`.
- **Penyimpanan bersama**: NPD baru disimpan di tab `APP NPD 2026` lewat Apps Script yang sama dengan aplikasi Nomor Nodin, sehingga terbaca di semua browser dan perangkat. Nodin baru dibaca dari tab `APP NODIN 2026` milik aplikasi Nomor Nodin.

Formulir Google untuk NPD sebaiknya ditutup agar nomor tidak dobel, karena isian formulir tidak lagi dibaca aplikasi.

## Memperbarui Apps Script (sekali saja)

Kode di `apps-script/Code.gs` adalah versi gabungan untuk aplikasi Nomor Nodin dan NPD (sama dengan `apps-script/Code.gs` di repositori nomor-nodin-keuangan).

1. Buka spreadsheet Register Nomor Nota Dinas, pilih **Ekstensi → Apps Script**.
2. Ganti seluruh isi `Code.gs` dengan isi `apps-script/Code.gs`, lalu simpan.
3. Pilih **Terapkan → Kelola deployment**, klik ikon pensil pada deployment yang ada, pilih **Versi: Versi baru**, lalu **Terapkan**. URL Web App tetap sama, jadi aplikasi Nomor Nodin tidak perlu diubah.

Sebelum langkah ini dilakukan, arsip dan cetak tetap jalan, tetapi tombol simpan NPD menampilkan pesan bahwa Apps Script belum diperbarui.

## Struktur

```
index.html              aplikasi (GitHub Pages), berisi arsip bawaan
apps-script/Code.gs     backend Web App gabungan Nomor Nodin + NPD
apps-script/appsscript.json
```
