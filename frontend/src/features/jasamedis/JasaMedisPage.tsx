// =====================================================================
// JasaMedisPage.tsx — Jasa Medis Dokter
//  Daftar fee/jasa dokter per kunjungan + form. Alur status:
//  DRAFT → DISETUJUI → DIBAYAR (approve/bayar oleh kasir/admin).
// =====================================================================

import { useState, useEffect } from "react";
import type { AuthUser } from "../../lib/api";
import type { JasaMedis, JasaForm, JasaJenis, JasaStatus } from "./types";
import { getJasa, createJasa, updateJasa, setJasaStatus } from "./jasamedisApi";
import { getEncounters } from "../encounter/encounterApi";
import type { Encounter } from "../encounter/types";
import { Toolbar, Btn, Badge, sap, th, td, tableStyle, inp, lbl } from "../shell/ui";

const STATUS_COLOR: Record<JasaStatus, string> = { DRAFT: sap.textSub, DISETUJUI: sap.blue, DIBAYAR: sap.green };
const NEXT: Record<JasaStatus, JasaStatus[]> = { DRAFT: ["DISETUJUI"], DISETUJUI: ["DIBAYAR"], DIBAYAR: [] };
const JENIS: JasaJenis[] = ["KONSUL", "VISITE", "TINDAKAN", "OPERASI"];

const EMPTY: JasaForm = { encounter_id: "", dokter: "", jenis: "KONSUL", deskripsi: "", jumlah: "", petugas: "" };

const rupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");

export default function JasaMedisPage({ user }: { user: AuthUser }) {
  const canEditEntry = user.role === "dokter" || user.role === "kasir" || user.role === "admin";
  const canApprove = user.role === "kasir" || user.role === "admin";

  const [rows, setRows] = useState<JasaMedis[]>([]);
  const [encs, setEncs] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<JasaForm>(EMPTY);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function muat() {
    setLoading(true);
    try {
      setRows(await getJasa());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
    getEncounters().then((e) => setEncs(e.filter((x) => x.status === "AKTIF"))).catch(() => {});
  }, []);

  function tambah() {
    setEditId("new");
    setForm({ ...EMPTY, petugas: user.nama });
    setErr("");
  }

  function edit(r: JasaMedis) {
    setEditId(r.id);
    setForm({
      encounter_id: r.encounter_id, dokter: r.dokter, jenis: r.jenis, deskripsi: r.deskripsi ?? "",
      jumlah: String(Number(r.jumlah)), petugas: r.petugas ?? "",
    });
    setErr("");
  }

  function set<K extends keyof JasaForm>(k: K, v: JasaForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function simpan() {
    setErr("");
    if (editId === "new" && !form.encounter_id) return setErr("Kunjungan wajib dipilih");
    if (!form.dokter.trim()) return setErr("Nama dokter wajib diisi");
    if (form.jumlah === "" || Number(form.jumlah) < 0) return setErr("Jumlah jasa harus angka >= 0");
    setSaving(true);
    try {
      if (editId === "new") await createJasa(form);
      else if (typeof editId === "number") await updateJasa(editId, form);
      setEditId(null);
      muat();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function ubahStatus(r: JasaMedis, status: JasaStatus) {
    await setJasaStatus(r.id, status);
    muat();
  }

  const total = rows.reduce((a, r) => a + Number(r.jumlah), 0);
  const totalDibayar = rows.filter((r) => r.status === "DIBAYAR").reduce((a, r) => a + Number(r.jumlah), 0);

  return (
    <div>
      <Toolbar>
        {canEditEntry && <Btn icon="➕" primary onClick={tambah}>Catat Jasa Medis</Btn>}
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>
          {!loading && `${rows.length} jasa · total ${rupiah(total)} · dibayar ${rupiah(totalDibayar)}`}
        </span>
      </Toolbar>

      {editId !== null && (
        <div style={{ border: `1px solid ${sap.line}`, borderRadius: 4, padding: 16, marginBottom: 14, background: sap.bgZebra }}>
          <h3 style={{ margin: "0 0 10px", color: sap.blue, fontSize: 16 }}>
            💰 {editId === "new" ? "Catat Jasa Medis" : "Ubah Jasa Medis"}
          </h3>
          {err && <div style={{ color: sap.red, marginBottom: 10, fontSize: 13 }}>{err}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Kunjungan *</label>
              <select style={inp} value={form.encounter_id} onChange={(e) => set("encounter_id", e.target.value ? Number(e.target.value) : "")} disabled={editId !== "new" || !canEditEntry}>
                <option value="">- pilih kunjungan -</option>
                {encs.map((e) => <option key={e.id} value={e.id}>{e.encounter_no} · {e.patient_nama} ({e.tipe})</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Dokter *</label>
              <input style={inp} value={form.dokter} onChange={(e) => set("dokter", e.target.value)} disabled={!canEditEntry} />
            </div>
            <div>
              <label style={lbl}>Jenis</label>
              <select style={inp} value={form.jenis} onChange={(e) => set("jenis", e.target.value as JasaJenis)} disabled={!canEditEntry}>
                {JENIS.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={lbl}>Deskripsi</label>
              <input style={inp} value={form.deskripsi} onChange={(e) => set("deskripsi", e.target.value)} disabled={!canEditEntry} placeholder="mis. Visite dokter spesialis" />
            </div>
            <div>
              <label style={lbl}>Jumlah (Rp) *</label>
              <input style={inp} type="number" value={form.jumlah} onChange={(e) => set("jumlah", e.target.value)} disabled={!canEditEntry} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            {canEditEntry && <Btn icon="💾" primary onClick={simpan} disabled={saving}>{saving ? "..." : "Simpan"}</Btn>}
            <Btn icon="✖️" onClick={() => setEditId(null)}>Batal</Btn>
          </div>
        </div>
      )}

      {loading ? (
        <p>Memuat data...</p>
      ) : rows.length === 0 ? (
        <p style={{ color: sap.textSub }}>Belum ada catatan jasa medis.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={th}>Kunjungan</th>
              <th style={th}>Pasien</th>
              <th style={th}>Dokter</th>
              <th style={th}>Jenis</th>
              <th style={th}>Jumlah</th>
              <th style={th}>Status</th>
              <th style={th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                <td style={td}>{r.encounter_no}</td>
                <td style={td}>{r.pasien_nama} ({r.mrn})</td>
                <td style={td}>{r.dokter}</td>
                <td style={td}>{r.jenis}{r.deskripsi ? <span style={{ color: sap.textSub, fontSize: 11 }}> · {r.deskripsi}</span> : null}</td>
                <td style={{ ...td, textAlign: "right" }}>{rupiah(Number(r.jumlah))}</td>
                <td style={td}><Badge text={r.status} color={STATUS_COLOR[r.status]} /></td>
                <td style={{ ...td, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {canEditEntry && r.status === "DRAFT" && <Btn icon="✏️" onClick={() => edit(r)}>Ubah</Btn>}
                  {canApprove && NEXT[r.status].map((s) => (
                    <Btn key={s} icon="➡️" primary={s === "DIBAYAR"} onClick={() => ubahStatus(r, s)}>{s}</Btn>
                  ))}
                  {!canEditEntry && !canApprove && <span style={{ fontSize: 12, color: sap.textSub }}>-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
