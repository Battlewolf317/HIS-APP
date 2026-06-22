// =====================================================================
// claim.routes.js — endpoint klaim penjamin (piutang)
//  Mutasi dibatasi role kasir (+admin otomatis).
// =====================================================================

import { Router } from "express";
import * as controller from "./claim.controller.js";
import { authorize } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";

const router = Router();

const createSchema = {
  penjamin_id: { type: "int", required: true, min: 1 },
  jumlah_tagih: { type: "number", required: true, min: 1 },
  pasien: { type: "string", maxLen: 100 },
  keterangan: { type: "string", maxLen: 200 },
};

router.get("/penjamin", controller.listPenjamin);     // GET /api/claims/penjamin
router.get("/aging", controller.aging);               // GET /api/claims/aging
router.get("/", controller.list);                     // GET /api/claims?status=&penjamin_id=
router.post("/", authorize("kasir"), validate(createSchema), controller.create);
router.patch("/:id/submit", authorize("kasir"), controller.submit);
router.patch("/:id/approve", authorize("kasir"), controller.approve);
router.patch("/:id/pay", authorize("kasir"), controller.pay);
router.patch("/:id/reject", authorize("kasir"), controller.reject);

export default router;
