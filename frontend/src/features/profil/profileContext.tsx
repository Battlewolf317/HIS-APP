// =====================================================================
// profileContext.tsx — akses global "buka profil pasien".
//  Disediakan di App; dipakai komponen manapun lewat <PatientLink/>.
//  Hanya role dokter/perawat/admin yang bisa membuka profil (canView).
// =====================================================================

import { createContext, useContext, type ReactNode } from "react";
import { sap } from "../shell/ui";

type ProfileCtx = {
  canView: boolean;                       // role boleh lihat profil?
  open: (patientId: number) => void;      // buka profil pasien
};

const Ctx = createContext<ProfileCtx>({ canView: false, open: () => {} });

export function ProfileProvider({ value, children }: { value: ProfileCtx; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfile() {
  return useContext(Ctx);
}

// daftar role yang boleh membuka profil pasien
export const CAN_VIEW_PROFILE = ["dokter", "perawat", "admin"];

// --- PatientLink: render nama/identitas pasien.
//  Kalau role boleh → jadi link biru yang membuka profil.
//  Kalau tidak → tampil teks biasa.
export function PatientLink({
  patientId,
  children,
  title = "Lihat profil pasien",
}: {
  patientId?: number | null;
  children: ReactNode;
  title?: string;
}) {
  const { canView, open } = useProfile();
  if (!canView || !patientId) return <>{children}</>;
  return (
    <span
      onClick={(e) => { e.stopPropagation(); open(patientId); }}
      title={title}
      style={{ color: sap.blue, cursor: "pointer", fontWeight: 600, textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 2 }}
    >
      {children}
    </span>
  );
}
