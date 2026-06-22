// =====================================================================
// auth.routes.js — endpoint login & sesi
// =====================================================================

import { Router } from "express";
import * as controller from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";

const router = Router();

const loginSchema = {
  username: { type: "string", required: true, maxLen: 50 },
  password: { type: "string", required: true, maxLen: 100 },
};

router.post("/login", validate(loginSchema), controller.login); // POST /api/auth/login (public)
router.get("/me", authenticate, controller.me);    // GET  /api/auth/me   (perlu token)

export default router;
