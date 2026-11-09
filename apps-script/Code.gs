/**
 * Nomor Nodin Keuangan — penghubung aplikasi web dengan spreadsheet "Register Nomor Nota Dinas".
 * Pasang di spreadsheet itu: Ekstensi > Apps Script, tempel berkas ini, lalu
 * Terapkan > Deployment baru > Aplikasi web (Jalankan sebagai: Saya; Akses: Siapa saja).
 *
 * - Nomor baru  : ditambahkan sebagai baris baru di sheet NODIN 2026 (kolom sama seperti Google Form),
 *                 sehingga nomornya keluar dari rumus kolom A dan tidak bentrok dengan Form.
 * - Sisipan, nomor kosong, pembatalan, dan rincian estimasi: disimpan di tab APP NODIN 2026.
 * - NPD baru dari aplikasi Nomor Nota Pencairan Dana Keuangan: disimpan di tab APP NPD 2026
 *   (sheet NPD 2026 tidak dibaca dan tidak ditulis; arsip NPD lama ada di dalam aplikasinya).
 */
var MAIN = 'NODIN 2026';
var APP = 'APP NODIN 2026';
var APP_COLS = ['key', 'seq', 'sub', 'no', 'idx', 'tgl', 'uraian', 'kepada', 'jenis', 'cara', 'status', 'subkeg', 'nilai', 'rek',
  'belanja', 'pelaksana', 'mulai', 'akhir', 'lokasi', 'rincian', 'at', 'by', 'dibatalkan', 'by_batal'];

var NPD_APP = 'APP NPD 2026';
var NPD_COLS = ['num', 'no', 'ts', 'nodin', 'si', 'keg', 'sub', 'rek', 'nilai', 'uraian', 'oleh', 'at'];

function doGet(e) {
  return out_({ ok: true, app: readApp_(), npd: readNpd_() });
}

