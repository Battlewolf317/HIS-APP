// Bentuk data kunjungan (encounter / ADT)
export type Encounter = {
  id: number;
  encounter_no: string;
  patient_id: number;
  tipe: string;              // RJ / RI / IGD
  poli: string | null;
  dokter: string | null;
  keluhan: string | null;
  tgl_masuk: string | null;
  tgl_keluar: string | null;
  status: string;            // AKTIF / SELESAI / BATAL
  cancelled: boolean;
  created_at: string;
  updated_at: string;
  // hasil JOIN dari backend
  patient_nama?: string;
  patient_mrn?: string;
};

// Data buat form (nomor kunjungan di-generate backend, jadi ga ada di sini)
export type EncounterInput = {
  patient_id: number | "";
  tipe: string;
  poli: string;
  dokter: string;
  keluhan: string;
};
