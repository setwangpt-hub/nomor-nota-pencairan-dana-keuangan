# Nomor Nota Pencairan Dana Keuangan

Aplikasi penomoran Nota Pencairan Dana (NPD) Bagian Program dan Keuangan, Sekretariat DPRD Provinsi Jawa Timur. Pendamping aplikasi [Nomor Nodin Keuangan](https://setwangpt-hub.github.io/nomor-nodin-keuangan/).

## Fitur

- **Buat NPD**: panggil nomor urut nota dinas. Sub kegiatan dan kode rekening diambil dari sheet NODIN 2026, lalu Anda isi nilai dan uraian realisasi. Nomor NPD otomatis melanjutkan nomor terakhir di sheet NPD 2026 dengan format `000/KPA/KEU/2026`, dan tanggalnya otomatis hari ini.
- **Arsip NPD 2026**: semua NPD sejak 001 (Januari 2026) dengan filter bulan, sub kegiatan dan pencarian, total nilai, dan tombol salin ke Excel.
- **NPD Siap Cetak**: pratinjau NPD ukuran A4. Tombol Cetak langsung membuka dialog printer, dan beberapa NPD bisa dicetak sekaligus.

## Sumber data

Spreadsheet **Register Nomor Nota Dinas** (sheet `NPD 2026` dan `NODIN 2026`), dibaca dan ditulis lewat Google Apps Script Web App di folder `apps-script/`.

## Memasang Apps Script (sekali saja)

1. Buka spreadsheet Register Nomor Nota Dinas, lalu pilih **Ekstensi → Apps Script**.
2. Buat file skrip baru, salin isi `apps-script/Code.gs`, lalu simpan.
3. Di **Setelan proyek**, set zona waktu ke `Asia/Jakarta`.
4. Pilih **Terapkan → Deployment baru → Aplikasi web**.
   - Jalankan sebagai: **Saya**
   - Yang memiliki akses: **Siapa saja**
5. Izinkan akses, lalu salin **URL aplikasi web** (berakhiran `/exec`).
6. Buka halaman aplikasi ini, tempel URL tadi di panel **Sambungan Google Sheets**, lalu tekan **Simpan**.

Catatan: siapa pun yang mengetahui URL Web App bisa membaca sheet NPD 2026 dan NODIN 2026 serta menambah baris NPD. Bagikan URL itu hanya kepada pengguna internal. Skrip hanya mengizinkan penulisan ke kolom B:W sheet NPD 2026, pada baris yang masih kosong.

## Struktur

```
index.html              aplikasi (GitHub Pages)
apps-script/Code.gs     backend Web App
apps-script/appsscript.json
```
