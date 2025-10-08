import pool from "../config/db.js";

// ============================
// 🔹 Get all scrapped assets
// ============================
export const getScrappedAssets = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
          s.id,
          s.asset_code,
          s.serial_number,
          s.asset_type,
          s.asset_brand,
          s.scrap_date,
          s.scrap_reason,
          s.scrapped_by,
          a.status
      FROM asset_scrap s
      LEFT JOIN assets a ON s.asset_code = a.asset_code
      WHERE a.status = 'scrapped'
      ORDER BY s.scrap_date DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching scrapped assets:", error);
    res.status(500).json({ error: "Failed to fetch scrapped assets" });
  }
};

// ============================
// 🔹 Scrap an available asset
// ============================
export const scrapAsset = async (req, res) => {
  const { asset_code, scrap_reason, scrap_date, scrapped_by } = req.body;

  try {
    // 1️⃣ Check asset validity
    const [assetRows] = await pool.execute(
      "SELECT * FROM assets WHERE asset_code = ?",
      [asset_code]
    );

    if (!assetRows.length) {
      return res.status(404).json({ error: "Asset not found" });
    }

    const asset = assetRows[0];

    if (asset.status !== "available") {
      return res.status(400).json({ error: "Only available assets can be scrapped" });
    }

    // 2️⃣ Insert into asset_scrap table
    await pool.execute(
      `INSERT INTO asset_scrap (
        asset_code, serial_number, asset_type, asset_brand,
        scrap_date, scrap_reason, scrapped_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        asset.asset_code,
        asset.serial_number,
        asset.asset_type,
        asset.asset_brand,
        scrap_date || new Date(),
        scrap_reason || null,
        scrapped_by || "SYSTEM",
      ]
    );

    // 3️⃣ Update asset status → scrapped
    await pool.execute(
      "UPDATE assets SET status = 'scrapped', updated_at = NOW() WHERE asset_code = ?",
      [asset_code]
    );

    res.json({ message: "✅ Asset scrapped successfully" });
  } catch (error) {
    console.error("Error scrapping asset:", error);
    res.status(500).json({ error: "Failed to scrap asset" });
  }
};

// ============================
// 🔹 Get scrap statistics
// ============================
export const getScrapStats = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
          COUNT(*) AS total_scrapped,
          MONTH(scrap_date) AS month,
          YEAR(scrap_date) AS year
      FROM asset_scrap
      GROUP BY YEAR(scrap_date), MONTH(scrap_date)
      ORDER BY year DESC, month DESC
      LIMIT 12
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching scrap stats:", error);
    res.status(500).json({ error: "Failed to fetch scrap statistics" });
  }
};

// ============================
// 🔹 Get single asset details
// ============================
export const getAssetDetails = async (req, res) => {
  const { asset_code } = req.params;
  try {
    const [rows] = await pool.execute(
      "SELECT asset_code, serial_number, asset_type, asset_brand, status FROM assets WHERE asset_code = ?",
      [asset_code]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Asset not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching asset details:", error);
    res.status(500).json({ error: "Failed to fetch asset details" });
  }
};
