// =====================================================================
// types.ts — modul Asuhan Keperawatan (SDKI/SLKI/SIKI)
// =====================================================================

export type AskepStatus = "AKTIF" | "TERATASI" | "BATAL";

export type Askep = {
  id: number;
  encounter_id: number;
  diagnosa_kep: string;
  luaran: string | null;
  intervensi: string | null;
  evaluasi: string | null;
  status: AskepStatus;
  perawat: string | null;
  created_at: string;
  updated_at: string;
  encounter_no: string;
  tipe: string;
  pasien_nama: string;
  mrn: string;
};

export type AskepForm = {
  encounter_id: number | "";
  diagnosa_kep: string;
  luaran: string;
  intervensi: string;
  evaluasi: string;
  perawat: string;
};
