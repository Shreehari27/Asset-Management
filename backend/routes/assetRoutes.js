import express from "express";
import { getAssets, getAssetByCode, assignAssets , addAsset} from "../controllers/assetController.js";

const router = express.Router();

// GET all assets
router.get("/", getAssets);

// GET single asset by code
router.get("/:code", getAssetByCode);

// POST multiple asset assignments
router.post("/assign", assignAssets);

// POST single unassigned asset
router.post("/add", addAsset);


export default router;
