import pool from "../config/db.js";

// =============================
// ➤ Assign Asset (only if asset exists)
// =============================
export const assignAsset = async (req, res) => {
  try {
    const assignments = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];

    const assignedBy = req.user?.emp_code; // ✅ take from JWT
    if (!assignedBy) {
      return res.status(401).json({ error: "Unauthorized: missing emp_code in token" });
    }

    for (const assignment of assignments) {
      const {
        asset_code,
        serial_number,
        asset_type,
        asset_brand,
        emp_code,
        assign_date,
        assign_remark,
        psd_id,
        processor,
        warranty_start,
        warranty_end,
      } = assignment;

      if (!psd_id || !asset_code || !emp_code || !assign_date) {
        results.push({ asset_code, error: "❌ Missing required fields" });
        continue;
      }

      // 1️⃣ Check if asset exists
      const [assetRows] = await pool.query(
        "SELECT status FROM assets WHERE asset_code = ? LIMIT 1",
        [asset_code]
      );

      if (assetRows.length === 0) {
        results.push({
          asset_code,
          error: `⚠️ Asset ${asset_code} not found in database — cannot assign.`,
        });
        continue;
      }

      // 2️⃣ Check if asset is already assigned
      const assetStatus = assetRows[0].status;
      if (assetStatus === "assigned") {
        results.push({
          asset_code,
          error: `⚠️ Asset ${asset_code} is already assigned to another employee.`,
        });
        continue;
      }

      // 3️⃣ Proceed with assignment — ✅ use assignedBy from token
      await pool.query(
        `INSERT INTO assignment_active 
          (psd_id, asset_code, emp_code, assigned_by, assign_date, assign_remark)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [psd_id, asset_code, emp_code, assignedBy, assign_date, assign_remark]
      );

      // 4️⃣ Update asset details
      await pool.query(
        `UPDATE assets
         SET serial_number = ?, asset_brand = ?, processor = ?, 
             warranty_start = ?, warranty_end = ?, status = 'assigned'
         WHERE asset_code = ?`,
        [
          serial_number || null,
          asset_brand || null,
          processor || null,
          warranty_start || null,
          warranty_end || null,
          asset_code,
        ]
      );

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
      SELECT aa.psd_id, aa.asset_code, a.serial_number, a.asset_type, a.asset_brand, a.processor,
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
      SELECT ah.psd_id, ah.asset_code, a.serial_number, a.asset_type, a.asset_brand, a.processor,
             e.emp_code, ah.assigned_by, ah.assign_date, ah.return_date, ah.returned_to,
             ah.assign_remark, ah.return_remark
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
// ✅ Return Asset (Fixed: Prevent duplicate history entry)
// =============================
export const returnAsset = async (req, res) => {
  try {
    const { asset_code } = req.params;
    const { return_date, return_remark} = req.body;
    const return_to = req.user?.emp_code; // ✅ from JWT

    if (!return_date) {
      return res.status(400).json({ error: "return_date is required" });
    }

    // 1️⃣ Set session variables for trigger
    await pool.query("SET @return_to = ?, @return_remark = ?", [
      return_to,
      return_remark || "Returned",
    ]);

    // 2️⃣ Delete from active — trigger handles history update
    const [result] = await pool.query(
      "DELETE FROM assignment_active WHERE asset_code = ?",
      [asset_code]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No active assignment found for this asset" });
    }

    // 3️⃣ Directly update asset status to available (redundant but safe)
    await pool.query(
      "UPDATE assets SET status = 'available' WHERE asset_code = ?",
      [asset_code]
    );

    res.json({ message: `✅ Asset ${asset_code} returned successfully` });
  } catch (err) {
    console.error("❌ Error returning asset:", err);
    res.status(500).json({ error: err.message });
  }
};


// =============================
// ➤ Get Live Assignments by Employee Code
// =============================
export const getLiveAssignmentsByEmpCode = async (req, res) => {
  try {
    const { emp_code } = req.params;

    if (!emp_code) {
      return res.status(400).json({ error: "Employee code is required" });
    }

    const [rows] = await pool.query(
      `
      SELECT 
        aa.psd_id,
        aa.asset_code,
        a.serial_number,
        a.asset_type,
        a.asset_brand,
        a.processor,
        e.name AS employee_name,
        e.emp_code,
        aa.assigned_by,
        aa.assign_date,
        aa.assign_remark
      FROM assignment_active aa
      JOIN assets a ON aa.asset_code = a.asset_code
      JOIN employees e ON aa.emp_code = e.emp_code
      WHERE e.emp_code = ?
      ORDER BY aa.assign_date DESC
      `,
      [emp_code]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: `No active assignments found for ${emp_code}` });
    }

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching assignments by employee:", err);
    res.status(500).json({ error: "Failed to fetch employee's live assignments" });
  }
};
