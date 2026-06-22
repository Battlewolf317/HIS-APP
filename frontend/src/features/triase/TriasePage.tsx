// =====================================================================
// TriasePage.tsx — Triase IGD
//  Worklist pasien IGD (belum & sudah ditriase) → pilih → isi penilaian:
//  cara datang, keluhan, vital signs, GCS/kesadaran, level (warna) + kategori,
//  tindakan awal. Upsert ke /api/triase/by-encounter/:id.
// =====================================================================

import { useState, useEffect } from "react";
import type { AuthUser } from "../../lib/api";
import type { TriaseWorklistRow, TriaseDetail, TriaseForm, TriaseLevel, TriaseKategori } from "./types";
import { getWorklist, getByEncounter, save } from "./triaseApi";
import { Toolbar, Btn, Badge, sap, th, td, tableStyle, inp, lbl } from "../shell/ui";
import { PatientLink } from "../profil/profileContext";

// warna per level triase (standar START/ATS)
const LEVEL_COLOR: Record<TriaseLevel, string> = {
  MERAH: "#bb0000",
  KUNING: "#df6e0c",
  HIJAU: "#107e3e",
  HITAM: "#1a2733",
};
const LEVELS: TriaseLevel[] = ["MERAH", "KUNING", "HIJAU", "HITAM"];
const KATEGORI: TriaseKategori[] = ["RESUSITASI", "EMERGENCY", "URGENT", "NON_URGENT", "DOA"];

const EMPTY: TriaseForm = {
  cara_datang: "", keluhan_utama: "", td_sistol: "", td_diastol: "", nadi: "", rr: "",
  suhu: "", spo2: "", gcs: "", nyeri: "", kesadaran: "", level: "", kategori: "", tindakan_awal: "", petugas: "",
};

