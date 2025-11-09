import express from "express";
import {
    getLedgerReport,
    getStockSummary,
    getReorderLevelSummary,
    getInventorySummary,
    getTallySummary,
    downloadStockSummary,
    downloadLedgerReport,
    downloadReorderLevelReport,
    downloadAgeAnalysisReport
} from "../controllers/reportController.js";

const router = express.Router();

router.get("/ledger/:asset_code", getLedgerReport);
router.get("/stock-summary", getStockSummary);
router.get("/reorder-level", getReorderLevelSummary);
router.get("/inventory-summary", getInventorySummary);
router.get("/tally", getTallySummary);
router.get("/download/reorder-level", downloadReorderLevelReport);
router.get("/download/age-analysis", downloadAgeAnalysisReport);



// Excel downloads
router.get("/download/stock-summary", downloadStockSummary);
router.get("/download/ledger-report", downloadLedgerReport);

export default router;
