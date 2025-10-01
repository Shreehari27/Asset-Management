import pool from "../config/db.js";

export const getDashboardStats = async (req, res) => {
  try {
    // total assets
    const [totalAssets] = await pool.query("SELECT COUNT(*) AS total FROM assets");

    // assigned assets
    const [assignedAssets] = await pool.query(
      "SELECT COUNT(*) AS total FROM assets WHERE status = 'assigned'"
    );

    // available assets
    const [availableAssets] = await pool.query(
      "SELECT COUNT(*) AS total FROM assets WHERE status = 'available'"
    );

    // employees
    const [totalEmployees] = await pool.query("SELECT COUNT(*) AS total FROM employees");

    res.json({
      totalAssets: totalAssets[0].total,
      assignedAssets: assignedAssets[0].total,
      availableAssets: availableAssets[0].total,
      totalEmployees: totalEmployees[0].total,
    });
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
