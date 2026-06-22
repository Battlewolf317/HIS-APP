// =====================================================================
// lib/api.ts — config dasar + manajemen token + wrapper fetch ber-auth
// Semua modul frontend panggil backend lewat apiFetch() di sini.
// =====================================================================

// BASE_URL: ambil dari env VITE_API_BASE saat build (production), fallback ke dev lokal.
//  Set VITE_API_BASE = https://<backend-domain>/api di Vercel.
export const BASE_URL =
  (import.meta.env.VITE_API_BASE as string | undefined) || "http://localhost:3001/api";

const TOKEN_KEY = "his_token";
const USER_KEY = "his_user";

export type AuthUser = { id: number; username: string; nama: string; role: string };

// --- token & user disimpan di localStorage ---
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function getUser(): AuthUser | null {
  const s = localStorage.getItem(USER_KEY);
  return s ? (JSON.parse(s) as AuthUser) : null;
}
export function setUser(u: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(u));
}
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// --- wrapper fetch: otomatis tempel token + handle error & sesi habis ---
export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (options.body) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // token invalid/kadaluarsa → bersihkan sesi & paksa login ulang
  if (res.status === 401) {
    clearAuth();
    window.location.reload();
    throw new Error("Sesi habis, silakan login lagi");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Gagal" }));
    throw new Error(err.error || "Terjadi kesalahan");
  }
  return res.json();
}