function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, code: 'bad_request' }); }
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return out_({ ok: false, code: 'busy' });
  try {
    if (req.action === 'baru') return out_(baru_(req.doc, req.expectSeq));
    if (req.action === 'set') return out_(set_(req.doc, !!req.ifFree));
    if (req.action === 'npd') return out_(npd_(req.doc, req.base));
    return out_({ ok: false, code: 'unknown_action' });
  } catch (err) {
    return out_({ ok: false, code: 'server_error', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Nomor baru: tambah baris di NODIN 2026 ---------- */
function baru_(d, expectSeq) {
  var sh = ss_().getSheetByName(MAIN);
  var B = sh.getRange(1, 2, sh.getMaxRows(), 1).getValues();
  var last = 0;
  for (var i = B.length - 1; i >= 0; i--) { if (String(B[i][0]).trim() !== '') { last = i + 1; break; } }
  var prevNo = String(sh.getRange(last, 1).getDisplayValue());
  var m = prevNo.match(/\/(\d{3})\/050\.3\/2026$/);
  var nextSeq = m ? parseInt(m[1], 10) + 1 : null;
  if (expectSeq && nextSeq && nextSeq !== expectSeq) return { ok: false, code: 'conflict', nextSeq: nextSeq };

  var hdr = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
  var row = [];
  for (var c = 0; c < hdr.length; c++) row.push('');
  row[1] = new Date();
  row[2] = d.email || 'aplikasi nodin (' + (d.by || 'web') + ')';
  row[3] = d.idx;
  row[4] = toDate_(d.tgl);
  row[5] = d.uraian;
  row[6] = d.kepada;
  row[7] = d.jenis === 'S' ? 'Nota Dinas dengan SPJ Keuangan' : 'Nota Dinas tanpa SPJ Keuangan';
  if (d.jenis === 'S') {
    row[8] = d.subkegLabel || d.subkeg;
    row[9] = d.nilai || 0;
    var col = -1;
    for (var h = 0; h < hdr.length; h++) {
      if (/^Kode rekening pada sub kegiatan/i.test(hdr[h]) && hdr[h].indexOf(d.subkeg) >= 0) { col = h; break; }
    }
    if (col >= 0) row[col] = d.rekLabel || d.rek;
    var cP = hdr.indexOf('Pelaksana perjalanan dinas :');
    if (d.belanja === 'sppd' && cP >= 0) {
      row[cP] = d.pelaksana; row[cP + 1] = toDate_(d.mulai); row[cP + 2] = toDate_(d.akhir);
      row[cP + 3] = d.ld ? 'Luar daerah' : 'Dalam daerah';
      if (d.ld) row[cP + 5] = d.lokasi; else row[cP + 4] = d.lokasi;
    }
  }
  // Hanya isi kolom B..AQ; kolom A dan kolom rumus di kanan dibiarkan.
  var startCol = 2, endCol = Math.min(hdr.length, 43);
  sh.getRange(last + 1, startCol, 1, endCol - startCol + 1).setValues([row.slice(startCol - 1, endCol)]);
  SpreadsheetApp.flush();
  var no = String(sh.getRange(last + 1, 1).getDisplayValue());
  var mm = no.match(/\/(\d{3})\/050\.3\/2026$/);
  var seq = mm ? parseInt(mm[1], 10) : nextSeq;
  var doc = {};
  for (var k in d) doc[k] = d[k];
  doc.key = String(seq); doc.seq = seq; doc.sub = 0; doc.no = no; doc.cara = 'baru'; doc.status = 'aktif';
  upsertApp_(doc);
  return { ok: true, doc: doc, row: last + 1 };
}

/* ---------- Sisipan / nomor kosong / batal: tab APP NODIN 2026 ---------- */
function set_(d, ifFree) {
  var sh = appSheet_();
  if (ifFree) {
    var cur = findApp_(sh, d.key);
    if (cur && cur.obj.no && cur.obj.status !== 'batal') return { ok: false, code: 'conflict', doc: cur.obj };
  }
  upsertApp_(d);
  return { ok: true, doc: d };
}

function upsertApp_(d) {
  var sh = appSheet_();
  var vals = APP_COLS.map(function (c) {
    var v = d[c];
    if (c === 'rincian') return JSON.stringify(v || []);
    return v == null ? '' : v;
  });
  var cur = findApp_(sh, d.key);
  var r = cur ? cur.row : sh.getLastRow() + 1;
  sh.getRange(r, 1, 1, APP_COLS.length).setNumberFormat('@').setValues([vals.map(String)]);
}

function findApp_(sh, key) {
  var n = sh.getLastRow();
  if (n < 2) return null;
  var V = sh.getRange(2, 1, n - 1, APP_COLS.length).getValues();
  for (var i = 0; i < V.length; i++) if (String(V[i][0]) === String(key)) return { row: i + 2, obj: rowObj_(V[i]) };
  return null;
}

function readApp_() {
  var sh = appSheet_(), n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, APP_COLS.length).getValues().map(rowObj_).filter(function (o) { return o.key; });
}

function rowObj_(r) {
  var o = {};
  APP_COLS.forEach(function (c, i) { o[c] = r[i] === '' ? '' : String(r[i]); });
  o.seq = Number(o.seq) || 0; o.sub = Number(o.sub) || 0; o.nilai = Number(o.nilai) || 0;
  try { o.rincian = JSON.parse(o.rincian || '[]'); } catch (e) { o.rincian = []; }
  return o;
}

function appSheet_() {
  var ss = ss_(), sh = ss.getSheetByName(APP);
  if (!sh) {
    sh = ss.insertSheet(APP);
    sh.getRange(1, 1, 1, APP_COLS.length).setValues([APP_COLS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/* ---------- NPD baru: tab APP NPD 2026 ---------- */
function npd_(d, base) {
  d = d || {};
  var nilai = Number(d.nilai) || 0, si = Number(d.si);
  if (!(nilai > 0) || !String(d.uraian || '').trim() || !(si >= 0 && si < 15) || !String(d.rek || '').trim()) return { ok: false, code: 'bad_request', message: 'Isian NPD tidak lengkap' };
  var sh = npdSheet_(), n = sh.getLastRow(), max = Number(base) || 0;
  if (n >= 2) sh.getRange(2, 1, n - 1, 1).getValues().forEach(function (r) { var v = Number(r[0]); if (v > max) max = v; });
  var num = max + 1;
  var o = {
    num: num, no: ('00' + num).slice(-3) + '/KPA/KEU/2026',
    ts: Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy H:mm:ss'),
    nodin: String(d.nodin || ''), si: si, keg: String(d.keg || ''), sub: String(d.sub || ''), rek: String(d.rek),
    nilai: nilai, uraian: String(d.uraian), oleh: String(d.oleh || ''), at: new Date().toISOString()
  };
  sh.getRange(n + 1, 1, 1, NPD_COLS.length).setNumberFormat('@')
    .setValues([NPD_COLS.map(function (c) { return String(o[c]); })]);
  return { ok: true, doc: o };
}

function readNpd_() {
  var sh = npdSheet_(), n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, NPD_COLS.length).getValues().map(function (r) {
    var o = {};
    NPD_COLS.forEach(function (c, i) { o[c] = String(r[i]); });
    o.num = Number(o.num) || 0; o.si = Number(o.si); o.nilai = Number(o.nilai) || 0;
    return o;
  }).filter(function (o) { return o.num; });
}

function npdSheet_() {
  var ss = ss_(), sh = ss.getSheetByName(NPD_APP);
  if (!sh) {
    sh = ss.insertSheet(NPD_APP);
    sh.getRange(1, 1, 1, NPD_COLS.length).setValues([NPD_COLS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function toDate_(s) {
  var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : (s || '');
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/** Jalankan sekali dari editor untuk membuat tab APP NODIN 2026 & APP NPD 2026 dan memberi izin akses. */
function setup() { appSheet_(); npdSheet_(); }
