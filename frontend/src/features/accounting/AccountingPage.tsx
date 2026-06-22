// =====================================================================
// AccountingPage.tsx — P12 Akuntansi: Jurnal, Neraca Saldo, COA.
//  Jurnal auto-posting dari payment & klaim; jurnal manual (admin).
// =====================================================================

import { useState, useEffect } from "react";
import type { Akun, Jurnal, TrialRow } from "./types";
import { getAccounts, getJournals, getTrialBalance, postJournal } from "./accountingApi";
import { sap, Toolbar, Btn, Badge, inp, lbl, th, td, tableStyle } from "../shell/ui";

const rupiah = (n: number | string) =>
  Number(n).toLocaleString("id-ID", { minimumFractionDigits: 0 });

const REF_COLOR: Record<string, string> = { PAYMENT: sap.green, CLAIM: sap.blue, MANUAL: sap.textSub };
type Tab = "jurnal" | "neraca" | "coa";

export default function AccountingPage({ role }: { role: string }) {
  const canManage = role === "admin";

  const [tab, setTab] = useState<Tab>("jurnal");
  const [journals, setJournals] = useState<Jurnal[]>([]);
  const [trial, setTrial] = useState<TrialRow[]>([]);
  const [accounts, setAccounts] = useState<Akun[]>([]);
  const [loading, setLoading] = useState(true);
  const [refFilter, setRefFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState({ keterangan: "", akunDebit: "", akunKredit: "", jumlah: "" });
  const [error, setError] = useState("");

  async function muat() {
    setLoading(true);
    try {
      if (tab === "jurnal") setJournals(await getJournals(refFilter));
      else if (tab === "neraca") setTrial(await getTrialBalance());
      else setAccounts(await getAccounts());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getAccounts().then(setAccounts).catch(() => setAccounts([]));
  }, []);

  useEffect(() => {
    muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, refFilter]);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const jumlah = Number(draft.jumlah);
    if (!draft.akunDebit || !draft.akunKredit) { setError("Pilih akun debit dan kredit"); return; }
    if (draft.akunDebit === draft.akunKredit) { setError("Akun debit dan kredit tidak boleh sama"); return; }
    try {
      await postJournal({
        keterangan: draft.keterangan,
        lines: [
          { akun_id: Number(draft.akunDebit), debit: jumlah, kredit: 0 },
          { akun_id: Number(draft.akunKredit), debit: 0, kredit: jumlah },
        ],
      });
      setDraft({ keterangan: "", akunDebit: "", akunKredit: "", jumlah: "" });
      setFormOpen(false);
      setTab("jurnal");
      muat();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  // total neraca (untuk cek balance)
  const totD = trial.reduce((s, r) => s + Number(r.total_debit), 0);
  const totK = trial.reduce((s, r) => s + Number(r.total_kredit), 0);

  return (
    <div>
      <Toolbar>
        <Btn primary={tab === "jurnal"} onClick={() => setTab("jurnal")}>Jurnal</Btn>
        <Btn primary={tab === "neraca"} onClick={() => setTab("neraca")}>Neraca Saldo</Btn>
        <Btn primary={tab === "coa"} onClick={() => setTab("coa")}>Bagan Akun (COA)</Btn>
        <span style={{ borderLeft: `1px solid ${sap.line}`, paddingLeft: 12, marginLeft: 4 }}>
          <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        </span>
        {tab === "jurnal" && (
          <>
            <select style={{ ...inp, width: 150 }} value={refFilter} onChange={(e) => setRefFilter(e.target.value)}>
              <option value="">Semua Sumber</option>
              <option value="PAYMENT">Pembayaran</option>
              <option value="CLAIM">Klaim</option>
              <option value="MANUAL">Manual</option>
            </select>
            {canManage && <Btn icon="➕" primary onClick={() => { setFormOpen(true); setError(""); }}>Jurnal Manual</Btn>}
          </>
        )}
      </Toolbar>

      {/* FORM JURNAL MANUAL (2 baris balanced) */}
      {tab === "jurnal" && formOpen && (
        <div style={{ border: `1px solid ${sap.line}`, borderRadius: 4, padding: 14, marginBottom: 12, background: "#fff" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 15, color: sap.text }}>Jurnal Manual</h3>
          <form onSubmit={simpan} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            <div>
              <label style={lbl}>Akun Debit</label>
              <select style={inp} value={draft.akunDebit} onChange={(e) => setDraft({ ...draft, akunDebit: e.target.value })}>
                <option value="">-- pilih --</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.kode} — {a.nama}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Akun Kredit</label>
              <select style={inp} value={draft.akunKredit} onChange={(e) => setDraft({ ...draft, akunKredit: e.target.value })}>
                <option value="">-- pilih --</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.kode} — {a.nama}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Jumlah</label>
              <input style={inp} type="number" min={0} value={draft.jumlah} onChange={(e) => setDraft({ ...draft, jumlah: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>Keterangan</label>
              <input style={inp} value={draft.keterangan} onChange={(e) => setDraft({ ...draft, keterangan: e.target.value })} />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 6 }}>
              <Btn type="submit" primary icon="💾">Posting</Btn>
              <Btn onClick={() => setFormOpen(false)}>Batal</Btn>
            </div>
          </form>
          {error && <p style={{ color: sap.red, margin: "8px 0 0" }}>⚠️ {error}</p>}
        </div>
      )}

      {loading ? <p>Memuat data...</p> : (
        <>
          {/* TAB JURNAL */}
          {tab === "jurnal" && (
            journals.length === 0 ? <p style={{ color: sap.textSub }}>Belum ada jurnal.</p> :
            journals.map((j) => (
              <div key={j.id} style={{ border: `1px solid ${sap.line}`, borderRadius: 4, marginBottom: 10, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: sap.bgHead, borderBottom: `1px solid ${sap.line}` }}>
                  <span><b>{j.no_jurnal}</b> <span style={{ color: sap.textSub, fontSize: 12 }}>· {j.tanggal} · {j.keterangan}</span></span>
                  <Badge text={j.ref_tipe ?? "MANUAL"} color={REF_COLOR[j.ref_tipe ?? "MANUAL"] ?? sap.textSub} />
                </div>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={th}>Akun</th>
                      <th style={{ ...th, textAlign: "right" }}>Debit</th>
                      <th style={{ ...th, textAlign: "right" }}>Kredit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {j.lines.map((l, i) => (
                      <tr key={i}>
                        <td style={td}>{l.akun_kode} — {l.akun_nama}</td>
                        <td style={{ ...td, textAlign: "right" }}>{Number(l.debit) > 0 ? rupiah(l.debit) : ""}</td>
                        <td style={{ ...td, textAlign: "right" }}>{Number(l.kredit) > 0 ? rupiah(l.kredit) : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}

          {/* TAB NERACA SALDO */}
          {tab === "neraca" && (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={th}>Kode</th>
                  <th style={th}>Akun</th>
                  <th style={th}>Tipe</th>
                  <th style={{ ...th, textAlign: "right" }}>Total Debit</th>
                  <th style={{ ...th, textAlign: "right" }}>Total Kredit</th>
                  <th style={{ ...th, textAlign: "right" }}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {trial.map((r, i) => {
                  const d = Number(r.total_debit), k = Number(r.total_kredit);
                  const saldo = r.saldo_normal === "D" ? d - k : k - d;
                  return (
                    <tr key={r.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                      <td style={td}>{r.kode}</td>
                      <td style={td}>{r.nama}</td>
                      <td style={td}><span style={{ fontSize: 11, color: sap.textSub }}>{r.tipe}</span></td>
                      <td style={{ ...td, textAlign: "right" }}>{d > 0 ? rupiah(d) : "-"}</td>
                      <td style={{ ...td, textAlign: "right" }}>{k > 0 ? rupiah(k) : "-"}</td>
                      <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{rupiah(saldo)} {r.saldo_normal}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: sap.bgHead }}>
                  <td style={{ ...td, fontWeight: 700 }} colSpan={3}>TOTAL</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 700, color: sap.blue }}>{rupiah(totD)}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 700, color: sap.blue }}>{rupiah(totK)}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 700, color: Math.round((totD - totK) * 100) === 0 ? sap.green : sap.red }}>
                    {Math.round((totD - totK) * 100) === 0 ? "BALANCE ✓" : "TIMPANG"}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* TAB COA */}
          {tab === "coa" && (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={th}>Kode</th>
                  <th style={th}>Nama Akun</th>
                  <th style={th}>Tipe</th>
                  <th style={th}>Saldo Normal</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a, i) => (
                  <tr key={a.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                    <td style={td}>{a.kode}</td>
                    <td style={td}>{a.nama}</td>
                    <td style={td}>{a.tipe}</td>
                    <td style={td}>{a.saldo_normal === "D" ? "Debit" : "Kredit"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
