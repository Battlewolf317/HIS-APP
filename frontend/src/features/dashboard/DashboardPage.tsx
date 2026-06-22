// =====================================================================
// DashboardPage.tsx — Dashboard & Laporan (P9)
//  KPI cards + bar sederhana (tanpa chart lib): kunjungan per tipe,
//  order per jenis, 10 besar diagnosa, bed occupancy, ringkasan billing.
// =====================================================================

import { useState, useEffect } from "react";
import type { Dashboard } from "./types";
import { getDashboard } from "./dashboardApi";
import { Toolbar, Btn, sap } from "../shell/ui";

const rp = (n: number) => "Rp " + Number(n).toLocaleString("id-ID");

function Kpi({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ flex: "1 1 160px", border: `1px solid ${sap.line}`, borderTop: `3px solid ${color}`, borderRadius: 4, padding: "12px 14px", background: "#fff" }}>
      <div style={{ fontSize: 11, color: sap.textSub, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: sap.text, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: sap.textSub, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Bar({ label, n, max, color }: { label: string; n: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((n / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, fontSize: 13 }}>
      <div style={{ width: 150, color: sap.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={label}>{label}</div>
      <div style={{ flex: 1, background: sap.bgZebra, borderRadius: 3, height: 16, position: "relative" }}>
        <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 3, minWidth: n > 0 ? 4 : 0 }} />
      </div>
      <div style={{ width: 34, textAlign: "right", fontWeight: 700 }}>{n}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: "1 1 320px", border: `1px solid ${sap.line}`, borderRadius: 4, padding: 14, background: "#fff" }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: sap.blue, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

const tipeColor: Record<string, string> = { RJ: sap.blue, RI: sap.orange, IGD: sap.red };

export default function DashboardPage() {
  const [d, setD] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  async function muat() {
    setLoading(true);
    try {
      setD(await getDashboard());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
  }, []);

  if (loading || !d) return <p>Memuat dashboard...</p>;

  const maxTipe = Math.max(1, ...d.encounter_by_tipe.map((x) => x.n));
  const maxDiag = Math.max(1, ...d.top_diagnosa.map((x) => x.n));
  const maxOrder = Math.max(1, ...d.orders_by_jenis.map((x) => x.total));

  return (
    <div>
      <Toolbar>
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
      </Toolbar>

      {/* KPI cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <Kpi label="Total Pasien" value={String(d.pasien_total)} color={sap.blue} />
        <Kpi label="Kunjungan Hari Ini" value={String(d.encounter.today)} color={sap.green} sub={`${d.encounter.aktif} aktif`} />
        <Kpi label="Bed Occupancy" value={`${d.bed.occupancy}%`} color={sap.orange} sub={`${d.bed.terisi}/${d.bed.total} terisi`} />
        <Kpi label="Pendapatan (Lunas)" value={rp(d.billing.pendapatan)} color={sap.green} sub={`${d.billing.lunas_count} tagihan`} />
        <Kpi label="Outstanding (Draft)" value={rp(d.billing.outstanding)} color={sap.red} sub={`${d.billing.draft_count} tagihan`} />
        <Kpi label="Stok Rendah" value={String(d.low_stock)} color={d.low_stock > 0 ? sap.red : sap.green} sub="item ≤ minimum" />
      </div>

      {/* Panels */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <Panel title="Kunjungan per Tipe">
          {d.encounter_by_tipe.length === 0 ? (
            <p style={{ color: sap.textSub, fontSize: 13 }}>Belum ada data.</p>
          ) : (
            d.encounter_by_tipe.map((x) => (
              <Bar key={x.tipe} label={x.tipe} n={x.n} max={maxTipe} color={tipeColor[x.tipe] ?? sap.blue} />
            ))
          )}
        </Panel>

        <Panel title="Order Penunjang per Jenis (total)">
          {d.orders_by_jenis.length === 0 ? (
            <p style={{ color: sap.textSub, fontSize: 13 }}>Belum ada order.</p>
          ) : (
            d.orders_by_jenis.map((x) => (
              <Bar key={x.jenis} label={`${x.jenis} (${x.pending} pending)`} n={x.total} max={maxOrder} color={sap.blue} />
            ))
          )}
        </Panel>

        <Panel title="Bed Status">
          <Bar label="Terisi" n={d.bed.terisi} max={d.bed.total || 1} color={sap.blue} />
          <Bar label="Kosong" n={d.bed.kosong} max={d.bed.total || 1} color={sap.green} />
          <Bar label="Maintenance" n={d.bed.maintenance} max={d.bed.total || 1} color={sap.textSub} />
        </Panel>

        <Panel title="10 Besar Diagnosa">
          {d.top_diagnosa.length === 0 ? (
            <p style={{ color: sap.textSub, fontSize: 13 }}>Belum ada rekam medis.</p>
          ) : (
            d.top_diagnosa.map((x) => (
              <Bar key={x.nama} label={x.nama} n={x.n} max={maxDiag} color={sap.orange} />
            ))
          )}
        </Panel>
      </div>
    </div>
  );
}
