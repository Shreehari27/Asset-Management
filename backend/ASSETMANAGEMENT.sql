CREATE DATABASE ASSETMANAGEMENT;
USE ASSETMANAGEMENT;
-- ================================
-- Employees Table
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
-- Assets Table
-- ================================
CREATE TABLE assets (
    asset_code VARCHAR(20) PRIMARY KEY,        
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    asset_type VARCHAR(50) NOT NULL,           
    asset_brand VARCHAR(50),                   
    status ENUM('available','assigned','retired','repair') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ================================
-- Assignment Active (live assignments)
-- ================================
CREATE TABLE assignment_active (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_code VARCHAR(20) NOT NULL,
    emp_code VARCHAR(20) NOT NULL,
    assigned_by VARCHAR(20) NOT NULL,
    assign_date DATE NOT NULL,
    assign_remark TEXT,
    FOREIGN KEY (asset_code)
        REFERENCES assets (asset_code),
    FOREIGN KEY (emp_code)
        REFERENCES employees (emp_code),
    FOREIGN KEY (assigned_by)
        REFERENCES employees (emp_code)
);

-- ================================
-- Assignment History (log of all assignments)
-- ================================
CREATE TABLE assignment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_code VARCHAR(20) NOT NULL,
    emp_code VARCHAR(20) NOT NULL,
    assigned_by VARCHAR(20) NOT NULL,  -- IT person who assigned
    assign_date DATE NOT NULL,
    assign_remark TEXT,
    return_date DATE DEFAULT NULL,
    return_remark TEXT,
    returned_to VARCHAR(20) DEFAULT NULL,  -- IT person who received return
    FOREIGN KEY (asset_code) REFERENCES assets(asset_code),
    FOREIGN KEY (emp_code) REFERENCES employees(emp_code),
    FOREIGN KEY (assigned_by) REFERENCES employees(emp_code),
    FOREIGN KEY (returned_to) REFERENCES employees(emp_code)
);

-- ================================
-- Triggers
-- ================================

-- 1️⃣ Insert assignment → copy to history + mark asset assigned
DELIMITER //
CREATE TRIGGER trg_insert_assignment
AFTER INSERT ON assignment_active
FOR EACH ROW
BEGIN
    INSERT INTO assignment_history (asset_code, emp_code, assigned_by, assign_date, assign_remark)
    VALUES (NEW.asset_code, NEW.emp_code, NEW.assigned_by, NEW.assign_date, NEW.assign_remark);

    UPDATE assets SET status = 'assigned' WHERE asset_code = NEW.asset_code;
END;
//
DELIMITER ;

-- 2️⃣ Return assignment → update history with return info
DELIMITER //
CREATE TRIGGER trg_return_assignment
AFTER DELETE ON assignment_active
FOR EACH ROW
BEGIN
    UPDATE assignment_history
    SET return_date = CURRENT_DATE,
        return_remark = 'Returned'
        -- returned_to should be handled in API, not trigger
    WHERE asset_code = OLD.asset_code
      AND emp_code = OLD.emp_code
      AND return_date IS NULL;

    UPDATE assets 
    SET status = 'available' 
    WHERE asset_code = OLD.asset_code;
END;
//
DELIMITER ;


CREATE INDEX idx_active_asset ON assignment_active(asset_code);
CREATE INDEX idx_active_emp ON assignment_active(emp_code);
CREATE INDEX idx_history_asset ON assignment_history(asset_code);
CREATE INDEX idx_history_emp ON assignment_history(emp_code);


-- Modify status to include 'ready_to_be_assigned'
ALTER TABLE assets 
MODIFY COLUMN status 
ENUM('available', 'ready_to_be_assigned', 'assigned', 'scrapped', 'repair', 'retired') 
DEFAULT 'available';

ALTER TABLE assets
ADD COLUMN warranty_start DATE NULL AFTER asset_brand,
ADD COLUMN warranty_end DATE NULL AFTER warranty_start,
ADD COLUMN warranty_status ENUM('active', 'expired', 'unknown') DEFAULT 'unknown' AFTER warranty_end;

ALTER TABLE assets
ADD COLUMN processor VARCHAR(100) NULL AFTER asset_brand;

--   =========================
DELIMITER //

CREATE TRIGGER trg_update_warranty_status
BEFORE INSERT ON assets
FOR EACH ROW
BEGIN
    IF NEW.warranty_start IS NOT NULL AND NEW.warranty_end IS NOT NULL THEN
        IF CURDATE() BETWEEN NEW.warranty_start AND NEW.warranty_end THEN
            SET NEW.warranty_status = 'active';
        ELSE
            SET NEW.warranty_status = 'expired';
        END IF;
    ELSE
        SET NEW.warranty_status = 'unknown';
    END IF;
END;
//
DELIMITER ;
-- ================================
DELIMITER //

CREATE TRIGGER trg_update_warranty_status_on_update
BEFORE UPDATE ON assets
FOR EACH ROW
BEGIN
    IF NEW.warranty_start IS NOT NULL AND NEW.warranty_end IS NOT NULL THEN
        IF CURDATE() BETWEEN NEW.warranty_start AND NEW.warranty_end THEN
            SET NEW.warranty_status = 'active';
        ELSE
            SET NEW.warranty_status = 'expired';
        END IF;
    ELSE
        SET NEW.warranty_status = 'unknown';
    END IF;
END;
//
DELIMITER ;
-- ========================================
SET GLOBAL event_scheduler = ON;

CREATE EVENT update_warranty_status_daily
ON SCHEDULE EVERY 1 DAY
DO
    UPDATE assets
    SET warranty_status = 
        CASE 
            WHEN warranty_start IS NOT NULL AND warranty_end IS NOT NULL 
                 AND CURDATE() BETWEEN warranty_start AND warranty_end THEN 'active'
            WHEN warranty_start IS NOT NULL AND warranty_end IS NOT NULL 
                 AND CURDATE() > warranty_end THEN 'expired'
            ELSE 'unknown'
        END;
-- =============================





select * FROM assignment_active;
select * FROM assignment_history;
select * from employees;
select * FROM assets;
select * from asset_scrap;

