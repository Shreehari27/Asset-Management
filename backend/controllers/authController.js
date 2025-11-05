import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

// ✅ SIGNUP
export const signup = async (req, res) => {
  try {
    const { emp_code, email, password } = req.body;

    if (!emp_code || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if employee exists
    const [emp] = await pool.query("SELECT * FROM employees WHERE emp_code = ?", [emp_code]);
    if (emp.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if user already exists
    const [existing] = await pool.query("SELECT * FROM user_logins WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user login record
    await pool.query(
      "INSERT INTO user_logins (emp_code, email, password_hash) VALUES (?, ?, ?)",
      [emp_code, email, hashedPassword]
    );

    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const [users] = await pool.query("SELECT * FROM user_logins WHERE email = ?", [email]);
    if (users.length === 0) return res.status(404).json({ message: "User not found" });

    const user = users[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, emp_code: user.emp_code, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ Fetch employee name & designation only
    const [empData] = await pool.query(
      "SELECT name FROM employees WHERE emp_code = ?",
      [user.emp_code]
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        emp_code: user.emp_code,
        email: user.email,
        ...empData[0],
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
