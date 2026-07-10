import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  getProfile,
  logout,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.get("/profile", authenticate, getProfile);
router.post("/logout", authenticate, logout);

export default router;
