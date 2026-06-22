// =====================================================================
// config/db.js — koneksi PostgreSQL (dipakai semua modul)
// =====================================================================

import "dotenv/config";
import pkg from "pg";
import bcrypt from "bcryptjs";
const { Pool } = pkg;

// Pool koneksi.
//  - Production / managed Postgres (Neon/Railway/Render): pakai DATABASE_URL + SSL.
//  - Lokal/dev: tanpa DATABASE_URL → baca PG* env / default.
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // managed Postgres butuh SSL
      }
    : undefined
);

// ---------------------------------------------------------------------
// initDb: bikin tabel patient (kalau belum ada) + seed data contoh.
// Data model lebih lengkap, mendekati kebutuhan RS.
// ---------------------------------------------------------------------
export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS patient (
      id            SERIAL PRIMARY KEY,
      mrn           VARCHAR(20)  NOT NULL,         -- nomor rekam medis
      nik           VARCHAR(16),                   -- NIK KTP
      nama          VARCHAR(100) NOT NULL,
      tgl_lahir     DATE,
      jenis_kelamin CHAR(1),                       -- L / P
      alamat        TEXT,
      no_hp         VARCHAR(20),
      penjamin      VARCHAR(20)  DEFAULT 'UMUM',   -- UMUM / BPJS / ASURANSI
      no_penjamin   VARCHAR(30),                   -- no BPJS / polis asuransi
      cancelled     BOOLEAN      DEFAULT false,    -- soft delete
      created_at    TIMESTAMP    DEFAULT now(),
      updated_at    TIMESTAMP    DEFAULT now()
    )
  `);

  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM patient");
  if (rows[0].n === 0) {
    await pool.query(
      `INSERT INTO patient (mrn, nik, nama, tgl_lahir, jenis_kelamin, alamat, no_hp, penjamin, no_penjamin)
       VALUES
       ($1,$2,$3,$4,$5,$6,$7,$8,$9),
       ($10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [
        "RM000001", "3173010101900001", "AURELYN N TRAVERS", "1990-01-01", "P", "Jl. Mawar No. 1, Jakarta", "08123456789", "BPJS", "0001234567890",
        "RM000002", "3173020202850002", "BUDI SANTOSO",      "1985-02-02", "L", "Jl. Melati No. 2, Jakarta", "08129876543", "UMUM", null,
      ]
    );
    console.log("📦 Data contoh pasien dibuat (seed)");
  }

  // -------------------------------------------------------------------
  // Tabel encounter (kunjungan / ADT) — nyambung ke patient via patient_id
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS encounter (
      id            SERIAL PRIMARY KEY,
      encounter_no  VARCHAR(20)  NOT NULL,                 -- nomor kunjungan (auto)
      patient_id    INT          NOT NULL REFERENCES patient(id),
      tipe          VARCHAR(10)  NOT NULL DEFAULT 'RJ',    -- RJ / RI / IGD
      poli          VARCHAR(50),                           -- poliklinik / ruangan
      dokter        VARCHAR(100),
      keluhan       TEXT,
      tgl_masuk     TIMESTAMP    DEFAULT now(),
      tgl_keluar    TIMESTAMP,                             -- diisi saat status SELESAI
      status        VARCHAR(10)  DEFAULT 'AKTIF',          -- AKTIF / SELESAI / BATAL
      cancelled     BOOLEAN      DEFAULT false,            -- soft delete
      created_at    TIMESTAMP    DEFAULT now(),
      updated_at    TIMESTAMP    DEFAULT now()
    )
  `);

  const enc = await pool.query("SELECT COUNT(*)::int AS n FROM encounter");
  if (enc.rows[0].n === 0) {
    await pool.query(
      `INSERT INTO encounter (encounter_no, patient_id, tipe, poli, dokter, keluhan, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      ["ENC20260614001", 1, "RJ", "Poli Penyakit Dalam", "dr. SETYA W, Sp.PD", "Demam 3 hari, batuk", "AKTIF"]
    );
    console.log("📦 Data contoh kunjungan dibuat (seed)");
  }

  // -------------------------------------------------------------------
  // Tabel icd10 (master diagnosa) — dipakai modul EMR buat pilih diagnosa
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS icd10 (
      code      VARCHAR(10) PRIMARY KEY,    -- kode ICD-10 (mis. J06.9)
      name      VARCHAR(200) NOT NULL,      -- nama diagnosa
      category  VARCHAR(100)                -- kelompok (opsional)
    )
  `);

  const icd = await pool.query("SELECT COUNT(*)::int AS n FROM icd10");
  if (icd.rows[0].n === 0) {
    await pool.query(
      `INSERT INTO icd10 (code, name, category) VALUES
       ('J00',   'Nasofaringitis akut (common cold)',                'Pernapasan'),
       ('J06.9', 'Infeksi saluran napas atas akut, tidak spesifik',  'Pernapasan'),
       ('J18.9', 'Pneumonia, tidak spesifik',                        'Pernapasan'),
       ('J45.9', 'Asma, tidak spesifik',                             'Pernapasan'),
       ('A09',   'Diare dan gastroenteritis',                        'Pencernaan'),
       ('A01.0', 'Demam tifoid',                                     'Infeksi'),
       ('K30',   'Dispepsia fungsional',                             'Pencernaan'),
       ('K35.80','Apendisitis akut',                                 'Pencernaan'),
       ('I10',   'Hipertensi esensial (primer)',                     'Kardiovaskular'),
       ('E11.9', 'Diabetes melitus tipe 2 tanpa komplikasi',         'Endokrin'),
       ('B34.9', 'Infeksi virus, tidak spesifik',                    'Infeksi'),
       ('R50.9', 'Demam, tidak spesifik',                            'Gejala'),
       ('R51',   'Nyeri kepala (sefalgia)',                          'Gejala'),
       ('M54.5', 'Nyeri punggung bawah (low back pain)',             'Muskuloskeletal'),
       ('N39.0', 'Infeksi saluran kemih (ISK)',                      'Urogenital'),
       ('A15.0', 'Tuberkulosis paru',                                'Infeksi'),
       ('E78.5', 'Hiperlipidemia, tidak spesifik',                   'Endokrin'),
       ('K29.7', 'Gastritis, tidak spesifik',                        'Pencernaan'),
       ('J02.9', 'Faringitis akut, tidak spesifik',                  'Pernapasan'),
       ('L23.9', 'Dermatitis kontak alergi, tidak spesifik',         'Kulit')`
    );
    console.log("📦 Data master ICD-10 dibuat (seed)");
  }

  // -------------------------------------------------------------------
  // Tabel medical_record (rekam medis ringkas SOAP) — nempel ke encounter
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS medical_record (
      id            SERIAL PRIMARY KEY,
      encounter_id  INT  NOT NULL REFERENCES encounter(id),
      anamnesa      TEXT,                       -- S (Subjective): keluhan pasien
      pemeriksaan   TEXT,                       -- O (Objective): hasil periksa
      diagnosa_code VARCHAR(10) REFERENCES icd10(code),  -- A (Assessment)
      diagnosa_nama VARCHAR(200),               -- denormalisasi buat tampil cepat
      tindak_lanjut TEXT,                       -- P (Plan): terapi/rujukan
      dokter        VARCHAR(100),
      created_at    TIMESTAMP DEFAULT now(),
      updated_at    TIMESTAMP DEFAULT now()
    )
  `);

  // -------------------------------------------------------------------
  // Triase IGD — penilaian awal pasien gawat darurat (1:1 dengan encounter IGD)
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS triase (
      id            SERIAL PRIMARY KEY,
      encounter_id  INT NOT NULL UNIQUE REFERENCES encounter(id),
      cara_datang   VARCHAR(15) DEFAULT 'MANDIRI',   -- MANDIRI/AMBULANS/RUJUKAN
      keluhan_utama TEXT,
      td_sistol     INT,                              -- tekanan darah sistolik
      td_diastol    INT,                              -- diastolik
      nadi          INT,                              -- x/menit
      rr            INT,                              -- respiratory rate x/menit
      suhu          NUMERIC(4,1),                     -- celcius
      spo2          INT,                              -- saturasi %
      gcs           INT,                              -- 3-15
      nyeri         INT,                              -- skala 0-10
      kesadaran     VARCHAR(12) DEFAULT 'CM',         -- CM/APATIS/SOMNOLEN/SOPOR/KOMA
      level         VARCHAR(10),                      -- MERAH/KUNING/HIJAU/HITAM
      kategori      VARCHAR(15),                      -- RESUSITASI/EMERGENCY/URGENT/NON_URGENT/DOA
      tindakan_awal TEXT,
      petugas       VARCHAR(100),
      created_at    TIMESTAMP DEFAULT now(),
      updated_at    TIMESTAMP DEFAULT now()
    )
  `);

  // -------------------------------------------------------------------
  // Tabel bill + bill_item (tagihan per kunjungan)
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bill (
      id            SERIAL PRIMARY KEY,
      encounter_id  INT NOT NULL REFERENCES encounter(id),
      status        VARCHAR(10) DEFAULT 'DRAFT',     -- DRAFT / LUNAS
      total         NUMERIC(14,2) DEFAULT 0,
      paid_at       TIMESTAMP,
      created_at    TIMESTAMP DEFAULT now(),
      updated_at    TIMESTAMP DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bill_item (
      id        SERIAL PRIMARY KEY,
      bill_id   INT NOT NULL REFERENCES bill(id),
      deskripsi VARCHAR(200) NOT NULL,
      qty       INT NOT NULL DEFAULT 1,
      harga     NUMERIC(14,2) NOT NULL DEFAULT 0,
      subtotal  NUMERIC(14,2) NOT NULL DEFAULT 0
    )
  `);

  // -------------------------------------------------------------------
  // Tabel payment (P10 Kasir lanjutan: multi-metode, deposit, refund)
  //  jenis  : BAYAR / DEPOSIT / REFUND
  //  metode : TUNAI / DEBIT / KREDIT / TRANSFER / BPJS / ASURANSI
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment (
      id          SERIAL PRIMARY KEY,
      bill_id     INT NOT NULL REFERENCES bill(id),
      jenis       VARCHAR(10) NOT NULL DEFAULT 'BAYAR',
      metode      VARCHAR(15) NOT NULL,
      jumlah      NUMERIC(14,2) NOT NULL DEFAULT 0,
      keterangan  VARCHAR(200),
      kasir       VARCHAR(60),
      created_at  TIMESTAMP DEFAULT now()
    )
  `);

  // -------------------------------------------------------------------
  // Tabel clinical_order (Order/CPOE: permintaan lab/radiologi/resep)
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clinical_order (
      id            SERIAL PRIMARY KEY,
      encounter_id  INT NOT NULL REFERENCES encounter(id),
      jenis         VARCHAR(10) NOT NULL,            -- LAB / RAD / RESEP
      deskripsi     VARCHAR(200) NOT NULL,
      harga         NUMERIC(14,2) DEFAULT 0,
      status        VARCHAR(10) DEFAULT 'PENDING',   -- PENDING / DONE / BATAL
      hasil         TEXT,                            -- hasil lab/rad atau catatan
      created_at    TIMESTAMP DEFAULT now(),
      updated_at    TIMESTAMP DEFAULT now()
    )
  `);

  // -------------------------------------------------------------------
  // Tabel inv_item (master stok obat & alkes) + inv_movement (kartu stok)
  // Mirip konsep material SAP: kode + satuan (MEINS) + stok berjalan.
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inv_item (
      id          SERIAL PRIMARY KEY,
      kode        VARCHAR(20) UNIQUE NOT NULL,        -- kode material
      nama        VARCHAR(150) NOT NULL,
      kategori    VARCHAR(10) NOT NULL DEFAULT 'OBAT',-- OBAT / ALKES
      satuan      VARCHAR(10) NOT NULL DEFAULT 'PC',  -- unit (mirip MEINS): PC/TAB/BOX
      stok        NUMERIC(14,2) NOT NULL DEFAULT 0,   -- stok berjalan
      stok_min    NUMERIC(14,2) NOT NULL DEFAULT 0,   -- batas minimum (reorder point)
      harga       NUMERIC(14,2) NOT NULL DEFAULT 0,
      cancelled   BOOLEAN DEFAULT false,
      created_at  TIMESTAMP DEFAULT now(),
      updated_at  TIMESTAMP DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inv_movement (
      id           SERIAL PRIMARY KEY,
      item_id      INT NOT NULL REFERENCES inv_item(id),
      tipe         VARCHAR(5) NOT NULL,               -- IN / OUT / ADJ
      qty          NUMERIC(14,2) NOT NULL,            -- jumlah gerakan
      stok_before  NUMERIC(14,2) NOT NULL DEFAULT 0,
      stok_after   NUMERIC(14,2) NOT NULL DEFAULT 0,
      ref          VARCHAR(50),                       -- no faktur / referensi
      keterangan   TEXT,
      created_by   VARCHAR(50),
      created_at   TIMESTAMP DEFAULT now()
    )
  `);

  const inv = await pool.query("SELECT COUNT(*)::int AS n FROM inv_item");
  if (inv.rows[0].n === 0) {
    await pool.query(
      `INSERT INTO inv_item (kode, nama, kategori, satuan, stok, stok_min, harga) VALUES
       ('OBT0001', 'PARACETAMOL 500 MG TABLET',      'OBAT',  'TAB', 500, 100, 500),
       ('OBT0002', 'AMOXICILLIN 500 MG KAPSUL',      'OBAT',  'KAP', 300, 100, 800),
       ('OBT0003', 'OMEPRAZOLE 20 MG KAPSUL',        'OBAT',  'KAP', 80,  100, 1500),
       ('OBT0004', 'RINGER LAKTAT 500 ML INFUS',     'OBAT',  'BTL', 120, 50,  12000),
       ('ALK0001', 'SPUIT 3 ML',                     'ALKES', 'PC',  400, 100, 1200),
       ('ALK0002', 'INFUS SET DEWASA',               'ALKES', 'PC',  60,  50,  8500),
       ('ALK0003', 'HANDSCOON STERIL NO. 7',         'ALKES', 'PSG', 250, 100, 2500),
       ('ALK0004', 'MASKER BEDAH 3 PLY',             'ALKES', 'BOX', 30,  20,  35000)`
    );
    console.log("📦 Data master inventory (obat & alkes) dibuat (seed)");
  }

  // -------------------------------------------------------------------
  // Tabel pharmacy_dispense (P3 Farmasi): jejak dispensing resep (RESEP order)
  //  → potong stok inv_item. 1 baris per dispensing.
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pharmacy_dispense (
      id            SERIAL PRIMARY KEY,
      order_id      INT NOT NULL REFERENCES clinical_order(id),
      item_id       INT NOT NULL REFERENCES inv_item(id),
      qty           NUMERIC(14,2) NOT NULL,
      dispensed_by  VARCHAR(50),
      dispensed_at  TIMESTAMP DEFAULT now()
    )
  `);

  // -------------------------------------------------------------------
  // P6 Rawat Inap & Bed Management: ward (bangsal) + bed (tempat tidur)
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ward (
      id     SERIAL PRIMARY KEY,
      kode   VARCHAR(10) UNIQUE NOT NULL,
      nama   VARCHAR(100) NOT NULL,
      kelas  VARCHAR(10)                      -- VIP / 1 / 2 / 3
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bed (
      id           SERIAL PRIMARY KEY,
      ward_id      INT NOT NULL REFERENCES ward(id),
      kode_bed     VARCHAR(20) NOT NULL,
      status       VARCHAR(15) NOT NULL DEFAULT 'KOSONG',  -- KOSONG / TERISI / MAINTENANCE
      encounter_id INT REFERENCES encounter(id),           -- penghuni saat ini (nullable)
      updated_at   TIMESTAMP DEFAULT now()
    )
  `);

  const wrd = await pool.query("SELECT COUNT(*)::int AS n FROM ward");
  if (wrd.rows[0].n === 0) {
    await pool.query(
      `INSERT INTO ward (kode, nama, kelas) VALUES
       ('MW','Mawar (Kelas 3)','3'),
       ('ML','Melati (Kelas 2)','2'),
       ('AN','Anggrek (Kelas 1)','1'),
       ('VIP','VIP Cendana','VIP')`
    );
    // seed bed per ward
    await pool.query(`
      INSERT INTO bed (ward_id, kode_bed)
      SELECT w.id, w.kode || '-' || g.n
        FROM ward w
        CROSS JOIN (SELECT generate_series(1,4) AS n) g
    `);
    console.log("📦 Data ward & bed dibuat (seed: 4 ward x 4 bed)");
  }

  // -------------------------------------------------------------------
  // P8 Antrian: nomor antrian per poli per tanggal (berbasis encounter)
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS queue (
      id           SERIAL PRIMARY KEY,
      encounter_id INT NOT NULL REFERENCES encounter(id),
      poli         VARCHAR(50),
      queue_no     INT NOT NULL,
      tanggal      DATE NOT NULL DEFAULT current_date,
      status       VARCHAR(12) NOT NULL DEFAULT 'MENUNGGU',  -- MENUNGGU / DIPANGGIL / SELESAI
      called_at    TIMESTAMP,
      created_at   TIMESTAMP DEFAULT now()
    )
  `);

  // -------------------------------------------------------------------
  // P7 Master Data: poli, dokter, tarif (layanan)
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS poli (
      id   SERIAL PRIMARY KEY,
      kode VARCHAR(10) UNIQUE NOT NULL,
      nama VARCHAR(100) NOT NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dokter (
      id           SERIAL PRIMARY KEY,
      kode         VARCHAR(10) UNIQUE NOT NULL,
      nama         VARCHAR(100) NOT NULL,
      spesialisasi VARCHAR(80),
      poli         VARCHAR(100)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tarif (
      id       SERIAL PRIMARY KEY,
      kode     VARCHAR(15) UNIQUE NOT NULL,
      nama     VARCHAR(120) NOT NULL,
      kategori VARCHAR(30),                 -- ADMIN/TINDAKAN/LAB/RAD/KONSUL
      harga    NUMERIC(14,2) NOT NULL DEFAULT 0
    )
  `);

  const pol = await pool.query("SELECT COUNT(*)::int AS n FROM poli");
  if (pol.rows[0].n === 0) {
    await pool.query(`INSERT INTO poli (kode, nama) VALUES
      ('PD','Poli Penyakit Dalam'),('ANAK','Poli Anak'),('BEDAH','Poli Bedah'),
      ('OBG','Poli Obgyn'),('UMUM','Poli Umum'),('GIGI','Poli Gigi')`);
    await pool.query(`INSERT INTO dokter (kode, nama, spesialisasi, poli) VALUES
      ('DR01','dr. SETYA W, Sp.PD','Penyakit Dalam','Poli Penyakit Dalam'),
      ('DR02','dr. RINA, Sp.A','Anak','Poli Anak'),
      ('DR03','dr. BUDI, Sp.B','Bedah','Poli Bedah'),
      ('DR04','dr. JOHN DORIAN','Umum','Poli Umum')`);
    await pool.query(`INSERT INTO tarif (kode, nama, kategori, harga) VALUES
      ('ADM01','Administrasi Pendaftaran','ADMIN',25000),
      ('KON01','Konsultasi Dokter Umum','KONSUL',50000),
      ('KON02','Konsultasi Dokter Spesialis','KONSUL',150000),
      ('LAB01','Pemeriksaan Darah Lengkap','LAB',85000),
      ('RAD01','Rontgen Thorax','RAD',120000),
      ('TND01','Tindakan Jahit Luka','TINDAKAN',200000)`);
    console.log("📦 Data master (poli/dokter/tarif) dibuat (seed)");
  }

  // -------------------------------------------------------------------
  // P11 Piutang & Klaim: penjamin (payer) + claim (klaim ke penjamin)
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS penjamin (
      id    SERIAL PRIMARY KEY,
      kode  VARCHAR(20) UNIQUE NOT NULL,
      nama  VARCHAR(120) NOT NULL,
      jenis VARCHAR(15) NOT NULL DEFAULT 'ASURANSI'   -- BPJS / ASURANSI / PERUSAHAAN
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS claim (
      id            SERIAL PRIMARY KEY,
      no_klaim      VARCHAR(30) UNIQUE NOT NULL,
      penjamin_id   INT NOT NULL REFERENCES penjamin(id),
      encounter_id  INT REFERENCES encounter(id),
      bill_id       INT REFERENCES bill(id),
      pasien        VARCHAR(100),                       -- denormalisasi nama pasien
      jumlah_tagih  NUMERIC(14,2) NOT NULL DEFAULT 0,
      jumlah_setuju NUMERIC(14,2) DEFAULT 0,
      status        VARCHAR(12) NOT NULL DEFAULT 'OPEN', -- OPEN/SUBMITTED/APPROVED/PAID/REJECTED
      tgl_klaim     DATE NOT NULL DEFAULT current_date,
      tgl_bayar     DATE,
      keterangan    VARCHAR(200),
      created_at    TIMESTAMP DEFAULT now(),
      updated_at    TIMESTAMP DEFAULT now()
    )
  `);

  const pjm = await pool.query("SELECT COUNT(*)::int AS n FROM penjamin");
  if (pjm.rows[0].n === 0) {
    await pool.query(`INSERT INTO penjamin (kode, nama, jenis) VALUES
      ('BPJS','BPJS Kesehatan','BPJS'),
      ('INH','Mandiri Inhealth','ASURANSI'),
      ('PRU','Prudential','ASURANSI'),
      ('ADM','Admedika','ASURANSI'),
      ('CORP','PT Sehat Sentosa (Corporate)','PERUSAHAAN')`);
    console.log("📦 Data master penjamin dibuat (seed)");
  }

  // -------------------------------------------------------------------
  // P12 Akuntansi: akun (COA) + jurnal (header) + jurnal_line (double-entry)
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS akun (
      id           SERIAL PRIMARY KEY,
      kode         VARCHAR(10) UNIQUE NOT NULL,
      nama         VARCHAR(100) NOT NULL,
      tipe         VARCHAR(12) NOT NULL,        -- ASET/KEWAJIBAN/EKUITAS/PENDAPATAN/BEBAN
      saldo_normal CHAR(1) NOT NULL DEFAULT 'D' -- D / K
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jurnal (
      id          SERIAL PRIMARY KEY,
      no_jurnal   VARCHAR(30) UNIQUE NOT NULL,
      tanggal     DATE NOT NULL DEFAULT current_date,
      keterangan  VARCHAR(200),
      ref_tipe    VARCHAR(15),                 -- PAYMENT / CLAIM / MANUAL
      ref_id      INT,
      created_at  TIMESTAMP DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jurnal_line (
      id        SERIAL PRIMARY KEY,
      jurnal_id INT NOT NULL REFERENCES jurnal(id) ON DELETE CASCADE,
      akun_id   INT NOT NULL REFERENCES akun(id),
      debit     NUMERIC(14,2) NOT NULL DEFAULT 0,
      kredit    NUMERIC(14,2) NOT NULL DEFAULT 0
    )
  `);

  const akn = await pool.query("SELECT COUNT(*)::int AS n FROM akun");
  if (akn.rows[0].n === 0) {
    await pool.query(`INSERT INTO akun (kode, nama, tipe, saldo_normal) VALUES
      ('1100','Kas','ASET','D'),
      ('1200','Bank','ASET','D'),
      ('1300','Piutang Penjamin','ASET','D'),
      ('2100','Uang Muka Pasien','KEWAJIBAN','K'),
      ('4100','Pendapatan Pelayanan','PENDAPATAN','K'),
      ('5100','Beban Operasional','BEBAN','D')`);
    console.log("📦 Data master akun (COA) dibuat (seed)");
  }

  // -------------------------------------------------------------------
  // Tabel app_user (login + role) — password DI-HASH (bcrypt)
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_user (
      id            SERIAL PRIMARY KEY,
      username      VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(100) NOT NULL,
      nama          VARCHAR(100),
      role          VARCHAR(20) NOT NULL DEFAULT 'perawat',  -- admin/dokter/perawat/kasir
      active        BOOLEAN DEFAULT true,
      created_at    TIMESTAMP DEFAULT now()
    )
  `);

  const usr = await pool.query("SELECT COUNT(*)::int AS n FROM app_user");
  // password default (dev only) — hash dgn bcrypt
  const seed = [
    ["admin",   "admin123",   "Administrator",  "admin"],
    ["dokter",  "dokter123",  "dr. SETYA W",    "dokter"],
    ["perawat", "perawat123", "NS. RINI",       "perawat"],
    ["kasir",   "kasir123",   "KASIR LOKET 1",  "kasir"],
    ["gudang",  "gudang123",  "PETUGAS GUDANG", "gudang"],
    ["farmasi", "farmasi123", "APOTEKER",       "farmasi"],
    ["lab",       "lab123",       "ANALIS LAB",   "lab"],
    ["radiologi", "radiologi123", "RADIOGRAFER",  "radiologi"],
  ];
  // idempotent: insert user yang belum ada (ON CONFLICT username DO NOTHING)
  // — supaya user role baru (gudang/farmasi) tetap dibuat walau DB sudah ter-seed.
  for (const [username, pass, nama, role] of seed) {
    const hash = await bcrypt.hash(pass, 10);
    await pool.query(
      `INSERT INTO app_user (username, password_hash, nama, role)
       VALUES ($1,$2,$3,$4) ON CONFLICT (username) DO NOTHING`,
      [username, hash, nama, role]
    );
  }
  if (usr.rows[0].n === 0) {
    console.log("📦 User awal dibuat (admin/dokter/perawat/kasir/gudang/farmasi — password: <user>123)");
  } else {
    console.log("📦 User seed dicek (role baru spt gudang/farmasi ditambah bila belum ada)");
  }

  // -------------------------------------------------------------------
  // P16 Hardening: audit_log — jejak aktivitas mutasi (siapa/apa/kapan)
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id          SERIAL PRIMARY KEY,
      user_id     INT,
      username    VARCHAR(50),
      role        VARCHAR(20),
      method      VARCHAR(8),
      path        VARCHAR(200),
      status      INT,
      ip          VARCHAR(45),
      created_at  TIMESTAMP DEFAULT now()
    )
  `);

  // -------------------------------------------------------------------
  // A8 Diet Pasien / Nutrition — order diet per kunjungan (1:N)
  //  Nyambung rawat inap. Status alur: AKTIF → SELESAI/BATAL.
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS diet_order (
      id            SERIAL PRIMARY KEY,
      encounter_id  INT NOT NULL REFERENCES encounter(id),
      jenis_diet    VARCHAR(40) NOT NULL,            -- BIASA/LUNAK/CAIR/SARING/DM/RENDAH GARAM/TKTP/dll
      bentuk        VARCHAR(20) DEFAULT 'BIASA',     -- BIASA/LUNAK/CAIR/SARING
      kalori        INT,                             -- target kkal/hari
      jadwal        VARCHAR(40) DEFAULT 'PAGI-SIANG-MALAM',
      pantangan     TEXT,                            -- alergi / pantangan
      catatan       TEXT,
      status        VARCHAR(10) NOT NULL DEFAULT 'AKTIF',  -- AKTIF/SELESAI/BATAL
      petugas       VARCHAR(100),
      created_at    TIMESTAMP DEFAULT now(),
      updated_at    TIMESTAMP DEFAULT now()
    )
  `);

  // -------------------------------------------------------------------
  // A6 Rujukan Keluar/Masuk (SISRUTE) — rujukan per kunjungan (1:N)
  //  arah: KELUAR (ke faskes lain) / MASUK (dari faskes lain)
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rujukan (
      id              SERIAL PRIMARY KEY,
      encounter_id    INT NOT NULL REFERENCES encounter(id),
      arah            VARCHAR(8) NOT NULL DEFAULT 'KELUAR',  -- KELUAR / MASUK
      faskes_tujuan   VARCHAR(150),                          -- nama RS/faskes tujuan (KELUAR)
      faskes_asal     VARCHAR(150),                          -- nama faskes asal (MASUK)
      spesialis       VARCHAR(80),                           -- tujuan poli/spesialis
      diagnosa_code   VARCHAR(10) REFERENCES icd10(code),
      diagnosa_nama   VARCHAR(200),
      alasan          TEXT NOT NULL,                         -- alasan rujukan
      kondisi         TEXT,                                  -- kondisi pasien saat dirujuk
      no_rujukan      VARCHAR(40),                           -- no rujukan (SISRUTE/BPJS)
      status          VARCHAR(12) NOT NULL DEFAULT 'DRAFT',  -- DRAFT/DIKIRIM/DITERIMA/DITOLAK/SELESAI
      petugas         VARCHAR(100),
      tgl_rujuk       DATE NOT NULL DEFAULT current_date,
      created_at      TIMESTAMP DEFAULT now(),
      updated_at      TIMESTAMP DEFAULT now()
    )
  `);

  // -------------------------------------------------------------------
  // A5 Operasi / Jadwal Operasi (OT) — penjadwalan tindakan operasi (1:N)
  //  Status alur: DIJADWALKAN → BERLANGSUNG → SELESAI / BATAL
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS operasi (
      id              SERIAL PRIMARY KEY,
      encounter_id    INT NOT NULL REFERENCES encounter(id),
      nama_tindakan   VARCHAR(150) NOT NULL,
      kategori        VARCHAR(12) DEFAULT 'SEDANG',    -- KECIL/SEDANG/BESAR/KHUSUS
      kamar_ot        VARCHAR(20),                     -- OK-1, OK-2, VK
      dokter_bedah    VARCHAR(100),
      dokter_anestesi VARCHAR(100),
      jenis_anestesi  VARCHAR(20),                     -- UMUM/REGIONAL/LOKAL
      tgl_operasi     TIMESTAMP,                       -- jadwal mulai
      durasi_menit    INT,                             -- estimasi durasi
      diagnosa_pre    VARCHAR(200),
      diagnosa_post   VARCHAR(200),
      status          VARCHAR(14) NOT NULL DEFAULT 'DIJADWALKAN',  -- DIJADWALKAN/BERLANGSUNG/SELESAI/BATAL
      catatan         TEXT,
      petugas         VARCHAR(100),
      created_at      TIMESTAMP DEFAULT now(),
      updated_at      TIMESTAMP DEFAULT now()
    )
  `);

  // -------------------------------------------------------------------
  // B-DPJP: Dokter Penanggung Jawab Pelayanan — per kunjungan (1:N)
  //  peran: UTAMA / KONSULEN / ALIH RAWAT
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dpjp (
      id            SERIAL PRIMARY KEY,
      encounter_id  INT NOT NULL REFERENCES encounter(id),
      dokter        VARCHAR(100) NOT NULL,
      spesialisasi  VARCHAR(80),
      peran         VARCHAR(12) NOT NULL DEFAULT 'UTAMA',   -- UTAMA/KONSULEN/ALIH
      tgl_mulai     DATE NOT NULL DEFAULT current_date,
      tgl_selesai   DATE,
      status        VARCHAR(10) NOT NULL DEFAULT 'AKTIF',   -- AKTIF/SELESAI
      catatan       TEXT,
      petugas       VARCHAR(100),
      created_at    TIMESTAMP DEFAULT now(),
      updated_at    TIMESTAMP DEFAULT now()
    )
  `);

  // -------------------------------------------------------------------
  // B-Discharge / Resep Pulang: ringkasan pulang per kunjungan (1:1)
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS discharge (
      id              SERIAL PRIMARY KEY,
      encounter_id    INT NOT NULL UNIQUE REFERENCES encounter(id),
      kondisi_pulang  VARCHAR(12) DEFAULT 'MEMBAIK',   -- SEMBUH/MEMBAIK/RUJUK/APS/MENINGGAL
      cara_pulang     VARCHAR(20) DEFAULT 'IZIN DOKTER',
      diagnosa_akhir  VARCHAR(200),
      ringkasan       TEXT,                             -- resume medis
      instruksi       TEXT,                             -- instruksi/anjuran pulang
      obat_pulang     TEXT,                             -- daftar obat pulang
      kontrol_tgl     DATE,                             -- tanggal kontrol
      dokter          VARCHAR(100),
      petugas         VARCHAR(100),
      created_at      TIMESTAMP DEFAULT now(),
      updated_at      TIMESTAMP DEFAULT now()
    )
  `);

  // -------------------------------------------------------------------
  // D-Jasa Medis: fee/jasa dokter per kunjungan (1:N)
  //  jenis: KONSUL / VISITE / TINDAKAN / OPERASI
  //  status: DRAFT / DISETUJUI / DIBAYAR
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jasa_medis (
      id            SERIAL PRIMARY KEY,
      encounter_id  INT NOT NULL REFERENCES encounter(id),
      dokter        VARCHAR(100) NOT NULL,
      jenis         VARCHAR(12) NOT NULL DEFAULT 'KONSUL',
      deskripsi     VARCHAR(200),
      jumlah        NUMERIC(14,2) NOT NULL DEFAULT 0,
      status        VARCHAR(10) NOT NULL DEFAULT 'DRAFT',
      petugas       VARCHAR(100),
      created_at    TIMESTAMP DEFAULT now(),
      updated_at    TIMESTAMP DEFAULT now()
    )
  `);

  // -------------------------------------------------------------------
  // F-Procurement: supplier + purchase (PR/PO header) + purchase_item (lines)
  //  Alur status: DRAFT → DIAJUKAN → DISETUJUI → DITERIMA / BATAL
  //  Saat DITERIMA → stok inv_item bertambah (movement IN).
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS supplier (
      id      SERIAL PRIMARY KEY,
      kode    VARCHAR(20) UNIQUE NOT NULL,
      nama    VARCHAR(150) NOT NULL,
      telp    VARCHAR(30),
      alamat  TEXT
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS purchase (
      id            SERIAL PRIMARY KEY,
      no_dok        VARCHAR(30) UNIQUE NOT NULL,        -- nomor PR/PO
      supplier_id   INT REFERENCES supplier(id),
      keterangan    VARCHAR(200),
      total         NUMERIC(16,2) NOT NULL DEFAULT 0,
      status        VARCHAR(12) NOT NULL DEFAULT 'DRAFT', -- DRAFT/DIAJUKAN/DISETUJUI/DITERIMA/BATAL
      requested_by  VARCHAR(60),
      approved_by   VARCHAR(60),
      received_at   TIMESTAMP,
      created_at    TIMESTAMP DEFAULT now(),
      updated_at    TIMESTAMP DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS purchase_item (
      id          SERIAL PRIMARY KEY,
      purchase_id INT NOT NULL REFERENCES purchase(id) ON DELETE CASCADE,
      item_id     INT NOT NULL REFERENCES inv_item(id),
      qty         NUMERIC(14,2) NOT NULL DEFAULT 0,
      harga       NUMERIC(14,2) NOT NULL DEFAULT 0,
      subtotal    NUMERIC(16,2) NOT NULL DEFAULT 0,
      qty_terima  NUMERIC(14,2) NOT NULL DEFAULT 0
    )
  `);

  const sup = await pool.query("SELECT COUNT(*)::int AS n FROM supplier");
  if (sup.rows[0].n === 0) {
    await pool.query(`INSERT INTO supplier (kode, nama, telp, alamat) VALUES
      ('SUP01','PT Kimia Farma Trading','021-5551001','Jakarta'),
      ('SUP02','PT Enseval Putera Megatrading','021-5551002','Jakarta'),
      ('SUP03','PT Anugrah Pharmindo Lestari','021-5551003','Tangerang'),
      ('SUP04','PT Surgika Alkesindo','021-5551004','Bekasi')`);
    console.log("📦 Data master supplier dibuat (seed)");
  }

  // -------------------------------------------------------------------
  // H-SDM: pegawai (staff) + presensi (kehadiran harian)
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pegawai (
      id          SERIAL PRIMARY KEY,
      nip         VARCHAR(20) UNIQUE NOT NULL,
      nama        VARCHAR(100) NOT NULL,
      jabatan     VARCHAR(80),
      unit        VARCHAR(80),
      no_hp       VARCHAR(20),
      status      VARCHAR(10) NOT NULL DEFAULT 'AKTIF',   -- AKTIF/NONAKTIF
      created_at  TIMESTAMP DEFAULT now(),
      updated_at  TIMESTAMP DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS presensi (
      id          SERIAL PRIMARY KEY,
      pegawai_id  INT NOT NULL REFERENCES pegawai(id),
      tanggal     DATE NOT NULL DEFAULT current_date,
      jam_masuk   VARCHAR(5),                            -- HH:mm
      jam_pulang  VARCHAR(5),
      status      VARCHAR(10) NOT NULL DEFAULT 'HADIR',  -- HADIR/IZIN/SAKIT/ALPA/CUTI
      catatan     VARCHAR(200),
      created_at  TIMESTAMP DEFAULT now(),
      UNIQUE (pegawai_id, tanggal)
    )
  `);

  const peg = await pool.query("SELECT COUNT(*)::int AS n FROM pegawai");
  if (peg.rows[0].n === 0) {
    await pool.query(`INSERT INTO pegawai (nip, nama, jabatan, unit) VALUES
      ('NIP001','dr. SETYA WIJAYA, Sp.PD','Dokter Spesialis','Poli Penyakit Dalam'),
      ('NIP002','NS. RINI ANGGRAINI','Perawat','IGD'),
      ('NIP003','APT. DEWI LESTARI','Apoteker','Farmasi'),
      ('NIP004','BUDI HARTONO','Petugas Gudang','Logistik'),
      ('NIP005','SITI AMINAH','Kasir','Loket Kasir')`);
    console.log("📦 Data master pegawai dibuat (seed)");
  }

  // -------------------------------------------------------------------
  // C-Fisioterapi: program terapi fisik per kunjungan (1:N)
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fisioterapi (
      id            SERIAL PRIMARY KEY,
      encounter_id  INT NOT NULL REFERENCES encounter(id),
      jenis_terapi  VARCHAR(80) NOT NULL,            -- mis. Terapi Latihan, Elektroterapi
      diagnosa      VARCHAR(200),
      modalitas     TEXT,                            -- alat/teknik: TENS, IR, US, dll
      jumlah_sesi   INT NOT NULL DEFAULT 1,
      sesi_selesai  INT NOT NULL DEFAULT 0,
      status        VARCHAR(10) NOT NULL DEFAULT 'AKTIF',  -- AKTIF/SELESAI/BATAL
      terapis       VARCHAR(100),
      catatan       TEXT,
      created_at    TIMESTAMP DEFAULT now(),
      updated_at    TIMESTAMP DEFAULT now()
    )
  `);

  // -------------------------------------------------------------------
  // C-MCU (Medical Check Up): pemeriksaan kesehatan paket per kunjungan
  //  Status: TERDAFTAR → PROSES → SELESAI
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mcu (
      id              SERIAL PRIMARY KEY,
      encounter_id    INT NOT NULL REFERENCES encounter(id),
      paket           VARCHAR(15) NOT NULL DEFAULT 'BASIC',   -- BASIC/STANDARD/EXECUTIVE
      perusahaan      VARCHAR(120),                            -- corporate / instansi
      hasil_ringkas   TEXT,
      kesimpulan      VARCHAR(16),                             -- LAYAK/LAYAK_CATATAN/TIDAK_LAYAK
      rekomendasi     TEXT,
      dokter_pemeriksa VARCHAR(100),
      status          VARCHAR(12) NOT NULL DEFAULT 'TERDAFTAR', -- TERDAFTAR/PROSES/SELESAI
      petugas         VARCHAR(100),
      created_at      TIMESTAMP DEFAULT now(),
      updated_at      TIMESTAMP DEFAULT now()
    )
  `);

  // -------------------------------------------------------------------
  // C-UTD (Unit Transfusi Darah): permintaan & penyerahan darah per kunjungan
  //  Status: DIMINTA → CROSSMATCH → SIAP → DISERAHKAN / BATAL
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transfusi (
      id            SERIAL PRIMARY KEY,
      encounter_id  INT NOT NULL REFERENCES encounter(id),
      gol_darah     VARCHAR(2) NOT NULL,             -- A/B/AB/O
      rhesus        VARCHAR(3) NOT NULL DEFAULT '+', -- + / -
      komponen      VARCHAR(10) NOT NULL DEFAULT 'PRC', -- WB/PRC/TC/FFP/CRYO
      jumlah_kantong INT NOT NULL DEFAULT 1,
      indikasi      TEXT,
      no_kantong    VARCHAR(100),                    -- nomor kantong yang diserahkan
      crossmatch    VARCHAR(12),                     -- COMPATIBLE/INCOMPATIBLE/PENDING
      status        VARCHAR(12) NOT NULL DEFAULT 'DIMINTA', -- DIMINTA/CROSSMATCH/SIAP/DISERAHKAN/BATAL
      petugas       VARCHAR(100),
      created_at    TIMESTAMP DEFAULT now(),
      updated_at    TIMESTAMP DEFAULT now()
    )
  `);

  // -------------------------------------------------------------------
  // B-CPPT: Catatan Perkembangan Pasien Terintegrasi (SOAP multi-profesi, 1:N)
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cppt (
      id            SERIAL PRIMARY KEY,
      encounter_id  INT NOT NULL REFERENCES encounter(id),
      profesi       VARCHAR(15) NOT NULL DEFAULT 'DOKTER', -- DOKTER/PERAWAT/GIZI/FARMASI/FISIO
      subjektif     TEXT,                            -- S
      objektif      TEXT,                            -- O
      asesmen       TEXT,                            -- A
      plan          TEXT,                            -- P
      instruksi     TEXT,                            -- instruksi PPA / verifikasi DPJP
      petugas       VARCHAR(100),
      created_at    TIMESTAMP DEFAULT now()
    )
  `);

  // -------------------------------------------------------------------
  // B-Asuhan Keperawatan (SDKI/SLKI/SIKI) per kunjungan (1:N)
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS askep (
      id              SERIAL PRIMARY KEY,
      encounter_id    INT NOT NULL REFERENCES encounter(id),
      diagnosa_kep    VARCHAR(200) NOT NULL,         -- SDKI: diagnosa keperawatan
      luaran          TEXT,                          -- SLKI: kriteria hasil
      intervensi      TEXT,                          -- SIKI: rencana tindakan
      evaluasi        TEXT,                          -- catatan evaluasi (SOAP)
      status          VARCHAR(12) NOT NULL DEFAULT 'AKTIF', -- AKTIF/TERATASI/BATAL
      perawat         VARCHAR(100),
      created_at      TIMESTAMP DEFAULT now(),
      updated_at      TIMESTAMP DEFAULT now()
    )
  `);

  // -------------------------------------------------------------------
  // B-Informed Consent: persetujuan/penolakan tindakan medis per kunjungan
  // -------------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS consent (
      id              SERIAL PRIMARY KEY,
      encounter_id    INT NOT NULL REFERENCES encounter(id),
      jenis_tindakan  VARCHAR(150) NOT NULL,
      pemberi_info    VARCHAR(100),                  -- dokter yang menjelaskan
      penerima_info   VARCHAR(100),                  -- pasien/keluarga
      hubungan        VARCHAR(40),                   -- hubungan penerima dgn pasien
      keputusan       VARCHAR(10) NOT NULL DEFAULT 'SETUJU', -- SETUJU/TOLAK
      catatan         TEXT,
      tgl_consent     DATE NOT NULL DEFAULT current_date,
      petugas         VARCHAR(100),
      created_at      TIMESTAMP DEFAULT now()
    )
  `);
}

export default pool;
