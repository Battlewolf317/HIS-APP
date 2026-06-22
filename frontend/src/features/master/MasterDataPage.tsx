// =====================================================================
// MasterDataPage.tsx — kelola master data (poli / dokter / tarif).
//  Tabs per entitas, tabel generik (kolom dari ENTITY_FIELDS) + form CRUD.
//  Mutasi (baru/edit/hapus) hanya untuk role admin.
// =====================================================================

import { useState, useEffect } from "react";
import type { MasterRow } from "./types";
import { ENTITY_FIELDS, ENTITY_LABEL } from "./types";
import { getAll, createRow, updateRow, removeRow } from "./masterApi";
import { Toolbar, Btn, sap, th, td, tableStyle, inp, lbl } from "../shell/ui";

const ENTITIES = Object.keys(ENTITY_FIELDS); // ["poli","dokter","tarif"]

export default function MasterDataPage({ role }: { role: string }) {
  const canManage = role === "admin";

  const [entity, setEntity] = useState<string>(ENTITIES[0]);
  const [rows, setRows] = useState<MasterRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MasterRow | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const fields = ENTITY_FIELDS[entity];

  async function muat() {
    setLoading(true);
    try {
      setRows(await getAll(entity));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setFormOpen(false);
    setEditing(null);
    muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity]);

  function bukaBaru() {
    setEditing(null);
    const init: Record<string, string> = {};
    fields.forEach((f) => (init[f.key] = ""));
    setDraft(init);
    setFormOpen(true);
  }

  function bukaEdit(r: MasterRow) {
    setEditing(r);
    const init: Record<string, string> = {};
    fields.forEach((f) => (init[f.key] = r[f.key] == null ? "" : String(r[f.key])));
    setDraft(init);
    setFormOpen(true);
  }

  async function simpan() {
    // payload sesuai tipe field (number → Number)
    const payload: Record<string, unknown> = {};
    fields.forEach((f) => {
      const v = draft[f.key] ?? "";
      payload[f.key] = f.type === "number" ? Number(v || 0) : v;
    });
    if (editing) await updateRow(entity, editing.id, payload);
    else await createRow(entity, payload);
    setFormOpen(false);
    setEditing(null);
    muat();
  }

  async function hapus(r: MasterRow) {
    if (!confirm(`Hapus ${ENTITY_LABEL[entity]} "${r.nama ?? r.kode}"?`)) return;
    await removeRow(entity, r.id);
    muat();
  }

  return (
    <div>
      {/* tabs entitas */}
      <Toolbar>
        {ENTITIES.map((e) => (
          <Btn key={e} primary={e === entity} onClick={() => setEntity(e)}>
            {ENTITY_LABEL[e]}
          </Btn>
        ))}
        <span style={{ marginLeft: 12, borderLeft: `1px solid ${sap.line}`, paddingLeft: 12 }}>
          {canManage && <Btn icon="➕" primary onClick={bukaBaru}>Baru</Btn>}
        </span>
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>
          {!loading && `${rows.length} ${ENTITY_LABEL[entity]}`}
        </span>
      </Toolbar>

      {/* form inline */}
      {formOpen && (
        <div
          style={{
            border: `1px solid ${sap.line}`,
            borderRadius: 4,
            padding: 14,
            marginBottom: 12,
            background: sap.bgZebra,
          }}
        >
          <h3 style={{ margin: "0 0 10px", fontSize: 15, color: sap.text }}>
            {editing ? `Edit ${ENTITY_LABEL[entity]}` : `${ENTITY_LABEL[entity]} Baru`}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {fields.map((f) => {
              // kode dikunci saat edit (primary business key)
              const locked = !!editing && f.key === "kode";
              return (
                <div key={f.key}>
                  <label style={lbl}>{f.label}</label>
                  <input
                    style={{ ...inp, background: locked ? "#eee" : "#fff" }}
                    type={f.type === "number" ? "number" : "text"}
                    value={draft[f.key] ?? ""}
                    disabled={locked}
                    onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                  />
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
            <Btn primary icon="💾" onClick={simpan}>Simpan</Btn>
            <Btn onClick={() => { setFormOpen(false); setEditing(null); }}>Batal</Btn>
          </div>
        </div>
      )}

      {/* tabel */}
      {loading ? (
        <p>Memuat data...</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              {fields.map((f) => (
                <th key={f.key} style={th}>{f.label}</th>
              ))}
              {canManage && <th style={{ ...th, width: 140 }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td style={td} colSpan={fields.length + (canManage ? 1 : 0)}>
                  Belum ada data.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 ? sap.bgZebra : "#fff" }}>
                  {fields.map((f) => (
                    <td key={f.key} style={td}>
                      {f.type === "number" && r[f.key] != null
                        ? Number(r[f.key]).toLocaleString("id-ID")
                        : r[f.key] ?? "-"}
                    </td>
                  ))}
                  {canManage && (
                    <td style={td}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Btn icon="✏️" onClick={() => bukaEdit(r)}>Edit</Btn>
                        <Btn icon="🗑️" danger onClick={() => hapus(r)}>Hapus</Btn>
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
