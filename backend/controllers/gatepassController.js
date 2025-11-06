import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { fileURLToPath } from "url";
import db from "../config/db.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateGatePass = async (req, res) => {
  try {
    console.log("📥 Request Body:", req.body);
    const { empCode, selectedAssets } = req.body;

    if (!empCode || !selectedAssets?.length) {
      return res.status(400).json({ message: "empCode and selectedAssets are required" });
    }

    // ✅ Fetch employee details including email
    const [empRows] = await db.query(
      `SELECT emp_code, name, email FROM employees WHERE emp_code = ?`,
      [empCode]
    );

    if (!empRows.length) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const emp = empRows[0];

    // ✅ Fetch asset & PSD details
    const [rows] = await db.query(
      `
      SELECT 
        aa.psd_id AS psd_id,
        aa.asset_code AS asset_code,
        a.asset_type AS asset_type,
        a.asset_brand AS asset_brand,
        a.serial_number AS serial_number,
        aa.assign_date AS assign_date
      FROM assignment_active aa
      JOIN assets a ON aa.asset_code = a.asset_code
      WHERE aa.emp_code = ?
        AND aa.asset_code IN (?)
      `,
      [empCode, selectedAssets]
    );

    console.log("✅ Assets Fetched:", rows);

    if (!rows.length) {
      return res.status(404).json({ message: "No matching assets found" });
    }

    const psdId = rows[0]?.psd_id || "N/A";

    // ✅ Load Template
    const templatePath = path.join(__dirname, "../templates/Gatepass.docx");
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ message: "Template file not found" });
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "[[", end: "]]" },
    });

    const data = {
      empCode,
      name: emp.name,
      date: new Date().toLocaleDateString("en-IN"),
      assets: rows.map((r) => ({
        psd_id: r.psd_id,
        asset_code: r.asset_code,
        asset_type: r.asset_type,
        asset_brand: r.asset_brand,
        serial_number: r.serial_number,
        assign_date: new Date(r.assign_date).toLocaleDateString("en-IN"),
      })),
    };

    doc.setData(data);
    try {
      doc.render();
    } catch (error) {
      console.error("❌ DOCX Render Error:", error);
      return res.status(500).json({ message: "Template processing failed" });
    }

    const buffer = doc.getZip().generate({ type: "nodebuffer" });

    // ✅ Save file locally
    const saveDir = path.join(__dirname, "../generated_gatepass");
    if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir);

    const fileName = `Gatepass_${empCode}_${psdId}.docx`;
    const savePath = path.join(saveDir, fileName);
    fs.writeFileSync(savePath, buffer);

    console.log("💾 Gatepass saved:", savePath);

    // ✅ Send Email with attachment
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"PippinTech Support" <${process.env.MAIL_USER}>`,
      to: emp.email, // Employee
      cc: ["techsupport@pippintittle.com", "ivaldar@pippintechnologies.com"],
      subject: `Gate Pass Issued - ${empCode}`,
      text: `Dear ${emp.name},\n\nPlease find attached your gate pass.\n\nRegards,\nIT Support Team`,
      attachments: [
        {
          filename: fileName,
          path: savePath,
        },
      ],
    });

    console.log("📧 Email Sent Successfully");

    // ✅ Send file for browser download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(buffer);

  } catch (error) {
    console.error("❌ Gate Pass generation failed:", error);
    res.status(500).json({ message: "Gate Pass generation failed", error: error.message });
  }
};
