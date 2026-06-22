// =====================================================================
// RujukanPage.tsx — Rujukan Keluar/Masuk (SISRUTE)
//  Daftar rujukan + form (arah, faskes, spesialis, diagnosa, alasan).
//  Status alur: DRAFT → DIKIRIM → DITERIMA/DITOLAK → SELESAI.
// =====================================================================

import { useState, useEffect } from "react";
import type { AuthUser } from "../../lib/api";
import type { Rujukan, RujukanForm, RujukanArah, RujukanStatus } from "./types";
import { getRujukan, createRujukan, updateRujukan, setRujukanStatus } from "./rujukanApi";
import { getEncounters } from "../encounter/encounterApi";
import type { Encounter } from "../encounter/types";
import { searchIcd10 } from "../icd10/icd10Api";
import type { Icd10 } from "../icd10/types";
import { Toolbar, Btn, Badge, sap, th, td, tableStyle, inp, lbl } from "../shell/ui";

const STATUS_COLOR: Record<RujukanStatus, string> = {
  DRAFT: sap.textSub, DIKIRIM: sap.blue, DITERIMA: sap.green, DITOLAK: sap.red, SELESAI: "#5b738b",
};
// transisi status yang diizinkan
const NEXT: Record<RujukanStatus, RujukanStatus[]> = {
  DRAFT: ["DIKIRIM"], DIKIRIM: ["DITERIMA", "DITOLAK"], DITERIMA: ["SELESAI"], DITOLAK: [], SELESAI: [],
};

const EMPTY: RujukanForm = {
  encounter_id: "", arah: "KELUAR", faskes_tujuan: "", faskes_asal: "", spesialis: "",
  diagnosa_code: "", alasan: "", kondisi: "", no_rujukan: "", petugas: "",
};

