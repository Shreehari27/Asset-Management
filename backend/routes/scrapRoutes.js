import express from "express";
import { getScrappedAssets, scrapAsset, getScrapStats } from "../controllers/scrapController.js";

const router = express.Router();

// Get all scrapped assets
router.get("/", getScrappedAssets);

// Scrap an asset
router.post("/scrap", scrapAsset);

// Get scrap statistics
router.get("/stats", getScrapStats);

export default router;
