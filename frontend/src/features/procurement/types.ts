// =====================================================================
// types.ts — modul Procurement (pengadaan PR/PO)
// =====================================================================

export type PurchaseStatus = "DRAFT" | "DIAJUKAN" | "DISETUJUI" | "DITERIMA" | "BATAL";

export type Supplier = {
  id: number;
  kode: string;
  nama: string;
  telp: string | null;
  alamat: string | null;
};

export type PurchaseItem = {
  id: number;
  purchase_id: number;
  item_id: number;
  qty: string;
  harga: string;
  subtotal: string;
  qty_terima: string;
  // join
  item_kode: string;
  item_nama: string;
  satuan: string;
};

export type Purchase = {
  id: number;
  no_dok: string;
  supplier_id: number | null;
  keterangan: string | null;
  total: string;
  status: PurchaseStatus;
  requested_by: string | null;
  approved_by: string | null;
  received_at: string | null;
  created_at: string;
  updated_at: string;
  // join / detail
  supplier_nama?: string | null;
  jml_item?: number;
  items?: PurchaseItem[];
};

// baris form item saat buat PR
export type LineInput = {
  item_id: number | "";
  qty: string;
  harga: string;
};

export type PurchaseForm = {
  supplier_id: number | "";
  keterangan: string;
  items: LineInput[];
};
