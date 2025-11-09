import pool from "../config/db.js";

export const getDashboardStats = async (req, res) => {
  try {
    // ✅ Exclude Chargers from global totals
    const [totalAssets] = await pool.query(
      "SELECT COUNT(*) AS total FROM assets WHERE asset_type != 'Charger'"
    );
    const [assignedAssets] = await pool.query(
      "SELECT COUNT(*) AS total FROM assets WHERE status='assigned' AND asset_type != 'Charger'"
    );
    const [availableAssets] = await pool.query(
      "SELECT COUNT(*) AS total FROM assets WHERE status IN ('available','ready_to_be_assigned') AND asset_type != 'Charger'"
    );
    const [scrappedAssets] = await pool.query(
      "SELECT COUNT(*) AS total FROM assets WHERE status='scrapped' AND asset_type != 'Charger'"
    );
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
      WHERE asset_type IN (?) AND asset_type != 'Charger'
      GROUP BY asset_type, status
    `, [assetTypes]);

    // Structure: { asset_type: { assigned, available, scrapped, ready_to_be_assigned } }
    const assetTypeSummary = {};
    for (const row of typeStats) {
      if (!assetTypeSummary[row.asset_type]) {
        assetTypeSummary[row.asset_type] = {
          assigned: 0,
          available: 0,
          scrapped: 0,
          ready_to_be_assigned: 0
        };
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
      WHERE asset_type='Cables' AND cable_type IN (?) AND asset_type != 'Charger'
      GROUP BY cable_type, status
    `, [cableTypes]);

    const cableTypeSummary = {};
    for (const row of cableStats) {
      if (!cableTypeSummary[row.cable_type]) {
        cableTypeSummary[row.cable_type] = {
          assigned: 0,
          available: 0,
          scrapped: 0,
          ready_to_be_assigned: 0
        };
      }
      cableTypeSummary[row.cable_type][row.status] = row.count;
    }

    // ✅ Return cleaned dashboard data
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
