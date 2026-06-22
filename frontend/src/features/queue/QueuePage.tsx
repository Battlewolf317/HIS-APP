// =====================================================================
// QueuePage.tsx — Antrian Poli (P8)
//  Ambil nomor antrian (dari encounter RJ/IGD AKTIF), papan antrian per
//  poli, panggil & selesaikan. Highlight yang sedang dipanggil.
// =====================================================================

import { useState, useEffect } from "react";
import type { QueueItem, Queueable } from "./types";
import { getBoard, getQueueable, takeQueue, callQueue, doneQueue } from "./queueApi";
import { Toolbar, Btn, sap, th, td, tableStyle, Badge } from "../shell/ui";

const statusColor: Record<string, string> = {
  MENUNGGU: sap.textSub,
  DIPANGGIL: sap.orange,
  SELESAI: sap.green,
};
const pad = (n: number) => String(n).padStart(3, "0");

export default function QueuePage({ role }: { role: string }) {
  const canManage = role === "perawat" || role === "admin";

  const [board, setBoard] = useState<QueueItem[]>([]);
  const [cand, setCand] = useState<Queueable[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [pick, setPick] = useState(0);

  async function muat() {
    setLoading(true);
    setErr("");
    try {
      const [b, c] = await Promise.all([getBoard(), getQueueable()]);
      setBoard(b);
      setCand(c);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
  }, []);

  async function run(fn: () => Promise<unknown>) {
    setErr("");
    try {
      await fn();
      setPick(0);
      muat();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  // group per poli
  const polis = [...new Set(board.map((q) => q.poli))];

  return (
    <div>
      <Toolbar>
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        {canManage && (
          <>
            <select style={{ padding: "5px 8px", fontSize: 13, border: `1px solid ${sap.line}`, borderRadius: 4, minWidth: 240 }}
              value={pick} onChange={(e) => setPick(Number(e.target.value))}>
              <option value={0}>-- pilih kunjungan utk ambil antrian --</option>
              {cand.map((c) => (
                <option key={c.id} value={c.id}>{c.pasien} ({c.mrn}) · {c.tipe} · {c.poli || "UMUM"}</option>
              ))}
            </select>
            <Btn icon="🎫" primary onClick={() => { if (!pick) { setErr("Pilih kunjungan dulu"); return; } run(() => takeQueue(pick)); }}>
              Ambil Antrian
            </Btn>
          </>
        )}
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>
          {!loading && `${board.length} antrian hari ini`}
        </span>
      </Toolbar>

      {err && <div style={{ color: sap.red, marginBottom: 10, fontSize: 13 }}>{err}</div>}

      {loading ? (
        <p>Memuat data...</p>
      ) : board.length === 0 ? (
        <p style={{ color: sap.textSub }}>Belum ada antrian hari ini.</p>
      ) : (
        polis.map((poli) => {
          const rows = board.filter((q) => q.poli === poli);
          const calling = rows.find((q) => q.status === "DIPANGGIL");
          return (
            <div key={poli} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: sap.blue }}>Poli {poli}</div>
                {calling && (
                  <div style={{ fontSize: 13, color: sap.orange, fontWeight: 700 }}>
                    📢 Memanggil: {poli}-{pad(calling.queue_no)} · {calling.pasien}
                  </div>
                )}
              </div>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{ ...th, width: 90 }}>No.</th>
                    <th style={th}>Pasien (MRN)</th>
                    <th style={th}>Kunjungan</th>
                    <th style={th}>Status</th>
                    <th style={th}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((q, i) => (
                    <tr key={q.id} style={{ background: q.status === "DIPANGGIL" ? sap.yellow : i % 2 ? sap.bgZebra : "#fff" }}>
                      <td style={{ ...td, fontWeight: 700, fontSize: 15 }}>{poli}-{pad(q.queue_no)}</td>
                      <td style={td}>{q.pasien} ({q.mrn})</td>
                      <td style={td}>{q.encounter_no}</td>
                      <td style={td}><Badge text={q.status} color={statusColor[q.status] ?? sap.textSub} /></td>
                      <td style={{ ...td, whiteSpace: "nowrap" }}>
                        {canManage && q.status !== "SELESAI" && (
                          <>
                            <Btn icon="📢" onClick={() => run(() => callQueue(q.id))}>Panggil</Btn>{" "}
                            <Btn icon="✅" onClick={() => run(() => doneQueue(q.id))}>Selesai</Btn>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
}
