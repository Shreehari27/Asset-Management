export interface Assignment {
  id: number;
  psd_id: string;
  asset_code: string;
  asset_type: string;
  asset_brand: string;
  serial_number: string;
  emp_code: string;
  assigned_to_name?: string;
  assigned_to_email?: string;
  assigned_by: string;
  assigned_by_name?: string;
  assigned_by_email?: string;
  assign_date: string;
  assign_remark?: string;
  return_date?: string;
  return_remark?: string;
  returned_to?: string;
  returned_to_name?: string;
  employee_name?: string;
}
