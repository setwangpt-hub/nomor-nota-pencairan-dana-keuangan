/**
 * Nomor Nota Pencairan Dana Keuangan — penyimpanan bersama NPD baru.
 *
 * Proyek Apps Script MANDIRI: tidak terikat dan tidak membaca/menulis spreadsheet apa pun.
 * NPD baru disimpan di Script Properties proyek ini (satu properti per NPD), sehingga
 * terbaca di semua browser dan perangkat. Arsip NPD 001–110 ada di dalam index.html.
 *
 * Pasang: script.google.com > Proyek baru > tempel berkas ini >
 * Terapkan > Deployment baru > Aplikasi web (Jalankan sebagai: Saya; Akses: Siapa saja).
 */
var PREFIX = 'npd:';
var COLS = ['num', 'no', 'ts', 'nodin', 'si', 'keg', 'sub', 'rek', 'nilai', 'uraian', 'oleh', 'at'];

function doGet(e) {
  return out_({ ok: true, npd: readAll_() });
}

function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, code: 'bad_request' }); }
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return out_({ ok: false, code: 'busy' });
  try {
    if (req.action === 'npd') return out_(save_(req.doc, req.base));
    return out_({ ok: false, code: 'unknown_action' });
  } catch (err) {
    return out_({ ok: false, code: 'server_error', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function save_(d, base) {
  d = d || {};
  var nilai = Number(d.nilai) || 0, si = Number(d.si);
  if (!(nilai > 0) || !String(d.uraian || '').trim() || !(si >= 0 && si < 15) || !String(d.rek || '').trim()) {
    return { ok: false, code: 'bad_request', message: 'Isian NPD tidak lengkap' };
  }
  var max = Number(base) || 0;
  readAll_().forEach(function (o) { if (o.num > max) max = o.num; });
  var num = max + 1;
  var o = {
    num: num, no: ('00' + num).slice(-3) + '/KPA/KEU/2026',
    ts: Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy H:mm:ss'),
    nodin: String(d.nodin || ''), si: si, keg: String(d.keg || ''), sub: String(d.sub || ''),
    rek: String(d.rek).slice(0, 300), nilai: nilai, uraian: String(d.uraian).slice(0, 3000),
    oleh: String(d.oleh || '').slice(0, 120), at: new Date().toISOString()
  };
  PropertiesService.getScriptProperties().setProperty(PREFIX + ('0000' + num).slice(-4), JSON.stringify(o));
  return { ok: true, doc: o };
}

function readAll_() {
  var all = PropertiesService.getScriptProperties().getProperties(), list = [];
  Object.keys(all).forEach(function (k) {
    if (k.indexOf(PREFIX) !== 0) return;
    try {
      var o = JSON.parse(all[k]);
      o.num = Number(o.num) || 0; o.si = Number(o.si); o.nilai = Number(o.nilai) || 0;
      if (o.num) list.push(o);
    } catch (e) {}
  });
  return list.sort(function (a, b) { return a.num - b.num; });
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
