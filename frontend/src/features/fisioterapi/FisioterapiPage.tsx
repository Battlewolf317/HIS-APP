// =====================================================================
// FisioterapiPage.tsx — Fisioterapi
//  Daftar program terapi + form. Progress sesi (X/Y) + tombol +Sesi.
//  Status: AKTIF/SELESAI/BATAL. Auto SELESAI bila sesi penuh.
// =====================================================================

import { useState, useEffect } from "react";
import type { AuthUser } from "../../lib/api";
import type { Fisioterapi, FisioForm, FisioStatus } from "./types";
import { getFisio, createFisio, updateFisio, setFisioStatus, addSesi } from "./fisioterapiApi";
import { getEncounters } from "../encounter/encounterApi";
import type { Encounter } from "../encounter/types";
import { Toolbar, Btn, Badge, sap, th, td, tableStyle, inp, lbl } from "../shell/ui";

const STATUS_COLOR: Record<FisioStatus, string> = { AKTIF: sap.green, SELESAI: sap.textSub, BATAL: sap.red };
const JENIS = ["Terapi Latihan (Exercise)", "Elektroterapi (TENS)", "Terapi Panas (IR)", "Ultrasound Terapi", "Terapi Manual", "Hidroterapi", "Terapi Wicara"];

const EMPTY: FisioForm = { encounter_id: "", jenis_terapi: "", diagnosa: "", modalitas: "", jumlah_sesi: "6", terapis: "", catatan: "" };

