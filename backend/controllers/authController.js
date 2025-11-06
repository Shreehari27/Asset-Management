import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import nodemailer from "nodemailer";

// ✅ SIGNUP (validate email in employees table, get emp_code, then create user)
export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔹 Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // 🔹 Check if email exists in employees table
    const [employeeRows] = await pool.query(
      "SELECT emp_code, name FROM employees WHERE email = ?",
      [email]
    );

    if (employeeRows.length === 0) {
      return res.status(404).json({
        message: "Email not found in employee records. Please contact admin.",
      });
    }

    const { emp_code, name } = employeeRows[0];

    // 🔹 Check if already signed up
    const [existingUser] = await pool.query(
      "SELECT * FROM user_logins WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res
        .status(400)
        .json({ message: "Email already registered. Please log in." });
    }

    // 🔹 Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Insert into user_logins (with emp_code)
    await pool.query(
      `INSERT INTO user_logins (emp_code, email, password_hash) VALUES (?, ?, ?)`,
      [emp_code, email, hashedPassword]
    );

    console.log(`✅ New user created: ${email} (Emp Code: ${emp_code})`);

    res.status(201).json({
      message: `Signup successful! Welcome ${name}. You can now log in.`,
      emp_code,
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({
      message: "Server error during signup",
      error: err.message,
    });
  }
};


// ✅ LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query("SELECT * FROM user_logins WHERE email = ?", [email]);
    if (users.length === 0) return res.status(404).json({ message: "User not found" });
    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // fetch employee info including isIT
    const [empData] = await pool.query("SELECT name, isIT FROM employees WHERE emp_code = ?", [user.emp_code]);
    const emp = empData[0] || { name: null, isIT: false };

    // include isIT in token
    const token = jwt.sign(
      { id: user.id, emp_code: user.emp_code, email: user.email, isIT: !!emp.isIT, name: emp.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        emp_code: user.emp_code,
        email: user.email,
        name: emp.name,
        isIT: !!emp.isIT
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// 🧩 Temporary store for OTPs (in-memory)
const otpStore = new Map(); // key: email, value: { otp, expiresAt }

// ✅ Send Reset OTP
export const sendResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    // Check user exists
    const [users] = await pool.query("SELECT * FROM user_logins WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore.set(email, { otp, expiresAt });

    // Configure email sender (Gmail example)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER, // example: yourcompany@gmail.com
        pass: process.env.MAIL_PASS, // app password
      },
    });

    const mailOptions = {
      from: `"Asset Management System" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP - Asset Management",
      html: `
        <p>Hello,</p>
        <p>Your OTP to reset the password is:</p>
        <h2 style="color:#007bff;">${otp}</h2>
        <p>This OTP will expire in <b>5 minutes</b>.</p>
        <p>Do not share it with anyone.</p>
        <br>
        <p>Regards,<br><b>Asset Management System</b></p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "OTP sent successfully to your email" });
  } catch (error) {
    console.error("❌ Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
};

// ✅ Verify OTP and Reset Password
export const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }

    const record = otpStore.get(email);
    if (!record) return res.status(400).json({ message: "No OTP found for this email" });

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ message: "OTP has expired" });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE user_logins SET password_hash = ? WHERE email = ?", [hashedPassword, email]);

    otpStore.delete(email); // remove OTP after successful reset
    res.json({ message: "Password reset successful" });

  } catch (error) {
    console.error("❌ Error resetting password:", error);
    res.status(500).json({ message: "Password reset failed", error: error.message });
  }
};
