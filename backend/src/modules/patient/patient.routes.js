// =====================================================================
// patient.routes.js — daftar endpoint modul Patient
// Hubungkan URL + method → fungsi controller
// =====================================================================

import { Router } from "express";
import * as controller from "./patient.controller.js";

const router = Router();

router.get("/", controller.getAll);        // GET    /api/patients
router.get("/:id", controller.getOne);      // GET    /api/patients/:id
router.post("/", controller.create);        // POST   /api/patients
router.put("/:id", controller.update);      // PUT    /api/patients/:id
router.delete("/:id", controller.remove);   // DELETE /api/patients/:id

export default router;
