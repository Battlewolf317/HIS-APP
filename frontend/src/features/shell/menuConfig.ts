// =====================================================================
// menuConfig.ts — daftar menu sidebar PER ROLE (parameter karyawan).
// Mirip "Work Environment" SAP IS-H: tiap role lihat menu berbeda.
// pageKey menentukan komponen mana yang dirender di area konten.
//
// STRUKTUR GRUP mengikuti referensi SIMRS (REFERENSI_SIMRS_FITUR_LENGKAP.md):
//   A. Pelayanan Klinis Inti   C. Penunjang Medis
//   D. Billing & Kasir         E. Keuangan & Akuntansi
//   F. Inventory & Logistik    I. Pelaporan & Mutu
//   + Master Data, Administrasi Sistem
// =====================================================================

export type PageKey = "pasien" | "profil" | "kunjungan" | "triase" | "diet" | "rujukan" | "operasi" | "dpjp" | "discharge" | "jasamedis" | "cppt" | "askep" | "consent" | "inventory" | "farmasi" | "procurement" | "sdm" | "lab" | "radiologi" | "fisioterapi" | "mcu" | "transfusi" | "bed" | "dashboard" | "laporan" | "antrian" | "master" | "claim" | "akuntansi" | "audit";

export type MenuItem = {
  key: PageKey;
  label: string;
};

export type MenuGroup = {
  title: string;       // judul folder (mis. "A. Pelayanan Klinis Inti")
  items: MenuItem[];
};

export type WorkEnv = {
  code: string;        // kode lingkungan kerja (mis. "1600 OP Nurse")
  label: string;       // nama role yang tampil
  groups: MenuGroup[];
};

