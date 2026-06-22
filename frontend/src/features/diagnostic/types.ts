// Penunjang Diagnostik (Lab LIS / Radiologi RIS) — berbasis clinical_order
export type DiagOrder = {
  id: number;
  encounter_id: number;
  jenis: string;        // LAB / RAD
  deskripsi: string;
  harga?: string;
  status: string;       // PENDING / DONE
  hasil: string | null;
  created_at?: string;
  updated_at?: string;
  encounter_no: string;
  pasien: string;
  mrn: string;
};
