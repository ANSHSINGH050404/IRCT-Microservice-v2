import { Router } from "express";
import { getAdmins, getAdmin } from "../controllers/admin.controller";

const router = Router();

router.get("/admins", getAdmins);
router.get("/admins/:id", getAdmin);

export default router;
