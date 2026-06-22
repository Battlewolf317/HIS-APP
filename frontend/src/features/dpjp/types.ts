// =====================================================================
// types.ts — modul DPJP (Dokter Penanggung Jawab Pelayanan)
// =====================================================================

export type DpjpPeran = "UTAMA" | "KONSULEN" | "ALIH";
export type DpjpStatus = "AKTIF" | "SELESAI";

export type Dpjp = {
  id: number;
  encounter_id: number;
  dokter: string;
  spesialisasi: string | null;
  peran: DpjpPeran;
  tgl_mulai: string;
  tgl_selesai: string | null;
  status: DpjpStatus;
  catatan: string | null;
  petugas: string | null;
  created_at: string;
  updated_at: string;
  // hasil JOIN
  encounter_no: string;
  tipe: string;
  pasien_nama: string;
  mrn: string;
};

export type DpjpForm = {
  encounter_id: number | "";
  dokter: string;
  spesialisasi: string;
  peran: DpjpPeran;
  tgl_mulai: string;
  tgl_selesai: string;
  catatan: string;
  petugas: string;
};
