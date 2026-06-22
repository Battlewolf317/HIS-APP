// =====================================================================
// OperasiPage.tsx — Operasi / Jadwal Operasi (OT)
//  Daftar jadwal operasi + form (tindakan, kamar OT, tim bedah/anestesi,
//  jadwal, durasi, diagnosa). Status: DIJADWALKAN→BERLANGSUNG→SELESAI/BATAL.
// =====================================================================

import { useState, useEffect } from "react";
import type { AuthUser } from "../../lib/api";
import type { Operasi, OperasiForm, OperasiStatus } from "./types";
import { getOperasi, createOperasi, updateOperasi, setOperasiStatus } from "./operasiApi";
import { getEncounters } from "../encounter/encounterApi";
import type { Encounter } from "../encounter/types";
import { Toolbar, Btn, Badge, sap, th, td, tableStyle, inp, lbl } from "../shell/ui";

const STATUS_COLOR: Record<OperasiStatus, string> = {
  DIJADWALKAN: sap.blue, BERLANGSUNG: sap.orange, SELESAI: sap.green, BATAL: sap.red,
};
const NEXT: Record<OperasiStatus, OperasiStatus[]> = {
  DIJADWALKAN: ["BERLANGSUNG", "BATAL"], BERLANGSUNG: ["SELESAI"], SELESAI: [], BATAL: [],
};
const KATEGORI = ["KECIL", "SEDANG", "BESAR", "KHUSUS"];
const ANESTESI = ["UMUM", "REGIONAL", "LOKAL"];

const EMPTY: OperasiForm = {
  encounter_id: "", nama_tindakan: "", kategori: "SEDANG", kamar_ot: "", dokter_bedah: "", dokter_anestesi: "",
  jenis_anestesi: "UMUM", tgl_operasi: "", durasi_menit: "", diagnosa_pre: "", diagnosa_post: "", catatan: "", petugas: "",
};

