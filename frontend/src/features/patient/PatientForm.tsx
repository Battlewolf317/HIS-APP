import { useState, useEffect } from "react";
import type { Patient, PatientInput } from "./types";
import { createPatient, updatePatient } from "./patientApi";
import { inp, lbl, Btn, sap } from "../shell/ui";

const KOSONG: PatientInput = {
  mrn: "", nik: "", nama: "", tgl_lahir: "", jenis_kelamin: "P",
  alamat: "", no_hp: "", penjamin: "UMUM", no_penjamin: "",
};

type Props = {
  editing: Patient | null;
  onSaved: () => void;
  onCancel: () => void;
};

export default function PatientForm({ editing, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<PatientInput>(KOSONG);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) {
      setForm({
        mrn: editing.mrn,
        nik: editing.nik ?? "",
        nama: editing.nama,
        tgl_lahir: editing.tgl_lahir ? editing.tgl_lahir.substring(0, 10) : "",
        jenis_kelamin: editing.jenis_kelamin ?? "P",
        alamat: editing.alamat ?? "",
        no_hp: editing.no_hp ?? "",
        penjamin: editing.penjamin ?? "UMUM",
        no_penjamin: editing.no_penjamin ?? "",
      });
    } else {
      setForm(KOSONG);
    }
    setError("");
  }, [editing]);

  function set(field: keyof PatientInput, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editing) await updatePatient(editing.id, form);
      else await createPatient(form);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

  return (
    <form
      onSubmit={submit}
      style={{ background: "#fff", padding: 16, borderRadius: 4, marginBottom: 16, border: `1px solid ${sap.line}` }}
    >
      <h3 style={{ marginTop: 0, color: sap.text }}>
        {editing ? `Edit Pasien — ${editing.mrn}` : "Registrasi Pasien Baru"}
      </h3>

      <div style={grid}>
        <div>
          <label style={lbl}>No. RM (MRN) *</label>
          <input style={inp} value={form.mrn} onChange={(e) => set("mrn", e.target.value)} />
        </div>
        <div>
          <label style={lbl}>NIK (16 digit)</label>
          <input style={inp} value={form.nik} onChange={(e) => set("nik", e.target.value)} maxLength={16} />
        </div>
        <div style={{ gridColumn: "1 / 3" }}>
          <label style={lbl}>Nama Lengkap *</label>
          <input style={inp} value={form.nama} onChange={(e) => set("nama", e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Tanggal Lahir</label>
          <input style={inp} type="date" value={form.tgl_lahir} onChange={(e) => set("tgl_lahir", e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Jenis Kelamin</label>
          <select style={inp} value={form.jenis_kelamin} onChange={(e) => set("jenis_kelamin", e.target.value)}>
            <option value="P">Perempuan</option>
            <option value="L">Laki-laki</option>
          </select>
        </div>
        <div style={{ gridColumn: "1 / 3" }}>
          <label style={lbl}>Alamat</label>
          <input style={inp} value={form.alamat} onChange={(e) => set("alamat", e.target.value)} />
        </div>
        <div>
          <label style={lbl}>No. HP</label>
          <input style={inp} value={form.no_hp} onChange={(e) => set("no_hp", e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Penjamin</label>
          <select style={inp} value={form.penjamin} onChange={(e) => set("penjamin", e.target.value)}>
            <option value="UMUM">Umum</option>
            <option value="BPJS">BPJS</option>
            <option value="ASURANSI">Asuransi</option>
          </select>
        </div>
        <div style={{ gridColumn: "1 / 3" }}>
          <label style={lbl}>No. Penjamin (BPJS/Polis)</label>
          <input style={inp} value={form.no_penjamin} onChange={(e) => set("no_penjamin", e.target.value)} />
        </div>
      </div>

      {error && <p style={{ color: sap.red, margin: "10px 0 0" }}>⚠️ {error}</p>}

      <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
        <Btn type="submit" primary icon="💾">{editing ? "Update" : "Simpan"}</Btn>
        <Btn type="button" icon="✖" onClick={onCancel}>Batal</Btn>
      </div>
    </form>
  );
}
