import express from "express";
import { signup, login, sendResetOTP, verifyResetOTP } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/send-reset-otp", sendResetOTP);
router.post("/verify-reset-otp", verifyResetOTP);


export default router;
