// =====================================================================
// types.ts — modul Fisioterapi
// =====================================================================

export type FisioStatus = "AKTIF" | "SELESAI" | "BATAL";

export type Fisioterapi = {
  id: number;
  encounter_id: number;
  jenis_terapi: string;
  diagnosa: string | null;
  modalitas: string | null;
  jumlah_sesi: number;
  sesi_selesai: number;
  status: FisioStatus;
  terapis: string | null;
  catatan: string | null;
  created_at: string;
  updated_at: string;
  encounter_no: string;
  tipe: string;
  pasien_nama: string;
  mrn: string;
};

export type FisioForm = {
  encounter_id: number | "";
  jenis_terapi: string;
  diagnosa: string;
  modalitas: string;
  jumlah_sesi: string;
  terapis: string;
  catatan: string;
};
