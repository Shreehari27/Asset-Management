-- ===================================
-- 📦 ASSET MANAGEMENT SYSTEM DATABASE
-- Finalized Version (with warranty, scrap, and modification tracking)
-- ===================================

CREATE DATABASE ASSETMANAGEMENT;
USE ASSETMANAGEMENT;

-- ================================
-- 👤 Employees Table
-- ================================
CREATE TABLE employees (
    emp_code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    isIT BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ================================
-- 💻 Assets Table
-- ================================
CREATE TABLE assets (
    asset_code VARCHAR(20) PRIMARY KEY,
    serial_number VARCHAR(100) UNIQUE,
    asset_type VARCHAR(50) NOT NULL,
    asset_brand VARCHAR(50),
    processor VARCHAR(100) NULL,
    warranty_start DATE NULL,
    warranty_end DATE NULL,
    warranty_status ENUM('active', 'expired', 'unknown') DEFAULT 'unknown',
    parent_asset_code VARCHAR(20) NULL,
    status ENUM('available', 'ready_to_be_assigned', 'assigned', 'scrapped', 'repair', 'retired') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_asset_code) REFERENCES assets(asset_code)
);

-- ================================
-- 🔄 Assignment Active (Live)
-- ================================
CREATE TABLE assignment_active (
    id INT AUTO_INCREMENT PRIMARY KEY,
    psd_id VARCHAR(350) NOT NULL,
    asset_code VARCHAR(20) NOT NULL,
    emp_code VARCHAR(20) NOT NULL,
    assigned_by VARCHAR(20) NOT NULL,
    assign_date DATE NOT NULL,
    assign_remark TEXT,
    FOREIGN KEY (asset_code) REFERENCES assets(asset_code),
    FOREIGN KEY (emp_code) REFERENCES employees(emp_code),
    FOREIGN KEY (assigned_by) REFERENCES employees(emp_code)
);

-- ================================
-- 📜 Assignment History (Log)
-- ================================
CREATE TABLE assignment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    psd_id VARCHAR(350) NOT NULL,
    asset_code VARCHAR(20) NOT NULL,
    emp_code VARCHAR(20) NOT NULL,
    assigned_by VARCHAR(20) NOT NULL,
    assign_date DATE NOT NULL,
    assign_remark TEXT,
    return_date DATE DEFAULT NULL,
    return_remark TEXT,
    returned_to VARCHAR(20) DEFAULT NULL,
    FOREIGN KEY (asset_code) REFERENCES assets(asset_code),
    FOREIGN KEY (emp_code) REFERENCES employees(emp_code),
    FOREIGN KEY (assigned_by) REFERENCES employees(emp_code),
    FOREIGN KEY (returned_to) REFERENCES employees(emp_code)
);

-- Indexes for performance
CREATE INDEX idx_active_asset ON assignment_active(asset_code);
CREATE INDEX idx_active_emp ON assignment_active(emp_code);
CREATE INDEX idx_history_asset ON assignment_history(asset_code);
CREATE INDEX idx_history_emp ON assignment_history(emp_code);

-- ================================
-- 🪓 Asset Scrap Table
-- ================================
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
    FOREIGN KEY (asset_code) REFERENCES assets(asset_code)
);

-- ================================
-- 🧰 Asset Modification Table
-- ================================
CREATE TABLE asset_modifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_code VARCHAR(20) NOT NULL,
    modified_by VARCHAR(20) NOT NULL,
    modification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modification TEXT NOT NULL,
    FOREIGN KEY (asset_code) REFERENCES assets(asset_code),
    FOREIGN KEY (modified_by) REFERENCES employees(emp_code)
);

-- ================================
-- ⚙️ Triggers
-- ================================

-- 1️⃣ Warranty Status Trigger (on INSERT)
DELIMITER //
CREATE TRIGGER trg_update_warranty_status
BEFORE INSERT ON assets
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

-- 2️⃣ Warranty Status Trigger (on UPDATE)
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

-- 3️⃣ Trigger: Insert Assignment → Add to History + Update Asset Status
DELIMITER //
CREATE TRIGGER trg_insert_assignment
AFTER INSERT ON assignment_active
FOR EACH ROW
BEGIN
    INSERT INTO assignment_history (
        psd_id, asset_code, emp_code, assigned_by, assign_date, assign_remark
    )
    VALUES (
        NEW.psd_id, NEW.asset_code, NEW.emp_code, NEW.assigned_by, NEW.assign_date, NEW.assign_remark
    );

    UPDATE assets 
    SET status = 'assigned'
    WHERE asset_code = NEW.asset_code;
END;
//
DELIMITER ;

-- 4️⃣ Trigger: Return Assignment → Update History + Set Asset Available
DELIMITER //
CREATE TRIGGER trg_return_assignment
AFTER DELETE ON assignment_active
FOR EACH ROW
BEGIN
    UPDATE assignment_history
    SET 
        return_date = CURRENT_DATE,
        return_remark = 'Returned'
    WHERE 
        asset_code = OLD.asset_code
        AND emp_code = OLD.emp_code
        AND psd_id = OLD.psd_id
        AND return_date IS NULL;

    UPDATE assets 
    SET status = 'available'
    WHERE asset_code = OLD.asset_code;
END;
//
DELIMITER ;

-- ================================
-- 🕒 Scheduled Event: Daily Warranty Update
-- ================================
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

-- ===================================
-- ✅ Final Check Commands
-- ===================================
SELECT * FROM employees;
SELECT * FROM assets;
SELECT * FROM assignment_active;
SELECT * FROM assignment_history;
SELECT * FROM asset_scrap;
SELECT * FROM asset_modifications;

DESCRIBE assets;
