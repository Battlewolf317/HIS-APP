// Inventory / Gudang — master stok + kartu stok
export type InvItem = {
  id: number;
  kode: string;
  nama: string;
  kategori: string;   // OBAT / ALKES
  satuan: string;     // PC / TAB / BOX ...
  stok: string;
  stok_min: string;
  harga: string;
  cancelled: boolean;
  created_at: string;
  updated_at: string;
};

export type InvItemInput = {
  kode: string;
  nama: string;
  kategori: string;
  satuan: string;
  stok?: number;       // hanya saat create (saldo awal)
  stok_min: number;
  harga: number;
};

export type InvMovement = {
  id: number;
  item_id: number;
  tipe: string;        // IN / OUT / ADJ
  qty: string;
  stok_before: string;
  stok_after: string;
  ref: string | null;
  keterangan: string | null;
  created_by: string | null;
  created_at: string;
};

export type MovementInput = {
  item_id: number;
  tipe: string;
  qty: number;
  ref?: string;
  keterangan?: string;
};
