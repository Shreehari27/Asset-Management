export interface Asset {
  asset_code: string;
  serial_number: string;
  asset_type: string;
  asset_brand?: string;
  processor?: string;
  charger_serial?: string;
  warranty_start?: string;
  warranty_end?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}
