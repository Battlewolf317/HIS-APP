// =====================================================================
// auth.service.js — BUSINESS LOGIC login
//  - verifikasi password (bcrypt)
//  - terbitkan JWT berisi identitas + role
// =====================================================================

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import * as repo from "./auth.repository.js";
import { JWT_SECRET, JWT_EXPIRES } from "../../config/security.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

export async function login(username, password) {
  if (!username || !password) throw new ValidationError("Username & password wajib diisi");

  const user = await repo.findByUsername(username);
  // pesan sengaja generik biar ga bocorin username mana yang ada
  if (!user) throw new ValidationError("Username atau password salah");

  const cocok = await bcrypt.compare(password, user.password_hash);
  if (!cocok) throw new ValidationError("Username atau password salah");

  const payload = { id: user.id, username: user.username, nama: user.nama, role: user.role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

  return { token, user: payload };
}

export { ValidationError };
