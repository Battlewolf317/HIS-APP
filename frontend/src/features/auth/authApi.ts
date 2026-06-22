// =====================================================================
// authApi.ts — login & cek sesi
// =====================================================================

import { apiFetch, type AuthUser } from "../../lib/api";

export function login(username: string, password: string): Promise<{ token: string; user: AuthUser }> {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function me(): Promise<{ user: AuthUser }> {
  return apiFetch("/auth/me");
}
