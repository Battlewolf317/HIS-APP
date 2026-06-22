// =====================================================================
// asisten.service.js — BUSINESS LOGIC Asisten Klinis (tanya-jawab riwayat pasien)
//  Pendekatan: retrieval data pasien + deteksi maksud (intent) + jawaban natural.
//  Bekerja TANPA API eksternal. Dapat di-upgrade ke LLM (RAG) di kemudian hari
//  dengan mengganti fungsi buildAnswer() oleh pemanggilan LLM atas konteks.
// =====================================================================

import * as repo from "./asisten.repository.js";
import { llmEnabled, generate, LLM_INFO } from "./asisten.llm.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

// daftar nama generik antibiotik umum (untuk deteksi penggunaan antibiotik)
const ANTIBIOTIK = [
  "amoxicillin", "amoxicilin", "ampicillin", "penicillin", "penisilin",
  "ceftriaxone", "cefixime", "cefadroxil", "cefotaxime", "ceftazidime", "cefuroxime",
  "ciprofloxacin", "levofloxacin", "ofloxacin", "moxifloxacin",
  "metronidazole", "azithromycin", "erythromycin", "clarithromycin",
  "gentamicin", "amikacin", "cotrimoxazole", "trimethoprim", "sulfamethoxazole",
  "doxycycline", "tetracycline", "clindamycin", "meropenem", "imipenem",
  "vancomycin", "linezolid", "chloramphenicol", "thiamphenicol", "cefepime",
  "kanamycin", "streptomycin", "rifampicin", "isoniazid",
];

