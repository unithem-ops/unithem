const SHEET_NAME = "KES_KESIHATAN";

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const action = body.action || "";
    if (action === "listCases") return json({ ok: true, records: listCases_() });
    if (action === "createCase") return json({ ok: true, record: createCase_(body.record || {}) });
    if (action === "updateCase") return json({ ok: true, record: updateCase_(body.record || {}) });
    if (action === "deleteCase") return json({ ok: true, id: deleteCase_(body.id) });
    return json({ ok: false, error: "Action tidak sah" });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow([
      "id","tarikh","namaMurid","noKp","tingkatan","kelas","jantina","kamar",
      "simptom","suhu","status","tarikhCutiMula","tarikhCutiTamat","catatan","buktiUrl","updatedAt"
    ]);
  }
  return sh;
}

function headers_(sh) {
  return sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
}

function rowToObject_(headers, row) {
  const out = {};
  headers.forEach((h,i) => out[h] = row[i]);
  return out;
}

function listCases_() {
  const sh = sheet_();
  if (sh.getLastRow() < 2) return [];
  const headers = headers_(sh);
  return sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues()
    .map(r => rowToObject_(headers,r))
    .filter(r => r.id);
}

function createCase_(record) {
  const sh = sheet_();
  const headers = headers_(sh);
  record.id = record.id || Utilities.getUuid();
  record.updatedAt = new Date().toISOString();
  sh.appendRow(headers.map(h => record[h] ?? ""));
  return record;
}

function findRowById_(sh, id) {
  if (sh.getLastRow() < 2) return -1;
  const ids = sh.getRange(2,1,sh.getLastRow()-1,1).getValues().flat();
  const idx = ids.findIndex(v => String(v) === String(id));
  return idx < 0 ? -1 : idx + 2;
}

function updateCase_(record) {
  if (!record.id) throw new Error("ID rekod tiada");
  const sh = sheet_();
  const row = findRowById_(sh, record.id);
  if (row < 0) throw new Error("Rekod tidak ditemui");
  const headers = headers_(sh);
  record.updatedAt = new Date().toISOString();
  sh.getRange(row,1,1,headers.length).setValues([headers.map(h => record[h] ?? "")]);
  return record;
}

function deleteCase_(id) {
  if (!id) throw new Error("ID rekod tiada");
  const sh = sheet_();
  const row = findRowById_(sh, id);
  if (row < 0) throw new Error("Rekod tidak ditemui");
  sh.deleteRow(row);
  return id;
}
