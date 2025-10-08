import pool from "../config/db.js";

// Get all scrapped assets
export const getScrappedAssets = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT
                a.asset_code,
                a.serial_number,
                a.asset_type,
                a.asset_brand,
                a.status,
                h.assign_date,
                h.return_date,
                h.return_remark,
                e.name AS scrapped_by
            FROM assets a
            LEFT JOIN assignment_history h ON a.asset_code = h.asset_code
            LEFT JOIN employees e ON h.returned_to = e.emp_code
            WHERE a.status = 'retired'
            ORDER BY h.return_date DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching scrapped assets:", error);
        res.status(500).json({ error: "Failed to fetch scrapped assets" });
    }
};

// Scrap an asset
export const scrapAsset = async (req, res) => {
    const { asset_code, return_remark, returned_to } = req.body;

    try {
        // Update asset status to retired
        await pool.execute(
            "UPDATE assets SET status = 'retired' WHERE asset_code = ?",
            [asset_code]
        );

        // Update the latest assignment history record
        await pool.execute(
            `UPDATE assignment_history
             SET return_date = CURDATE(),
                 return_remark = ?,
                 returned_to = ?
             WHERE asset_code = ?
               AND return_date IS NULL
             ORDER BY assign_date DESC
             LIMIT 1`,
            [return_remark, returned_to, asset_code]
        );

        res.json({ message: "Asset scrapped successfully" });
    } catch (error) {
        console.error("Error scrapping asset:", error);
        res.status(500).json({ error: "Failed to scrap asset" });
    }
};

// Get scrap statistics
export const getScrapStats = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT
                COUNT(*) as total_scrapped,
                MONTH(return_date) as month,
                YEAR(return_date) as year
            FROM assignment_history
            WHERE return_date IS NOT NULL
              AND asset_code IN (
                  SELECT asset_code FROM assets WHERE status = 'retired'
              )
            GROUP BY YEAR(return_date), MONTH(return_date)
            ORDER BY year DESC, month DESC
            LIMIT 12
        `);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching scrap stats:", error);
        res.status(500).json({ error: "Failed to fetch scrap statistics" });
    }
};
