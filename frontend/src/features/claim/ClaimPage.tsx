// =====================================================================
// ClaimPage.tsx — P11 Piutang & Klaim penjamin (BPJS/asuransi) + aging.
//  Status flow: OPEN → SUBMITTED → APPROVED → PAID  (↘ REJECTED)
//  Mutasi hanya untuk role kasir/admin.
// =====================================================================

import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import type { Claim, Penjamin, Aging } from "./types";
import { getClaims, getPenjamin, getAging, createClaim, submitClaim, approveClaim, payClaim, rejectClaim } from "./claimApi";
import { sap, Toolbar, Btn, Badge, inp, lbl, th, td, tableStyle } from "../shell/ui";

const rupiah = (n: number | string) =>
  "Rp " + Number(n).toLocaleString("id-ID", { minimumFractionDigits: 0 });

const STATUS_COLOR: Record<string, string> = {
  OPEN: sap.textSub,
  SUBMITTED: sap.blue,
  APPROVED: sap.orange,
  PAID: sap.green,
  REJECTED: sap.red,
};

const STATUS_LIST = ["OPEN", "SUBMITTED", "APPROVED", "PAID", "REJECTED"];
const KOSONG = { penjamin_id: "", pasien: "", jumlah_tagih: "", keterangan: "" };

