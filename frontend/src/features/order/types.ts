// Order / CPOE — permintaan layanan klinis
export type ClinicalOrder = {
  id: number;
  encounter_id: number;
  jenis: string;       // LAB / RAD / RESEP
  deskripsi: string;
  harga: string;
  status: string;      // PENDING / DONE / BATAL
  hasil: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderInput = {
  encounter_id: number;
  jenis: string;
  deskripsi: string;
  harga: number;
};
