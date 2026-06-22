import type { Encounter } from "./types";
import { th, td, tableStyle, sap, Btn, Badge } from "../shell/ui";
import { PatientLink } from "../profil/profileContext";

type Props = {
  encounters: Encounter[];
  onEdit: (e: Encounter) => void;
  onSelesai: (e: Encounter) => void;
  onDelete: (e: Encounter) => void;
  onMedrec: (e: Encounter) => void;
  onBill: (e: Encounter) => void;
  onOrder: (e: Encounter) => void;
};

const STATUS_COLOR: Record<string, string> = {
  AKTIF: sap.green,
  SELESAI: sap.textSub,
  BATAL: sap.red,
};

const TIPE_LABEL: Record<string, string> = {
  RJ: "Rawat Jalan",
  RI: "Rawat Inap",
  IGD: "IGD",
};

export default function EncounterList({ encounters, onEdit, onSelesai, onDelete, onMedrec, onBill, onOrder }: Props) {
  if (encounters.length === 0) {
    return <p style={{ color: sap.textSub }}>Belum ada data kunjungan.</p>;
  }

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={th}>No. Kunjungan</th>
          <th style={th}>Pasien</th>
          <th style={th}>Tipe</th>
          <th style={th}>Poli / Ruang</th>
          <th style={th}>Dokter</th>
          <th style={th}>Status</th>
          <th style={th}>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {encounters.map((e, i) => (
          <tr key={e.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
            <td style={{ ...td, fontFamily: "monospace" }}>{e.encounter_no}</td>
            <td style={td}>
              <PatientLink patientId={e.patient_id}>{e.patient_nama}</PatientLink>
              <span style={{ color: sap.textSub, fontSize: 12 }}> ({e.patient_mrn})</span>
            </td>
            <td style={td}>{TIPE_LABEL[e.tipe] ?? e.tipe}</td>
            <td style={td}>{e.poli}</td>
            <td style={td}>{e.dokter}</td>
            <td style={td}><Badge text={e.status} color={STATUS_COLOR[e.status] ?? sap.textSub} /></td>
            <td style={{ ...td, whiteSpace: "nowrap" }}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                <Btn icon="📋" onClick={() => onMedrec(e)}>Rekam Medis</Btn>
                <Btn icon="🧪" onClick={() => onOrder(e)}>Order</Btn>
                <Btn icon="💰" onClick={() => onBill(e)}>Billing</Btn>
                {e.status === "AKTIF" && (
                  <>
                    <Btn icon="✏️" onClick={() => onEdit(e)}>Edit</Btn>
                    <Btn icon="✔" onClick={() => onSelesai(e)}>Selesai</Btn>
                  </>
                )}
                <Btn icon="🗑️" danger onClick={() => onDelete(e)}>Hapus</Btn>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
