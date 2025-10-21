export interface Asset {
  asset_code: string;
  serial_number: string;
  asset_type: string;
  asset_brand?: string;
  processor?: string;
  charger_serial?: string;
  warranty_start?: string;
  warranty_end?: string;
  emp_code?: string;
  assigned_by?: string;
  psd_id?: string;
  assign_date?: string;
  assign_remark?: string;
  parent_asset_code?: string;
  cable_type?: string;
  status?: string;
}
