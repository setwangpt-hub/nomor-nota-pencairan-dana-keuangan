# Nomor Nota Pencairan Dana Keuangan

Aplikasi penomoran Nota Pencairan Dana (NPD) Bagian Program dan Keuangan, Sekretariat DPRD Provinsi Jawa Timur. Pendamping aplikasi [Nomor Nodin Keuangan](https://setwangpt-hub.github.io/nomor-nodin-keuangan/).

## Fitur

- **Buat NPD**: panggil nomor urut nota dinas. Sub kegiatan dan kode rekening diambil dari data nodin, lalu Anda isi nilai, uraian realisasi, dan nama penginput. Nomor NPD otomatis melanjutkan nomor terakhir dengan format `000/KPA/KEU/2026`, dan tanggalnya otomatis hari ini.
- **Arsip NPD 2026**: semua NPD sejak 001 (Januari 2026) dengan filter bulan, sub kegiatan dan pencarian, total nilai, dan tombol salin ke Excel. NPD yang baru disimpan oleh siapa pun otomatis muncul di sini dan di NPD Siap Cetak pada semua browser (sinkron otomatis setiap 15 detik, tanpa muat ulang).
- **NPD Siap Cetak**: pratinjau NPD ukuran A4. Tombol Cetak langsung membuka dialog printer, dan beberapa NPD bisa dicetak sekaligus.

## Sumber data

Aplikasi ini **tidak tersambung ke spreadsheet mana pun** untuk NPD (sheet `NPD 2026` tidak dibaca dan tidak ditulis).

- **Arsip bawaan**: NPD 001–110 dan nodin 001–378 disalin dari spreadsheet per 9 November 2026 dan disimpan di dalam `index.html`. Nomor-nomor ini tidak berubah.
- **Penyimpanan bersama NPD baru (111 dst.)**: proyek Apps Script mandiri **"Nomor NPD Keuangan - Penyimpanan"** di akun setwangpt@gmail.com (kode di `apps-script/Code.gs`). Data disimpan di Script Properties proyek itu, bukan di spreadsheet, sehingga terbaca di semua browser dan perangkat. Penomoran dikunci di server, jadi dua orang yang menyimpan bersamaan tidak mendapat nomor yang sama.
- **Nodin baru (379 dst.)**: hanya *dibaca* dari Web App aplikasi Nomor Nodin agar sub kegiatan dan rekeningnya bisa dipanggil. Aplikasi NPD tidak menulis apa pun ke sana.

Formulir Google untuk NPD sebaiknya ditutup agar nomor tidak dobel, karena isian formulir tidak dibaca aplikasi.

## Memasang ulang penyimpanan (bila perlu)

1. Buka script.google.com → **Proyek baru**, tempel isi `apps-script/Code.gs`, simpan.
2. **Terapkan → Deployment baru → Aplikasi web**, Jalankan sebagai: Saya, Yang memiliki akses: Siapa saja.
3. Salin URL Web App ke konstanta `API_NPD` di `index.html`.

## Struktur

```
index.html              aplikasi (GitHub Pages), berisi arsip bawaan
apps-script/Code.gs     backend penyimpanan NPD mandiri (tanpa spreadsheet)
apps-script/appsscript.json
```
