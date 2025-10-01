import express from "express";
import { assignAsset, getLiveAssignments, getAssignmentHistory, returnAsset } from '../controllers/assignmentController.js';

const router = express.Router();

router.post('/', assignAsset);                       // Assign asset
router.get('/live', getLiveAssignments);            // Get live assignments
router.get('/history', getAssignmentHistory);       // Get assignment history
router.patch('/:asset_code/return', returnAsset);   // Return asset


export default router;
