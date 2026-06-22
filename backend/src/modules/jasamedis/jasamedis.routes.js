// =====================================================================
// jasamedis.routes.js — endpoint jasa medis dokter
// =====================================================================

import { Router } from "express";
import * as controller from "./jasamedis.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/", controller.list);                                          // GET    /api/jasamedis
router.post("/", authorize("dokter", "kasir"), controller.create);         // catat jasa
router.put("/:id", authorize("dokter", "kasir"), controller.update);       // ubah jasa
router.patch("/:id/status", authorize("kasir"), controller.setStatus);     // setujui/bayar (kasir +admin)

export default router;