export default function RujukanPage({ user }: { user: AuthUser }) {
  const canEdit = user.role === "perawat" || user.role === "dokter" || user.role === "admin";

  const [rows, setRows] = useState<Rujukan[]>([]);
  const [encs, setEncs] = useState<Encounter[]>([]);
  const [icd, setIcd] = useState<Icd10[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<RujukanForm>(EMPTY);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function muat() {
    setLoading(true);
    try {
      setRows(await getRujukan());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
    getEncounters().then((e) => setEncs(e.filter((x) => x.status === "AKTIF"))).catch(() => {});
    searchIcd10("").then(setIcd).catch(() => {});
  }, []);

  function tambah() {
    setEditId("new");
    setForm({ ...EMPTY, petugas: user.nama });
    setErr("");
  }

  function edit(r: Rujukan) {
    setEditId(r.id);
    setForm({
      encounter_id: r.encounter_id, arah: r.arah, faskes_tujuan: r.faskes_tujuan ?? "", faskes_asal: r.faskes_asal ?? "",
      spesialis: r.spesialis ?? "", diagnosa_code: r.diagnosa_code ?? "", alasan: r.alasan, kondisi: r.kondisi ?? "",
      no_rujukan: r.no_rujukan ?? "", petugas: r.petugas ?? "",
    });
    setErr("");
  }

  function set<K extends keyof RujukanForm>(k: K, v: RujukanForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function simpan() {
    setErr("");
    if (editId === "new" && !form.encounter_id) return setErr("Kunjungan wajib dipilih");
    if (!form.alasan.trim()) return setErr("Alasan rujukan wajib diisi");
    if (form.arah === "KELUAR" && !form.faskes_tujuan.trim()) return setErr("Faskes tujuan wajib diisi");
    if (form.arah === "MASUK" && !form.faskes_asal.trim()) return setErr("Faskes asal wajib diisi");
    setSaving(true);
    try {
      if (editId === "new") await createRujukan(form);
      else if (typeof editId === "number") await updateRujukan(editId, form);
      setEditId(null);
      muat();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function ubahStatus(r: Rujukan, status: RujukanStatus) {
    await setRujukanStatus(r.id, status);
    muat();
  }

  return (
    <div>
      <Toolbar>
        {canEdit && <Btn icon="➕" primary onClick={tambah}>Buat Rujukan</Btn>}
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>
          {!loading && `${rows.length} rujukan`}
        </span>
      </Toolbar>

      {editId !== null && (
        <div style={{ border: `1px solid ${sap.line}`, borderRadius: 4, padding: 16, marginBottom: 14, background: sap.bgZebra }}>
          <h3 style={{ margin: "0 0 10px", color: sap.blue, fontSize: 16 }}>
            ↪️ {editId === "new" ? "Rujukan Baru" : "Ubah Rujukan"}
          </h3>
          {err && <div style={{ color: sap.red, marginBottom: 10, fontSize: 13 }}>{err}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Kunjungan *</label>
              <select style={inp} value={form.encounter_id} onChange={(e) => set("encounter_id", e.target.value ? Number(e.target.value) : "")} disabled={editId !== "new" || !canEdit}>
                <option value="">- pilih kunjungan -</option>
                {encs.map((e) => <option key={e.id} value={e.id}>{e.encounter_no} · {e.patient_nama} ({e.tipe})</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Arah Rujukan</label>
              <select style={inp} value={form.arah} onChange={(e) => set("arah", e.target.value as RujukanArah)} disabled={!canEdit}>
                <option value="KELUAR">KELUAR (ke faskes lain)</option>
                <option value="MASUK">MASUK (dari faskes lain)</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 10 }}>
            {form.arah === "KELUAR" ? (
              <div>
                <label style={lbl}>Faskes Tujuan *</label>
                <input style={inp} value={form.faskes_tujuan} onChange={(e) => set("faskes_tujuan", e.target.value)} disabled={!canEdit} placeholder="mis. RSUP Nasional" />
              </div>
            ) : (
              <div>
                <label style={lbl}>Faskes Asal *</label>
                <input style={inp} value={form.faskes_asal} onChange={(e) => set("faskes_asal", e.target.value)} disabled={!canEdit} placeholder="mis. Puskesmas Kec. X" />
              </div>
            )}
            <div>
              <label style={lbl}>Tujuan Poli / Spesialis</label>
              <input style={inp} value={form.spesialis} onChange={(e) => set("spesialis", e.target.value)} disabled={!canEdit} placeholder="mis. Bedah Saraf" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Diagnosa (ICD-10)</label>
              <select style={inp} value={form.diagnosa_code} onChange={(e) => set("diagnosa_code", e.target.value)} disabled={!canEdit}>
                <option value="">- pilih diagnosa -</option>
                {icd.map((d) => <option key={d.code} value={d.code}>{d.code} — {d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>No. Rujukan (SISRUTE/BPJS)</label>
              <input style={inp} value={form.no_rujukan} onChange={(e) => set("no_rujukan", e.target.value)} disabled={!canEdit} />
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>Alasan Rujukan *</label>
            <textarea style={{ ...inp, minHeight: 50, fontFamily: "inherit" }} value={form.alasan} onChange={(e) => set("alasan", e.target.value)} disabled={!canEdit} placeholder="mis. memerlukan fasilitas/kompetensi lebih lanjut" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Kondisi Pasien Saat Dirujuk</label>
            <input style={inp} value={form.kondisi} onChange={(e) => set("kondisi", e.target.value)} disabled={!canEdit} placeholder="mis. stabil, terpasang infus" />
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
        <p style={{ color: sap.textSub }}>Belum ada rujukan.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={th}>Tgl</th>
              <th style={th}>Pasien</th>
              <th style={th}>Arah</th>
              <th style={th}>Faskes</th>
              <th style={th}>Diagnosa</th>
              <th style={th}>Status</th>
              <th style={th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                <td style={td}>{r.tgl_rujuk}</td>
                <td style={td}>{r.pasien_nama} ({r.mrn})</td>
                <td style={td}>{r.arah}</td>
                <td style={td}>{r.arah === "KELUAR" ? r.faskes_tujuan : r.faskes_asal}{r.spesialis ? ` · ${r.spesialis}` : ""}</td>
                <td style={td}>{r.diagnosa_code ? `${r.diagnosa_code} — ${r.diagnosa_nama}` : "-"}</td>
                <td style={td}><Badge text={r.status} color={STATUS_COLOR[r.status]} /></td>
                <td style={{ ...td, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {canEdit && (r.status === "DRAFT" || r.status === "DIKIRIM") && (
                    <Btn icon="✏️" onClick={() => edit(r)}>Ubah</Btn>
                  )}
                  {canEdit && NEXT[r.status].map((s) => (
                    <Btn key={s} icon="➡️" danger={s === "DITOLAK"} onClick={() => ubahStatus(r, s)}>{s}</Btn>
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
