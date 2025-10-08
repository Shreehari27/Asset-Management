import pool from "../config/db.js";

// =============================
// ➤ Assign Asset (supports bulk + charger + psd_id)
// =============================
export const assignAsset = async (req, res) => {
  try {
    const assignments = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];

    for (const assignment of assignments) {
      const {
        asset_code,
        serial_number,
        asset_type,
        asset_brand,
        emp_code,
        assigned_by,
        assign_date,
        assign_remark,
        parent_asset_code,
        psd_id,
      } = assignment;

      // ✅ Validate required fields
      if (
        !psd_id ||
        !asset_code ||
        !serial_number ||
        !asset_type ||
        !emp_code ||
        !assigned_by ||
        !assign_date
      ) {
        results.push({ asset_code, error: "Missing required fields" });
        continue;
      }

      // 1️⃣ Check if asset exists
      let [assetRows] = await pool.query(
        "SELECT * FROM assets WHERE asset_code = ? OR serial_number = ?",
        [asset_code, serial_number]
      );

      if (assetRows.length === 0) {
        // Insert new asset (if not in DB)
        await pool.query(
          `INSERT INTO assets (asset_code, serial_number, asset_type, asset_brand, parent_asset_code, status)
           VALUES (?, ?, ?, ?, ?, 'available')
           ON DUPLICATE KEY UPDATE asset_type = VALUES(asset_type), asset_brand = VALUES(asset_brand)`,
          [asset_code, serial_number, asset_type, asset_brand, parent_asset_code || null]
        );
        console.log(`✅ New asset added: ${asset_code}`);
      } else {
        const existing = assetRows[0];
        if (existing.status !== "available") {
          results.push({
            asset_code,
            error: `Asset ${asset_code} is currently ${existing.status}`,
          });
          continue;
        }
      }

      // 2️⃣ Assign main asset
      await pool.query(
        `INSERT INTO assignment_active
          (psd_id, asset_code, emp_code, assigned_by, assign_date, assign_remark)
          VALUES (?, ?, ?, ?, ?, ?)`,
        [psd_id, asset_code, emp_code, assigned_by, assign_date, assign_remark]
      );

      // 3️⃣ Update asset status to 'assigned'
      await pool.query(`UPDATE assets SET status = 'assigned' WHERE asset_code = ?`, [asset_code]);

      results.push({ asset_code, message: "✅ Asset assigned successfully" });
    }

    res.json(results);
  } catch (err) {
    console.error("❌ Error assigning asset:", err);
    res.status(500).json({ error: err.message || "Failed to assign asset" });
  }
};

// =============================
// ➤ Get Live Assignments
// =============================
export const getLiveAssignments = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT aa.psd_id, aa.asset_code, a.serial_number, a.asset_type, a.asset_brand,
             e.name AS employee_name, e.emp_code, aa.assigned_by, aa.assign_date, aa.assign_remark
      FROM assignment_active aa
      JOIN assets a ON aa.asset_code = a.asset_code
      JOIN employees e ON aa.emp_code = e.emp_code
      ORDER BY aa.assign_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching live assignments:", err);
    res.status(500).json({ error: "Failed to fetch live assignments" });
  }
};

// =============================
// ➤ Get Assignment History
// =============================
export const getAssignmentHistory = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ah.psd_id, ah.asset_code,
             a.serial_number, a.asset_type, a.asset_brand,
             e.emp_code, ah.assigned_by, ah.assign_date,
             ah.return_date, ah.returned_to, ah.assign_remark, ah.return_remark
      FROM assignment_history ah
      JOIN assets a ON ah.asset_code = a.asset_code
      JOIN employees e ON ah.emp_code = e.emp_code
      ORDER BY ah.assign_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching assignment history:", err);
    res.status(500).json({ error: "Failed to fetch assignment history" });
  }
};

// =============================
// ➤ Return Asset (Independent Laptop / Charger Return)
// =============================
export const returnAsset = async (req, res) => {
  try {
    const { asset_code } = req.params;
    const { return_date, return_remark, return_to } = req.body;

    if (!return_date || !return_to) {
      return res
        .status(400)
        .json({ error: "return_date and return_to are required" });
    }

    // 1️⃣ Get active assignment for the asset
    const [activeRows] = await pool.query(
      "SELECT * FROM assignment_active WHERE asset_code = ?",
      [asset_code]
    );

    if (activeRows.length === 0) {
      return res.status(404).json({ error: "Active assignment not found" });
    }

    const assignment = activeRows[0];

    // 2️⃣ Update assignment_history for this asset only
    await pool.query(
      `UPDATE assignment_history
       SET return_date = ?, return_remark = ?, returned_to = ?
       WHERE asset_code = ? AND emp_code = ? AND return_date IS NULL`,
      [
        return_date,
        return_remark || "Returned",
        return_to,
        assignment.asset_code,
        assignment.emp_code,
      ]
    );

    // 3️⃣ Delete from assignment_active
    await pool.query("DELETE FROM assignment_active WHERE id = ?", [assignment.id]);

    // 4️⃣ Update asset status to 'available'
    await pool.query("UPDATE assets SET status = 'available' WHERE asset_code = ?", [
      asset_code,
    ]);

    // ✅ Now laptop and charger are independent
    res.json({
      message: `✅ Asset ${asset_code} returned successfully`,
    });
  } catch (err) {
    console.error("❌ Error returning asset:", err);
    res.status(500).json({ error: "Failed to return asset" });
  }
};
