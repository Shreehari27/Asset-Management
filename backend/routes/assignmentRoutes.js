import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { assignAsset, getLiveAssignments, getAssignmentHistory, returnAsset, getLiveAssignmentsByEmpCode } from '../controllers/assignmentController.js';
import { requireIT } from "../middleware/requireIT.js";

const router = express.Router();

router.post('/', verifyToken, requireIT, assignAsset);                       // Assign asset
router.get('/live', verifyToken, getLiveAssignments);            // Get live assignments
router.get('/live/:emp_code', getLiveAssignmentsByEmpCode); // Get live assignments by employee code
router.get('/history', verifyToken, getAssignmentHistory);       // Get assignment history
router.patch('/:asset_code/return', verifyToken, requireIT, returnAsset);   // Return asset


export default router;
