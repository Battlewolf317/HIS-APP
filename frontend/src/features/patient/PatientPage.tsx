import { useState, useEffect } from "react";
import type { Patient } from "./types";
import { getPatients, deletePatient } from "./patientApi";
import PatientForm from "./PatientForm";
import PatientList from "./PatientList";
import { Toolbar, Btn } from "../shell/ui";

export default function PatientPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function muat() {
    setLoading(true);
    try {
      setPatients(await getPatients());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
  }, []);

  function bukaBaru() {
    setEditing(null);
    setFormOpen(true);
  }
  function bukaEdit(p: Patient) {
    setEditing(p);
    setFormOpen(true);
  }
  function tutupForm() {
    setEditing(null);
    setFormOpen(false);
  }
  function onSaved() {
    tutupForm();
    muat();
  }
  async function onDelete(p: Patient) {
    if (!confirm(`Cancel pasien ${p.nama}?`)) return;
    await deletePatient(p.id);
    muat();
  }

  return (
    <div>
      <Toolbar>
        <Btn icon="➕" primary onClick={bukaBaru}>Pasien Baru</Btn>
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#6a6d70" }}>
          {!loading && `${patients.length} pasien`}
        </span>
      </Toolbar>

      {formOpen && (
        <PatientForm editing={editing} onSaved={onSaved} onCancel={tutupForm} />
      )}

      {loading ? (
        <p>Memuat data...</p>
      ) : (
        <PatientList patients={patients} onEdit={bukaEdit} onDelete={onDelete} />
      )}
    </div>
  );
}
