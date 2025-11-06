import express from "express";
import {
  getEmployees,
  getITEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
} from "../controllers/employeeController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireIT } from "../middleware/requireIT.js";

const router = express.Router();

// Get all employees
router.get("/", verifyToken, getEmployees);

// Get IT employees only
router.get("/ITR", getITEmployees);

// Get single employee
router.get("/:emp_code", getEmployeeById);

// Add employee
router.post("/", verifyToken, requireIT, addEmployee);

// Update employee by emp_code
router.patch("/:emp_code", verifyToken, requireIT, updateEmployee);

export default router;
