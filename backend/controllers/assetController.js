import pool from "../config/db.js";

// ➤ Get all assets
export const getAssets = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM assets");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch assets" });
  }
};

// ➤ Add single or multiple asset assignments
export const assignAssets = async (req, res) => {
  try {
    let assignments = req.body;

    // Ensure array
    if (!Array.isArray(assignments)) assignments = [assignments];

    const processed = [];
    const skipped = [];

    for (const item of assignments) {
      const {
        asset_code,
        serial_number,
        asset_type,
        asset_brand,
        emp_code,
        assigned_by,
        assign_date,
        assign_remark
      } = item;

      // 1️⃣ Skip if required fields are missing
      if (!asset_code || !serial_number || !asset_type || !emp_code || !assigned_by || !assign_date) {
        skipped.push({ asset_code, serial_number, reason: "Missing required fields" });
        continue;
      }

      // 2️⃣ Add asset if it doesn't exist
      const [existingAsset] = await pool.query(
        "SELECT * FROM assets WHERE asset_code = ? OR serial_number = ?",
        [asset_code, serial_number]
      );

      if (!existingAsset.length) {
        await pool.query(
          "INSERT INTO assets (asset_code, serial_number, asset_type, asset_brand, status) VALUES (?, ?, ?, ?, 'available')",
          [asset_code, serial_number, asset_type, asset_brand || null]
        );
      }

      // 3️⃣ Check if asset is already assigned (active)
      const [alreadyAssigned] = await pool.query(
        "SELECT * FROM assignment_active WHERE asset_code = ? AND emp_code = ?",
        [asset_code, emp_code]
      );

      if (alreadyAssigned.length) {
        skipped.push({ asset_code, emp_code, reason: "Asset already assigned to this employee" });
        continue;
      }

      // 4️⃣ Insert assignment
      await pool.query(
        "INSERT INTO assignment_active (asset_code, emp_code, assigned_by, assign_date, assign_remark) VALUES (?, ?, ?, ?, ?)",
        [asset_code, emp_code, assigned_by, assign_date, assign_remark || null]
      );

      processed.push({ asset_code, emp_code });
    }

    res.json({ message: "Assignments processed", processed, skipped });
  } catch (err) {
    console.error("❌ Failed to assign assets:", err);
    res.status(500).json({ error: "Failed to assign assets" });
  }
};
