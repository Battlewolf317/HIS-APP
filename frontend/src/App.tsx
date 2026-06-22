import { useState } from "react";
import PatientPage from "./features/patient/PatientPage";
import ProfilPage from "./features/profil/ProfilPage";
import { ProfileProvider, CAN_VIEW_PROFILE } from "./features/profil/profileContext";
import EncounterPage from "./features/encounter/EncounterPage";
import TriasePage from "./features/triase/TriasePage";
import DietPage from "./features/diet/DietPage";
import RujukanPage from "./features/rujukan/RujukanPage";
import OperasiPage from "./features/operasi/OperasiPage";
import DpjpPage from "./features/dpjp/DpjpPage";
import DischargePage from "./features/discharge/DischargePage";
import JasaMedisPage from "./features/jasamedis/JasaMedisPage";
import ProcurementPage from "./features/procurement/ProcurementPage";
import SdmPage from "./features/sdm/SdmPage";
import InventoryPage from "./features/inventory/InventoryPage";
import PharmacyPage from "./features/pharmacy/PharmacyPage";
import DiagnosticPage from "./features/diagnostic/DiagnosticPage";
import BedBoardPage from "./features/bed/BedBoardPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import LaporanPage from "./features/laporan/LaporanPage";
import FisioterapiPage from "./features/fisioterapi/FisioterapiPage";
import McuPage from "./features/mcu/McuPage";
import TransfusiPage from "./features/transfusi/TransfusiPage";
import CpptPage from "./features/cppt/CpptPage";
import AskepPage from "./features/askep/AskepPage";
import ConsentPage from "./features/consent/ConsentPage";
import QueuePage from "./features/queue/QueuePage";
import MasterDataPage from "./features/master/MasterDataPage";
import ClaimPage from "./features/claim/ClaimPage";
import AccountingPage from "./features/accounting/AccountingPage";
import AuditLogPage from "./features/audit/AuditLogPage";
import LoginPage from "./features/auth/LoginPage";
import Sidebar from "./features/shell/Sidebar";
import { getWorkEnv, type PageKey } from "./features/shell/menuConfig";
import { sap } from "./features/shell/ui";
import { getUser, clearAuth, type AuthUser } from "./lib/api";

export default function App() {
  const [user, setUserState] = useState<AuthUser | null>(getUser());
  if (!user) return <LoginPage onLogin={setUserState} />;
  return <Shell user={user} onLogout={() => { clearAuth(); setUserState(null); }} />;
}

// inisial nama untuk avatar (mis. "dr. SETYA W" → "SW")
function initials(nama: string): string {
  const words = (nama || "").replace(/[^a-zA-Z ]/g, "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function Shell({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const env = getWorkEnv(user.role);
  const firstKey = env.groups[0].items[0].key;
  const [active, setActive] = useState<PageKey>(firstKey);
  // pasien yang profilnya sedang dibuka (dari klik di daftar pasien)
  const [profilId, setProfilId] = useState<number | null>(null);
  const canViewProfile = CAN_VIEW_PROFILE.includes(user.role);

  function openProfile(patientId: number) {
    setProfilId(patientId);
    setActive("profil");
  }

  const activeLabel =
    active === "profil"
      ? "Profil Pasien"
      : env.groups.flatMap((g) => g.items).find((i) => i.key === active)?.label ?? "";

  return (
    <ProfileProvider value={{ canView: canViewProfile, open: openProfile }}>
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      {/* SHELL BAR (atas, full width) */}
      <header
        style={{
          background: `linear-gradient(90deg, ${sap.shell} 0%, #1b3a6b 100%)`,
          color: "#fff",
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 18px",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(15,23,42,0.18)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🏥</div>
          <div style={{ lineHeight: 1.15 }}>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.2 }}>HIS — Hospital Information System</div>
            <div style={{ fontSize: 10.5, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.6 }}>RS Sehat Sentosa</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12, textAlign: "right", lineHeight: 1.25 }}>
            <div><b>{user.nama}</b></div>
            <div style={{ opacity: 0.75, fontSize: 11 }}>[{env.code}]</div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: sap.blue, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, border: "2px solid rgba(255,255,255,0.25)" }}>
            {initials(user.nama)}
          </div>
        </div>
      </header>

      {/* BODY: sidebar + konten */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Sidebar env={env} user={user} active={active} onSelect={setActive} onLogout={onLogout} />

        <main style={{ flex: 1, padding: 22, overflow: "auto", background: "#eef2f7" }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: sap.textSub, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
              {env.label} › {activeLabel}
            </div>
            <h2 style={{ margin: "3px 0 0", color: sap.text, fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>{activeLabel}</h2>
          </div>

          {active === "pasien" && <PatientPage />}
          {active === "profil" && <ProfilPage initialPatientId={profilId ?? undefined} onBack={() => setActive("pasien")} />}
          {active === "kunjungan" && <EncounterPage role={user.role} />}
          {active === "triase" && <TriasePage user={user} />}
          {active === "operasi" && <OperasiPage user={user} />}
          {active === "dpjp" && <DpjpPage user={user} />}
          {active === "discharge" && <DischargePage user={user} />}
          {active === "cppt" && <CpptPage user={user} />}
          {active === "askep" && <AskepPage user={user} />}
          {active === "consent" && <ConsentPage user={user} />}
          {active === "jasamedis" && <JasaMedisPage user={user} />}
          {active === "procurement" && <ProcurementPage user={user} />}
          {active === "sdm" && <SdmPage user={user} />}
          {active === "rujukan" && <RujukanPage user={user} />}
          {active === "diet" && <DietPage user={user} />}
          {active === "inventory" && <InventoryPage role={user.role} />}
          {active === "farmasi" && <PharmacyPage role={user.role} />}
          {active === "lab" && <DiagnosticPage jenis="LAB" role={user.role} />}
          {active === "radiologi" && <DiagnosticPage jenis="RAD" role={user.role} />}
          {active === "fisioterapi" && <FisioterapiPage user={user} />}
          {active === "mcu" && <McuPage user={user} />}
          {active === "transfusi" && <TransfusiPage user={user} />}
          {active === "bed" && <BedBoardPage role={user.role} />}
          {active === "dashboard" && <DashboardPage />}
          {active === "laporan" && <LaporanPage />}
          {active === "antrian" && <QueuePage role={user.role} />}
          {active === "master" && <MasterDataPage role={user.role} />}
          {active === "claim" && <ClaimPage role={user.role} />}
          {active === "akuntansi" && <AccountingPage role={user.role} />}
          {active === "audit" && <AuditLogPage />}
        </main>
      </div>
    </div>
    </ProfileProvider>
  );
}
