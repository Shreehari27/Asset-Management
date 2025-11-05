import express from "express";
import { generateGatePass } from '../controllers/gatepassController.js';

const router = express.Router();

router.post("/generate",  generateGatePass);

export default router;
