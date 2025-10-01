import express from "express";
import {
  getEmployees,
  getITEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
} from "../controllers/employeeController.js";

const router = express.Router();

// Get all employees
router.get("/", getEmployees);

// Get IT employees only
router.get("/ITR", getITEmployees);

// Get single employee
router.get("/:emp_code", getEmployeeById);

// Add employee
router.post("/", addEmployee);

// Update employee by emp_code
router.patch("/:emp_code", updateEmployee);

export default router;
