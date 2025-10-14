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

// ➤ Get single asset by code
export const getAssetByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM assets WHERE asset_code = ?",
      [code]
    );

    if (rows.length === 0) {
      return res.status(200).json(null); // return null for new asset
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching asset:", err);
    res.status(500).json({ error: "Failed to fetch asset" });
  }
};

// ➤ Assign single or multiple assets
export const assignAssets = async (req, res) => {
  try {
    let assignments = req.body;
    if (!Array.isArray(assignments)) assignments = [assignments];

    const processed = [];
    const skipped = [];

    for (const item of assignments) {
      const {
        asset_code,
        serial_number,
        asset_type,
        asset_brand,
        processor,
        charger_serial,
        warranty_start,
        warranty_end,
        emp_code,
        assigned_by,
        assign_date,
        assign_remark,
        parent_asset_code,
        psd_id
      } = item;

      // Skip if required fields are missing for assignment
      if (!asset_code || !serial_number || !asset_type || !emp_code || !assigned_by || !assign_date || !psd_id) {
        skipped.push({ asset_code, reason: "Missing required fields" });
        continue;
      }

      // 1️⃣ Check if asset exists
      const [existingAsset] = await pool.query(
        "SELECT * FROM assets WHERE asset_code = ? OR serial_number = ?",
        [asset_code, serial_number]
      );

      if (!existingAsset.length) {
        // Insert new asset
        await pool.query(
          `INSERT INTO assets 
          (asset_code, serial_number, asset_type, asset_brand, processor, charger_serial, parent_asset_code, warranty_start, warranty_end, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
          [
            asset_code,
            serial_number,
            asset_type,
            asset_brand || null,
            processor || null,
            charger_serial || null,
            parent_asset_code || null,
            warranty_start || null,
            warranty_end || null
          ]
        );
      } else {
        // If asset exists but not available, skip
        const existing = existingAsset[0];
        if (existing.status !== "available") {
          skipped.push({ asset_code, reason: `Asset is currently ${existing.status}` });
          continue;
        }
      }

      // 2️⃣ Assign asset
      await pool.query(
        `INSERT INTO assignment_active 
        (psd_id, asset_code, emp_code, assigned_by, assign_date, assign_remark) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [psd_id, asset_code, emp_code, assigned_by, assign_date, assign_remark || null]
      );

      // 3️⃣ Update asset status & warranty
      await pool.query(
        `UPDATE assets SET status = 'assigned', warranty_start = ?, warranty_end = ? WHERE asset_code = ?`,
        [warranty_start || null, warranty_end || null, asset_code]
      );

      processed.push({ asset_code, emp_code });
    }

    res.json({ message: "Assignments processed", processed, skipped });
  } catch (err) {
    console.error("❌ Failed to assign assets:", err);
    res.status(500).json({ error: "Failed to assign assets" });
  }
};

// Helper to format ISO string to YYYY-MM-DD
const formatDate = (isoString) => {
  if (!isoString) return null;
  return isoString.split('T')[0]; // take only the date part
};

export const addAsset = async (req, res) => {
  try {
    const {
      asset_code,
      serial_number,
      asset_type,
      asset_brand,
      processor,
      charger_serial,
      warranty_start,
      warranty_end
    } = req.body;

    if (!asset_code || !serial_number || !asset_type) {
      return res.status(400).json({ error: "asset_code, serial_number, and asset_type are required" });
    }

    const [existing] = await pool.query(
      "SELECT * FROM assets WHERE asset_code = ? OR serial_number = ?",
      [asset_code, serial_number]
    );

    if (existing.length) {
      return res.status(400).json({ error: "Asset code or serial number already exists" });
    }

    const columns = ['asset_code', 'serial_number', 'asset_type'];
    const values = [asset_code, serial_number, asset_type];
    const placeholders = ['?', '?', '?'];

    if (asset_brand) {
      columns.push('asset_brand');
      values.push(asset_brand);
      placeholders.push('?');
    }

    if ((asset_type.toLowerCase().includes('laptop') || asset_type.toLowerCase().includes('desktop')) && processor) {
      columns.push('processor');
      values.push(processor);
      placeholders.push('?');
    }

    if ((asset_type.toLowerCase().includes('laptop') || asset_type.toLowerCase().includes('mini desktop')) && charger_serial) {
      columns.push('charger_serial');
      values.push(charger_serial);
      placeholders.push('?');
    }

    if (warranty_start) {
      columns.push('warranty_start');
      values.push(formatDate(warranty_start)); // ✅ convert to YYYY-MM-DD
      placeholders.push('?');
    }

    if (warranty_end) {
      columns.push('warranty_end');
      values.push(formatDate(warranty_end)); // ✅ convert to YYYY-MM-DD
      placeholders.push('?');
    }

    columns.push('status');
    values.push('available');
    placeholders.push('?');

    const sql = `INSERT INTO assets (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;

    await pool.query(sql, values);

    res.json({ message: "✅ Asset added successfully" });

  } catch (err) {
    console.error("❌ Failed to add asset:", err);
    res.status(500).json({ error: "Failed to add asset" });
  }
};



