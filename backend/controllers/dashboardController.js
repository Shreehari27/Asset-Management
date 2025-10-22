import pool from "../config/db.js";

export const getDashboardStats = async (req, res) => {
  try {
    // Basic overall counts
    const [totalAssets] = await pool.query("SELECT COUNT(*) AS total FROM assets");
    const [assignedAssets] = await pool.query("SELECT COUNT(*) AS total FROM assets WHERE status='assigned'");
    const [availableAssets] = await pool.query("SELECT COUNT(*) AS total FROM assets WHERE status='available'");
    const [scrappedAssets] = await pool.query("SELECT COUNT(*) AS total FROM assets WHERE status='scrapped'");
    const [totalEmployees] = await pool.query("SELECT COUNT(*) AS total FROM employees");

    // ----- Per Asset Type Stats -----
    const assetTypes = [
      'Monitor', 'Desktop', 'Mini Desktop', 'Windows Laptop', 'Mac Laptop',
      'Mouse', 'Wireless Mouse', 'Headset', 'Wireless Headset',
      'Keyboard', 'Wireless Keyboard', 'Usb Camera', 'Cables',
      'Laptop Bag', 'Wifi Device', 'Docking Station', 'UPS',
      'Jio/Airtel Modem', 'Others'
    ];

    const [typeStats] = await pool.query(`
      SELECT asset_type, status, COUNT(*) AS count
      FROM assets
      WHERE asset_type IN (?)
      GROUP BY asset_type, status
    `, [assetTypes]);

    // Structure it as { asset_type: { assigned: x, available: y, scrapped: z } }
    const assetTypeSummary = {};
    for (const row of typeStats) {
      if (!assetTypeSummary[row.asset_type]) {
        assetTypeSummary[row.asset_type] = { assigned: 0, available: 0, scrapped: 0 };
      }
      assetTypeSummary[row.asset_type][row.status] = row.count;
    }

    // ----- Cable Type Stats -----
    const cableTypes = [
      'MONITOR POWER CABLE', 'DESKTOP POWER CABLE', 'LAPTOP POWER CABLE',
      'HDMI CABLE', 'DP CABLE', 'HDMI TO VGA CABLE', 'VGA TO HDMI CABLE',
      'VGA CABLE', 'WIFI EXTENDER', 'POWER CABLE EXTENSION', 'LAN CABLE'
    ];

    const [cableStats] = await pool.query(`
      SELECT cable_type, status, COUNT(*) AS count
      FROM assets
      WHERE asset_type='Cables' AND cable_type IN (?)
      GROUP BY cable_type, status
    `, [cableTypes]);

    const cableTypeSummary = {};
    for (const row of cableStats) {
      if (!cableTypeSummary[row.cable_type]) {
        cableTypeSummary[row.cable_type] = { assigned: 0, available: 0, scrapped: 0 };
      }
      cableTypeSummary[row.cable_type][row.status] = row.count;
    }

    res.json({
      totalAssets: totalAssets[0].total,
      assignedAssets: assignedAssets[0].total,
      availableAssets: availableAssets[0].total,
      scrappedAssets: scrappedAssets[0].total,
      totalEmployees: totalEmployees[0].total,
      assetTypeSummary,
      cableTypeSummary
    });
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
