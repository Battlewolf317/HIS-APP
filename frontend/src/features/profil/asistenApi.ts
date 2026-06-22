// =====================================================================
// asistenApi.ts — panggil API Asisten Klinis (tanya-jawab riwayat pasien)
// =====================================================================

import { apiFetch } from "../../lib/api";

export type AsistenSection = { key: string; title: string; text: string };

export type AsistenAnswer = {
  patient: { id: number; nama: string; mrn: string };
  question: string;
  intents: string[];
  sections: AsistenSection[];
  sumber: Record<string, number>;
  engine?: "llm" | "rule";
  model?: string;
};

export function askAsisten(patientId: number, question: string): Promise<AsistenAnswer> {
  return apiFetch("/asisten/ask", {
    method: "POST",
    body: JSON.stringify({ patientId, question }),
  });
}
