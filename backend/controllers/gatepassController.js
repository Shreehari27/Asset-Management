import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { fileURLToPath } from "url";
import db from "../config/db.js"; // ✅ MySQL connection

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateGatePass = async (req, res) => {
    try {
        console.log("📥 Request Body:", req.body);
        const { empCode, selectedAssets } = req.body;

        if (!empCode || !selectedAssets?.length) {
            return res.status(400).json({ message: "empCode and selectedAssets are required" });
        }

        // ✅ Fetch selected assets for employee
        const [rows] = await db.query(
            `
            SELECT 
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

        // ✅ Load DOCX Template
        const templatePath = path.join(__dirname, "../templates/Gatepass.docx");
        if (!fs.existsSync(templatePath)) {
            return res.status(500).json({ message: "Template file not found" });
        }

        const content = fs.readFileSync(templatePath, "binary");
        const zip = new PizZip(content);

        // ✅ Use custom delimiters [[ ]]
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: "[[", end: "]]" },
        });

        // ✅ Inject data
        const data = {
            empCode,
            date: new Date().toLocaleDateString("en-IN"),
            assets: rows.map((r) => ({
                asset_code: r.asset_code,
                asset_type: r.asset_type,
                asset_brand: r.asset_brand,
                serial_number: r.serial_number,
                assign_date: new Date(r.assign_date).toLocaleDateString("en-IN"),
            })),
        };

        console.log("🧩 DOCX data being injected:", data);
        doc.setData(data);

        try {
            doc.render();
        } catch (error) {
            console.error("❌ DOCX Render Error:", {
                message: error.message,
                explanation: error.explanation,
                properties: error.properties,
            });
            return res.status(500).json({
                message: "Template processing failed",
                error: error.message,
            });
        }

        // ✅ Generate DOCX Buffer
        const buffer = doc.getZip().generate({ type: "nodebuffer" });

        // ✅ Send file for download
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=Gatepass_${empCode}.docx`
        );
        res.send(buffer);
    } catch (error) {
        console.error("❌ Gate Pass generation failed:", error);
        res.status(500).json({
            message: "Gate Pass generation failed",
            error: error.message,
        });
    }
};
