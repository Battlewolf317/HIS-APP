// =====================================================================
// accounting.service.js — BUSINESS LOGIC akuntansi (jurnal double-entry)
//  - posting manual + auto-posting dari payment & klaim
//  - aturan: total debit HARUS sama dengan total kredit (balance)
// =====================================================================

import * as repo from "./accounting.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

export function listAkun() {
  return repo.findAkun();
}

export function trialBalance() {
  return repo.trialBalance();
}

// kelompokkan baris flat jadi jurnal { ...header, lines: [] }
export async function listJurnal(filter) {
  const rows = await repo.findJurnal(filter);
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.id)) {
      map.set(r.id, {
        id: r.id,
        no_jurnal: r.no_jurnal,
        tanggal: r.tanggal,
        keterangan: r.keterangan,
        ref_tipe: r.ref_tipe,
        ref_id: r.ref_id,
        created_at: r.created_at,
        lines: [],
      });
    }
    map.get(r.id).lines.push({
      akun_id: r.akun_id,
      akun_kode: r.akun_kode,
      akun_nama: r.akun_nama,
      debit: r.debit,
      kredit: r.kredit,
    });
  }
  return [...map.values()];
}

async function genNoJurnal() {
  const n = await repo.countToday();
  const d = new Date();
  const tgl = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `JV-${tgl}-${String(n + 1).padStart(4, "0")}`;
}

// posting jurnal generik (dipakai manual + auto)
//  lines: [{ akun_id, debit, kredit }]
export async function postJurnal({ tanggal, keterangan, ref_tipe, ref_id, lines }) {
  if (!Array.isArray(lines) || lines.length < 2)
    throw new ValidationError("Jurnal minimal 2 baris (debit & kredit)");

  let totD = 0;
  let totK = 0;
  for (const ln of lines) {
    if (!ln.akun_id) throw new ValidationError("Setiap baris wajib punya akun");
    totD += Number(ln.debit) || 0;
    totK += Number(ln.kredit) || 0;
  }
  if (totD <= 0) throw new ValidationError("Total nilai jurnal harus lebih dari 0");
  if (Math.round((totD - totK) * 100) !== 0)
    throw new ValidationError(`Jurnal tidak balance (debit ${totD} ≠ kredit ${totK})`);

  const no_jurnal = await genNoJurnal();
  const jurnal = await repo.insertJurnal(
    { no_jurnal, tanggal: tanggal || null, keterangan, ref_tipe: ref_tipe || "MANUAL", ref_id },
    lines
  );
  return jurnal;
}

// ambil akun_id berdasarkan kode (helper auto-posting)
async function akunId(kode) {
  const a = await repo.findAkunByKode(kode);
  if (!a) throw new ValidationError(`Akun ${kode} tidak ditemukan di COA`);
  return a.id;
}

// metode pembayaran → akun kas/bank/piutang
function akunKodeByMetode(metode) {
  if (metode === "TUNAI") return "1100";              // Kas
  if (["DEBIT", "KREDIT", "TRANSFER"].includes(metode)) return "1200"; // Bank
  return "1300";                                       // BPJS/ASURANSI → Piutang
}

// AUTO-POSTING saat ada pembayaran (dipanggil dari bill.service)
//  BAYAR  : Dr Kas/Bank/Piutang   Cr Pendapatan
//  DEPOSIT: Dr Kas/Bank           Cr Uang Muka Pasien
//  REFUND : Dr Uang Muka Pasien   Cr Kas/Bank
export async function postPayment(payment) {
  const jumlah = Number(payment.jumlah) || 0;
  if (jumlah <= 0) return null;
  const kasBank = await akunId(akunKodeByMetode(payment.metode));

  let lines;
  let ket;
  if (payment.jenis === "DEPOSIT") {
    const uangMuka = await akunId("2100");
    lines = [{ akun_id: kasBank, debit: jumlah, kredit: 0 }, { akun_id: uangMuka, debit: 0, kredit: jumlah }];
    ket = `Deposit pasien (${payment.metode}) bill #${payment.bill_id}`;
  } else if (payment.jenis === "REFUND") {
    const uangMuka = await akunId("2100");
    lines = [{ akun_id: uangMuka, debit: jumlah, kredit: 0 }, { akun_id: kasBank, debit: 0, kredit: jumlah }];
    ket = `Refund pasien (${payment.metode}) bill #${payment.bill_id}`;
  } else {
    const pendapatan = await akunId("4100");
    lines = [{ akun_id: kasBank, debit: jumlah, kredit: 0 }, { akun_id: pendapatan, debit: 0, kredit: jumlah }];
    ket = `Pembayaran pasien (${payment.metode}) bill #${payment.bill_id}`;
  }

  return postJurnal({ keterangan: ket, ref_tipe: "PAYMENT", ref_id: payment.id, lines });
}

// AUTO-POSTING saat klaim penjamin DIBAYAR (dipanggil dari claim.service)
//  Dr Bank   Cr Piutang Penjamin
export async function postClaimPaid(claim) {
  const jumlah = Number(claim.jumlah_setuju) > 0 ? Number(claim.jumlah_setuju) : Number(claim.jumlah_tagih);
  if (jumlah <= 0) return null;
  const bank = await akunId("1200");
  const piutang = await akunId("1300");
  const lines = [
    { akun_id: bank, debit: jumlah, kredit: 0 },
    { akun_id: piutang, debit: 0, kredit: jumlah },
  ];
  return postJurnal({
    keterangan: `Pelunasan klaim ${claim.no_klaim}`,
    ref_tipe: "CLAIM",
    ref_id: claim.id,
    lines,
  });
}

export { ValidationError };
