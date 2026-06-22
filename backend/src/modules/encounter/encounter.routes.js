// =====================================================================
// encounter.routes.js — daftar endpoint modul Encounter (kunjungan/ADT)
// Hubungkan URL + method → fungsi controller
// =====================================================================

import { Router } from "express";
import * as controller from "./encounter.controller.js";

const router = Router();

router.get("/", controller.getAll);             // GET    /api/encounters
router.get("/:id", controller.getOne);           // GET    /api/encounters/:id
router.post("/", controller.create);             // POST   /api/encounters
router.put("/:id", controller.update);           // PUT    /api/encounters/:id
router.patch("/:id/selesai", controller.selesai); // PATCH  /api/encounters/:id/selesai (discharge)
router.delete("/:id", controller.remove);        // DELETE /api/encounters/:id

export default router;
