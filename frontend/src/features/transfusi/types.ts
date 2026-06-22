// =====================================================================
// types.ts — modul Unit Transfusi Darah (UTD)
// =====================================================================

export type TransfusiStatus = "DIMINTA" | "CROSSMATCH" | "SIAP" | "DISERAHKAN" | "BATAL";

export type Transfusi = {
  id: number;
  encounter_id: number;
  gol_darah: string;
  rhesus: string;
  komponen: string;
  jumlah_kantong: number;
  indikasi: string | null;
  no_kantong: string | null;
  crossmatch: string | null;
  status: TransfusiStatus;
  petugas: string | null;
  created_at: string;
  updated_at: string;
  encounter_no: string;
  tipe: string;
  pasien_nama: string;
  mrn: string;
};

export type TransfusiForm = {
  encounter_id: number | "";
  gol_darah: string;
  rhesus: string;
  komponen: string;
  jumlah_kantong: string;
  indikasi: string;
  no_kantong: string;
  crossmatch: string;
  petugas: string;
};
