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
    SET status = 'available'
    WHERE asset_code = OLD.asset_code;
END;
//
DELIMITER ;
