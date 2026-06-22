// =====================================================================
// AsistenKlinis.tsx — panel tanya-jawab AI atas riwayat pasien (per pasien).
//  Dokter mengetik pertanyaan natural ("riwayat antibiotik?", "diagnosa?") →
//  sistem menjawab dari data klinis pasien tanpa pencarian manual.
// =====================================================================

import { useState, useRef, useEffect } from "react";
import { askAsisten, type AsistenAnswer } from "./asistenApi";
import { Card, Btn, sap, inp } from "../shell/ui";

type Turn = { q: string; a: AsistenAnswer | null; err?: string };

const SARAN = [
  "Ringkasan kondisi pasien",
  "Riwayat penggunaan antibiotik?",
  "Diagnosa apa saja?",
  "Obat/resep terakhir?",
  "Ada alergi?",
  "Riwayat kunjungan",
];

export default function AsistenKlinis({ patientId, patientNama }: { patientId: number; patientNama: string }) {
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // reset percakapan saat ganti pasien
    setTurns([]);
    setQ("");
  }, [patientId]);

  useEffect(() => {
    // scroll HANYA di dalam kotak percakapan, jangan gerakkan halaman
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, loading]);

  async function kirim(pertanyaan?: string) {
    const question = (pertanyaan ?? q).trim();
    if (!question || loading) return;
    setQ("");
    setLoading(true);
    setTurns((t) => [...t, { q: question, a: null }]);
    try {
      const ans = await askAsisten(patientId, question);
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, a: ans } : x)));
    } catch (e) {
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, err: (e as Error).message } : x)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card style={{ borderTop: `3px solid ${sap.blue}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <h4 style={{ margin: 0, color: sap.text, fontSize: 15 }}>Asisten Klinis</h4>
        <span style={{ fontSize: 11, color: sap.textSub }}>· tanya riwayat {patientNama} pakai bahasa biasa</span>
      </div>

      {/* saran cepat */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0 10px" }}>
        {SARAN.map((s) => (
          <button
            key={s}
            onClick={() => kirim(s)}
            disabled={loading}
            className="hms-btn"
            style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, border: `1px solid ${sap.line}`, background: "#f3f7ff", color: sap.blueDark, cursor: "pointer" }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* percakapan */}
      {turns.length > 0 && (
        <div ref={listRef} style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 360, overflowY: "auto", padding: "4px 2px", marginBottom: 10 }}>
          {turns.map((t, i) => (
            <div key={i}>
              {/* pertanyaan */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                <span style={{ background: sap.blue, color: "#fff", padding: "6px 12px", borderRadius: "12px 12px 2px 12px", fontSize: 13, maxWidth: "80%" }}>{t.q}</span>
              </div>
              {/* jawaban */}
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ background: "#f6f8fb", border: `1px solid ${sap.line}`, padding: "8px 12px", borderRadius: "12px 12px 12px 2px", fontSize: 13, maxWidth: "92%" }}>
                  {t.err ? (
                    <span style={{ color: sap.red }}>{t.err}</span>
                  ) : !t.a ? (
                    <span style={{ color: sap.textSub }}>Menganalisis data pasien…</span>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {t.a.sections.map((sec) => (
                        <div key={sec.key}>
                          <div style={{ fontWeight: 700, color: sap.blueDark, marginBottom: 2 }}>{sec.title}</div>
                          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{sec.text}</div>
                        </div>
                      ))}
                      <div style={{ fontSize: 10.5, color: sap.textSub, borderTop: `1px dashed ${sap.line}`, paddingTop: 4, marginTop: 2 }}>
                        <span style={{ display: "inline-block", background: t.a.engine === "llm" ? "#ede9fe" : "#e8f0fe", color: t.a.engine === "llm" ? "#6d28d9" : sap.blueDark, fontWeight: 700, borderRadius: 6, padding: "1px 6px", marginRight: 6 }}>
                          {t.a.engine === "llm" ? `🧠 AI${t.a.model ? " · " + t.a.model : ""}` : "⚡ cepat"}
                        </span>
                        Sumber data: {Object.entries(t.a.sumber).map(([k, v]) => `${k} ${v}`).join(" · ")} — verifikasi pada rekam medis sebelum keputusan klinis.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* input */}
      <div style={{ display: "flex", gap: 6 }}>
        <input
          style={{ ...inp, flex: 1 }}
          placeholder="Tanya: mis. 'pasien pernah dikasih antibiotik apa aja?'"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") kirim(); }}
          disabled={loading}
        />
        <Btn icon="➤" primary onClick={() => kirim()} disabled={loading}>{loading ? "..." : "Tanya"}</Btn>
      </div>
    </Card>
  );
}
