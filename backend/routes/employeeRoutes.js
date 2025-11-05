import express from "express";
import {
  getEmployees,
  getITEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
} from "../controllers/employeeController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all employees
router.get("/", verifyToken, getEmployees);

// Get IT employees only
router.get("/ITR", getITEmployees);

// Get single employee
router.get("/:emp_code", getEmployeeById);

// Add employee
router.post("/", verifyToken, addEmployee);

// Update employee by emp_code
router.patch("/:emp_code", verifyToken, updateEmployee);

export default router;
