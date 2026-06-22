// =====================================================================
// DischargePage.tsx — Discharge / Resep Pulang (ringkasan pulang)
//  Daftar resume pulang + form upsert per kunjungan (pilih kunjungan,
//  kondisi pulang, resume, instruksi, obat pulang, tgl kontrol).
// =====================================================================

import { useState, useEffect } from "react";
import type { AuthUser } from "../../lib/api";
import type { Discharge, DischargeForm, KondisiPulang } from "./types";
import { getDischarges, getByEncounter, saveDischarge } from "./dischargeApi";
import { getEncounters } from "../encounter/encounterApi";
import type { Encounter } from "../encounter/types";
import { Toolbar, Btn, Badge, sap, th, td, tableStyle, inp, lbl } from "../shell/ui";

const KONDISI: KondisiPulang[] = ["SEMBUH", "MEMBAIK", "RUJUK", "APS", "MENINGGAL"];
const KONDISI_COLOR: Record<KondisiPulang, string> = {
  SEMBUH: sap.green, MEMBAIK: sap.blue, RUJUK: sap.orange, APS: sap.textSub, MENINGGAL: sap.red,
};
const CARA = ["IZIN DOKTER", "ATAS PERMINTAAN SENDIRI", "DIRUJUK", "MENINGGAL"];

const EMPTY: DischargeForm = {
  kondisi_pulang: "MEMBAIK", cara_pulang: "IZIN DOKTER", diagnosa_akhir: "", ringkasan: "",
  instruksi: "", obat_pulang: "", kontrol_tgl: "", dokter: "", petugas: "",
};

