import { useState, useEffect } from "react";
import type { Encounter } from "./types";
import { getEncounters, deleteEncounter, selesaiEncounter } from "./encounterApi";
import EncounterForm from "./EncounterForm";
import EncounterList from "./EncounterList";
import MedrecPanel from "../medrec/MedrecPanel";
import BillPanel from "../bill/BillPanel";
import OrderPanel from "../order/OrderPanel";
import { Toolbar, Btn } from "../shell/ui";

export default function EncounterPage({ role }: { role: string }) {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [editing, setEditing] = useState<Encounter | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [medrecOf, setMedrecOf] = useState<Encounter | null>(null);
  const [billOf, setBillOf] = useState<Encounter | null>(null);
  const [orderOf, setOrderOf] = useState<Encounter | null>(null);
  const [loading, setLoading] = useState(true);

  // hanya admin/perawat yang boleh daftar kunjungan baru
  const bolehDaftar = role === "admin" || role === "perawat";

  async function muat() {
    setLoading(true);
    try {
      setEncounters(await getEncounters());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
  }, []);

  function bukaBaru() { setEditing(null); setFormOpen(true); }
  function bukaEdit(e: Encounter) { setEditing(e); setFormOpen(true); }
  function tutupForm() { setEditing(null); setFormOpen(false); }
  function onSaved() { tutupForm(); muat(); }

  async function onSelesai(e: Encounter) {
    if (!confirm(`Selesaikan kunjungan ${e.encounter_no}?`)) return;
    await selesaiEncounter(e.id);
    if (medrecOf?.id === e.id) setMedrecOf(null);
    muat();
  }
  async function onDelete(e: Encounter) {
    if (!confirm(`Cancel kunjungan ${e.encounter_no}?`)) return;
    await deleteEncounter(e.id);
    if (medrecOf?.id === e.id) setMedrecOf(null);
    muat();
  }

  return (
    <div>
      <Toolbar>
        {bolehDaftar && <Btn icon="➕" primary onClick={bukaBaru}>Kunjungan Baru</Btn>}
        <Btn icon="🔄" onClick={muat}>Refresh</Btn>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#6a6d70" }}>
          {!loading && `${encounters.length} kunjungan`}
        </span>
      </Toolbar>

      {formOpen && <EncounterForm editing={editing} onSaved={onSaved} onCancel={tutupForm} />}

      {medrecOf && <MedrecPanel encounter={medrecOf} role={role} onClose={() => setMedrecOf(null)} />}
      {billOf && <BillPanel encounter={billOf} role={role} onClose={() => setBillOf(null)} />}
      {orderOf && <OrderPanel encounter={orderOf} role={role} onClose={() => setOrderOf(null)} />}

      {loading ? (
        <p>Memuat data...</p>
      ) : (
        <EncounterList
          encounters={encounters}
          onEdit={bukaEdit}
          onSelesai={onSelesai}
          onDelete={onDelete}
          onMedrec={setMedrecOf}
          onBill={setBillOf}
          onOrder={setOrderOf}
        />
      )}
    </div>
  );
}
