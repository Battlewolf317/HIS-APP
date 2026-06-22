// Bed Management / Rawat Inap
export type Bed = {
  id: number;
  kode_bed: string;
  status: string;          // KOSONG / TERISI / MAINTENANCE
  encounter_id: number | null;
  ward_id: number;
  ward_kode: string;
  ward_nama: string;
  kelas: string | null;
  encounter_no: string | null;
  pasien: string | null;
  mrn: string | null;
};

export type Admittable = {
  id: number;              // encounter_id
  encounter_no: string;
  poli: string | null;
  dokter: string | null;
  pasien: string;
  mrn: string;
};
