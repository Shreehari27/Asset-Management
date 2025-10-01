import pool from "../config/db.js";

// ➤ Assign Asset (supports bulk assignment)
export const assignAsset = async (req, res) => {
  try {
    const assignments = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];

    for (const assignment of assignments) {
      const { asset_code, serial_number, asset_type, asset_brand, emp_code, assigned_by, assign_date, assign_remark } = assignment;

      if (!asset_code || !serial_number || !asset_type || !emp_code || !assigned_by || !assign_date) {
        results.push({ asset_code, error: "Missing required fields" });
        continue;
      }

      // 1️⃣ Check if asset exists
      let [assetRows] = await pool.query(
        "SELECT * FROM assets WHERE asset_code = ? OR serial_number = ?",
        [asset_code, serial_number]
      );

      if (assetRows.length === 0) {
        // Insert new asset
        await pool.query(
          `INSERT INTO assets (asset_code, serial_number, asset_type, asset_brand, status) 
           VALUES (?, ?, ?, ?, 'available')`,
          [asset_code, serial_number, asset_type, asset_brand]
        );
        console.log(`✅ New asset added: ${asset_code}`);
      } else {
        const existing = assetRows[0];
        if (existing.status !== "available") {
          results.push({ asset_code, error: `Asset ${asset_code} is currently ${existing.status}` });
          continue; // skip this one
        }
      }

      // 2️⃣ Assign asset
      await pool.query(
        `INSERT INTO assignment_active (asset_code, emp_code, assigned_by, assign_date, assign_remark)
         VALUES (?, ?, ?, ?, ?)`,
        [asset_code, emp_code, assigned_by, assign_date, assign_remark]
      );

      results.push({ asset_code, message: "✅ Asset assigned successfully" });
    }

    res.json(results);
  } catch (err) {
    console.error("❌ Error assigning asset:", err);
    res.status(500).json({ error: "Failed to assign asset" });
  }
};

// ➤ Get live assignments
export const getLiveAssignments = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT aa.asset_code, a.serial_number, a.asset_type, a.asset_brand,
             e.name AS employee_name, e.emp_code, aa.assigned_by, aa.assign_date, aa.assign_remark
      FROM assignment_active aa
      JOIN assets a ON aa.asset_code = a.asset_code
      JOIN employees e ON aa.emp_code = e.emp_code
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching live assignments:", err);
    res.status(500).json({ error: "Failed to fetch live assignments" });
  }
};

// ➤ Get assignment history
export const getAssignmentHistory = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ah.asset_code,
             a.serial_number,
             a.asset_type,
             a.asset_brand,
             e.emp_code,
             ah.assigned_by,
             ah.assign_date,
             ah.return_date,
             ah.returned_to,
             ah.assign_remark,
             ah.return_remark
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

// ➤ Return Asset
export const returnAsset = async (req, res) => {
  try {
    const { asset_code } = req.params;
    const { return_date, return_remark, return_to } = req.body;

    if (!return_date || !return_to) {
      return res.status(400).json({ error: "return_date and return_to are required" });
    }

    // 1️⃣ Get active assignment
    const [activeRows] = await pool.query(
      "SELECT * FROM assignment_active WHERE asset_code = ?",
      [asset_code]
    );

    if (activeRows.length === 0) {
      return res.status(404).json({ error: "Active assignment not found" });
    }

    const assignment = activeRows[0];

    // 2️⃣ Update assignment_history
    await pool.query(
      `UPDATE assignment_history
       SET return_date = ?, return_remark = ?, returned_to = ?
       WHERE asset_code = ? AND emp_code = ? AND return_date IS NULL`,
      [return_date, return_remark || "Returned", return_to, assignment.asset_code, assignment.emp_code]
    );

    // 3️⃣ Delete from assignment_active
    await pool.query("DELETE FROM assignment_active WHERE id = ?", [assignment.id]);

    // ✅ Asset status update handled by DB trigger
    res.json({ message: "✅ Asset returned successfully" });
  } catch (err) {
    console.error("❌ Error returning asset:", err);
    res.status(500).json({ error: "Failed to return asset" });
  }
};
