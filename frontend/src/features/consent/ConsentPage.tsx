// =====================================================================
// ConsentPage.tsx — Informed Consent
//  Daftar persetujuan/penolakan tindakan + form. Keputusan SETUJU/TOLAK.
// =====================================================================

import { useState, useEffect } from "react";
import type { AuthUser } from "../../lib/api";
import type { Consent, ConsentForm, Keputusan } from "./types";
import { getConsent, createConsent, updateConsent } from "./consentApi";
import { getEncounters } from "../encounter/encounterApi";
import type { Encounter } from "../encounter/types";
import { Toolbar, Btn, Badge, sap, th, td, tableStyle, inp, lbl } from "../shell/ui";

const KEP_COLOR: Record<Keputusan, string> = { SETUJU: sap.green, TOLAK: sap.red };
const HUBUNGAN = ["PASIEN", "SUAMI/ISTRI", "ORANG TUA", "ANAK", "WALI", "KELUARGA LAIN"];

const EMPTY: ConsentForm = { encounter_id: "", jenis_tindakan: "", pemberi_info: "", penerima_info: "", hubungan: "PASIEN", keputusan: "SETUJU", catatan: "", petugas: "" };

export default function ConsentPage({ user }: { user: AuthUser }) {
  const canEdit = user.role === "dokter" || user.role === "perawat" || user.role === "admin";

  const [rows, setRows] = useState<Consent[]>([]);
  const [encs, setEncs] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<ConsentForm>(EMPTY);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function muat() {
    setLoading(true);
    try { setRows(await getConsent()); } finally { setLoading(false); }
  }
  useEffect(() => {
    muat();
    getEncounters().then((e) => setEncs(e.filter((x) => x.status === "AKTIF"))).catch(() => {});
  }, []);

  function tambah() { setEditId("new"); setForm({ ...EMPTY, pemberi_info: user.role === "dokter" ? user.nama : "", petugas: user.nama }); setErr(""); }
  function edit(r: Consent) {
    setEditId(r.id);
    setForm({ encounter_id: r.encounter_id, jenis_tindakan: r.jenis_tindakan, pemberi_info: r.pemberi_info ?? "", penerima_info: r.penerima_info ?? "", hubungan: r.hubungan ?? "PASIEN", keputusan: r.keputusan, catatan: r.catatan ?? "", petugas: r.petugas ?? "" });
    setErr("");
  }
  function set<K extends keyof ConsentForm>(k: K, v: ConsentForm[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function simpan() {
    setErr("");
    if (editId === "new" && !form.encounter_id) return setErr("Kunjungan wajib dipilih");
    if (!form.jenis_tindakan.trim()) return setErr("Jenis tindakan wajib diisi");
    setSaving(true);
    try {
      if (editId === "new") await createConsent(form);
      else if (typeof editId === "number") await updateConsent(editId, form);
      setEditId(null);
      muat();
    } catch (e) { setErr((e as Error).message); } finally { setSaving(false); }
  }

  return (
    <div>
      <Toolbar>
        {canEdit && <Btn icon="➕" primary onClick={tambah}>Buat Informed Consent</Btn>}
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>{!loading && `${rows.length} consent`}</span>
      </Toolbar>

      {editId !== null && (
        <div style={{ border: `1px solid ${sap.line}`, borderRadius: 4, padding: 16, marginBottom: 14, background: sap.bgZebra }}>
          <h3 style={{ margin: "0 0 10px", color: sap.blue, fontSize: 16 }}>📄 {editId === "new" ? "Informed Consent Baru" : "Ubah Informed Consent"}</h3>
          {err && <div style={{ color: sap.red, marginBottom: 10, fontSize: 13 }}>{err}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Kunjungan *</label>
              <select style={inp} value={form.encounter_id} onChange={(e) => set("encounter_id", e.target.value ? Number(e.target.value) : "")} disabled={editId !== "new" || !canEdit}>
                <option value="">- pilih kunjungan -</option>
                {encs.map((e) => <option key={e.id} value={e.id}>{e.encounter_no} · {e.patient_nama} ({e.tipe})</option>)}
              </select>
            </div>
            <div><label style={lbl}>Jenis Tindakan *</label><input style={inp} value={form.jenis_tindakan} onChange={(e) => set("jenis_tindakan", e.target.value)} disabled={!canEdit} placeholder="mis. Operasi Apendektomi, Pemasangan Infus" /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={lbl}>Pemberi Informasi (Dokter)</label><input style={inp} value={form.pemberi_info} onChange={(e) => set("pemberi_info", e.target.value)} disabled={!canEdit} /></div>
            <div><label style={lbl}>Penerima Informasi</label><input style={inp} value={form.penerima_info} onChange={(e) => set("penerima_info", e.target.value)} disabled={!canEdit} /></div>
            <div>
              <label style={lbl}>Hubungan</label>
              <select style={inp} value={form.hubungan} onChange={(e) => set("hubungan", e.target.value)} disabled={!canEdit}>
                {HUBUNGAN.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Keputusan</label>
              <select style={inp} value={form.keputusan} onChange={(e) => set("keputusan", e.target.value as Keputusan)} disabled={!canEdit}>
                <option value="SETUJU">SETUJU</option>
                <option value="TOLAK">TOLAK</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}><label style={lbl}>Catatan / Penjelasan</label><textarea style={{ ...inp, minHeight: 56, fontFamily: "inherit" }} value={form.catatan} onChange={(e) => set("catatan", e.target.value)} disabled={!canEdit} placeholder="penjelasan tindakan, risiko, alternatif" /></div>
          <div style={{ display: "flex", gap: 6 }}>
            {canEdit && <Btn icon="💾" primary onClick={simpan} disabled={saving}>{saving ? "..." : "Simpan"}</Btn>}
            <Btn icon="✖️" onClick={() => setEditId(null)}>Batal</Btn>
          </div>
        </div>
      )}

      {loading ? <p>Memuat data...</p> : rows.length === 0 ? (
        <p style={{ color: sap.textSub }}>Belum ada informed consent.</p>
      ) : (
        <table style={tableStyle}>
          <thead><tr><th style={th}>Tgl</th><th style={th}>Pasien</th><th style={th}>Tindakan</th><th style={th}>Penerima</th><th style={th}>Keputusan</th><th style={th}>Aksi</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                <td style={td}>{(r.tgl_consent ?? "").slice(0, 10)}</td>
                <td style={td}>{r.pasien_nama} ({r.mrn})</td>
                <td style={td}>{r.jenis_tindakan}</td>
                <td style={td}>{r.penerima_info ?? "-"}{r.hubungan ? <span style={{ color: sap.textSub, fontSize: 11 }}> · {r.hubungan}</span> : ""}</td>
                <td style={td}><Badge text={r.keputusan} color={KEP_COLOR[r.keputusan]} /></td>
                <td style={td}>{canEdit ? <Btn icon="✏️" onClick={() => edit(r)}>Ubah</Btn> : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