// Menu per role. admin = super set (lihat semua), disusun mengikuti
// kategori modul SIMRS pada dokumen referensi.
const ROLE_MENU: Record<string, WorkEnv> = {
  admin: {
    code: "0000 Administrator",
    label: "Administrator",
    groups: [
      { title: "A. Pelayanan Klinis Inti", items: [
        { key: "pasien", label: "Registrasi Pasien" },
        { key: "kunjungan", label: "Kunjungan / ADT (RJ·RI·IGD)" },
        { key: "triase", label: "Triase IGD" },
        { key: "antrian", label: "Antrian Poli" },
        { key: "bed", label: "Kamar Inap (Bed Board)" },
        { key: "dpjp", label: "DPJP (Dokter Penanggung Jawab)" },
        { key: "operasi", label: "Operasi / Jadwal OT" },
        { key: "rujukan", label: "Rujukan (SISRUTE)" },
        { key: "diet", label: "Diet Pasien / Nutrition" },
        { key: "discharge", label: "Resume / Resep Pulang" },
      ] },
      { title: "B. Rekam Medis (EMR)", items: [
        { key: "cppt", label: "CPPT (Catatan Terintegrasi)" },
        { key: "askep", label: "Asuhan Keperawatan" },
        { key: "consent", label: "Informed Consent" },
      ] },
      { title: "C. Penunjang Medis", items: [
        { key: "lab", label: "Laboratorium (LIS)" },
        { key: "radiologi", label: "Radiologi (RIS)" },
        { key: "fisioterapi", label: "Fisioterapi" },
        { key: "mcu", label: "Medical Check Up (MCU)" },
        { key: "transfusi", label: "Unit Transfusi Darah" },
      ] },
      { title: "D·E. Keuangan & Akuntansi", items: [
        { key: "claim", label: "Piutang & Klaim" },
        { key: "jasamedis", label: "Jasa Medis Dokter" },
        { key: "akuntansi", label: "Jurnal & Akuntansi" },
      ] },
      { title: "F. Inventory & Logistik", items: [
        { key: "farmasi", label: "Farmasi / Dispensing Resep" },
        { key: "inventory", label: "Inventory Obat & Alkes" },
        { key: "procurement", label: "Pengadaan (PR/PO)" },
      ] },
      { title: "H. SDM / Kepegawaian", items: [
        { key: "sdm", label: "Pegawai & Presensi" },
      ] },
      { title: "I. Pelaporan & Mutu", items: [
        { key: "dashboard", label: "Dashboard & Grafik" },
        { key: "laporan", label: "Laporan RS (BOR/ALOS/Sensus)" },
      ] },
      { title: "Master Data", items: [
        { key: "master", label: "Master Data (Poli/Dokter/Tarif)" },
      ] },
      { title: "Administrasi Sistem", items: [
        { key: "audit", label: "Audit Log" },
      ] },
    ],
  },
  perawat: {
    code: "1600 OP Nurse",
    label: "Perawat",
    groups: [
      {
        title: "A. Pelayanan Klinis Inti",
        items: [
          { key: "pasien", label: "Registrasi Pasien" },
          { key: "kunjungan", label: "Daftar Kunjungan" },
          { key: "triase", label: "Triase IGD" },
          { key: "antrian", label: "Antrian Poli" },
          { key: "bed", label: "Kamar Inap (Bed Board)" },
          { key: "dpjp", label: "DPJP" },
          { key: "operasi", label: "Operasi / Jadwal OT" },
          { key: "rujukan", label: "Rujukan (SISRUTE)" },
          { key: "diet", label: "Diet Pasien / Nutrition" },
        ],
      },
      {
        title: "B. Rekam Medis (EMR)",
        items: [
          { key: "cppt", label: "CPPT (Catatan Terintegrasi)" },
          { key: "askep", label: "Asuhan Keperawatan" },
          { key: "consent", label: "Informed Consent" },
        ],
      },
      {
        title: "C. Penunjang Medis",
        items: [
          { key: "fisioterapi", label: "Fisioterapi" },
          { key: "mcu", label: "Medical Check Up" },
          { key: "transfusi", label: "Unit Transfusi Darah" },
        ],
      },
    ],
  },
  dokter: {
    code: "1600 OP Physician",
    label: "Dokter",
    groups: [
      {
        title: "A. Pelayanan Klinis Inti",
        items: [
          { key: "kunjungan", label: "Kunjungan Pasien" },
          { key: "triase", label: "Triase IGD" },
          { key: "dpjp", label: "DPJP" },
          { key: "operasi", label: "Operasi / Jadwal OT" },
          { key: "rujukan", label: "Rujukan (SISRUTE)" },
          { key: "diet", label: "Diet Pasien / Nutrition" },
          { key: "discharge", label: "Resume / Resep Pulang" },
        ],
      },
      {
        title: "B. Rekam Medis (EMR)",
        items: [
          { key: "cppt", label: "CPPT (Catatan Terintegrasi)" },
          { key: "askep", label: "Asuhan Keperawatan" },
          { key: "consent", label: "Informed Consent" },
        ],
      },
      {
        title: "C. Penunjang Medis",
        items: [
          { key: "fisioterapi", label: "Fisioterapi" },
          { key: "mcu", label: "Medical Check Up" },
          { key: "transfusi", label: "Unit Transfusi Darah" },
        ],
      },
      {
        title: "D. Billing & Kasir",
        items: [{ key: "jasamedis", label: "Jasa Medis Dokter" }],
      },
    ],
  },
  kasir: {
    code: "1100 Cashier",
    label: "Kasir",
    groups: [
      {
        title: "D. Billing & Kasir",
        items: [{ key: "kunjungan", label: "Tagihan Kunjungan" }],
      },
      {
        title: "E. Keuangan & Akuntansi",
        items: [
          { key: "claim", label: "Piutang & Klaim" },
          { key: "jasamedis", label: "Jasa Medis Dokter" },
        ],
      },
    ],
  },
  gudang: {
    code: "2000 Warehouse",
    label: "Petugas Gudang",
    groups: [
      {
        title: "F. Inventory & Logistik",
        items: [
          { key: "inventory", label: "Inventory / Gudang" },
          { key: "procurement", label: "Pengadaan (PR/PO)" },
        ],
      },
    ],
  },
  farmasi: {
    code: "3000 Pharmacy",
    label: "Apoteker / Farmasi",
    groups: [
      {
        title: "F. Inventory & Logistik",
        items: [
          { key: "farmasi", label: "Dispensing Resep" },
          { key: "inventory", label: "Stok Obat & Alkes" },
        ],
      },
    ],
  },
  lab: {
    code: "4000 Laboratory",
    label: "Analis Lab",
    groups: [
      {
        title: "C. Penunjang Medis",
        items: [{ key: "lab", label: "Worklist Lab (LIS)" }],
      },
    ],
  },
  radiologi: {
    code: "5000 Radiology",
    label: "Radiografer",
    groups: [
      {
        title: "C. Penunjang Medis",
        items: [{ key: "radiologi", label: "Worklist Radiologi (RIS)" }],
      },
    ],
  },
};

// ambil work environment sesuai role (fallback: cuma kunjungan)
export function getWorkEnv(role: string): WorkEnv {
  return (
    ROLE_MENU[role] ?? {
      code: role,
      label: role,
      groups: [{ title: "A. Pelayanan Klinis Inti", items: [{ key: "kunjungan", label: "Kunjungan" }] }],
    }
  );
}
