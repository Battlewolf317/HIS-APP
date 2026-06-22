// =====================================================================
// consent.routes.js — endpoint informed consent
// =====================================================================

import { Router } from "express";
import * as controller from "./consent.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/", controller.list);
router.post("/", authorize("dokter", "perawat"), controller.create);
router.put("/:id", authorize("dokter", "perawat"), controller.update);

export default router;
