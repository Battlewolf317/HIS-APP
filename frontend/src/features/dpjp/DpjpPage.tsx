// =====================================================================
// DpjpPage.tsx — DPJP (Dokter Penanggung Jawab Pelayanan)
//  Daftar penetapan DPJP per kunjungan + form. Peran UTAMA/KONSULEN/ALIH.
//  Set UTAMA baru otomatis menutup UTAMA aktif sebelumnya (di backend).
// =====================================================================

import { useState, useEffect } from "react";
import type { AuthUser } from "../../lib/api";
import type { Dpjp, DpjpForm, DpjpPeran, DpjpStatus } from "./types";
import { getDpjp, createDpjp, updateDpjp, setDpjpStatus } from "./dpjpApi";
import { getEncounters } from "../encounter/encounterApi";
import type { Encounter } from "../encounter/types";
import { Toolbar, Btn, Badge, sap, th, td, tableStyle, inp, lbl } from "../shell/ui";

const PERAN_COLOR: Record<DpjpPeran, string> = { UTAMA: sap.blue, KONSULEN: sap.orange, ALIH: "#5b738b" };
const STATUS_COLOR: Record<DpjpStatus, string> = { AKTIF: sap.green, SELESAI: sap.textSub };
const PERAN: DpjpPeran[] = ["UTAMA", "KONSULEN", "ALIH"];

const EMPTY: DpjpForm = { encounter_id: "", dokter: "", spesialisasi: "", peran: "UTAMA", tgl_mulai: "", tgl_selesai: "", catatan: "", petugas: "" };

export default function DpjpPage({ user }: { user: AuthUser }) {
  const canEdit = user.role === "perawat" || user.role === "dokter" || user.role === "admin";

  const [rows, setRows] = useState<Dpjp[]>([]);
  const [encs, setEncs] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<DpjpForm>(EMPTY);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function muat() {
    setLoading(true);
    try {
      setRows(await getDpjp());
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

  function edit(r: Dpjp) {
    setEditId(r.id);
    setForm({
      encounter_id: r.encounter_id, dokter: r.dokter, spesialisasi: r.spesialisasi ?? "", peran: r.peran,
      tgl_mulai: (r.tgl_mulai ?? "").slice(0, 10), tgl_selesai: (r.tgl_selesai ?? "").slice(0, 10),
      catatan: r.catatan ?? "", petugas: r.petugas ?? "",
    });
    setErr("");
  }

  function set<K extends keyof DpjpForm>(k: K, v: DpjpForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function simpan() {
    setErr("");
    if (editId === "new" && !form.encounter_id) return setErr("Kunjungan wajib dipilih");
    if (!form.dokter.trim()) return setErr("Nama dokter DPJP wajib diisi");
    setSaving(true);
    try {
      if (editId === "new") await createDpjp(form);
      else if (typeof editId === "number") await updateDpjp(editId, form);
      setEditId(null);
      muat();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function ubahStatus(r: Dpjp, status: DpjpStatus) {
    await setDpjpStatus(r.id, status);
    muat();
  }

  return (
    <div>
      <Toolbar>
        {canEdit && <Btn icon="➕" primary onClick={tambah}>Tetapkan DPJP</Btn>}
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>
          {!loading && `${rows.length} penetapan DPJP`}
        </span>
      </Toolbar>

      {editId !== null && (
        <div style={{ border: `1px solid ${sap.line}`, borderRadius: 4, padding: 16, marginBottom: 14, background: sap.bgZebra }}>
          <h3 style={{ margin: "0 0 10px", color: sap.blue, fontSize: 16 }}>
            👨‍⚕️ {editId === "new" ? "Tetapkan DPJP" : "Ubah DPJP"}
          </h3>
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
              <label style={lbl}>Dokter *</label>
              <input style={inp} value={form.dokter} onChange={(e) => set("dokter", e.target.value)} disabled={!canEdit} placeholder="dr. ... Sp. ..." />
            </div>
            <div>
              <label style={lbl}>Peran</label>
              <select style={inp} value={form.peran} onChange={(e) => set("peran", e.target.value as DpjpPeran)} disabled={!canEdit}>
                {PERAN.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Spesialisasi</label>
              <input style={inp} value={form.spesialisasi} onChange={(e) => set("spesialisasi", e.target.value)} disabled={!canEdit} placeholder="mis. Penyakit Dalam" />
            </div>
            <div>
              <label style={lbl}>Tgl Mulai</label>
              <input style={inp} type="date" value={form.tgl_mulai} onChange={(e) => set("tgl_mulai", e.target.value)} disabled={!canEdit} />
            </div>
            <div>
              <label style={lbl}>Tgl Selesai</label>
              <input style={inp} type="date" value={form.tgl_selesai} onChange={(e) => set("tgl_selesai", e.target.value)} disabled={!canEdit} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Catatan</label>
            <input style={inp} value={form.catatan} onChange={(e) => set("catatan", e.target.value)} disabled={!canEdit} />
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            {canEdit && <Btn icon="💾" primary onClick={simpan} disabled={saving}>{saving ? "..." : "Simpan"}</Btn>}
            <Btn icon="✖️" onClick={() => setEditId(null)}>Batal</Btn>
          </div>
        </div>
      )}

      {loading ? (
        <p>Memuat data...</p>
      ) : rows.length === 0 ? (
        <p style={{ color: sap.textSub }}>Belum ada penetapan DPJP.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={th}>Kunjungan</th>
              <th style={th}>Pasien</th>
              <th style={th}>Dokter</th>
              <th style={th}>Peran</th>
              <th style={th}>Periode</th>
              <th style={th}>Status</th>
              <th style={th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                <td style={td}>{r.encounter_no}</td>
                <td style={td}>{r.pasien_nama} ({r.mrn})</td>
                <td style={td}>{r.dokter}{r.spesialisasi ? <span style={{ color: sap.textSub, fontSize: 11 }}> · {r.spesialisasi}</span> : null}</td>
                <td style={td}><Badge text={r.peran} color={PERAN_COLOR[r.peran]} /></td>
                <td style={td}>{(r.tgl_mulai ?? "").slice(0, 10)}{r.tgl_selesai ? ` s/d ${r.tgl_selesai.slice(0, 10)}` : ""}</td>
                <td style={td}><Badge text={r.status} color={STATUS_COLOR[r.status]} /></td>
                <td style={{ ...td, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {canEdit && r.status === "AKTIF" && (
                    <>
                      <Btn icon="✏️" onClick={() => edit(r)}>Ubah</Btn>
                      <Btn icon="✔️" onClick={() => ubahStatus(r, "SELESAI")}>Akhiri</Btn>
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
