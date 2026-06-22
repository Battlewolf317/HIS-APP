import { useState, useEffect } from "react";
import type { Encounter, EncounterInput } from "./types";
import { createEncounter, updateEncounter } from "./encounterApi";
import type { Patient } from "../patient/types";
import { getPatients } from "../patient/patientApi";
import { inp, lbl, Btn, sap } from "../shell/ui";

const KOSONG: EncounterInput = {
  patient_id: "", tipe: "RJ", poli: "", dokter: "", keluhan: "",
};

type Props = {
  editing: Encounter | null;   // kalau ada = mode edit
  onSaved: () => void;
  onCancel: () => void;
};

export default function EncounterForm({ editing, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<EncounterInput>(KOSONG);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState("");

  // ambil daftar pasien buat dropdown (interaksi antar-modul)
  useEffect(() => {
    getPatients().then(setPatients).catch(() => setPatients([]));
  }, []);

  useEffect(() => {
    if (editing) {
      setForm({
        patient_id: editing.patient_id,
        tipe: editing.tipe,
        poli: editing.poli ?? "",
        dokter: editing.dokter ?? "",
        keluhan: editing.keluhan ?? "",
      });
    } else {
      setForm(KOSONG);
    }
    setError("");
  }, [editing]);

  function set(field: keyof EncounterInput, value: string) {
    setForm((f) => ({ ...f, [field]: field === "patient_id" ? Number(value) : value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await updateEncounter(editing.id, form);
      } else {
        await createEncounter(form);
      }
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const lbl2: React.CSSProperties = lbl;
  const inp2: React.CSSProperties = inp;
  const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

  return (
    <form onSubmit={submit} style={{ background: "#fff", padding: 16, borderRadius: 4, marginBottom: 16, border: `1px solid ${sap.line}` }}>
      <h3 style={{ marginTop: 0, color: sap.text }}>
        {editing ? `Edit Kunjungan — ${editing.encounter_no}` : "Pendaftaran Kunjungan Baru"}
      </h3>

      <div style={grid}>
        <div style={{ gridColumn: "1 / 3" }}>
          <label style={lbl2}>Pasien *</label>
          <select
            style={inp2}
            value={form.patient_id}
            onChange={(e) => set("patient_id", e.target.value)}
            disabled={!!editing}
          >
            <option value="">-- pilih pasien --</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.mrn} — {p.nama}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={lbl2}>Tipe Kunjungan</label>
          <select style={inp2} value={form.tipe} onChange={(e) => set("tipe", e.target.value)}>
            <option value="RJ">Rawat Jalan</option>
            <option value="RI">Rawat Inap</option>
            <option value="IGD">IGD</option>
          </select>
        </div>
        <div>
          <label style={lbl2}>Poli / Ruangan</label>
          <input style={inp2} value={form.poli} onChange={(e) => set("poli", e.target.value)} />
        </div>
        <div style={{ gridColumn: "1 / 3" }}>
          <label style={lbl2}>Dokter *</label>
          <input style={inp2} value={form.dokter} onChange={(e) => set("dokter", e.target.value)} />
        </div>
        <div style={{ gridColumn: "1 / 3" }}>
          <label style={lbl2}>Keluhan</label>
          <input style={inp2} value={form.keluhan} onChange={(e) => set("keluhan", e.target.value)} />
        </div>
      </div>

      {error && <p style={{ color: sap.red, margin: "10px 0 0" }}>⚠️ {error}</p>}

      <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
        <Btn type="submit" primary icon="💾">{editing ? "Update" : "Daftar"}</Btn>
        <Btn type="button" icon="✖" onClick={onCancel}>Batal</Btn>
      </div>
    </form>
  );
}
