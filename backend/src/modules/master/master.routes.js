// =====================================================================
// master.routes.js — endpoint master data (poli/dokter/tarif)
//  Mutasi dibatasi role admin.
// =====================================================================

import { Router } from "express";
import * as controller from "./master.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/:entity", controller.getAll);
router.post("/:entity", authorize("admin"), controller.create);
router.put("/:entity/:id", authorize("admin"), controller.update);
router.delete("/:entity/:id", authorize("admin"), controller.remove);

export default router;
