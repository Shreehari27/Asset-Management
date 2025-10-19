import express from "express";
import {
    getAssets,
    getAssetByCode,
    assignAssets,
    addAsset,
    addAssetModification,
    getAssetModifications
} from "../controllers/assetController.js";

const router = express.Router();

router.get("/", getAssets);
router.get("/:code", getAssetByCode);
router.post("/assign", assignAssets);
router.post("/add", addAsset);

// ➤ New routes for modifications
router.post("/modify", addAssetModification);
router.get("/modifications/:asset_code", getAssetModifications);

export default router;
