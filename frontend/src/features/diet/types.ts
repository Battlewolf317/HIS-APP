// =====================================================================
// types.ts — modul Diet Pasien / Nutrition
// =====================================================================

export type DietStatus = "AKTIF" | "SELESAI" | "BATAL";

export type Diet = {
  id: number;
  encounter_id: number;
  jenis_diet: string;
  bentuk: string | null;
  kalori: number | null;
  jadwal: string | null;
  pantangan: string | null;
  catatan: string | null;
  status: DietStatus;
  petugas: string | null;
  created_at: string;
  updated_at: string;
  // hasil JOIN
  encounter_no: string;
  tipe: string;
  pasien_nama: string;
  mrn: string;
};

export type DietForm = {
  encounter_id: number | "";
  jenis_diet: string;
  bentuk: string;
  kalori: string;
  jadwal: string;
  pantangan: string;
  catatan: string;
  petugas: string;
};
