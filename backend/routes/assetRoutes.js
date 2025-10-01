import express from "express";
import { getAssets, assignAssets } from "../controllers/assetController.js";

const router = express.Router();

// GET all assets
router.get("/", getAssets);

// POST multiple asset assignments
router.post("/assign", assignAssets); // ✅ changed endpoint to /assign

export default router;
