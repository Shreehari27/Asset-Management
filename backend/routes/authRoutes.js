import express from "express";
import { signup, login, sendResetOTP, verifyResetOTP, googleAuth, googleCallback } 
from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/send-reset-otp", sendResetOTP);
router.post("/verify-reset-otp", verifyResetOTP);
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);


export default router;
