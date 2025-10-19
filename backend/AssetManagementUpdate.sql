USE ASSETMANAGEMENT;


-- Add PSD_ID to assignment_active
ALTER TABLE assignment_active
ADD COLUMN psd_id VARCHAR(50) NOT NULL AFTER id;

-- Add PSD_ID to assignment_history
ALTER TABLE assignment_history
ADD COLUMN psd_id VARCHAR(50) NOT NULL AFTER id;


DROP TRIGGER IF EXISTS trg_insert_assignment;
DROP TRIGGER IF EXISTS trg_return_assignment;

-- ===================================
-- 🔁 Trigger 1: Insert Assignment → History + Update Asset Status
-- ===================================
DELIMITER //
CREATE TRIGGER trg_insert_assignment
AFTER INSERT ON assignment_active
FOR EACH ROW
BEGIN
    INSERT INTO assignment_history (
        psd_id,
        asset_code,
        emp_code,
        assigned_by,
        assign_date,
        assign_remark
    )
    VALUES (
        NEW.psd_id,
        NEW.asset_code,
        NEW.emp_code,
        NEW.assigned_by,
        NEW.assign_date,
        NEW.assign_remark
    );

    UPDATE assets 
    SET status = 'assigned'
    WHERE asset_code = NEW.asset_code;
END;
//
DELIMITER ;

-- ===================================
-- 🔁 Trigger 2: Return Assignment → Update History + Update Asset Status
-- ===================================
DELIMITER //
CREATE TRIGGER trg_return_assignment
AFTER DELETE ON assignment_active
FOR EACH ROW
BEGIN
    UPDATE assignment_history
    SET 
        return_date = CURRENT_DATE,
        return_remark = 'Returned'
        -- returned_to still set via API when known
    WHERE 
        asset_code = OLD.asset_code
        AND emp_code = OLD.emp_code
        AND psd_id = OLD.psd_id
        AND return_date IS NULL;

UPDATE assets 
SET 
    status = 'available'
WHERE
    asset_code = OLD.asset_code;
END;
//
DELIMITER ;

-- Scrap Table
CREATE TABLE asset_scrap (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_code VARCHAR(50) NOT NULL,
    serial_number VARCHAR(100),
    asset_type VARCHAR(100),
    asset_brand VARCHAR(100),
    scrap_date DATE NOT NULL,
    scrap_reason TEXT,
    scrapped_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_code)
        REFERENCES assets (asset_code)
);

SELECT * FROM assets;
ALTER TABLE assets 
MODIFY COLUMN status 
ENUM('available', 'assigned', 'scrapped', 'repair') 
DEFAULT 'available';
select * FROM asset_scrap;


-- Laptop Charger
ALTER TABLE assets
ADD COLUMN parent_asset_code VARCHAR(20) NULL,
ADD FOREIGN KEY (parent_asset_code) REFERENCES assets(asset_code);

CREATE TABLE asset_modifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_code VARCHAR(20) NOT NULL,
    modified_by VARCHAR(20) NOT NULL,
    modification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modification TEXT NOT NULL,
    FOREIGN KEY (asset_code)
        REFERENCES assets (asset_code),
    FOREIGN KEY (modified_by)
        REFERENCES employees (emp_code)
);


-- correction
DROP TRIGGER IF EXISTS trg_update_warranty_status;
DROP TRIGGER IF EXISTS trg_update_warranty_status_on_update;

DELIMITER //

CREATE TRIGGER trg_update_warranty_status
BEFORE INSERT ON assets
FOR EACH ROW
BEGIN
    IF NEW.warranty_start IS NULL OR NEW.warranty_end IS NULL THEN
        SET NEW.warranty_status = 'unknown';
    ELSEIF CURDATE() < NEW.warranty_start THEN
        SET NEW.warranty_status = 'unknown'; -- warranty not started yet
    ELSEIF CURDATE() BETWEEN NEW.warranty_start AND NEW.warranty_end THEN
        SET NEW.warranty_status = 'active';
    ELSE
        SET NEW.warranty_status = 'expired';
    END IF;
END;
//

CREATE TRIGGER trg_update_warranty_status_on_update
BEFORE UPDATE ON assets
FOR EACH ROW
BEGIN
    IF NEW.warranty_start IS NULL OR NEW.warranty_end IS NULL THEN
        SET NEW.warranty_status = 'unknown';
    ELSEIF CURDATE() < NEW.warranty_start THEN
        SET NEW.warranty_status = 'unknown';
    ELSEIF CURDATE() BETWEEN NEW.warranty_start AND NEW.warranty_end THEN
        SET NEW.warranty_status = 'active';
    ELSE
        SET NEW.warranty_status = 'expired';
    END IF;
END;
//
DELIMITER ;

DROP EVENT IF EXISTS update_warranty_status_daily;

CREATE EVENT update_warranty_status_daily
ON SCHEDULE EVERY 1 DAY
DO
    UPDATE assets
    SET warranty_status = 
        CASE
            WHEN warranty_start IS NULL OR warranty_end IS NULL THEN 'unknown'
            WHEN CURDATE() < warranty_start THEN 'unknown'
            WHEN CURDATE() BETWEEN warranty_start AND warranty_end THEN 'active'
            WHEN CURDATE() > warranty_end THEN 'expired'
            ELSE 'unknown'
        END;
        














