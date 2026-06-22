// =====================================================================
// pharmacy.routes.js — endpoint farmasi / dispensing
//  Dispensing dibatasi role "farmasi" (admin selalu boleh).
// =====================================================================

import { Router } from "express";
import * as controller from "./pharmacy.controller.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

router.get("/resep", controller.getPendingResep);              // GET resep PENDING
router.get("/resep/:id/dispense", controller.getDispenseHistory); // riwayat dispense per resep
router.post("/dispense", authorize("farmasi"), controller.dispense); // proses dispense

export default router;
