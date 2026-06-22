// =====================================================================
// TransfusiPage.tsx — Unit Transfusi Darah (UTD)
//  Daftar permintaan darah + form (gol darah, komponen, indikasi).
//  Alur: DIMINTA → CROSSMATCH → SIAP → DISERAHKAN (perlu no kantong) / BATAL.
// =====================================================================

import { useState, useEffect } from "react";
import type { AuthUser } from "../../lib/api";
import type { Transfusi, TransfusiForm, TransfusiStatus } from "./types";
import { getTransfusi, createTransfusi, updateTransfusi, setTransfusiStatus } from "./transfusiApi";
import { getEncounters } from "../encounter/encounterApi";
import type { Encounter } from "../encounter/types";
import { Toolbar, Btn, Badge, sap, th, td, tableStyle, inp, lbl } from "../shell/ui";

const STATUS_COLOR: Record<TransfusiStatus, string> = {
  DIMINTA: sap.textSub, CROSSMATCH: sap.orange, SIAP: sap.blue, DISERAHKAN: sap.green, BATAL: sap.red,
};
const NEXT: Record<TransfusiStatus, TransfusiStatus[]> = {
  DIMINTA: ["CROSSMATCH"], CROSSMATCH: ["SIAP"], SIAP: ["DISERAHKAN"], DISERAHKAN: [], BATAL: [],
};
const GOL = ["A", "B", "AB", "O"];
const RHESUS = ["+", "-"];
const KOMPONEN = ["WB", "PRC", "TC", "FFP", "CRYO"];

const EMPTY: TransfusiForm = {
  encounter_id: "", gol_darah: "O", rhesus: "+", komponen: "PRC", jumlah_kantong: "1",
  indikasi: "", no_kantong: "", crossmatch: "", petugas: "",
};

