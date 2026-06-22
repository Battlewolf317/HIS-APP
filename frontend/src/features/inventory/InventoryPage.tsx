// =====================================================================
// InventoryPage.tsx — Master stok obat & alkes + kartu stok (gerakan)
// =====================================================================

import { useState, useEffect } from "react";
import type { InvItem } from "./types";
import { getItems, deleteItem } from "./inventoryApi";
import { Toolbar, Btn, sap, inp } from "../shell/ui";
import ItemForm from "./ItemForm";
import StockCard from "./StockCard";
import ItemTable from "./ItemTable";

export default function InventoryPage({ role }: { role: string }) {
  const canManage = role === "gudang" || role === "admin";

  const [items, setItems] = useState<InvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [kategori, setKategori] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InvItem | null>(null);
  const [stockItem, setStockItem] = useState<InvItem | null>(null);

  async function muat() {
    setLoading(true);
    try {
      setItems(await getItems(q, kategori));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kategori]);

  function bukaBaru() {
    setEditing(null);
    setFormOpen(true);
  }
  function bukaEdit(it: InvItem) {
    setEditing(it);
    setFormOpen(true);
  }
  function onSaved() {
    setFormOpen(false);
    setEditing(null);
    muat();
  }
  async function onDelete(it: InvItem) {
    if (!confirm(`Hapus item ${it.kode} - ${it.nama}?`)) return;
    await deleteItem(it.id);
    muat();
  }

  const lowCount = items.filter((i) => Number(i.stok) <= Number(i.stok_min)).length;

  return (
    <div>
      <Toolbar>
        {canManage && <Btn icon="➕" primary onClick={bukaBaru}>Item Baru</Btn>}
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <input
          style={{ ...inp, width: 220 }}
          placeholder="Cari kode / nama..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && muat()}
        />
        <select style={{ ...inp, width: 130 }} value={kategori} onChange={(e) => setKategori(e.target.value)}>
          <option value="">Semua Kategori</option>
          <option value="OBAT">Obat</option>
          <option value="ALKES">Alkes</option>
        </select>
        <Btn icon="🔍" onClick={muat}>Cari</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: sap.textSub }}>
          {!loading && (
            <>
              {items.length} item
              {lowCount > 0 && (
                <span style={{ color: sap.red, fontWeight: 700, marginLeft: 8 }}>
                  ⚠ {lowCount} stok rendah
                </span>
              )}
            </>
          )}
        </span>
      </Toolbar>

      {formOpen && <ItemForm editing={editing} onSaved={onSaved} onCancel={() => setFormOpen(false)} />}

      {loading ? (
        <p>Memuat data...</p>
      ) : (
        <ItemTable
          items={items}
          canManage={canManage}
          onEdit={bukaEdit}
          onDelete={onDelete}
          onStock={(it) => setStockItem(it)}
        />
      )}

      {stockItem && (
        <StockCard
          item={stockItem}
          canManage={canManage}
          onClose={() => setStockItem(null)}
          onChanged={muat}
        />
      )}
    </div>
  );
}
