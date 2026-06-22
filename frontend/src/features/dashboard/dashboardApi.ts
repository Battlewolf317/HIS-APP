// =====================================================================
// dashboardApi.ts — panggil API dashboard / laporan ber-auth
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Dashboard } from "./types";

export function getDashboard(): Promise<Dashboard> {
  return apiFetch("/reports/dashboard");
}
