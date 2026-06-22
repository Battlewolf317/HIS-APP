// =====================================================================
// asisten.llm.js — koneksi ke LLM lokal (Ollama) untuk RAG.
//  Dipakai oleh asisten.service: kirim konteks pasien + pertanyaan → jawaban natural.
//  Aktif bila env LLM_ENABLED=true. Default OFF (pakai rule-based).
//
//  Konfigurasi (env):
//    LLM_ENABLED=true
//    LLM_BASE=http://localhost:11434     (default Ollama)
//    LLM_MODEL=llama3.2                  (atau qwen2.5, dll yang sudah di-pull)
//    LLM_TIMEOUT_MS=45000
// =====================================================================

const BASE = process.env.LLM_BASE || "http://localhost:11434";
const MODEL = process.env.LLM_MODEL || "llama3.2";
const TIMEOUT = Number(process.env.LLM_TIMEOUT_MS || 45000);

export function llmEnabled() {
  return process.env.LLM_ENABLED === "true";
}

const SYSTEM_PROMPT = [
  "Anda adalah Asisten Klinis untuk dokter/perawat di rumah sakit.",
  "Jawab HANYA berdasarkan KONTEKS PASIEN yang diberikan. Dilarang mengarang.",
  "Jika informasi benar-benar tidak ada di konteks, katakan: 'Tidak ada data tersebut pada rekam pasien.'",
  "Gunakan Bahasa Indonesia, ringkas, faktual, dan rapi (boleh poin-poin).",
  "Jangan memberi diagnosis/terapi baru; hanya merangkum data yang ada.",
  "Sebut tanggal/nomor kunjungan bila relevan.",
  "PETUNJUK ISTILAH: 'antibiotik' sama dengan 'obat anti-kuman' / 'anti-bakteri'.",
  "Jika konteks memuat baris 'Antibiotik terdeteksi', gunakan baris itu untuk menjawab",
  "pertanyaan tentang antibiotik, anti-kuman, atau anti-bakteri.",
].join(" ");

// Panggil Ollama /api/chat (non-stream). Lempar error bila gagal/timeout.
export async function generate(contextText, question) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        options: { temperature: 0.1 },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `KONTEKS PASIEN:\n${contextText}\n\nPERTANYAAN: ${question}` },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const data = await res.json();
    const text = data?.message?.content?.trim();
    if (!text) throw new Error("LLM kosong");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export const LLM_INFO = { base: BASE, model: MODEL };
