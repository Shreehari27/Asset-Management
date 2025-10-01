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
    status ENUM('active','inactive','suspended') DEFAULT 'active',
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
    assigned_by VARCHAR(20) NOT NULL,   -- IT person assigning
    assign_date DATE NOT NULL,
    assign_remark TEXT,
    FOREIGN KEY (asset_code) REFERENCES assets(asset_code),
    FOREIGN KEY (emp_code) REFERENCES employees(emp_code),
    FOREIGN KEY (assigned_by) REFERENCES employees(emp_code)
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




-- records for my refernece
-- Insert Employees
INSERT INTO employees (emp_code, name, email, isIT, status) VALUES
('E001', 'Shreehari',   'shreehari@example.com',   0, 'active'),
('E002', 'Kanimozhi',   'kanimozhi@example.com',   1, 'active'), -- IT Staff
('E003', 'Vishwa',      'vishwa@example.com',      0, 'active'),
('E004', 'Karthikeyan', 'karthikeyan@example.com', 1, 'active'), -- IT Staff
('E005', 'Padmashri',   'padmashri@example.com',   0, 'active'),
('E006', 'Barath',      'barath@example.com',      0, 'active'),
('E007', 'Ashlyn',      'ashlyn@example.com',      0, 'active'),
('E008', 'Sherlyn',     'sherlyn@example.com',     0, 'active'),
('E009', 'Vishal',      'vishal@example.com',      0, 'active'),
('E010', 'Kaushik',     'kaushik@example.com',     1, 'active'); -- IT Staff

-- Insert Assets
INSERT INTO assets (asset_code, serial_number, asset_type, asset_brand, status) VALUES
('A001', 'SN12345', 'Laptop', 'Dell', 'available'),
('A002', 'SN67890', 'Monitor', 'HP',  'available'),
('A003', 'SN54321', 'Keyboard', 'Logitech', 'available');

select * FROM assignment_active;
select * FROM assignment_history;