export default function FisioterapiPage({ user }: { user: AuthUser }) {
  const canEdit = user.role === "perawat" || user.role === "dokter" || user.role === "admin";

  const [rows, setRows] = useState<Fisioterapi[]>([]);
  const [encs, setEncs] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<FisioForm>(EMPTY);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function muat() {
    setLoading(true);
    try { setRows(await getFisio()); } finally { setLoading(false); }
  }
  useEffect(() => {
    muat();
    getEncounters().then((e) => setEncs(e.filter((x) => x.status === "AKTIF"))).catch(() => {});
  }, []);

  function tambah() { setEditId("new"); setForm({ ...EMPTY, terapis: user.nama }); setErr(""); }
  function edit(r: Fisioterapi) {
    setEditId(r.id);
    setForm({ encounter_id: r.encounter_id, jenis_terapi: r.jenis_terapi, diagnosa: r.diagnosa ?? "", modalitas: r.modalitas ?? "", jumlah_sesi: String(r.jumlah_sesi), terapis: r.terapis ?? "", catatan: r.catatan ?? "" });
    setErr("");
  }
  function set<K extends keyof FisioForm>(k: K, v: FisioForm[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function simpan() {
    setErr("");
    if (editId === "new" && !form.encounter_id) return setErr("Kunjungan wajib dipilih");
    if (!form.jenis_terapi) return setErr("Jenis terapi wajib dipilih");
    setSaving(true);
    try {
      if (editId === "new") await createFisio(form);
      else if (typeof editId === "number") await updateFisio(editId, form);
      setEditId(null);
      muat();
    } catch (e) { setErr((e as Error).message); } finally { setSaving(false); }
  }

  async function ubahStatus(r: Fisioterapi, status: FisioStatus) { await setFisioStatus(r.id, status); muat(); }
  async function tambahSesi(r: Fisioterapi) { await addSesi(r.id); muat(); }

  return (
    <div>
      <Toolbar>
        {canEdit && <Btn icon="➕" primary onClick={tambah}>Program Terapi Baru</Btn>}
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>{!loading && `${rows.length} program`}</span>
      </Toolbar>

      {editId !== null && (
        <div style={{ border: `1px solid ${sap.line}`, borderRadius: 4, padding: 16, marginBottom: 14, background: sap.bgZebra }}>
          <h3 style={{ margin: "0 0 10px", color: sap.blue, fontSize: 16 }}>🧑‍⚕️ {editId === "new" ? "Program Fisioterapi Baru" : "Ubah Program"}</h3>
          {err && <div style={{ color: sap.red, marginBottom: 10, fontSize: 13 }}>{err}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Kunjungan *</label>
              <select style={inp} value={form.encounter_id} onChange={(e) => set("encounter_id", e.target.value ? Number(e.target.value) : "")} disabled={editId !== "new" || !canEdit}>
                <option value="">- pilih kunjungan -</option>
                {encs.map((e) => <option key={e.id} value={e.id}>{e.encounter_no} · {e.patient_nama} ({e.tipe})</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Jenis Terapi *</label>
              <select style={inp} value={form.jenis_terapi} onChange={(e) => set("jenis_terapi", e.target.value)} disabled={!canEdit}>
                <option value="">- pilih -</option>
                {JENIS.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Jumlah Sesi</label>
              <input style={inp} type="number" value={form.jumlah_sesi} onChange={(e) => set("jumlah_sesi", e.target.value)} disabled={!canEdit} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={lbl}>Diagnosa</label><input style={inp} value={form.diagnosa} onChange={(e) => set("diagnosa", e.target.value)} disabled={!canEdit} /></div>
            <div><label style={lbl}>Terapis</label><input style={inp} value={form.terapis} onChange={(e) => set("terapis", e.target.value)} disabled={!canEdit} /></div>
          </div>
          <div style={{ marginBottom: 10 }}><label style={lbl}>Modalitas / Teknik</label><input style={inp} value={form.modalitas} onChange={(e) => set("modalitas", e.target.value)} disabled={!canEdit} placeholder="mis. TENS 15 menit, IR 10 menit" /></div>
          <div style={{ marginBottom: 12 }}><label style={lbl}>Catatan</label><input style={inp} value={form.catatan} onChange={(e) => set("catatan", e.target.value)} disabled={!canEdit} /></div>
          <div style={{ display: "flex", gap: 6 }}>
            {canEdit && <Btn icon="💾" primary onClick={simpan} disabled={saving}>{saving ? "..." : "Simpan"}</Btn>}
            <Btn icon="✖️" onClick={() => setEditId(null)}>Batal</Btn>
          </div>
        </div>
      )}

      {loading ? <p>Memuat data...</p> : rows.length === 0 ? (
        <p style={{ color: sap.textSub }}>Belum ada program fisioterapi.</p>
      ) : (
        <table style={tableStyle}>
          <thead><tr><th style={th}>Kunjungan</th><th style={th}>Pasien</th><th style={th}>Jenis Terapi</th><th style={th}>Progress Sesi</th><th style={th}>Status</th><th style={th}>Aksi</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                <td style={td}>{r.encounter_no}</td>
                <td style={td}>{r.pasien_nama} ({r.mrn})</td>
                <td style={td}>{r.jenis_terapi}</td>
                <td style={td}>
                  {r.sesi_selesai}/{r.jumlah_sesi}
                  <div style={{ height: 4, marginTop: 3, background: sap.line, borderRadius: 2 }}>
                    <div style={{ height: 4, width: `${Math.min(100, (r.sesi_selesai / r.jumlah_sesi) * 100)}%`, background: sap.green, borderRadius: 2 }} />
                  </div>
                </td>
                <td style={td}><Badge text={r.status} color={STATUS_COLOR[r.status]} /></td>
                <td style={{ ...td, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {canEdit && r.status === "AKTIF" && (
                    <>
                      <Btn icon="➕" primary onClick={() => tambahSesi(r)}>+Sesi</Btn>
                      <Btn icon="✏️" onClick={() => edit(r)}>Ubah</Btn>
                      <Btn icon="🚫" danger onClick={() => ubahStatus(r, "BATAL")}>Batal</Btn>
                    </>
                  )}
                  {r.status !== "AKTIF" && <span style={{ fontSize: 12, color: sap.textSub }}>-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
