// Farmasi / Dispensing
export type PendingResep = {
  id: number;
  encounter_id: number;
  deskripsi: string;
  harga: string;
  status: string;
  created_at: string;
  encounter_no: string;
  pasien: string;
  mrn: string;
};

export type DispenseRecord = {
  id: number;
  order_id: number;
  item_id: number;
  qty: string;
  dispensed_by: string | null;
  dispensed_at: string;
  kode: string;
  item_nama: string;
  satuan: string;
};

export type DispenseInput = {
  order_id: number;
  item_id: number;
  qty: number;
};
