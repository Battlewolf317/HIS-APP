// Rekam medis ringkas (SOAP)
export type MedicalRecord = {
  id: number;
  encounter_id: number;
  anamnesa: string | null;       // S
  pemeriksaan: string | null;    // O
  diagnosa_code: string | null;  // A
  diagnosa_nama: string | null;
  tindak_lanjut: string | null;  // P
  dokter: string | null;
  created_at: string;
  updated_at: string;
};

export type MedicalRecordInput = {
  encounter_id: number;
  anamnesa: string;
  pemeriksaan: string;
  diagnosa_code: string;
  tindak_lanjut: string;
};
