// =====================================================================
// AuditLogPage.tsx — P16 Hardening: lihat jejak aktivitas mutasi (admin).
//  Data dari GET /api/audit (POST/PUT/PATCH/DELETE yang tercatat).
// =====================================================================

import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import { sap, Toolbar, Btn, Badge, th, td, tableStyle } from "../shell/ui";

type AuditRow = {
  id: number;
  username: string | null;
  role: string | null;
  method: string;
  path: string;
  status: number;
  ip: string | null;
  created_at: string;
};

const METHOD_COLOR: Record<string, string> = {
  POST: sap.green,
  PUT: sap.orange,
  PATCH: sap.orange,
  DELETE: sap.red,
};

function statusColor(s: number) {
  if (s >= 500) return sap.red;
  if (s >= 400) return sap.orange;
  return sap.green;
}

export default function AuditLogPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function muat() {
    setLoading(true);
    try {
      setRows(await apiFetch("/audit?limit=200"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { muat(); }, []);

  return (
    <div>
      <Toolbar>
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>
          {!loading && `${rows.length} aktivitas terakhir`}
        </span>
      </Toolbar>

      {loading ? <p>Memuat data...</p> : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={th}>Waktu</th>
              <th style={th}>User</th>
              <th style={th}>Role</th>
              <th style={th}>Method</th>
              <th style={th}>Endpoint</th>
              <th style={{ ...th, textAlign: "right" }}>Status</th>
              <th style={th}>IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td style={td} colSpan={7}>Belum ada aktivitas tercatat.</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                  <td style={td}>{new Date(r.created_at).toLocaleString("id-ID")}</td>
                  <td style={td}>{r.username || "-"}</td>
                  <td style={td}><span style={{ fontSize: 11, color: sap.textSub }}>{r.role || "-"}</span></td>
                  <td style={td}><Badge text={r.method} color={METHOD_COLOR[r.method] ?? sap.textSub} /></td>
                  <td style={{ ...td, fontFamily: "monospace", fontSize: 12 }}>{r.path}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 600, color: statusColor(r.status) }}>{r.status}</td>
                  <td style={td}>{r.ip || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