export default function OperasiPage({ user }: { user: AuthUser }) {
  const canEdit = user.role === "perawat" || user.role === "dokter" || user.role === "admin";

  const [rows, setRows] = useState<Operasi[]>([]);
  const [encs, setEncs] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<OperasiForm>(EMPTY);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function muat() {
    setLoading(true);
    try {
      setRows(await getOperasi());
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

  function edit(r: Operasi) {
    setEditId(r.id);
    setForm({
      encounter_id: r.encounter_id, nama_tindakan: r.nama_tindakan, kategori: r.kategori ?? "SEDANG",
      kamar_ot: r.kamar_ot ?? "", dokter_bedah: r.dokter_bedah ?? "", dokter_anestesi: r.dokter_anestesi ?? "",
      jenis_anestesi: r.jenis_anestesi ?? "UMUM", tgl_operasi: toLocalInput(r.tgl_operasi),
      durasi_menit: r.durasi_menit === null ? "" : String(r.durasi_menit),
      diagnosa_pre: r.diagnosa_pre ?? "", diagnosa_post: r.diagnosa_post ?? "", catatan: r.catatan ?? "", petugas: r.petugas ?? "",
    });
    setErr("");
  }

  function set<K extends keyof OperasiForm>(k: K, v: OperasiForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function simpan() {
    setErr("");
    if (editId === "new" && !form.encounter_id) return setErr("Kunjungan wajib dipilih");
    if (!form.nama_tindakan.trim()) return setErr("Nama tindakan operasi wajib diisi");
    setSaving(true);
    try {
      if (editId === "new") await createOperasi(form);
      else if (typeof editId === "number") await updateOperasi(editId, form);
      setEditId(null);
      muat();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function ubahStatus(r: Operasi, status: OperasiStatus) {
    await setOperasiStatus(r.id, status);
    muat();
  }

  return (
    <div>
      <Toolbar>
        {canEdit && <Btn icon="➕" primary onClick={tambah}>Jadwalkan Operasi</Btn>}
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>
          {!loading && `${rows.length} jadwal operasi`}
        </span>
      </Toolbar>

      {editId !== null && (
        <div style={{ border: `1px solid ${sap.line}`, borderRadius: 4, padding: 16, marginBottom: 14, background: sap.bgZebra }}>
          <h3 style={{ margin: "0 0 10px", color: sap.blue, fontSize: 16 }}>
            🔪 {editId === "new" ? "Jadwal Operasi Baru" : "Ubah Jadwal Operasi"}
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
              <label style={lbl}>Nama Tindakan *</label>
              <input style={inp} value={form.nama_tindakan} onChange={(e) => set("nama_tindakan", e.target.value)} disabled={!canEdit} placeholder="mis. Apendektomi" />
            </div>
            <div>
              <label style={lbl}>Kategori</label>
              <select style={inp} value={form.kategori} onChange={(e) => set("kategori", e.target.value)} disabled={!canEdit}>
                {KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Kamar OT</label>
              <input style={inp} value={form.kamar_ot} onChange={(e) => set("kamar_ot", e.target.value)} disabled={!canEdit} placeholder="OK-1" />
            </div>
            <div>
              <label style={lbl}>Dokter Bedah</label>
              <input style={inp} value={form.dokter_bedah} onChange={(e) => set("dokter_bedah", e.target.value)} disabled={!canEdit} />
            </div>
            <div>
              <label style={lbl}>Dokter Anestesi</label>
              <input style={inp} value={form.dokter_anestesi} onChange={(e) => set("dokter_anestesi", e.target.value)} disabled={!canEdit} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Jenis Anestesi</label>
              <select style={inp} value={form.jenis_anestesi} onChange={(e) => set("jenis_anestesi", e.target.value)} disabled={!canEdit}>
                {ANESTESI.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Jadwal Operasi</label>
              <input style={inp} type="datetime-local" value={form.tgl_operasi} onChange={(e) => set("tgl_operasi", e.target.value)} disabled={!canEdit} />
            </div>
            <div>
              <label style={lbl}>Estimasi Durasi (menit)</label>
              <input style={inp} type="number" value={form.durasi_menit} onChange={(e) => set("durasi_menit", e.target.value)} disabled={!canEdit} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Diagnosa Pre-Op</label>
              <input style={inp} value={form.diagnosa_pre} onChange={(e) => set("diagnosa_pre", e.target.value)} disabled={!canEdit} />
            </div>
            <div>
              <label style={lbl}>Diagnosa Post-Op</label>
              <input style={inp} value={form.diagnosa_post} onChange={(e) => set("diagnosa_post", e.target.value)} disabled={!canEdit} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Catatan</label>
            <textarea style={{ ...inp, minHeight: 50, fontFamily: "inherit" }} value={form.catatan} onChange={(e) => set("catatan", e.target.value)} disabled={!canEdit} />
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
        <p style={{ color: sap.textSub }}>Belum ada jadwal operasi.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={th}>Jadwal</th>
              <th style={th}>Pasien</th>
              <th style={th}>Tindakan</th>
              <th style={th}>Kamar</th>
              <th style={th}>Dokter Bedah</th>
              <th style={th}>Status</th>
              <th style={th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                <td style={td}>{fmt(r.tgl_operasi)}</td>
                <td style={td}>{r.pasien_nama} ({r.mrn})</td>
                <td style={td}>{r.nama_tindakan} <span style={{ color: sap.textSub, fontSize: 11 }}>· {r.kategori}</span></td>
                <td style={td}>{r.kamar_ot ?? "-"}</td>
                <td style={td}>{r.dokter_bedah ?? "-"}</td>
                <td style={td}><Badge text={r.status} color={STATUS_COLOR[r.status]} /></td>
                <td style={{ ...td, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {canEdit && (r.status === "DIJADWALKAN" || r.status === "BERLANGSUNG") && (
                    <Btn icon="✏️" onClick={() => edit(r)}>Ubah</Btn>
                  )}
                  {canEdit && NEXT[r.status].map((s) => (
                    <Btn key={s} icon="➡️" danger={s === "BATAL"} onClick={() => ubahStatus(r, s)}>{s}</Btn>
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

// ISO/timestamp → format input datetime-local (YYYY-MM-DDTHH:mm)
function toLocalInput(s: string | null): string {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmt(s: string | null): string {
  if (!s) return "(belum dijadwalkan)";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
}