export default function TransfusiPage({ user }: { user: AuthUser }) {
  const canEdit = user.role === "perawat" || user.role === "dokter" || user.role === "admin" || user.role === "lab";

  const [rows, setRows] = useState<Transfusi[]>([]);
  const [encs, setEncs] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<TransfusiForm>(EMPTY);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function muat() {
    setLoading(true);
    try { setRows(await getTransfusi()); } finally { setLoading(false); }
  }
  useEffect(() => {
    muat();
    getEncounters().then((e) => setEncs(e.filter((x) => x.status === "AKTIF"))).catch(() => {});
  }, []);

  function tambah() { setEditId("new"); setForm({ ...EMPTY, petugas: user.nama }); setErr(""); }
  function edit(r: Transfusi) {
    setEditId(r.id);
    setForm({
      encounter_id: r.encounter_id, gol_darah: r.gol_darah, rhesus: r.rhesus, komponen: r.komponen,
      jumlah_kantong: String(r.jumlah_kantong), indikasi: r.indikasi ?? "", no_kantong: r.no_kantong ?? "",
      crossmatch: r.crossmatch ?? "", petugas: r.petugas ?? "",
    });
    setErr("");
  }
  function set<K extends keyof TransfusiForm>(k: K, v: TransfusiForm[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function simpan() {
    setErr("");
    if (editId === "new" && !form.encounter_id) return setErr("Kunjungan wajib dipilih");
    if (!form.indikasi.trim()) return setErr("Indikasi transfusi wajib diisi");
    setSaving(true);
    try {
      if (editId === "new") await createTransfusi(form);
      else if (typeof editId === "number") await updateTransfusi(editId, form);
      setEditId(null);
      muat();
    } catch (e) { setErr((e as Error).message); } finally { setSaving(false); }
  }

  async function ubahStatus(r: Transfusi, status: TransfusiStatus) {
    try { await setTransfusiStatus(r.id, status); muat(); }
    catch (e) { alert((e as Error).message); }
  }

  return (
    <div>
      <Toolbar>
        {canEdit && <Btn icon="➕" primary onClick={tambah}>Permintaan Darah</Btn>}
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>{!loading && `${rows.length} permintaan`}</span>
      </Toolbar>

      {editId !== null && (
        <div style={{ border: `1px solid ${sap.line}`, borderRadius: 4, padding: 16, marginBottom: 14, background: sap.bgZebra }}>
          <h3 style={{ margin: "0 0 10px", color: sap.blue, fontSize: 16 }}>🩸 {editId === "new" ? "Permintaan Darah Baru" : "Ubah Permintaan"}</h3>
          {err && <div style={{ color: sap.red, marginBottom: 10, fontSize: 13 }}>{err}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Kunjungan *</label>
              <select style={inp} value={form.encounter_id} onChange={(e) => set("encounter_id", e.target.value ? Number(e.target.value) : "")} disabled={editId !== "new" || !canEdit}>
                <option value="">- pilih kunjungan -</option>
                {encs.map((e) => <option key={e.id} value={e.id}>{e.encounter_no} · {e.patient_nama} ({e.tipe})</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Gol. Darah</label>
              <select style={inp} value={form.gol_darah} onChange={(e) => set("gol_darah", e.target.value)} disabled={!canEdit}>
                {GOL.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Rhesus</label>
              <select style={inp} value={form.rhesus} onChange={(e) => set("rhesus", e.target.value)} disabled={!canEdit}>
                {RHESUS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Komponen</label>
              <select style={inp} value={form.komponen} onChange={(e) => set("komponen", e.target.value)} disabled={!canEdit}>
                {KOMPONEN.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Jml Kantong</label><input style={inp} type="number" value={form.jumlah_kantong} onChange={(e) => set("jumlah_kantong", e.target.value)} disabled={!canEdit} /></div>
            <div>
              <label style={lbl}>Crossmatch</label>
              <select style={inp} value={form.crossmatch} onChange={(e) => set("crossmatch", e.target.value)} disabled={!canEdit}>
                <option value="">- belum -</option>
                <option value="PENDING">PENDING</option>
                <option value="COMPATIBLE">COMPATIBLE</option>
                <option value="INCOMPATIBLE">INCOMPATIBLE</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}><label style={lbl}>Indikasi *</label><input style={inp} value={form.indikasi} onChange={(e) => set("indikasi", e.target.value)} disabled={!canEdit} placeholder="mis. anemia berat Hb 6.0, perdarahan" /></div>
          <div style={{ marginBottom: 12 }}><label style={lbl}>No. Kantong (saat penyerahan)</label><input style={inp} value={form.no_kantong} onChange={(e) => set("no_kantong", e.target.value)} disabled={!canEdit} placeholder="mis. UTD-2026-00123" /></div>
          <div style={{ display: "flex", gap: 6 }}>
            {canEdit && <Btn icon="💾" primary onClick={simpan} disabled={saving}>{saving ? "..." : "Simpan"}</Btn>}
            <Btn icon="✖️" onClick={() => setEditId(null)}>Batal</Btn>
          </div>
        </div>
      )}

      {loading ? <p>Memuat data...</p> : rows.length === 0 ? (
        <p style={{ color: sap.textSub }}>Belum ada permintaan transfusi.</p>
      ) : (
        <table style={tableStyle}>
          <thead><tr><th style={th}>Kunjungan</th><th style={th}>Pasien</th><th style={th}>Darah</th><th style={th}>Komponen</th><th style={th}>Kantong</th><th style={th}>Status</th><th style={th}>Aksi</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                <td style={td}>{r.encounter_no}</td>
                <td style={td}>{r.pasien_nama} ({r.mrn})</td>
                <td style={td}><b>{r.gol_darah}{r.rhesus}</b></td>
                <td style={td}>{r.komponen}</td>
                <td style={td}>{r.jumlah_kantong}{r.no_kantong ? <span style={{ color: sap.textSub, fontSize: 11 }}> · {r.no_kantong}</span> : ""}</td>
                <td style={td}><Badge text={r.status} color={STATUS_COLOR[r.status]} /></td>
                <td style={{ ...td, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {canEdit && r.status !== "DISERAHKAN" && r.status !== "BATAL" && <Btn icon="✏️" onClick={() => edit(r)}>Ubah</Btn>}
                  {canEdit && NEXT[r.status].map((s) => (
                    <Btn key={s} icon="➡️" primary={s === "DISERAHKAN"} onClick={() => ubahStatus(r, s)}>{s}</Btn>
                  ))}
                  {canEdit && r.status !== "DISERAHKAN" && r.status !== "BATAL" && <Btn icon="🚫" danger onClick={() => ubahStatus(r, "BATAL")}>Batal</Btn>}
                  {!canEdit && <span style={{ fontSize: 12, color: sap.textSub }}>-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
