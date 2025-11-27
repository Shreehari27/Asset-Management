import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import nodemailer from "nodemailer";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

// ✅ SIGNUP (validate email & active status)
export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔹 Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // 🔹 Check if email exists in employees table and is active
    const [employeeRows] = await pool.query(
      "SELECT emp_code, name, status FROM employees WHERE email = ?",
      [email]
    );

    if (employeeRows.length === 0) {
      return res.status(404).json({
        message: "Email not found in employee records. Please contact admin.",
      });
    }

    const { emp_code, name, status } = employeeRows[0];

    if (status !== "active") {
      return res.status(403).json({
        message: `Signup not allowed. Employee account is ${status}. Please contact admin.`,
      });
    }

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

// ✅ LOGIN (only active employees can log in)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query(
      "SELECT * FROM user_logins WHERE email = ?",
      [email]
    );
    if (users.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // fetch employee info including role and status
    const [empData] = await pool.query(
      "SELECT name, role, status FROM employees WHERE emp_code = ?",
      [user.emp_code]
    );

    if (empData.length === 0)
      return res.status(404).json({ message: "Employee record missing" });

    const emp = empData[0];

    // 🔒 Check if employee is active
    if (emp.status !== "active") {
      return res.status(403).json({
        message: `Access denied. Employee status is '${emp.status}'. Please contact admin.`,
      });
    }

    // ✅ Generate JWT token with role & name
    const token = jwt.sign(
      {
        id: user.id,
        emp_code: user.emp_code,
        email: user.email,
        role: emp.role,
        name: emp.name,
      },
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
        role: emp.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 🧩 OTP Section (same as before)
const otpStore = new Map();

// ✅ Send Reset OTP
export const sendResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ message: "Email is required" });

    // Check user exists
    const [users] = await pool.query(
      "SELECT * FROM user_logins WHERE email = ?",
      [email]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    // Check employee is active
    const [empStatus] = await pool.query(
      "SELECT status FROM employees WHERE email = ?",
      [email]
    );
    if (empStatus[0]?.status !== "active") {
      return res.status(403).json({
        message: `Password reset not allowed. Employee account is ${empStatus[0]?.status}.`,
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore.set(email, { otp, expiresAt });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
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
    res
      .status(500)
      .json({ message: "Failed to send OTP", error: error.message });
  }
};

// ✅ Verify OTP and Reset Password (unchanged)
export const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, OTP, and new password are required" });
    }

    const record = otpStore.get(email);
    if (!record)
      return res.status(400).json({ message: "No OTP found for this email" });

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ message: "OTP has expired" });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE user_logins SET password_hash = ? WHERE email = ?",
      [hashedPassword, email]
    );

    otpStore.delete(email);
    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    res
      .status(500)
      .json({ message: "Password reset failed", error: error.message });
  }
};


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        // 1️⃣ Check if employee exists
        const [employee] = await pool.query(
          "SELECT emp_code, name, role, status FROM employees WHERE email = ?",
          [email]
        );

        if (!employee.length)
          return done(null, false, { message: "Email not found in employee records" });

        if (employee[0].status !== "active")
          return done(null, false, { message: "Inactive employee. Contact admin." });

        // 2️⃣ Generate JWT
        const token = jwt.sign(
          {
            emp_code: employee[0].emp_code,
            email,
            name: employee[0].name,
            role: employee[0].role,
          },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );

        return done(null, { token });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

export const googleCallback = (req, res, next) => {
  passport.authenticate("google", (err, data, info) => {
    if (err) return res.redirect("/login?error=GoogleAuthFailed");
    if (!data) return res.redirect("/login?error=Unauthorized");

    // Redirect Angular with token
    return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${data.token}`);
  })(req, res, next);
};
