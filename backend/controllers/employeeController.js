import pool from "../config/db.js";

// Get all employees
export const getEmployees = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM employees");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching employees:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get IT employees only
export const getITEmployees = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM employees WHERE isIT = ?", [true]);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching IT employees:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get employee by emp_code
export const getEmployeeById = async (req, res) => {
  try {
    const { emp_code } = req.params;
    const [rows] = await pool.query("SELECT * FROM employees WHERE emp_code = ?", [emp_code]);
    if (rows.length === 0) return res.status(404).json({ error: "Employee not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching employee:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Add new employee
export const addEmployee = async (req, res) => {
  try {
    const { emp_code, name, email, isIT = false, status = "active" } = req.body;
    await pool.query(
      "INSERT INTO employees (emp_code, name, email, isIT, status) VALUES (?, ?, ?, ?, ?)",
      [emp_code, name, email, isIT, status]
    );
    res.status(201).json({ message: "✅ Employee added" });
  } catch (err) {
    console.error("❌ Error adding employee:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update employee (PATCH)
export const updateEmployee = async (req, res) => {
  try {
    const { emp_code } = req.params;
    const updates = req.body;

    // Validate employee exists
    const [rows] = await pool.query("SELECT * FROM employees WHERE emp_code = ?", [emp_code]);
    if (rows.length === 0) return res.status(404).json({ error: "Employee not found" });

    // Build dynamic update query
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    values.push(emp_code); // for WHERE clause

    const sql = `UPDATE employees SET ${fields.join(", ")} WHERE emp_code = ?`;
    await pool.query(sql, values);

    res.json({ message: "✅ Employee updated successfully" });
  } catch (err) {
    console.error("❌ Error updating employee:", err);
    res.status(500).json({ error: "Server error" });
  }
};
