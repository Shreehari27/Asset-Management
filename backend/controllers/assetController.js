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
        model_name,
        location,
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

// ➤ Add one or multiple assets(with charger and cable handling)
export const addAsset = async (req, res) => {
  try {
    const assets = Array.isArray(req.body) ? req.body : [req.body];
    const added = [];
    const skipped = [];

    // 🔧 Utility: format JS or ISO date into 'YYYY-MM-DD'
    const toSQLDate = (date) => {
      if (!date) return null;
      try {
        return new Date(date).toISOString().split("T")[0]; // keep only date part
      } catch {
        return null;
      }
    };

    for (let asset of assets) {
      let {
        asset_code,
        serial_number,
        asset_type,
        asset_brand,
        model_name,
        location,
        processor,
        charger_serial,
        warranty_start,
        warranty_end,
        cable_type,
        purchase_date,
        lot_number
      } = asset;

      if (!asset_type) {
        skipped.push({ asset_code, reason: "asset_type is required" });
        continue;
      }

      // Auto-code & serial for cables
      if (asset_type.toLowerCase() === "cables") {
        const [rows] = await pool.query("SELECT COUNT(*) AS count FROM assets WHERE asset_type='Cables'");
        const nextNum = rows[0].count + 1;
        asset_code = `C${nextNum.toString().padStart(3, '0')}`;
        if (!serial_number) serial_number = "N/A";
      }

      if (!asset_code || !serial_number) {
        skipped.push({ asset_code, reason: "Missing asset_code or serial_number" });
        continue;
      }

      // ✅ Format all dates safely for SQL
      const sqlPurchaseDate = toSQLDate(purchase_date);
      const sqlWarrantyStart = toSQLDate(warranty_start);
      const sqlWarrantyEnd = toSQLDate(warranty_end);

      // Check duplicate asset code
      const [existing] = await pool.query("SELECT asset_code FROM assets WHERE asset_code = ?", [asset_code]);
      if (existing.length) {
        skipped.push({ asset_code, reason: "Asset code already exists" });
        continue;
      }

      // Prepare query dynamically
      const columns = ["asset_code", "serial_number", "asset_type"];
      const values = [asset_code, serial_number, asset_type];
      const placeholders = ["?", "?", "?"];

      if (asset_type.toLowerCase() === "cables" && cable_type) {
        columns.push("cable_type");
        values.push(cable_type);
        placeholders.push("?");
      }

      if (asset_brand) { columns.push("asset_brand"); values.push(asset_brand); placeholders.push("?"); }
      if (model_name) { columns.push("model_name"); values.push(model_name); placeholders.push("?"); }
      if (sqlPurchaseDate) { columns.push("purchase_date"); values.push(sqlPurchaseDate); placeholders.push("?"); }
      if (lot_number) { columns.push("lot_number"); values.push(lot_number); placeholders.push("?"); }
      if (processor) { columns.push("processor"); values.push(processor); placeholders.push("?"); }
      if (location) { columns.push("location"); values.push(location); placeholders.push("?"); }

      columns.push("warranty_start");
      values.push(sqlWarrantyStart);
      placeholders.push("?");

      columns.push("warranty_end");
      values.push(sqlWarrantyEnd);
      placeholders.push("?");


      columns.push("status");
      values.push("ready_to_be_assigned");
      placeholders.push("?");

      const sql = `INSERT INTO assets (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
      await pool.query(sql, values);

      // Add charger if needed
      // Add charger if laptop or mini desktop — inherit warranty
      if ((asset_type.toLowerCase().includes("laptop") || asset_type.toLowerCase().includes("mini desktop")) && charger_serial) {
        const chargerCode = `${asset_code}-CH`;

        await pool.query(
          `INSERT INTO assets 
        (asset_code, serial_number, asset_type, asset_brand, parent_asset_code, location, warranty_start, warranty_end, status)
        VALUES (?, ?, 'Charger', ?, ?, ?, ?, ?, 'ready_to_be_assigned')`,
          [
            chargerCode,
            charger_serial,
            asset_brand || null,
            asset_code,
            location || 'EmployeeWFH',
            sqlWarrantyStart || null,
            sqlWarrantyEnd || null
          ]
        );
      }


      added.push({ asset_code, message: "✅ Added successfully" });
    }

    res.json({ added, skipped });
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
    const { asset_code, modification } = req.body;
    const modified_by = req.user?.emp_code; // ✅ from token


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