export default function ClaimPage({ role }: { role: string }) {
  const canManage = role === "kasir" || role === "admin";

  const [claims, setClaims] = useState<Claim[]>([]);
  const [penjamin, setPenjamin] = useState<Penjamin[]>([]);
  const [aging, setAging] = useState<Aging | null>(null);
  const [loading, setLoading] = useState(true);

  const [fStatus, setFStatus] = useState("");
  const [fPenjamin, setFPenjamin] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState(KOSONG);
  const [error, setError] = useState("");

  async function muat() {
    setLoading(true);
    try {
      const [cl, ag] = await Promise.all([getClaims(fStatus, fPenjamin), getAging()]);
      setClaims(cl);
      setAging(ag);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getPenjamin().then(setPenjamin).catch(() => setPenjamin([]));
  }, []);

  useEffect(() => {
    muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fStatus, fPenjamin]);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await createClaim({
        penjamin_id: Number(draft.penjamin_id),
        pasien: draft.pasien,
        jumlah_tagih: Number(draft.jumlah_tagih),
        keterangan: draft.keterangan,
      });
      setDraft(KOSONG);
      setFormOpen(false);
      muat();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function aksi(fn: () => Promise<unknown>) {
    setError("");
    try {
      await fn();
      muat();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  function onApprove(c: Claim) {
    const input = prompt(`Jumlah disetujui (tagih ${rupiah(c.jumlah_tagih)}):`, String(c.jumlah_tagih));
    if (input === null) return;
    aksi(() => approveClaim(c.id, Number(input)));
  }

  function onReject(c: Claim) {
    const alasan = prompt(`Alasan penolakan klaim ${c.no_klaim}:`, "");
    if (!alasan) return;
    aksi(() => rejectClaim(c.id, alasan));
  }

  return (
    <div>
      {/* AGING SUMMARY */}
      {aging && (
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <Box label="Total Piutang" value={rupiah(aging.total_piutang)} color={sap.blue} big />
          <Box label="0–30 hari" value={rupiah(aging.b0_30)} color={sap.green} />
          <Box label="31–60 hari" value={rupiah(aging.b31_60)} color={sap.orange} />
          <Box label="61–90 hari" value={rupiah(aging.b61_90)} color={sap.orange} />
          <Box label="> 90 hari" value={rupiah(aging.b90p)} color={sap.red} />
          <Box label="Jml Klaim Aktif" value={String(aging.jml_klaim)} color={sap.text} />
        </div>
      )}

      <Toolbar>
        {canManage && <Btn icon="➕" primary onClick={() => { setFormOpen(true); setError(""); }}>Klaim Baru</Btn>}
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <select style={{ ...inp, width: 150 }} value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="">Semua Status</option>
          {STATUS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select style={{ ...inp, width: 180 }} value={fPenjamin} onChange={(e) => setFPenjamin(e.target.value)}>
          <option value="">Semua Penjamin</option>
          {penjamin.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
        </select>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>
          {!loading && `${claims.length} klaim`}
        </span>
      </Toolbar>

      {/* FORM KLAIM BARU */}
      {formOpen && (
        <div style={formWrap}>
          <h3 style={{ margin: "0 0 10px", fontSize: 15, color: sap.text }}>Klaim Baru</h3>
          <form onSubmit={simpan} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            <div>
              <label style={lbl}>Penjamin *</label>
              <select style={inp} value={draft.penjamin_id} onChange={(e) => setDraft({ ...draft, penjamin_id: e.target.value })}>
                <option value="">-- pilih --</option>
                {penjamin.map((p) => <option key={p.id} value={p.id}>{p.nama} ({p.jenis})</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Nama Pasien</label>
              <input style={inp} value={draft.pasien} onChange={(e) => setDraft({ ...draft, pasien: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>Jumlah Tagih *</label>
              <input style={inp} type="number" min={0} value={draft.jumlah_tagih} onChange={(e) => setDraft({ ...draft, jumlah_tagih: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>Keterangan</label>
              <input style={inp} value={draft.keterangan} onChange={(e) => setDraft({ ...draft, keterangan: e.target.value })} />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 6 }}>
              <Btn type="submit" primary icon="💾">Simpan</Btn>
              <Btn onClick={() => setFormOpen(false)}>Batal</Btn>
            </div>
          </form>
          {error && <p style={{ color: sap.red, margin: "8px 0 0" }}>⚠️ {error}</p>}
        </div>
      )}

      {/* TABEL KLAIM */}
      {loading ? (
        <p>Memuat data...</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={th}>No Klaim</th>
              <th style={th}>Penjamin</th>
              <th style={th}>Pasien</th>
              <th style={{ ...th, textAlign: "right" }}>Tagih</th>
              <th style={{ ...th, textAlign: "right" }}>Disetujui</th>
              <th style={th}>Status</th>
              <th style={{ ...th, textAlign: "right" }}>Umur</th>
              {canManage && <th style={{ ...th, width: 200 }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {claims.length === 0 ? (
              <tr><td style={td} colSpan={canManage ? 8 : 7}>Belum ada klaim.</td></tr>
            ) : (
              claims.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                  <td style={td}>{c.no_klaim}</td>
                  <td style={td}>{c.penjamin_nama}<div style={{ fontSize: 11, color: sap.textSub }}>{c.penjamin_jenis}</div></td>
                  <td style={td}>{c.pasien || "-"}</td>
                  <td style={{ ...td, textAlign: "right" }}>{rupiah(c.jumlah_tagih)}</td>
                  <td style={{ ...td, textAlign: "right" }}>{Number(c.jumlah_setuju) > 0 ? rupiah(c.jumlah_setuju) : "-"}</td>
                  <td style={td}><Badge text={c.status} color={STATUS_COLOR[c.status] ?? sap.textSub} /></td>
                  <td style={{ ...td, textAlign: "right", color: c.umur_hari > 90 && !["PAID", "REJECTED"].includes(c.status) ? sap.red : sap.text }}>
                    {["PAID", "REJECTED"].includes(c.status) ? "-" : `${c.umur_hari} hr`}
                  </td>
                  {canManage && (
                    <td style={td}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {c.status === "OPEN" && <Btn icon="📤" onClick={() => aksi(() => submitClaim(c.id))}>Ajukan</Btn>}
                        {c.status === "SUBMITTED" && <Btn icon="✓" onClick={() => onApprove(c)}>Setujui</Btn>}
                        {c.status === "APPROVED" && <Btn icon="💵" primary onClick={() => aksi(() => payClaim(c.id))}>Bayar</Btn>}
                        {["SUBMITTED", "APPROVED"].includes(c.status) && <Btn icon="✕" danger onClick={() => onReject(c)}>Tolak</Btn>}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Box({ label, value, color, big }: { label: string; value: string; color: string; big?: boolean }) {
  return (
    <div style={{ flex: big ? 1.4 : 1, minWidth: 130, border: `1px solid ${sap.line}`, borderRadius: 4, padding: "8px 12px", background: sap.bgZebra }}>
      <div style={{ fontSize: 11, color: sap.textSub, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: big ? 18 : 15, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

const formWrap: CSSProperties = {
  border: `1px solid ${sap.line}`,
  borderRadius: 4,
  padding: 14,
  marginBottom: 12,
  background: "#fff",
};
