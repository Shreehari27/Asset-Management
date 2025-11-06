import express from "express";
import {
    getAssets,
    getAssetByCode,
    assignAssets,
    addAsset,
    addAssetModification,
    getAssetModifications
} from "../controllers/assetController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireIT } from "../middleware/requireIT.js";

const router = express.Router();

router.get("/", verifyToken, getAssets);
router.get("/:code", verifyToken, getAssetByCode);
router.post("/assign", verifyToken, requireIT, assignAssets);
router.post("/add", verifyToken, requireIT, addAsset);

// ➤ New routes for modifications
router.post("/modify", requireIT, addAssetModification);
router.get("/modifications/:asset_code", getAssetModifications);

export default router;