export default function TriasePage({ user }: { user: AuthUser }) {
  const canEdit = user.role === "perawat" || user.role === "dokter" || user.role === "admin";

  const [rows, setRows] = useState<TriaseWorklistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<TriaseDetail | null>(null);
  const [form, setForm] = useState<TriaseForm>(EMPTY);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function muat() {
    setLoading(true);
    try {
      setRows(await getWorklist());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
  }, []);

  async function pilih(encounterId: number) {
    setErr("");
    const detail = await getByEncounter(encounterId);
    setSel(detail);
    const t = detail.triase;
    setForm(
      t
        ? {
            cara_datang: t.cara_datang ?? "", keluhan_utama: t.keluhan_utama ?? "",
            td_sistol: str(t.td_sistol), td_diastol: str(t.td_diastol), nadi: str(t.nadi),
            rr: str(t.rr), suhu: str(t.suhu), spo2: str(t.spo2), gcs: str(t.gcs), nyeri: str(t.nyeri),
            kesadaran: t.kesadaran ?? "", level: t.level ?? "", kategori: t.kategori ?? "",
            tindakan_awal: t.tindakan_awal ?? "", petugas: t.petugas ?? "",
          }
        : { ...EMPTY, keluhan_utama: detail.encounter.keluhan ?? "", petugas: user.nama },
    );
  }

  function set<K extends keyof TriaseForm>(k: K, v: TriaseForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function simpan() {
    if (!sel) return;
    setErr("");
    if (!form.keluhan_utama.trim()) return setErr("Keluhan utama wajib diisi");
    if (!form.level) return setErr("Level triase wajib dipilih");
    setSaving(true);
    try {
      await save(sel.encounter.id, form);
      setSel(null);
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
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>
          {!loading && `${rows.length} pasien IGD`}
        </span>
      </Toolbar>

      {sel && (
        <div style={{ border: `1px solid ${sap.line}`, borderRadius: 4, padding: 16, marginBottom: 14, background: sap.bgZebra }}>
          <h3 style={{ margin: "0 0 4px", color: sap.blue, fontSize: 16 }}>
            🚨 Triase — {sel.encounter.patient_nama} ({sel.encounter.patient_mrn})
          </h3>
          <div style={{ fontSize: 12, color: sap.textSub, marginBottom: 12 }}>
            Kunjungan {sel.encounter.encounter_no} · masuk {fmt(sel.encounter.tgl_masuk)}
            {sel.triase && <> · <b style={{ color: sap.orange }}>sudah pernah ditriase (akan diperbarui)</b></>}
          </div>

          {err && <div style={{ color: sap.red, marginBottom: 10, fontSize: 13 }}>{err}</div>}

          {/* Cara datang & keluhan */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Cara Datang</label>
              <select style={inp} value={form.cara_datang} onChange={(e) => set("cara_datang", e.target.value)} disabled={!canEdit}>
                <option value="">- pilih -</option>
                <option value="Sendiri">Datang Sendiri</option>
                <option value="Ambulans">Ambulans</option>
                <option value="Rujukan">Rujukan</option>
                <option value="Polisi">Polisi</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Keluhan Utama *</label>
              <input style={inp} value={form.keluhan_utama} onChange={(e) => set("keluhan_utama", e.target.value)} disabled={!canEdit} />
            </div>
          </div>

          {/* Vital signs */}
          <label style={{ ...lbl, marginTop: 4 }}>Tanda Vital</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
            {vital("TD Sistol", "td_sistol", "mmHg")}
            {vital("TD Diastol", "td_diastol", "mmHg")}
            {vital("Nadi", "nadi", "x/mnt")}
            {vital("Resp. Rate", "rr", "x/mnt")}
            {vital("Suhu", "suhu", "°C")}
            {vital("SpO₂", "spo2", "%")}
            {vital("GCS", "gcs", "3-15")}
            {vital("Skala Nyeri", "nyeri", "0-10")}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={lbl}>Kesadaran</label>
              <select style={inp} value={form.kesadaran} onChange={(e) => set("kesadaran", e.target.value)} disabled={!canEdit}>
                <option value="">- pilih -</option>
                <option value="Composmentis">Composmentis</option>
                <option value="Apatis">Apatis</option>
                <option value="Somnolen">Somnolen</option>
                <option value="Sopor">Sopor</option>
                <option value="Koma">Koma</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Kategori</label>
              <select style={inp} value={form.kategori} onChange={(e) => set("kategori", e.target.value as TriaseKategori)} disabled={!canEdit}>
                <option value="">- pilih -</option>
                {KATEGORI.map((k) => <option key={k} value={k}>{k.replace("_", " ")}</option>)}
              </select>
            </div>
          </div>

          {/* Level — tombol warna */}
          <label style={lbl}>Level Triase *</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {LEVELS.map((lv) => (
              <button
                key={lv}
                onClick={() => canEdit && set("level", lv)}
                disabled={!canEdit}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 4, cursor: canEdit ? "pointer" : "default",
                  fontWeight: 700, fontSize: 13, color: "#fff", background: LEVEL_COLOR[lv],
                  border: form.level === lv ? "3px solid #1a2733" : "1px solid rgba(0,0,0,.2)",
                  opacity: form.level === lv || !form.level ? 1 : 0.45,
                }}
              >
                {lv}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Tindakan Awal</label>
            <textarea
              style={{ ...inp, minHeight: 60, fontFamily: "inherit" }}
              value={form.tindakan_awal}
              onChange={(e) => set("tindakan_awal", e.target.value)}
              disabled={!canEdit}
              placeholder="Mis. pasang O2 nasal kanul 3 lpm, pasang IV line ..."
            />
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            {canEdit && (
              <Btn icon="💾" primary onClick={simpan} disabled={saving}>
                {saving ? "..." : "Simpan Triase"}
              </Btn>
            )}
            <Btn icon="✖️" onClick={() => setSel(null)}>Tutup</Btn>
          </div>
        </div>
      )}

      {loading ? (
        <p>Memuat data...</p>
      ) : rows.length === 0 ? (
        <p style={{ color: sap.textSub }}>Tidak ada pasien IGD aktif.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={th}>Kunjungan</th>
              <th style={th}>Pasien</th>
              <th style={th}>Masuk</th>
              <th style={th}>Keluhan</th>
              <th style={th}>Status Triase</th>
              <th style={th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.encounter_id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                <td style={td}>{r.encounter_no}</td>
                <td style={td}><PatientLink patientId={r.patient_id}>{r.pasien_nama}</PatientLink></td>
                <td style={td}>{fmt(r.tgl_masuk)}</td>
                <td style={td}>{r.keluhan ?? "-"}</td>
                <td style={td}>
                  {r.level ? (
                    <Badge text={r.level} color={LEVEL_COLOR[r.level]} />
                  ) : (
                    <span style={{ color: sap.textSub, fontSize: 12 }}>belum ditriase</span>
                  )}
                </td>
                <td style={td}>
                  <Btn icon={r.level ? "✏️" : "🚨"} onClick={() => pilih(r.encounter_id)}>
                    {r.level ? "Lihat / Ubah" : "Triase"}
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // input vital kecil
  function vital(label: string, key: keyof TriaseForm, unit: string) {
    return (
      <div>
        <label style={{ ...lbl, fontSize: 11 }}>{label} <span style={{ color: sap.textSub, fontWeight: 400 }}>({unit})</span></label>
        <input
          style={inp}
          type="number"
          value={form[key]}
          onChange={(e) => set(key, e.target.value as TriaseForm[typeof key])}
          disabled={!canEdit}
        />
      </div>
    );
  }
}

function str(v: number | null): string {
  return v === null || v === undefined ? "" : String(v);
}

function fmt(s: string): string {
  if (!s) return "-";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
}
