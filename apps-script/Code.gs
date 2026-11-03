/**
 * Backend Nomor Nota Pencairan Dana Keuangan
 * Spreadsheet: Register Nomor Nota Dinas
 * Deploy: Deploy > New deployment > Web app
 *   Execute as: Me    Who has access: Anyone
 */
const SID = '1dLejaq2KWhWoWaoxD8OBxaYycYMOMTDe02YbomQN41U';
const ALLOWED_READ = ['NPD 2026', 'NODIN 2026'];
const ALLOWED_WRITE = ['NPD 2026'];

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// "'NPD 2026'!A1:X" -> {sheet, c1, r1, c2, r2}
function parseRange_(a1) {
  const m = String(a1 || '').match(/^'?(.+?)'?!([A-Z]+)(\d+):([A-Z]+)(\d*)$/);
  if (!m) throw new Error('Range tidak dikenali: ' + a1);
  return { sheet: m[1], c1: m[2], r1: +m[3], c2: m[4], r2: m[5] ? +m[5] : null };
}
function col_(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function doGet(e) {
  try {
    const p = e.parameter || {};
    if (p.action !== 'values') return json_({ ok: true, app: 'Nomor Nota Pencairan Dana Keuangan' });
    const r = parseRange_(p.range);
    if (ALLOWED_READ.indexOf(r.sheet) < 0) throw new Error('Sheet tidak diizinkan: ' + r.sheet);
    const sh = SpreadsheetApp.openById(SID).getSheetByName(r.sheet);
    const last = r.r2 || sh.getLastRow();
    if (last < r.r1) return json_({ range: p.range, values: [] });
    const c1 = col_(r.c1), c2 = col_(r.c2);
    const values = sh.getRange(r.r1, c1, last - r.r1 + 1, c2 - c1 + 1).getDisplayValues();
    while (values.length && values[values.length - 1].every(v => v === '')) values.pop();
    return json_({ range: p.range, values: values });
  } catch (err) {
    return json_({ error: String(err.message || err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const b = JSON.parse(e.postData.contents);
    if (b.action !== 'update') throw new Error('Aksi tidak dikenali');
    const r = parseRange_(b.range);
    if (ALLOWED_WRITE.indexOf(r.sheet) < 0) throw new Error('Sheet tidak diizinkan: ' + r.sheet);
    if (r.c1 !== 'B' || r.c2 !== 'W') throw new Error('Hanya kolom B:W yang boleh ditulis');
    const sh = SpreadsheetApp.openById(SID).getSheetByName(r.sheet);
    if (sh.getRange(r.r1, 2).getDisplayValue() !== '') throw new Error('Baris ' + r.r1 + ' sudah terisi. Muat ulang halaman lalu coba lagi.');
    const row = b.values[0].slice();
    // Kolom B: tanggal-waktu dari serial Sheets -> Date
    if (typeof row[0] === 'number') row[0] = new Date(Math.round((row[0] - 25569) * 864e5) + new Date().getTimezoneOffset() * 6e4);
    sh.getRange(r.r1, 2, 1, row.length).setValues([row]);
    SpreadsheetApp.flush();
    return json_({ updatedRange: b.range, nomor: sh.getRange(r.r1, 1).getDisplayValue() });
  } catch (err) {
    return json_({ error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}