export default function DischargePage({ user }: { user: AuthUser }) {
  const canEdit = user.role === "dokter" || user.role === "admin";

  const [rows, setRows] = useState<Discharge[]>([]);
  const [encs, setEncs] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [encId, setEncId] = useState<number | "">("");
  const [form, setForm] = useState<DischargeForm>(EMPTY);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function muat() {
    setLoading(true);
    try {
      setRows(await getDischarges());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
    getEncounters().then((e) => setEncs(e.filter((x) => x.status === "AKTIF"))).catch(() => {});
  }, []);

  function buka() {
    setOpen(true);
    setEncId("");
    setForm({ ...EMPTY, dokter: user.role === "dokter" ? user.nama : "", petugas: user.nama });
    setErr("");
  }

  // saat pilih kunjungan, muat resume existing kalau ada
  async function pilihEnc(id: number | "") {
    setEncId(id);
    setErr("");
    if (!id) { setForm({ ...EMPTY, petugas: user.nama }); return; }
    try {
      const { discharge: d } = await getByEncounter(id);
      if (d) {
        setForm({
          kondisi_pulang: d.kondisi_pulang ?? "MEMBAIK", cara_pulang: d.cara_pulang ?? "IZIN DOKTER",
          diagnosa_akhir: d.diagnosa_akhir ?? "", ringkasan: d.ringkasan ?? "", instruksi: d.instruksi ?? "",
          obat_pulang: d.obat_pulang ?? "", kontrol_tgl: (d.kontrol_tgl ?? "").slice(0, 10),
          dokter: d.dokter ?? "", petugas: d.petugas ?? user.nama,
        });
      } else {
        setForm({ ...EMPTY, dokter: user.role === "dokter" ? user.nama : "", petugas: user.nama });
      }
    } catch {
      /* abaikan */
    }
  }

  // buka resume existing dari tabel
  async function editRow(r: Discharge) {
    setOpen(true);
    await pilihEnc(r.encounter_id);
  }

  function set<K extends keyof DischargeForm>(k: K, v: DischargeForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function simpan() {
    setErr("");
    if (!encId) return setErr("Kunjungan wajib dipilih");
    if (!form.ringkasan.trim()) return setErr("Ringkasan/resume medis wajib diisi");
    setSaving(true);
    try {
      await saveDischarge(encId, form);
      setOpen(false);
      muat();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Toolbar>
        {canEdit && <Btn icon="➕" primary onClick={buka}>Buat / Edit Resume Pulang</Btn>}
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>
          {!loading && `${rows.length} resume pulang`}
        </span>
      </Toolbar>

      {open && (
        <div style={{ border: `1px solid ${sap.line}`, borderRadius: 4, padding: 16, marginBottom: 14, background: sap.bgZebra }}>
          <h3 style={{ margin: "0 0 10px", color: sap.blue, fontSize: 16 }}>🏠 Resume / Resep Pulang</h3>
          {err && <div style={{ color: sap.red, marginBottom: 10, fontSize: 13 }}>{err}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Kunjungan *</label>
              <select style={inp} value={encId} onChange={(e) => pilihEnc(e.target.value ? Number(e.target.value) : "")} disabled={!canEdit}>
                <option value="">- pilih kunjungan -</option>
                {encs.map((e) => <option key={e.id} value={e.id}>{e.encounter_no} · {e.patient_nama} ({e.tipe})</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Kondisi Pulang</label>
              <select style={inp} value={form.kondisi_pulang} onChange={(e) => set("kondisi_pulang", e.target.value as KondisiPulang)} disabled={!canEdit}>
                {KONDISI.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Cara Pulang</label>
              <select style={inp} value={form.cara_pulang} onChange={(e) => set("cara_pulang", e.target.value)} disabled={!canEdit}>
                {CARA.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Diagnosa Akhir</label>
              <input style={inp} value={form.diagnosa_akhir} onChange={(e) => set("diagnosa_akhir", e.target.value)} disabled={!canEdit} />
            </div>
            <div>
              <label style={lbl}>Tgl Kontrol</label>
              <input style={inp} type="date" value={form.kontrol_tgl} onChange={(e) => set("kontrol_tgl", e.target.value)} disabled={!canEdit} />
            </div>
            <div>
              <label style={lbl}>Dokter</label>
              <input style={inp} value={form.dokter} onChange={(e) => set("dokter", e.target.value)} disabled={!canEdit} />
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>Ringkasan / Resume Medis *</label>
            <textarea style={{ ...inp, minHeight: 70, fontFamily: "inherit" }} value={form.ringkasan} onChange={(e) => set("ringkasan", e.target.value)} disabled={!canEdit} placeholder="ringkasan perjalanan penyakit, tindakan, hasil selama dirawat" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={lbl}>Instruksi / Anjuran Pulang</label>
              <textarea style={{ ...inp, minHeight: 60, fontFamily: "inherit" }} value={form.instruksi} onChange={(e) => set("instruksi", e.target.value)} disabled={!canEdit} placeholder="mis. istirahat, diet rendah garam" />
            </div>
            <div>
              <label style={lbl}>Obat Pulang</label>
              <textarea style={{ ...inp, minHeight: 60, fontFamily: "inherit" }} value={form.obat_pulang} onChange={(e) => set("obat_pulang", e.target.value)} disabled={!canEdit} placeholder="mis. Amoxicillin 3x500mg, Paracetamol 3x500mg prn" />
            </div>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            {canEdit && <Btn icon="💾" primary onClick={simpan} disabled={saving}>{saving ? "..." : "Simpan Resume"}</Btn>}
            <Btn icon="✖️" onClick={() => setOpen(false)}>Tutup</Btn>
          </div>
        </div>
      )}

      {loading ? (
        <p>Memuat data...</p>
      ) : rows.length === 0 ? (
        <p style={{ color: sap.textSub }}>Belum ada resume pulang.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={th}>Kunjungan</th>
              <th style={th}>Pasien</th>
              <th style={th}>Kondisi</th>
              <th style={th}>Diagnosa Akhir</th>
              <th style={th}>Kontrol</th>
              <th style={th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                <td style={td}>{r.encounter_no}</td>
                <td style={td}>{r.pasien_nama} ({r.mrn})</td>
                <td style={td}>{r.kondisi_pulang ? <Badge text={r.kondisi_pulang} color={KONDISI_COLOR[r.kondisi_pulang]} /> : "-"}</td>
                <td style={td}>{r.diagnosa_akhir ?? "-"}</td>
                <td style={td}>{r.kontrol_tgl ? r.kontrol_tgl.slice(0, 10) : "-"}</td>
                <td style={td}>
                  {canEdit ? <Btn icon="✏️" onClick={() => editRow(r)}>Lihat / Ubah</Btn> : <span style={{ fontSize: 12, color: sap.textSub }}>-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
