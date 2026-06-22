// =====================================================================
// accounting.routes.js — endpoint akuntansi (COA + jurnal)
//  Jurnal manual dibatasi role admin.
// =====================================================================

import { Router } from "express";
import * as controller from "./accounting.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/accounts", controller.accounts);
router.get("/journals", controller.journals);
router.get("/trial-balance", controller.trialBalance);
router.post("/journals", authorize("admin"), controller.postJournal);

export default router;
