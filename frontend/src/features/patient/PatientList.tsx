import type { Patient } from "./types";
import { th, td, tableStyle, sap, Btn } from "../shell/ui";
import { PatientLink, useProfile } from "../profil/profileContext";

type Props = {
  patients: Patient[];
  onEdit: (p: Patient) => void;
  onDelete: (p: Patient) => void;
};

export default function PatientList({ patients, onEdit, onDelete }: Props) {
  const { canView, open } = useProfile();
  if (patients.length === 0) {
    return <p style={{ color: sap.textSub }}>Belum ada data pasien.</p>;
  }

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={th}>No. RM</th>
          <th style={th}>Nama</th>
          <th style={th}>JK</th>
          <th style={th}>Penjamin</th>
          <th style={th}>No. HP</th>
          <th style={th}>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {patients.map((p, i) => (
          <tr key={p.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
            <td style={{ ...td, fontFamily: "monospace" }}>
              <PatientLink patientId={p.id}>{p.mrn}</PatientLink>
            </td>
            <td style={td}>
              <PatientLink patientId={p.id}>{p.nama}</PatientLink>
            </td>
            <td style={td}>{p.jenis_kelamin}</td>
            <td style={td}>
              {p.penjamin}
              {p.no_penjamin ? <span style={{ color: sap.textSub }}> ({p.no_penjamin})</span> : ""}
            </td>
            <td style={td}>{p.no_hp}</td>
            <td style={{ ...td, whiteSpace: "nowrap", display: "flex", gap: 4 }}>
              {canView && <Btn icon="👤" onClick={() => open(p.id)}>Profil</Btn>}
              <Btn icon="✏️" onClick={() => onEdit(p)}>Edit</Btn>
              <Btn icon="🗑️" danger onClick={() => onDelete(p)}>Hapus</Btn>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
