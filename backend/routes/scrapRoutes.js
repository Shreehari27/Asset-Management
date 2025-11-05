import express from "express";
import {
  getScrappedAssets,
  scrapAsset,
  getScrapStats,
  getAssetDetails
} from "../controllers/scrapController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Fetch single asset details (for validation)
router.get("/details/:asset_code", verifyToken, getAssetDetails);

// Scrap an asset
router.post("/", verifyToken, scrapAsset); // Angular posts to /api/scrap

// Get all scrapped assets
router.get("/", verifyToken, getScrappedAssets);

// Scrap statistics
router.get("/stats", verifyToken, getScrapStats);

export default router;
