import pool from "../config/db.js";
import ExcelJS from "exceljs";

// ---------------------------------------------------------------------------
// Ledger Report (Individual Asset)
// ---------------------------------------------------------------------------
export const getLedgerReport = async (req, res) => {
  try {
    const { asset_code } = req.params;

    const [assetRows] = await pool.query(
      `SELECT asset_code, asset_type, asset_brand, model_name 
       FROM assets 
       WHERE asset_code = ? AND asset_type != 'Charger'`,
      [asset_code]
    );

    if (assetRows.length === 0)
      return res.status(404).json({ message: "Asset not found or is a Charger" });

    const asset = assetRows[0];

    const [assignments] = await pool.query(
      `SELECT assign_date AS date, 'Assigned' AS action, emp_code, assign_remark AS remark 
       FROM assignments WHERE asset_code = ?`,
      [asset_code]
    );

    const [returns] = await pool.query(
      `SELECT return_date AS date, 'Returned' AS action, emp_code, return_remark AS remark 
       FROM returns WHERE asset_code = ?`,
      [asset_code]
    );

    const [scraps] = await pool.query(
      `SELECT scrap_date AS date, 'Scrapped' AS action, scrapped_by AS emp_code, scrap_reason AS remark 
       FROM scrap WHERE asset_code = ?`,
      [asset_code]
    );

    const movements = [...assignments, ...returns, ...scraps].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    res.json({ ...asset, movements });
  } catch (err) {
    console.error("Ledger report error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------------------------------------------------------
// Stock Summary (lot → type → brand → model counts)
// ---------------------------------------------------------------------------
export const getStockSummary = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        lot_number, asset_type, asset_brand, model_name, status, COUNT(*) AS count
      FROM assets
      WHERE asset_type != 'Charger'
      GROUP BY lot_number, asset_type, asset_brand, model_name, status
      ORDER BY lot_number, asset_type, asset_brand, model_name;
    `);

    const summary = {};
    for (const r of rows) {
      const { lot_number, asset_type, asset_brand, model_name, status, count } = r;
      if (!summary[lot_number]) summary[lot_number] = {};
      if (!summary[lot_number][asset_type]) summary[lot_number][asset_type] = {};
      if (!summary[lot_number][asset_type][asset_brand])
        summary[lot_number][asset_type][asset_brand] = {};
      if (!summary[lot_number][asset_type][asset_brand][model_name])
        summary[lot_number][asset_type][asset_brand][model_name] = {
          available: 0,
          assigned: 0,
          ready_to_be_assigned: 0,
          scrapped: 0,
          total: 0,
        };

      summary[lot_number][asset_type][asset_brand][model_name][status] = count;
      summary[lot_number][asset_type][asset_brand][model_name].total += count;
    }

    res.json({ generated_at: new Date(), summary });
  } catch (err) {
    console.error("Stock summary error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------------------------------------------------------
// Reorder-level Summary (exclude Charger)
// ---------------------------------------------------------------------------
export const getReorderLevelSummary = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT asset_type,
             SUM(status = 'available') AS available,
             SUM(status = 'ready_to_be_assigned') AS ready_to_be_assigned,
             (SUM(status = 'available') + SUM(status = 'ready_to_be_assigned')) AS total_in_hand
      FROM assets
      WHERE asset_type != 'Charger'
      GROUP BY asset_type
      ORDER BY asset_type;
    `);

    res.json({ generated_at: new Date(), summary: rows });
  } catch (err) {
    console.error("Reorder-level error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------------------------------------------------------
// 📦 Download Reorder Level Report (Direct stream to browser, no file save)
// ---------------------------------------------------------------------------
export const downloadReorderLevelReport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const [rows] = await pool.query(`
      SELECT asset_type,
             SUM(status = 'available') AS available,
             SUM(status = 'ready_to_be_assigned') AS ready_to_be_assigned,
             (SUM(status = 'available') + SUM(status = 'ready_to_be_assigned')) AS total_in_hand
      FROM assets
      WHERE asset_type != 'Charger'
        AND (purchase_date BETWEEN ? AND ?)
      GROUP BY asset_type
      ORDER BY asset_type;
    `, [fromDate, toDate]);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Reorder Level Summary");

    sheet.columns = [
      { header: "Asset Type", key: "asset_type", width: 25 },
      { header: "Available", key: "available", width: 15 },
      { header: "New (Ready to Assign)", key: "ready_to_be_assigned", width: 20 },
      { header: "Total In Hand", key: "total_in_hand", width: 18 },
    ];

    sheet.addRows(rows);

    res.setHeader("Content-Disposition", "attachment; filename=reorder-level.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    await workbook.xlsx.write(res);
    res.end();

    console.log("✅ Reorder Level Report streamed directly to user.");
  } catch (err) {
    console.error("❌ Reorder Level Report Export Error:", err);
    res.status(500).json({ message: "Error exporting reorder level report", error: err.message });
  }
};

// ---------------------------------------------------------------------------
// Lot Statistics + Cable Summary (exclude Charger)
// ---------------------------------------------------------------------------
export const getInventorySummary = async (req, res) => {
  try {
    const [lotRows] = await pool.query(`
      SELECT lot_number, asset_type, status, COUNT(*) as count
      FROM assets
      WHERE asset_type != 'Charger' 
        AND lot_number IS NOT NULL AND lot_number != ''
      GROUP BY lot_number, asset_type, status
      ORDER BY lot_number;
    `);

    const lotStats = {};
    for (const row of lotRows) {
      const { lot_number, asset_type, status, count } = row;
      if (!lotStats[lot_number]) {
        lotStats[lot_number] = {
          lot_number,
          total_items: 0,
          status_breakdown: {},
          asset_types: {},
        };
      }

      lotStats[lot_number].total_items += count;
      lotStats[lot_number].status_breakdown[status] =
        (lotStats[lot_number].status_breakdown[status] || 0) + count;
      lotStats[lot_number].asset_types[asset_type] =
        (lotStats[lot_number].asset_types[asset_type] || 0) + count;
    }

    const lotStatistics = Object.values(lotStats);

    const cableTypes = [
      'MONITOR POWER CABLE', 'DESKTOP POWER CABLE', 'LAPTOP POWER CABLE',
      'HDMI CABLE', 'DP CABLE', 'HDMI TO VGA CABLE', 'VGA TO HDMI CABLE',
      'VGA CABLE', 'WIFI EXTENDER', 'POWER CABLE EXTENSION', 'LAN CABLE'
    ];

    const [cableRows] = await pool.query(`
      SELECT cable_type, status, COUNT(*) as count
      FROM assets
      WHERE asset_type = 'Cables' AND cable_type IN (?)
      GROUP BY cable_type, status
      ORDER BY cable_type;
    `, [cableTypes]);

    const cableStats = {};
    for (const row of cableRows) {
      const { cable_type, status, count } = row;
      if (!cableStats[cable_type]) {
        cableStats[cable_type] = {
          cable_type,
          total: 0,
          available: 0,
          ready_to_be_assigned: 0,
          assigned: 0,
          scrapped: 0,
        };
      }
      cableStats[cable_type][status] = count;
      cableStats[cable_type].total += count;
    }

    res.status(200).json({
      generated_at: new Date(),
      lot_statistics: lotStatistics,
      cable_summary: Object.values(cableStats),
    });
  } catch (err) {
    console.error("Inventory summary error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------------------------------------------------------
// Tally Summary (exclude Charger)
// ---------------------------------------------------------------------------
export const getTallySummary = async (req, res) => {
  try {
    const [[{ totalAssets }]] = await pool.query(`
      SELECT COUNT(*) AS totalAssets FROM assets WHERE asset_type != 'Charger';
    `);

    const [lotTotals] = await pool.query(`
      SELECT lot_number, COUNT(*) AS total_items
      FROM assets
      WHERE asset_type != 'Charger' AND lot_number IS NOT NULL AND lot_number != ''
      GROUP BY lot_number;
    `);

    const lotSum = lotTotals.reduce((sum, row) => sum + row.total_items, 0);
    const balanced = lotSum === totalAssets;

    res.json({
      totalAssets,
      lotSum,
      balanced,
      details: lotTotals,
    });
  } catch (err) {
    console.error("Tally summary error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------------------------------------------------------
// 🧾 Download Stock Summary (Direct stream to browser)
// ---------------------------------------------------------------------------
export const downloadStockSummary = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const [rows] = await pool.query(`
      SELECT lot_number, asset_type, asset_brand, model_name, status, COUNT(*) AS count
      FROM assets
      WHERE asset_type != 'Charger' 
        AND purchase_date BETWEEN ? AND ?
      GROUP BY lot_number, asset_type, asset_brand, model_name, status
      ORDER BY lot_number, asset_type, asset_brand;
    `, [fromDate, toDate]);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Stock Summary");

    sheet.columns = [
      { header: "Lot Number", key: "lot_number", width: 15 },
      { header: "Asset Type", key: "asset_type", width: 20 },
      { header: "Brand", key: "asset_brand", width: 20 },
      { header: "Model", key: "model_name", width: 25 },
      { header: "Status", key: "status", width: 15 },
      { header: "Count", key: "count", width: 10 },
    ];

    sheet.addRows(rows);

    res.setHeader("Content-Disposition", "attachment; filename=stock-summary.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    await workbook.xlsx.write(res);
    res.end();

    console.log("✅ Stock Summary streamed directly to user.");
  } catch (err) {
    console.error("❌ Stock Excel export error:", err);
    res.status(500).json({ message: "Error exporting stock summary", error: err.message });
  }
};

// ---------------------------------------------------------------------------
// 🧮 Download Ledger Report (Direct stream to browser)
// ---------------------------------------------------------------------------
export const downloadLedgerReport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const cableTypes = [
      'MONITOR POWER CABLE', 'DESKTOP POWER CABLE', 'LAPTOP POWER CABLE',
      'HDMI CABLE', 'DP CABLE', 'HDMI TO VGA CABLE', 'VGA TO HDMI CABLE',
      'VGA CABLE', 'WIFI EXTENDER', 'POWER CABLE EXTENSION', 'LAN CABLE'
    ];

    const [rows] = await pool.query(`
      SELECT 
        lot_number,
        CASE 
          WHEN asset_type = 'Cables' AND cable_type IN (?) THEN cable_type
          ELSE asset_type
        END AS classified_type,
        asset_brand,
        model_name,
        COUNT(*) AS count
      FROM assets
      WHERE asset_type != 'Charger'
        AND lot_number IS NOT NULL
        AND lot_number != ''
        AND (purchase_date BETWEEN ? AND ?)
      GROUP BY lot_number, classified_type, asset_brand, model_name
      ORDER BY lot_number, classified_type, asset_brand, model_name;
    `, [cableTypes, fromDate, toDate]);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Lot Ledger Summary");

    sheet.columns = [
      { header: "Lot Number", key: "lot_number", width: 18 },
      { header: "Asset Type / Cable Type", key: "classified_type", width: 25 },
      { header: "Brand", key: "asset_brand", width: 20 },
      { header: "Model Name", key: "model_name", width: 25 },
      { header: "Count", key: "count", width: 10 },
    ];

    sheet.addRows(rows);

    res.setHeader("Content-Disposition", "attachment; filename=lot-ledger-summary.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    await workbook.xlsx.write(res);
    res.end();

    console.log("✅ Ledger Summary streamed directly to user.");
  } catch (err) {
    console.error("❌ Lot Ledger Summary Excel export error:", err);
    res.status(500).json({ message: "Error exporting lot ledger summary", error: err.message });
  }
};

// ---------------------------------------------------------------------------
// 🕒 Age Analysis Report (Direct stream, exclude Charger + Scrapped)
// ---------------------------------------------------------------------------
export const downloadAgeAnalysisReport = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        asset_code,
        asset_type,
        asset_brand,
        model_name,
        lot_number,
        purchase_date,
        DATEDIFF(CURDATE(), purchase_date) AS age_days,
        ROUND(DATEDIFF(CURDATE(), purchase_date) / 30, 1) AS age_months,
        ROUND(DATEDIFF(CURDATE(), purchase_date) / 365, 1) AS age_years,
        status
      FROM assets
      WHERE asset_type != 'Charger' 
        AND status != 'scrapped'
        AND purchase_date IS NOT NULL
      ORDER BY lot_number, asset_type, asset_brand, model_name;
    `);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Age Analysis");

    sheet.columns = [
      { header: "Lot Number", key: "lot_number", width: 15 },
      { header: "Asset Code", key: "asset_code", width: 18 },
      { header: "Asset Type", key: "asset_type", width: 22 },
      { header: "Brand", key: "asset_brand", width: 18 },
      { header: "Model", key: "model_name", width: 22 },
      { header: "Purchase Date", key: "purchase_date", width: 18 },
      { header: "Age (Days)", key: "age_days", width: 15 },
      { header: "Age (Months)", key: "age_months", width: 15 },
      { header: "Age (Years)", key: "age_years", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    sheet.addRows(rows);

    // Highlight assets older than 3 years
    sheet.eachRow((row, idx) => {
      if (idx === 1) return;
      const years = Number(row.getCell("age_years").value);
      if (years >= 3) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFCDD2" },
          };
        });
      }
    });

    res.setHeader("Content-Disposition", "attachment; filename=asset-age-analysis.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    await workbook.xlsx.write(res);
    res.end();

    console.log("✅ Age Analysis Excel streamed directly to user (excluding scrapped assets).");
  } catch (err) {
    console.error("❌ Age Analysis Report Error:", err);
    res.status(500).json({ message: "Error generating Age Analysis Report", error: err.message });
  }
};
