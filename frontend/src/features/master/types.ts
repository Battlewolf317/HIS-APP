// Master Data (P7) — generik
export type MasterRow = Record<string, string | number | null> & { id: number };

export type FieldDef = { key: string; label: string; type?: "text" | "number" };

export const ENTITY_FIELDS: Record<string, FieldDef[]> = {
  poli: [
    { key: "kode", label: "Kode" },
    { key: "nama", label: "Nama Poli" },
  ],
  dokter: [
    { key: "kode", label: "Kode" },
    { key: "nama", label: "Nama Dokter" },
    { key: "spesialisasi", label: "Spesialisasi" },
    { key: "poli", label: "Poli" },
  ],
  tarif: [
    { key: "kode", label: "Kode" },
    { key: "nama", label: "Nama Layanan" },
    { key: "kategori", label: "Kategori" },
    { key: "harga", label: "Harga", type: "number" },
  ],
  penjamin: [
    { key: "kode", label: "Kode" },
    { key: "nama", label: "Nama Penjamin" },
    { key: "jenis", label: "Jenis (BPJS/ASURANSI/PERUSAHAAN)" },
  ],
};

export const ENTITY_LABEL: Record<string, string> = {
  poli: "Poli",
  dokter: "Dokter",
  tarif: "Tarif Layanan",
  penjamin: "Penjamin",
};
