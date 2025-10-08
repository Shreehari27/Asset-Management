import express from "express";
import { 
  getScrappedAssets, 
  scrapAsset, 
  getScrapStats, 
  getAssetDetails 
} from "../controllers/scrapController.js";

const router = express.Router();

// Fetch single asset details (for validation)
router.get("/details/:asset_code", getAssetDetails);

// Scrap an asset
router.post("/", scrapAsset); // Angular posts to /api/scrap

// Get all scrapped assets
router.get("/", getScrappedAssets);

// Scrap statistics
router.get("/stats", getScrapStats);

export default router;
