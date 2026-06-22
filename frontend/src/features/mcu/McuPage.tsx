// =====================================================================
// McuPage.tsx — Medical Check Up (MCU)
//  Daftar MCU + form (paket, perusahaan, hasil, kesimpulan, rekomendasi).
//  Alur status: TERDAFTAR → PROSES → SELESAI (perlu kesimpulan).
// =====================================================================

import { useState, useEffect } from "react";
import type { AuthUser } from "../../lib/api";
import type { Mcu, McuForm, McuStatus, McuKesimpulan } from "./types";
import { getMcu, createMcu, updateMcu, setMcuStatus } from "./mcuApi";
import { getEncounters } from "../encounter/encounterApi";
import type { Encounter } from "../encounter/types";
import { Toolbar, Btn, Badge, sap, th, td, tableStyle, inp, lbl } from "../shell/ui";

const STATUS_COLOR: Record<McuStatus, string> = { TERDAFTAR: sap.textSub, PROSES: sap.orange, SELESAI: sap.green };
const NEXT: Record<McuStatus, McuStatus[]> = { TERDAFTAR: ["PROSES"], PROSES: ["SELESAI"], SELESAI: [] };
const PAKET = ["BASIC", "STANDARD", "EXECUTIVE"];
const KESIMPULAN: McuKesimpulan[] = ["LAYAK", "LAYAK_CATATAN", "TIDAK_LAYAK"];
const KES_COLOR: Record<McuKesimpulan, string> = { LAYAK: sap.green, LAYAK_CATATAN: sap.orange, TIDAK_LAYAK: sap.red };

const EMPTY: McuForm = { encounter_id: "", paket: "BASIC", perusahaan: "", hasil_ringkas: "", kesimpulan: "", rekomendasi: "", dokter_pemeriksa: "", petugas: "" };

