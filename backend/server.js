import express from "express";
import * as dotenv from "dotenv";
import pool from "./config/db.js";
import cors from "cors";

import employeeRoutes from "./routes/employeeRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import scrapRoutes from "./routes/scrapRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import gatepassRoutes from "./routes/gatepassRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";


dotenv.config();
const app = express();
app.use(cors({
  origin: ["http://localhost:4200"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
})); // allow frontend calls
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});


// Routes
app.use("/api/employees", employeeRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/scrap", scrapRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/gatepass", gatepassRoutes);
app.use("/api/reports", reportRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));