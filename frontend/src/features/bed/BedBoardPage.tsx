// =====================================================================
// BedBoardPage.tsx — Bed Board Rawat Inap (P6)
//  Kelompok bed per ward, warna per status. Aksi: Tempatkan / Pindah /
//  Keluarkan / Maintenance. Tempatkan pakai daftar encounter RI AKTIF.
// =====================================================================

import { useState, useEffect } from "react";
import type { Bed, Admittable } from "./types";
import { getBoard, getAdmittable, assignBed, releaseBed, transferBed, maintenanceBed } from "./bedApi";
import { Toolbar, Btn, sap } from "../shell/ui";

const statusColor: Record<string, string> = {
  KOSONG: sap.green,
  TERISI: sap.blue,
  MAINTENANCE: sap.textSub,
};

export default function BedBoardPage({ role }: { role: string }) {
  const canManage = role === "perawat" || role === "admin";

  const [beds, setBeds] = useState<Bed[]>([]);
  const [admit, setAdmit] = useState<Admittable[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // aksi aktif: { bedId, mode: 'assign'|'transfer', value }
  const [act, setAct] = useState<{ bedId: number; mode: "assign" | "transfer" } | null>(null);
  const [pick, setPick] = useState(0);

  async function muat() {
    setLoading(true);
    setErr("");
    try {
      const [b, a] = await Promise.all([getBoard(), getAdmittable()]);
      setBeds(b);
      setAdmit(a);
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
      setAct(null);
      setPick(0);
      muat();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  const wards = [...new Set(beds.map((b) => b.ward_id))].map((wid) => {
    const list = beds.filter((b) => b.ward_id === wid);
    return { wid, head: list[0], list };
  });
  const emptyBeds = beds.filter((b) => b.status === "KOSONG");

  const summary = {
    total: beds.length,
    kosong: beds.filter((b) => b.status === "KOSONG").length,
    terisi: beds.filter((b) => b.status === "TERISI").length,
    maint: beds.filter((b) => b.status === "MAINTENANCE").length,
  };

  return (
    <div>
      <Toolbar>
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>
          {!loading && (
            <>
              {summary.total} bed · <b style={{ color: sap.green }}>{summary.kosong} kosong</b> ·{" "}
              <b style={{ color: sap.blue }}>{summary.terisi} terisi</b> · {summary.maint} maintenance
            </>
          )}
        </span>
      </Toolbar>

      {err && <div style={{ color: sap.red, marginBottom: 10, fontSize: 13 }}>{err}</div>}

      {loading ? (
        <p>Memuat data...</p>
      ) : (
        wards.map(({ wid, head, list }) => (
          <div key={wid} style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: sap.blue, marginBottom: 6 }}>
              {head.ward_nama} <span style={{ color: sap.textSub, fontWeight: 400 }}>({head.ward_kode} · Kelas {head.kelas})</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {list.map((b) => (
                <div
                  key={b.id}
                  style={{
                    width: 200,
                    border: `1px solid ${sap.line}`,
                    borderTop: `3px solid ${statusColor[b.status] ?? sap.line}`,
                    borderRadius: 4,
                    padding: 10,
                    background: "#fff",
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b>{b.kode_bed}</b>
                    <span style={{ fontSize: 11, fontWeight: 700, color: statusColor[b.status] ?? sap.text }}>
                      {b.status}
                    </span>
                  </div>
                  {b.status === "TERISI" ? (
                    <div style={{ marginTop: 4, color: sap.text }}>
                      👤 {b.pasien}<br />
                      <span style={{ fontSize: 11, color: sap.textSub }}>{b.mrn} · {b.encounter_no}</span>
                    </div>
                  ) : (
                    <div style={{ marginTop: 4, color: sap.textSub, fontSize: 12 }}>
                      {b.status === "MAINTENANCE" ? "Tidak tersedia" : "Tersedia"}
                    </div>
                  )}

                  {canManage && (
                    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {b.status === "KOSONG" && (
                        <>
                          <Btn icon="➕" onClick={() => { setAct({ bedId: b.id, mode: "assign" }); setPick(0); }}>Tempatkan</Btn>
                          <Btn icon="🔧" onClick={() => run(() => maintenanceBed(b.id, true))}>Maint</Btn>
                        </>
                      )}
                      {b.status === "TERISI" && (
                        <>
                          <Btn icon="↔️" onClick={() => { setAct({ bedId: b.id, mode: "transfer" }); setPick(0); }}>Pindah</Btn>
                          <Btn icon="🚪" danger onClick={() => run(() => releaseBed(b.id))}>Keluar</Btn>
                        </>
                      )}
                      {b.status === "MAINTENANCE" && (
                        <Btn icon="✅" onClick={() => run(() => maintenanceBed(b.id, false))}>Aktifkan</Btn>
                      )}
                    </div>
                  )}

                  {/* panel aksi inline */}
                  {act && act.bedId === b.id && (
                    <div style={{ marginTop: 8, padding: 8, background: sap.bgZebra, borderRadius: 4 }}>
                      {act.mode === "assign" ? (
                        <>
                          <div style={{ fontSize: 11, color: sap.textSub, marginBottom: 4 }}>Pilih pasien (RI aktif):</div>
                          <select style={{ width: "100%", fontSize: 12, padding: 4 }} value={pick} onChange={(e) => setPick(Number(e.target.value))}>
                            <option value={0}>-- pilih --</option>
                            {admit.map((a) => (
                              <option key={a.id} value={a.id}>{a.pasien} ({a.mrn})</option>
                            ))}
                          </select>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 11, color: sap.textSub, marginBottom: 4 }}>Pindah ke bed kosong:</div>
                          <select style={{ width: "100%", fontSize: 12, padding: 4 }} value={pick} onChange={(e) => setPick(Number(e.target.value))}>
                            <option value={0}>-- pilih --</option>
                            {emptyBeds.map((eb) => (
                              <option key={eb.id} value={eb.id}>{eb.ward_kode} {eb.kode_bed}</option>
                            ))}
                          </select>
                        </>
                      )}
                      <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
                        <Btn icon="💾" primary onClick={() => {
                          if (!pick) { setErr("Pilih dulu"); return; }
                          run(() => act.mode === "assign" ? assignBed(b.id, pick) : transferBed(b.id, pick));
                        }}>OK</Btn>
                        <Btn icon="✖️" onClick={() => setAct(null)}>Batal</Btn>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