export default function McuPage({ user }: { user: AuthUser }) {
  const canEdit = user.role === "perawat" || user.role === "dokter" || user.role === "admin";

  const [rows, setRows] = useState<Mcu[]>([]);
  const [encs, setEncs] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<McuForm>(EMPTY);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function muat() {
    setLoading(true);
    try { setRows(await getMcu()); } finally { setLoading(false); }
  }
  useEffect(() => {
    muat();
    getEncounters().then((e) => setEncs(e.filter((x) => x.status === "AKTIF"))).catch(() => {});
  }, []);

  function tambah() { setEditId("new"); setForm({ ...EMPTY, petugas: user.nama, dokter_pemeriksa: user.role === "dokter" ? user.nama : "" }); setErr(""); }
  function edit(r: Mcu) {
    setEditId(r.id);
    setForm({ encounter_id: r.encounter_id, paket: r.paket, perusahaan: r.perusahaan ?? "", hasil_ringkas: r.hasil_ringkas ?? "", kesimpulan: r.kesimpulan ?? "", rekomendasi: r.rekomendasi ?? "", dokter_pemeriksa: r.dokter_pemeriksa ?? "", petugas: r.petugas ?? "" });
    setErr("");
  }
  function set<K extends keyof McuForm>(k: K, v: McuForm[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function simpan() {
    setErr("");
    if (editId === "new" && !form.encounter_id) return setErr("Kunjungan wajib dipilih");
    setSaving(true);
    try {
      if (editId === "new") await createMcu(form);
      else if (typeof editId === "number") await updateMcu(editId, form);
      setEditId(null);
      muat();
    } catch (e) { setErr((e as Error).message); } finally { setSaving(false); }
  }

  async function ubahStatus(r: Mcu, status: McuStatus) {
    try { await setMcuStatus(r.id, status); muat(); }
    catch (e) { alert((e as Error).message); }
  }

  return (
    <div>
      <Toolbar>
        {canEdit && <Btn icon="➕" primary onClick={tambah}>Daftar MCU</Btn>}
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>{!loading && `${rows.length} MCU`}</span>
      </Toolbar>

      {editId !== null && (
        <div style={{ border: `1px solid ${sap.line}`, borderRadius: 4, padding: 16, marginBottom: 14, background: sap.bgZebra }}>
          <h3 style={{ margin: "0 0 10px", color: sap.blue, fontSize: 16 }}>🩺 {editId === "new" ? "Pendaftaran MCU" : "Ubah / Input Hasil MCU"}</h3>
          {err && <div style={{ color: sap.red, marginBottom: 10, fontSize: 13 }}>{err}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Kunjungan *</label>
              <select style={inp} value={form.encounter_id} onChange={(e) => set("encounter_id", e.target.value ? Number(e.target.value) : "")} disabled={editId !== "new" || !canEdit}>
                <option value="">- pilih kunjungan -</option>
                {encs.map((e) => <option key={e.id} value={e.id}>{e.encounter_no} · {e.patient_nama} ({e.tipe})</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Paket</label>
              <select style={inp} value={form.paket} onChange={(e) => set("paket", e.target.value)} disabled={!canEdit}>
                {PAKET.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Perusahaan / Instansi</label><input style={inp} value={form.perusahaan} onChange={(e) => set("perusahaan", e.target.value)} disabled={!canEdit} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Kesimpulan</label>
              <select style={inp} value={form.kesimpulan} onChange={(e) => set("kesimpulan", e.target.value as McuKesimpulan)} disabled={!canEdit}>
                <option value="">- pilih -</option>
                {KESIMPULAN.map((k) => <option key={k} value={k}>{k.replace("_", " ")}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Dokter Pemeriksa</label><input style={inp} value={form.dokter_pemeriksa} onChange={(e) => set("dokter_pemeriksa", e.target.value)} disabled={!canEdit} /></div>
          </div>
          <div style={{ marginBottom: 10 }}><label style={lbl}>Hasil Ringkas</label><textarea style={{ ...inp, minHeight: 60, fontFamily: "inherit" }} value={form.hasil_ringkas} onChange={(e) => set("hasil_ringkas", e.target.value)} disabled={!canEdit} placeholder="ringkasan hasil pemeriksaan (lab, fisik, radiologi)" /></div>
          <div style={{ marginBottom: 12 }}><label style={lbl}>Rekomendasi</label><textarea style={{ ...inp, minHeight: 50, fontFamily: "inherit" }} value={form.rekomendasi} onChange={(e) => set("rekomendasi", e.target.value)} disabled={!canEdit} /></div>
          <div style={{ display: "flex", gap: 6 }}>
            {canEdit && <Btn icon="💾" primary onClick={simpan} disabled={saving}>{saving ? "..." : "Simpan"}</Btn>}
            <Btn icon="✖️" onClick={() => setEditId(null)}>Batal</Btn>
          </div>
        </div>
      )}

      {loading ? <p>Memuat data...</p> : rows.length === 0 ? (
        <p style={{ color: sap.textSub }}>Belum ada MCU.</p>
      ) : (
        <table style={tableStyle}>
          <thead><tr><th style={th}>Kunjungan</th><th style={th}>Pasien</th><th style={th}>Paket</th><th style={th}>Perusahaan</th><th style={th}>Kesimpulan</th><th style={th}>Status</th><th style={th}>Aksi</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                <td style={td}>{r.encounter_no}</td>
                <td style={td}>{r.pasien_nama} ({r.mrn})</td>
                <td style={td}>{r.paket}</td>
                <td style={td}>{r.perusahaan ?? "-"}</td>
                <td style={td}>{r.kesimpulan ? <Badge text={r.kesimpulan.replace("_", " ")} color={KES_COLOR[r.kesimpulan]} /> : "-"}</td>
                <td style={td}><Badge text={r.status} color={STATUS_COLOR[r.status]} /></td>
                <td style={{ ...td, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {canEdit && r.status !== "SELESAI" && <Btn icon="✏️" onClick={() => edit(r)}>Input</Btn>}
                  {canEdit && NEXT[r.status].map((s) => (
                    <Btn key={s} icon="➡️" primary={s === "SELESAI"} onClick={() => ubahStatus(r, s)}>{s}</Btn>
                  ))}
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
