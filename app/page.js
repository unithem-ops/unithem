"use client";

import { useEffect, useMemo, useState } from "react";
import "./globals.css";

const API = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "";
const SIMPTOM_OPTIONS = [
  "Demam",
  "Batuk / Selesema",
  "Sakit Kepala",
  "Sakit Perut",
  "Muntah / Cirit-birit",
  "Kecederaan",
  "Penyakit Kulit",
  "Lain-lain"
];

const emptyForm = {
  id: "",
  tarikh: "",
  namaMurid: "",
  noKp: "",
  tingkatan: "1",
  kelas: "Tuah",
  jantina: "Lelaki",
  kamar: "",
  simptom: "Demam",
  simptomLain: "",
  suhu: "",
  status: "Dalam Pemantauan",
  tarikhCutiMula: "",
  tarikhCutiTamat: "",
  catatan: "",
  buktiUrl: ""
};

async function api(action, payload = {}) {
  if (!API) throw new Error("NEXT_PUBLIC_APPS_SCRIPT_URL belum ditetapkan.");
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload })
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Ralat pangkalan data");
  return data;
}

export default function Home() {
  const [records, setRecords] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(API ? "Sedia disegerakkan" : "Belum disegerakkan");

  const stats = useMemo(() => ({
    today: records.filter(r => r.tarikh === new Date().toISOString().slice(0,10)).length,
    clinic: records.filter(r => /klinik|hospital/i.test(r.status || "")).length,
    followup: records.filter(r => /susulan|pemantauan/i.test(r.status || "")).length,
    active: records.filter(r => !/selesai|pulang/i.test(r.status || "")).length
  }), [records]);

  async function load() {
    if (!API) return;
    try {
      setLoading(true);
      const data = await api("listCases");
      setRecords(data.records || []);
      setMessage("Google Sheets disegerakkan");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setForm({ ...emptyForm, tarikh: new Date().toISOString().slice(0,10) });
    setModal(true);
  }

  function openEdit(r) {
    const known = SIMPTOM_OPTIONS.includes(r.simptom);
    setForm({
      ...emptyForm,
      ...r,
      simptom: known ? r.simptom : "Lain-lain",
      simptomLain: known ? "" : (r.simptom || "")
    });
    setModal(true);
  }

  async function save(e) {
    e.preventDefault();
    try {
      setLoading(true);
      const recordToSave = {
        ...form,
        simptom: form.simptom === "Lain-lain" ? form.simptomLain.trim() : form.simptom
      };
      delete recordToSave.simptomLain;
      if (!recordToSave.simptom) throw new Error("Sila nyatakan simptom utama.");
      if (recordToSave.id) {
        await api("updateCase", { record: recordToSave });
      } else {
        await api("createCase", { record: recordToSave });
      }
      setModal(false);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(r) {
    if (!confirm(`Padam rekod ${r.namaMurid || ""}? Tindakan ini akan memadam rekod dalam Google Sheet.`)) return;
    try {
      setLoading(true);
      await api("deleteCase", { id: r.id });
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shell">
      <aside>
        <div className="brand">e-Kesihatan<small>& Wabak SAGA</small></div>
        <nav>
          <button>Ringkasan</button>
          <button className="active">Rekod Kes</button>
          <button>Lawatan Klinik</button>
          <button>Pengurusan Wabak</button>
          <button>Susulan</button>
          <button>Murid Kerap Sakit</button>
          <button>Laporan</button>
        </nav>
      </aside>
      <main>
        <div className="top">
          <div>
            <h1>Rekod Kes Kesihatan</h1>
            <div className="status">{message}{loading ? " · Memproses..." : ""}</div>
          </div>
          <button className="primary" onClick={openNew}>+ Rekod Kes Baharu</button>
        </div>

        <div className="cards">
          <div className="card"><div>Kes Hari Ini</div><h2>{stats.today}</h2></div>
          <div className="card"><div>Ke Klinik/Hospital</div><h2>{stats.clinic}</h2></div>
          <div className="card"><div>Susulan</div><h2>{stats.followup}</h2></div>
          <div className="card"><div>Belum Selesai</div><h2>{stats.active}</h2></div>
        </div>

        <section className="panel">
          <h2>Senarai Rekod</h2>
          <div style={{overflowX:"auto"}}>
            <table>
              <thead>
                <tr>
                  <th>Tarikh</th><th>Nama Murid</th><th>Ting/Kelas</th><th>Simptom</th><th>Status</th><th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan="6">Belum ada rekod.</td></tr>
                ) : records.map(r => (
                  <tr key={r.id}>
                    <td>{r.tarikh}</td>
                    <td><b>{r.namaMurid}</b><br/><small>{r.noKp}</small></td>
                    <td>{r.tingkatan} / {r.kelas}</td>
                    <td>{r.simptom}</td>
                    <td>{r.status}</td>
                    <td>
                      <div className="actions">
                        <button className="btn edit" onClick={() => openEdit(r)}>Sunting</button>
                        <button className="btn delete" onClick={() => remove(r)}>Padam</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {modal && (
        <div className="modalWrap">
          <form className="modal" onSubmit={save}>
            <h2>{form.id ? "Sunting Rekod" : "Rekod Kes Baharu"}</h2>
            <div className="grid">
              <label>Tarikh<input type="date" required value={form.tarikh} onChange={e=>setForm({...form,tarikh:e.target.value})}/></label>
              <label>Nama Murid<input required value={form.namaMurid} onChange={e=>setForm({...form,namaMurid:e.target.value})}/></label>
              <label>No. KP / No. Daftar<input value={form.noKp} onChange={e=>setForm({...form,noKp:e.target.value})}/></label>
              <label>Tingkatan<select value={form.tingkatan} onChange={e=>setForm({...form,tingkatan:e.target.value})}>{[1,2,3,4,5].map(x=><option key={x}>{x}</option>)}</select></label>
              <label>Kelas<select value={form.kelas} onChange={e=>setForm({...form,kelas:e.target.value})}>{["Tuah","Jebat","Kasturi","Lekir","Lekiu"].map(x=><option key={x}>{x}</option>)}</select></label>
              <label>Jantina<select value={form.jantina} onChange={e=>setForm({...form,jantina:e.target.value})}><option>Lelaki</option><option>Perempuan</option></select></label>
              <label>Kamar<input value={form.kamar} onChange={e=>setForm({...form,kamar:e.target.value})}/></label>
              <label>Simptom Utama<select required value={form.simptom} onChange={e=>setForm({...form,simptom:e.target.value,simptomLain:e.target.value === "Lain-lain" ? form.simptomLain : ""})}>{SIMPTOM_OPTIONS.map(x=><option key={x}>{x}</option>)}</select></label>
              {form.simptom === "Lain-lain" && <label className="full">Nyatakan Simptom<input required placeholder="Taip simptom yang tidak tersenarai" value={form.simptomLain} onChange={e=>setForm({...form,simptomLain:e.target.value})}/></label>}
              <label>Suhu Badan<input value={form.suhu} onChange={e=>setForm({...form,suhu:e.target.value})}/></label>
              <label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                <option>Dalam Pemantauan</option><option>Dibawa ke Klinik</option><option>Dibawa ke Hospital</option><option>Kuarantin</option><option>Cuti Sakit</option><option>Susulan</option><option>Selesai</option>
              </select></label>
              <label>Tarikh Cuti Bermula<input type="date" value={form.tarikhCutiMula} onChange={e=>setForm({...form,tarikhCutiMula:e.target.value})}/></label>
              <label>Tarikh Cuti Berakhir<input type="date" value={form.tarikhCutiTamat} onChange={e=>setForm({...form,tarikhCutiTamat:e.target.value})}/></label>
              <label className="full">Bukti Dokumen / URL<input placeholder="Sijil cuti sakit / dokumen klinik" value={form.buktiUrl} onChange={e=>setForm({...form,buktiUrl:e.target.value})}/></label>
              <label className="full">Catatan<textarea rows="3" value={form.catatan} onChange={e=>setForm({...form,catatan:e.target.value})}/></label>
            </div>
            <div className="modalActions">
              <button type="button" className="btn" onClick={()=>setModal(false)}>Batal</button>
              <button className="primary" disabled={loading}>{form.id ? "Simpan Perubahan" : "Simpan Rekod"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
