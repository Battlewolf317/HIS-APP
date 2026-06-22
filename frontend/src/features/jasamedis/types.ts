// =====================================================================
// types.ts — modul Jasa Medis Dokter
// =====================================================================

export type JasaJenis = "KONSUL" | "VISITE" | "TINDAKAN" | "OPERASI";
export type JasaStatus = "DRAFT" | "DISETUJUI" | "DIBAYAR";

export type JasaMedis = {
  id: number;
  encounter_id: number;
  dokter: string;
  jenis: JasaJenis;
  deskripsi: string | null;
  jumlah: string;        // NUMERIC datang sebagai string dari pg
  status: JasaStatus;
  petugas: string | null;
  created_at: string;
  updated_at: string;
  // hasil JOIN
  encounter_no: string;
  tipe: string;
  pasien_nama: string;
  mrn: string;
};

export type JasaForm = {
  encounter_id: number | "";
  dokter: string;
  jenis: JasaJenis;
  deskripsi: string;
  jumlah: string;
  petugas: string;
};
