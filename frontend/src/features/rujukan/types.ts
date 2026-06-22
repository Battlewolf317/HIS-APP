// =====================================================================
// types.ts — modul Rujukan (SISRUTE)
// =====================================================================

export type RujukanArah = "KELUAR" | "MASUK";
export type RujukanStatus = "DRAFT" | "DIKIRIM" | "DITERIMA" | "DITOLAK" | "SELESAI";

export type Rujukan = {
  id: number;
  encounter_id: number;
  arah: RujukanArah;
  faskes_tujuan: string | null;
  faskes_asal: string | null;
  spesialis: string | null;
  diagnosa_code: string | null;
  diagnosa_nama: string | null;
  alasan: string;
  kondisi: string | null;
  no_rujukan: string | null;
  status: RujukanStatus;
  petugas: string | null;
  tgl_rujuk: string;
  created_at: string;
  updated_at: string;
  // hasil JOIN
  encounter_no: string;
  tipe: string;
  pasien_nama: string;
  mrn: string;
};

export type RujukanForm = {
  encounter_id: number | "";
  arah: RujukanArah;
  faskes_tujuan: string;
  faskes_asal: string;
  spesialis: string;
  diagnosa_code: string;
  alasan: string;
  kondisi: string;
  no_rujukan: string;
  petugas: string;
};