function fmtDate(s) {
  if (!s) return "-";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function isAntibiotik(nama) {
  if (!nama) return false;
  const low = nama.toLowerCase();
  return ANTIBIOTIK.some((a) => low.includes(a));
}

// deteksi maksud dari pertanyaan (boleh lebih dari satu)
function detectIntents(q) {
  const t = (q || "").toLowerCase();
  const has = (...kw) => kw.some((k) => t.includes(k));
  const intents = [];
  if (has("antibiotik", "antibiotic", "antibiotika")) intents.push("antibiotik");
  if (has("obat", "resep", "terapi", "medikasi", "dikasih obat", "pengobatan")) intents.push("obat");
  if (has("diagnosa", "diagnosis", "penyakit", "sakit apa", "didiagnosa", "riwayat penyakit")) intents.push("diagnosa");
  if (has("alergi", "pantangan", "alergic", "alergic")) intents.push("alergi");
  if (has("operasi", "bedah", "tindakan operasi")) intents.push("operasi");
  if (has("lab", "laboratorium", "radiologi", "rontgen", "penunjang", "hasil periksa", "hasil lab")) intents.push("penunjang");
  if (has("catatan", "perkembangan", "cppt", "soap", "perawatan")) intents.push("cppt");
  if (has("kamar", "ruang", "ruangan", "bangsal", "tempat tidur", "bed ", "dirawat di", "di kamar", "di ruang", "nomor bed", "no bed")) intents.push("kamar");
  if (has("kunjungan", "rawat inap", "berapa kali", "kapan terakhir", "masuk rs", "berkunjung", "riwayat kunjungan", "riwayat rawat")) intents.push("kunjungan");
  if (has("ringkasan", "summary", "rangkum", "overview", "kondisi", "gambaran")) intents.push("ringkasan");
  return [...new Set(intents)];
}

// --- builder jawaban per intent ---
function ansKamar(ctx) {
  if (!ctx.kamar || ctx.kamar.length === 0) {
    const adaAktif = ctx.encounters.some((e) => e.status === "AKTIF");
    if (adaAktif) {
      return "Pasien punya kunjungan aktif, tetapi belum tercatat menempati kamar/bed " +
        "(kemungkinan rawat jalan/IGD atau belum admisi ke tempat tidur rawat inap).";
    }
    return "Pasien tidak sedang dirawat inap (tidak menempati kamar/bed).";
  }
  return "Ruang rawat saat ini:\n" + ctx.kamar.map(
    (k) => `• Bed ${k.kode_bed} — ${k.ward_nama}, kunjungan ${k.encounter_no} [${k.tipe}], masuk ${fmtDate(k.tgl_masuk)}`
  ).join("\n");
}

function ansDiagnosa(ctx) {
  if (ctx.diagnosa.length === 0) return "Belum ada diagnosa tercatat untuk pasien ini.";
  const lines = ctx.diagnosa.slice(0, 10).map(
    (d) => `• ${d.diagnosa_code ? d.diagnosa_code + " — " : ""}${d.diagnosa_nama} (${fmtDate(d.created_at)}, ${d.encounter_no})`
  );
  return `Riwayat diagnosa (${ctx.diagnosa.length} tercatat):\n` + lines.join("\n");
}

function ansObat(ctx) {
  const meds = ctx.obat.map((o) => o.item_nama || o.deskripsi).filter(Boolean);
  if (meds.length === 0) return "Belum ada riwayat resep/obat tercatat.";
  const lines = ctx.obat.slice(0, 15).map(
    (o) => `• ${o.item_nama || o.deskripsi} (${fmtDate(o.created_at)}, ${o.encounter_no})`
  );
  return `Riwayat obat/resep (${ctx.obat.length} entri):\n` + lines.join("\n");
}

function ansAntibiotik(ctx) {
  const ab = ctx.obat.filter((o) => isAntibiotik(o.item_nama) || isAntibiotik(o.deskripsi));
  if (ab.length === 0) {
    return "Tidak ditemukan riwayat penggunaan antibiotik pada data resep/dispensing pasien ini.";
  }
  const lines = ab.map(
    (o) => `• ${o.item_nama || o.deskripsi} (${fmtDate(o.created_at)}, ${o.encounter_no})`
  );
  const unik = [...new Set(ab.map((o) => (o.item_nama || o.deskripsi)))];
  return `Ditemukan ${ab.length} catatan penggunaan antibiotik (${unik.length} jenis):\n` +
    lines.join("\n") +
    `\n\n⚠️ Perhatikan riwayat ini untuk pertimbangan resistensi/antibiotic stewardship.`;
}

function ansAlergi(ctx) {
  if (ctx.alergi.length === 0) return "Tidak ada catatan alergi/pantangan untuk pasien ini.";
  return "⚠️ Alergi/pantangan tercatat:\n" + ctx.alergi.map((a) => `• ${a}`).join("\n");
}

function ansOperasi(ctx) {
  if (ctx.operasi.length === 0) return "Tidak ada riwayat operasi.";
  return `Riwayat operasi (${ctx.operasi.length}):\n` +
    ctx.operasi.map((o) => `• ${o.nama_tindakan} [${o.kategori}] — ${fmtDate(o.tgl_operasi)} (${o.status})`).join("\n");
}

function ansPenunjang(ctx) {
  if (ctx.penunjang.length === 0) return "Belum ada hasil penunjang (Lab/Radiologi).";
  return `Hasil penunjang terbaru (${ctx.penunjang.length}):\n` +
    ctx.penunjang.slice(0, 10).map(
      (p) => `• [${p.jenis}] ${p.deskripsi} — ${p.status}${p.hasil ? `: ${p.hasil}` : ""} (${fmtDate(p.created_at)})`
    ).join("\n");
}

function ansCppt(ctx) {
  if (ctx.cppt.length === 0) return "Belum ada catatan perkembangan (CPPT).";
  return `Catatan perkembangan terbaru:\n` +
    ctx.cppt.slice(0, 5).map(
      (c) => `• [${c.profesi}] ${fmtDate(c.created_at)} — A: ${c.asesmen || "-"} | P: ${c.plan || "-"}`
    ).join("\n");
}

function ansKunjungan(ctx) {
  if (ctx.encounters.length === 0) return "Belum ada riwayat kunjungan.";
  const terakhir = ctx.encounters[0];
  const aktif = ctx.encounters.filter((e) => e.status === "AKTIF").length;
  const head = `Total ${ctx.encounters.length} kunjungan (${aktif} aktif). Terakhir: ${terakhir.encounter_no} — ${terakhir.tipe}, ${fmtDate(terakhir.tgl_masuk)} (${terakhir.status}).`;
  const lines = ctx.encounters.slice(0, 8).map(
    (e) => `• ${e.encounter_no} [${e.tipe}] ${e.poli ?? "-"} — ${fmtDate(e.tgl_masuk)} (${e.status})`
  );
  return head + "\n" + lines.join("\n");
}

function ansRingkasan(ctx) {
  const umur = ctx.patient.umur != null ? `${ctx.patient.umur} th` : "-";
  const dx = ctx.diagnosa[0] ? ctx.diagnosa[0].diagnosa_nama : "belum ada diagnosa";
  const ab = ctx.obat.filter((o) => isAntibiotik(o.item_nama) || isAntibiotik(o.deskripsi));
  const bed = ctx.kamar && ctx.kamar.length
    ? `Bed ${ctx.kamar[0].kode_bed} — ${ctx.kamar[0].ward_nama}`
    : null;
  return [
    `Ringkasan ${ctx.patient.nama} (${ctx.patient.mrn}), ${ctx.patient.jenis_kelamin === "L" ? "L" : "P"}, ${umur}:`,
    `• Total kunjungan: ${ctx.encounters.length}`,
    bed ? `• 🛏️ Ruang rawat: ${bed}` : null,
    `• Diagnosa terbanyak terakhir: ${dx}`,
    `• Jumlah diagnosa tercatat: ${ctx.diagnosa.length}`,
    `• Riwayat obat: ${ctx.obat.length} entri${ab.length ? `, termasuk ${ab.length} catatan antibiotik` : ""}`,
    `• Operasi: ${ctx.operasi.length} | Penunjang: ${ctx.penunjang.length}`,
    ctx.alergi.length ? `• ⚠️ Alergi: ${ctx.alergi.join(", ")}` : `• Alergi: tidak ada catatan`,
  ].filter(Boolean).join("\n");
}

const BUILDERS = {
  diagnosa: ansDiagnosa,
  obat: ansObat,
  antibiotik: ansAntibiotik,
  alergi: ansAlergi,
  operasi: ansOperasi,
  penunjang: ansPenunjang,
  cppt: ansCppt,
  kunjungan: ansKunjungan,
  kamar: ansKamar,
  ringkasan: ansRingkasan,
};

const TITLES = {
  diagnosa: "🩺 Diagnosa",
  obat: "💊 Obat / Resep",
  antibiotik: "🦠 Penggunaan Antibiotik",
  alergi: "⚠️ Alergi",
  operasi: "🔪 Operasi",
  penunjang: "🔬 Penunjang",
  cppt: "📝 Catatan Perkembangan",
  kunjungan: "📋 Riwayat Kunjungan",
  kamar: "🛏️ Ruang Rawat",
  ringkasan: "📊 Ringkasan",
};

// Bangun konteks teks ringkas dari seluruh data pasien (untuk dikirim ke LLM/RAG).
function buildContextText(ctx) {
  const p = ctx.patient;
  const lines = [];
  lines.push(`Pasien: ${p.nama} (MRN ${p.mrn}), ${p.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}${p.umur != null ? `, ${p.umur} th` : ""}.`);
  lines.push(`Alergi/pantangan: ${ctx.alergi.length ? ctx.alergi.join(", ") : "tidak ada catatan"}.`);

  if (ctx.kamar && ctx.kamar.length) {
    lines.push("Ruang rawat aktif: " + ctx.kamar.map((k) => `Bed ${k.kode_bed} ${k.ward_nama} (${k.encounter_no}, ${k.tipe}, masuk ${fmtDate(k.tgl_masuk)})`).join("; ") + ".");
  } else {
    lines.push("Ruang rawat: tidak menempati bed saat ini.");
  }

  lines.push(`Kunjungan (${ctx.encounters.length}): ` + (ctx.encounters.slice(0, 12).map(
    (e) => `${e.encounter_no} [${e.tipe}] ${e.poli ?? "-"} ${fmtDate(e.tgl_masuk)} (${e.status})`
  ).join("; ") || "tidak ada") + ".");

  lines.push(`Diagnosa (${ctx.diagnosa.length}): ` + (ctx.diagnosa.slice(0, 15).map(
    (d) => `${d.diagnosa_code ? d.diagnosa_code + " " : ""}${d.diagnosa_nama} (${fmtDate(d.created_at)}, ${d.encounter_no})`
  ).join("; ") || "tidak ada") + ".");

  lines.push(`Obat/resep (${ctx.obat.length}): ` + (ctx.obat.slice(0, 20).map(
    (o) => `${o.item_nama || o.deskripsi} (${fmtDate(o.created_at)}, ${o.encounter_no})`
  ).join("; ") || "tidak ada") + ".");

  const ab = ctx.obat.filter((o) => isAntibiotik(o.item_nama) || isAntibiotik(o.deskripsi));
  lines.push(`Antibiotik terdeteksi (${ab.length}): ` + (ab.map((o) => o.item_nama || o.deskripsi).join("; ") || "tidak ada") + ".");

  lines.push(`Operasi (${ctx.operasi.length}): ` + (ctx.operasi.map(
    (o) => `${o.nama_tindakan} [${o.kategori}] ${fmtDate(o.tgl_operasi)} (${o.status})`
  ).join("; ") || "tidak ada") + ".");

  lines.push(`Penunjang (${ctx.penunjang.length}): ` + (ctx.penunjang.slice(0, 10).map(
    (p2) => `[${p2.jenis}] ${p2.deskripsi} ${p2.status}${p2.hasil ? `: ${p2.hasil}` : ""} (${fmtDate(p2.created_at)})`
  ).join("; ") || "tidak ada") + ".");

  if (ctx.cppt.length) {
    lines.push("CPPT terbaru: " + ctx.cppt.slice(0, 5).map(
      (c) => `[${c.profesi} ${fmtDate(c.created_at)}] A:${c.asesmen || "-"} P:${c.plan || "-"}`
    ).join(" || ") + ".");
  }
  return lines.join("\n");
}

export async function ask(patientId, question) {
  if (!patientId) throw new ValidationError("Pasien wajib dipilih");
  if (!question || !question.trim()) throw new ValidationError("Pertanyaan tidak boleh kosong");

  const p = await repo.patient(patientId);
  if (!p) throw new ValidationError("Pasien tidak ditemukan");

  // umur (tahun) untuk ringkasan
  let umur = null;
  if (p.tgl_lahir) {
    const lahir = new Date(p.tgl_lahir);
    if (!Number.isNaN(lahir.getTime())) {
      const now = new Date();
      umur = now.getFullYear() - lahir.getFullYear();
      const m = now.getMonth() - lahir.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < lahir.getDate())) umur--;
    }
  }

  const [diagnosa, obat, encounters, operasi, penunjang, cppt, alergiRows, kamar] = await Promise.all([
    repo.diagnosa(patientId),
    repo.obat(patientId),
    repo.encounters(patientId),
    repo.operasi(patientId),
    repo.penunjang(patientId),
    repo.cppt(patientId),
    repo.alergi(patientId),
    repo.kamar(patientId),
  ]);

  const ctx = {
    patient: { ...p, umur },
    diagnosa, obat, encounters, operasi, penunjang, cppt, kamar,
    alergi: alergiRows.map((a) => a.pantangan),
  };

  let intents = detectIntents(question);
  // kalau tidak terdeteksi maksud spesifik → beri ringkasan + saran
  if (intents.length === 0) intents = ["ringkasan"];

  const sumber = {
    diagnosa: diagnosa.length,
    obat: obat.length,
    kunjungan: encounters.length,
    operasi: operasi.length,
    penunjang: penunjang.length,
    kamar: kamar.length,
  };
  const meta = { patient: { id: p.id, nama: p.nama, mrn: p.mrn }, question, sumber };

  // --- Jalur RAG (LLM lokal) bila diaktifkan; gagal/timeout → fallback rule-based ---
  if (llmEnabled()) {
    try {
      const text = await generate(buildContextText(ctx), question);
      return {
        ...meta,
        engine: "llm",
        model: LLM_INFO.model,
        intents: ["ai"],
        sections: [{ key: "ai", title: "🤖 Jawaban Asisten (AI)", text }],
      };
    } catch (e) {
      console.warn("LLM gagal, fallback rule-based:", e.message);
      // lanjut ke rule-based di bawah
    }
  }

  const sections = intents.map((key) => ({
    key,
    title: TITLES[key],
    text: BUILDERS[key](ctx),
  }));

  return { ...meta, engine: "rule", intents, sections };
}

export { ValidationError };
