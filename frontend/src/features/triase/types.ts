// =====================================================================
// types.ts — tipe data modul Triase IGD
// =====================================================================

export type TriaseLevel = "MERAH" | "KUNING" | "HIJAU" | "HITAM";
export type TriaseKategori = "RESUSITASI" | "EMERGENCY" | "URGENT" | "NON_URGENT" | "DOA";

// Baris worklist IGD (encounter + ringkasan triase bila sudah ada)
export type TriaseWorklistRow = {
  encounter_id: number;
  encounter_no: string;
  tgl_masuk: string;
  keluhan: string | null;
  status: string;
  pasien_nama: string;
  patient_id: number;
  triase_id: number | null;
  level: TriaseLevel | null;
  kategori: TriaseKategori | null;
  triase_at: string | null;
};

// Data triase lengkap (1:1 dengan encounter)
export type Triase = {
  id: number;
  encounter_id: number;
  cara_datang: string | null;
  keluhan_utama: string | null;
  td_sistol: number | null;
  td_diastol: number | null;
  nadi: number | null;
  rr: number | null;
  suhu: number | null;
  spo2: number | null;
  gcs: number | null;
  nyeri: number | null;
  kesadaran: string | null;
  level: TriaseLevel | null;
  kategori: TriaseKategori | null;
  tindakan_awal: string | null;
  petugas: string | null;
  created_at: string;
  updated_at: string;
};

// Encounter ringkas (dari detail by-encounter)
export type EncounterInfo = {
  id: number;
  encounter_no: string;
  tipe: string;
  poli: string | null;
  dokter: string | null;
  keluhan: string | null;
  tgl_masuk: string;
  status: string;
  patient_nama: string;
  patient_mrn: string;
};

export type TriaseDetail = {
  encounter: EncounterInfo;
  triase: Triase | null;
};

// Form input (semua opsional kecuali keluhan_utama & level)
export type TriaseForm = {
  cara_datang: string;
  keluhan_utama: string;
  td_sistol: string;
  td_diastol: string;
  nadi: string;
  rr: string;
  suhu: string;
  spo2: string;
  gcs: string;
  nyeri: string;
  kesadaran: string;
  level: TriaseLevel | "";
  kategori: TriaseKategori | "";
  tindakan_awal: string;
  petugas: string;
};
