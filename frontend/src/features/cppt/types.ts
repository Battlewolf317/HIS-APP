// =====================================================================
// types.ts — modul CPPT (Catatan Perkembangan Pasien Terintegrasi)
// =====================================================================

export type Profesi = "DOKTER" | "PERAWAT" | "GIZI" | "FARMASI" | "FISIO";

export type Cppt = {
  id: number;
  encounter_id: number;
  profesi: Profesi;
  subjektif: string | null;
  objektif: string | null;
  asesmen: string | null;
  plan: string | null;
  instruksi: string | null;
  petugas: string | null;
  created_at: string;
  encounter_no: string;
  tipe: string;
  pasien_nama: string;
  mrn: string;
};

export type CpptForm = {
  encounter_id: number | "";
  profesi: Profesi;
  subjektif: string;
  objektif: string;
  asesmen: string;
  plan: string;
  instruksi: string;
  petugas: string;
};
