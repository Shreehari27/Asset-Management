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

// ➤ Get single asset by code (with charger info if applicable)
export const getAssetByCode = async (req, res) => {
  try {
    const { code } = req.params;

    // Fetch main asset
    const [rows] = await pool.query(
      "SELECT * FROM assets WHERE asset_code = ?",
      [code]
    );

    if (rows.length === 0) {
      return res.status(200).json(null); // return null for new asset
    }

    const asset = rows[0];

    // If it's laptop or mini desktop, try fetching linked charger
    if (
      asset.asset_type &&
      (asset.asset_type.toLowerCase().includes("laptop") ||
        asset.asset_type.toLowerCase().includes("mini desktop"))
    ) {
      const [chargerRows] = await pool.query(
        "SELECT serial_number FROM assets WHERE parent_asset_code = ? AND asset_type = 'Charger'",
        [code]
      );

      if (chargerRows.length > 0) {
        asset.charger_serial = chargerRows[0].serial_number;
      } else {
        asset.charger_serial = null;
      }
    } else {
      asset.charger_serial = null;
    }

    res.json(asset);
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

      // Validate required fields
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
        // Insert new asset if not found
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

      // 3️⃣ Update asset status
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

// ➤ Helper: Format ISO string to YYYY-MM-DD
const formatDate = (isoString) => {
  if (!isoString) return null;
  return isoString.split("T")[0]; // take only date part
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

    // Check if asset already exists
    const [existing] = await pool.query(
      "SELECT * FROM assets WHERE asset_code = ? OR serial_number = ?",
      [asset_code, serial_number]
    );

    if (existing.length) {
      return res.status(400).json({ error: "Asset code or serial number already exists" });
    }

    // Insert main asset
    const columns = ["asset_code", "serial_number", "asset_type"];
    const values = [asset_code, serial_number, asset_type];
    const placeholders = ["?", "?", "?"];

    if (asset_brand) {
      columns.push("asset_brand");
      values.push(asset_brand);
      placeholders.push("?");
    }

    if (processor) {
      columns.push("processor");
      values.push(processor);
      placeholders.push("?");
    }

    if (warranty_start) {
      columns.push("warranty_start");
      values.push(formatDate(warranty_start));
      placeholders.push("?");
    }

    if (warranty_end) {
      columns.push("warranty_end");
      values.push(formatDate(warranty_end));
      placeholders.push("?");
    }

    columns.push("status");
    values.push("available");
    placeholders.push("?");

    const sql = `INSERT INTO assets (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
    await pool.query(sql, values);

    // Create charger asset if applicable
    if ((asset_type.toLowerCase().includes("laptop") || asset_type.toLowerCase().includes("mini desktop")) && charger_serial) {
      const chargerCode = `${asset_code}-CH`; // Only asset_code gets suffix
      await pool.query(
        `INSERT INTO assets (asset_code, serial_number, asset_type, asset_brand, parent_asset_code, status)
         VALUES (?, ?, 'Charger', ?, ?, 'available')`,
        [chargerCode, charger_serial, asset_brand || null, asset_code]
      );
    }

    res.json({ message: "✅ Asset added successfully" });
  } catch (err) {
    console.error("❌ Failed to add asset:", err);
    res.status(500).json({ error: "Failed to add asset" });
  }
};
