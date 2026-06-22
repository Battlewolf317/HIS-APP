import { useState, useEffect } from "react";
import type { Encounter } from "../encounter/types";
import type { MedicalRecord } from "./types";
import { getRecords, createRecord, deleteRecord } from "./medrecApi";
import type { Icd10 } from "../icd10/types";
import { searchIcd10 } from "../icd10/icd10Api";
import { sap, Btn, inp, lbl } from "../shell/ui";

type Props = {
  encounter: Encounter;
  role: string;
  onClose: () => void;
};

const KOSONG = { anamnesa: "", pemeriksaan: "", tindak_lanjut: "" };

export default function MedrecPanel({ encounter, role, onClose }: Props) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [form, setForm] = useState(KOSONG);
  const [error, setError] = useState("");

  // pencarian diagnosa
  const [dxQuery, setDxQuery] = useState("");
  const [dxResults, setDxResults] = useState<Icd10[]>([]);
  const [dxPicked, setDxPicked] = useState<Icd10 | null>(null);

  const aktif = encounter.status === "AKTIF";
  const bisaTulis = aktif && (role === "dokter" || role === "admin");

  async function muat() {
    setRecords(await getRecords(encounter.id));
  }

  useEffect(() => {
    muat();
    setForm(KOSONG);
    setDxQuery("");
    setDxPicked(null);
    setError("");
  }, [encounter.id]);

  // cari diagnosa tiap ketik (min 1 huruf)
  useEffect(() => {
    if (dxPicked) return; // sudah dipilih, jangan cari lagi
    const t = setTimeout(() => {
      if (dxQuery.trim()) searchIcd10(dxQuery).then(setDxResults).catch(() => setDxResults([]));
      else setDxResults([]);
    }, 250);
    return () => clearTimeout(t);
  }, [dxQuery, dxPicked]);

  function pilihDx(icd: Icd10) {
    setDxPicked(icd);
    setDxQuery(`${icd.code} — ${icd.name}`);
    setDxResults([]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!dxPicked) {
      setError("Diagnosa wajib dipilih dari daftar");
      return;
    }
    try {
      await createRecord({
        encounter_id: encounter.id,
        anamnesa: form.anamnesa,
        pemeriksaan: form.pemeriksaan,
        diagnosa_code: dxPicked.code,
        tindak_lanjut: form.tindak_lanjut,
      });
      setForm(KOSONG);
      setDxQuery("");
      setDxPicked(null);
      muat();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function hapus(r: MedicalRecord) {
    if (!confirm("Hapus catatan rekam medis ini?")) return;
    await deleteRecord(r.id);
    muat();
  }

  return (
    <div style={panelWrap}>
      <div style={panelHead}>
        <h3 style={panelTitle}>
          📋 Rekam Medis — {encounter.encounter_no}
          <span style={subTitle}> ({encounter.patient_nama})</span>
        </h3>
        <Btn icon="✕" onClick={onClose}>Tutup</Btn>
      </div>

      <div style={panelBody}>
        {/* FORM tambah (hanya kalau kunjungan AKTIF & role dokter/admin) */}
        {bisaTulis ? (
          <form onSubmit={submit}>
            <div style={{ marginBottom: 8 }}>
              <label style={lbl}>S — Anamnesa (keluhan) *</label>
              <input style={inp} value={form.anamnesa} onChange={(e) => setForm({ ...form, anamnesa: e.target.value })} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={lbl}>O — Pemeriksaan</label>
              <input style={inp} value={form.pemeriksaan} onChange={(e) => setForm({ ...form, pemeriksaan: e.target.value })} />
            </div>
            <div style={{ marginBottom: 8, position: "relative" }}>
              <label style={lbl}>A — Diagnosa (ketik kode/nama, lalu pilih) *</label>
              <input
                style={inp}
                value={dxQuery}
                placeholder="mis. demam / J06"
                onChange={(e) => { setDxQuery(e.target.value); setDxPicked(null); }}
              />
              {dxResults.length > 0 && (
                <div style={{ position: "absolute", zIndex: 10, background: "#fff", border: `1px solid ${sap.line}`, width: "100%", maxHeight: 180, overflowY: "auto", boxShadow: "0 2px 6px rgba(0,0,0,.15)" }}>
                  {dxResults.map((d) => (
                    <div
                      key={d.code}
                      onClick={() => pilihDx(d)}
                      style={{ padding: "6px 8px", cursor: "pointer", borderBottom: `1px solid ${sap.bgZebra}`, fontSize: 13 }}
                    >
                      <b>{d.code}</b> — {d.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={lbl}>P — Tindak lanjut / terapi</label>
              <input style={inp} value={form.tindak_lanjut} onChange={(e) => setForm({ ...form, tindak_lanjut: e.target.value })} />
            </div>
            {error && <p style={errStyle}>⚠️ {error}</p>}
            <Btn type="submit" primary icon="💾">Simpan Catatan</Btn>
          </form>
        ) : (
          <p style={infoStyle}>
            {aktif ? "Hanya dokter yang bisa menambah rekam medis." : `Kunjungan sudah ${encounter.status} — rekam medis read-only.`}
          </p>
        )}

        {/* DAFTAR rekam medis */}
        <h4 style={sectionTitle}>Riwayat Catatan ({records.length})</h4>
        {records.length === 0 ? (
          <p style={{ color: sap.textSub }}>Belum ada catatan.</p>
        ) : (
          records.map((r) => (
            <div key={r.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <b>{new Date(r.created_at).toLocaleString("id-ID")}</b>
                {bisaTulis && <Btn danger icon="🗑️" onClick={() => hapus(r)}>Hapus</Btn>}
              </div>
              <div><b>S:</b> {r.anamnesa || "-"}</div>
              <div><b>O:</b> {r.pemeriksaan || "-"}</div>
              <div><b>A:</b> {r.diagnosa_code} — {r.diagnosa_nama}</div>
              <div><b>P:</b> {r.tindak_lanjut || "-"}</div>
              <div style={{ color: sap.textSub }}>Dokter: {r.dokter || "-"}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- style panel bergaya SAP ---
import type { CSSProperties } from "react";

const panelWrap: CSSProperties = {
  border: `1px solid ${sap.line}`,
  borderTop: `3px solid ${sap.blue}`,
  borderRadius: 4,
  marginBottom: 20,
  background: "#fff",
  boxShadow: "0 1px 3px rgba(0,0,0,.08)",
};
const panelHead: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 12px",
  background: sap.bgHead,
  borderBottom: `1px solid ${sap.line}`,
};
const panelTitle: CSSProperties = { margin: 0, fontSize: 15, color: sap.text };
const subTitle: CSSProperties = { color: sap.textSub, fontWeight: 400, fontSize: 13 };
const panelBody: CSSProperties = { padding: 14 };
const sectionTitle: CSSProperties = { margin: "16px 0 6px", fontSize: 13, color: sap.textSub, textTransform: "uppercase", letterSpacing: 0.3 };
const cardStyle: CSSProperties = { border: `1px solid ${sap.line}`, borderRadius: 4, padding: 10, marginBottom: 8, fontSize: 13, background: sap.bgZebra };
const errStyle: CSSProperties = { color: sap.red, margin: "6px 0" };
const infoStyle: CSSProperties = { color: sap.textSub, fontStyle: "italic" };
