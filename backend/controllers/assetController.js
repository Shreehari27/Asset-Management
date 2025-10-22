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

    const [rows] = await pool.query("SELECT * FROM assets WHERE asset_code = ?", [code]);

    if (rows.length === 0) return res.status(200).json(null);

    const asset = rows[0];

    if (
      asset.asset_type &&
      (asset.asset_type.toLowerCase().includes("laptop") ||
        asset.asset_type.toLowerCase().includes("mini desktop"))
    ) {
      const [chargerRows] = await pool.query(
        "SELECT serial_number FROM assets WHERE parent_asset_code = ? AND asset_type = 'Charger'",
        [code]
      );

      asset.charger_serial = chargerRows.length > 0 ? chargerRows[0].serial_number : null;
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

      if (!asset_code || !serial_number || !asset_type || !emp_code || !assigned_by || !assign_date || !psd_id) {
        skipped.push({ asset_code, reason: "Missing required fields" });
        continue;
      }

      const [existingAsset] = await pool.query(
        "SELECT * FROM assets WHERE asset_code = ? OR serial_number = ?",
        [asset_code, serial_number]
      );

      if (!existingAsset.length) {
        await pool.query(
          `INSERT INTO assets 
          (asset_code, serial_number, asset_type, asset_brand, processor, parent_asset_code, warranty_start, warranty_end, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
          [
            asset_code,
            serial_number,
            asset_type,
            asset_brand || null,
            processor || null,
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

      await pool.query(
        `INSERT INTO assignment_active 
        (psd_id, asset_code, emp_code, assigned_by, assign_date, assign_remark) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [psd_id, asset_code, emp_code, assigned_by, assign_date, assign_remark || null]
      );

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
  return isoString.split("T")[0];
};

// ➤ Add new asset (with optional charger & cable handling)
export const addAsset = async (req, res) => {
  try {
    let {
      asset_code,
      serial_number,
      asset_type,
      asset_brand,
      processor,
      charger_serial,
      warranty_start,
      warranty_end,
      cable_type
    } = req.body;

    if (!asset_type) {
      return res.status(400).json({ error: "asset_type is required" });
    }

    // ➤ Auto-generate code & serial for Cables
    if (asset_type.toLowerCase() === "cables") {
      const [rows] = await pool.query("SELECT COUNT(*) AS count FROM assets WHERE asset_type='Cables'");
      const nextNum = rows[0].count + 1;
      asset_code = `C${nextNum.toString().padStart(3, '0')}`;
      if (!serial_number) serial_number = "N/A"; // assign default if empty
    }

    if (!asset_code || !serial_number) {
      return res.status(400).json({ error: "asset_code and serial_number are required" });
    }

    // ➤ Check only for duplicate asset_code
    const [existing] = await pool.query(
      "SELECT * FROM assets WHERE asset_code = ?",
      [asset_code]
    );
    if (existing.length) {
      return res.status(400).json({ error: "Asset code already exists" });
    }

    // ➤ Build columns and values dynamically
    const columns = ["asset_code", "serial_number", "asset_type"];
    const values = [asset_code, serial_number, asset_type];
    const placeholders = ["?", "?", "?"];

    if (asset_type.toLowerCase() === "cables" && cable_type) {
      columns.push("cable_type");
      values.push(cable_type);
      placeholders.push("?");
    }

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
    values.push(req.body.status || "available"); // ✅ use provided status if present
    placeholders.push("?");

    const sql = `INSERT INTO assets (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
    await pool.query(sql, values);

    // ➤ Insert charger if applicable (laptop / mini desktop)
    if ((asset_type.toLowerCase().includes("laptop") || asset_type.toLowerCase().includes("mini desktop")) && charger_serial) {
      const chargerCode = `${asset_code}-CH`;
      await pool.query(
        `INSERT INTO assets (asset_code, serial_number, asset_type, asset_brand, parent_asset_code, status)
         VALUES (?, ?, 'Charger', ?, ?, 'available')`,
        [chargerCode, charger_serial, asset_brand || null, asset_code]
      );
    }

    res.json({ message: "✅ Asset added successfully", asset_code });
  } catch (err) {
    console.error("❌ Failed to add asset:", err);
    res.status(500).json({ error: "Failed to add asset" });
  }
};




// ====================================================
// ➤ Add modification record
// ====================================================
export const addAssetModification = async (req, res) => {
  try {
    const { asset_code, modified_by, modification } = req.body;

    if (!asset_code || !modified_by || !modification) {
      return res.status(400).json({ error: "asset_code, modified_by, and modification are required" });
    }

    await pool.query(
      `INSERT INTO asset_modifications (asset_code, modified_by, modification)
       VALUES (?, ?, ?)`,
      [asset_code, modified_by, modification]
    );

    res.json({ message: "✅ Modification added successfully" });
  } catch (err) {
    console.error("❌ Failed to add modification:", err);
    res.status(500).json({ error: "Failed to add modification" });
  }
};

// ➤ Get modifications for a given asset
export const getAssetModifications = async (req, res) => {
  try {
    const { asset_code } = req.params;

    const [rows] = await pool.query(
      `SELECT am.*, e.name AS modified_by_name, e.emp_code AS modified_by_code
       FROM asset_modifications am
       JOIN employees e ON am.modified_by = e.emp_code
       WHERE am.asset_code = ?
       ORDER BY am.modification_date DESC`,
      [asset_code]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Failed to fetch modifications:", err);
    res.status(500).json({ error: "Failed to fetch modifications" });
  }
};


