import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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
}

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private apiUrl = `${environment.baseUrl}/assets`;

  constructor(private http: HttpClient) { }

  getAssets(): Observable<Asset[]> {
    return this.http.get<Asset[]>(this.apiUrl);
  }

  getAssetByCode(code: string): Observable<Asset | null> {
    return this.http.get<Asset | null>(`${this.apiUrl}/${code}`).pipe(
      catchError(err => {
        if (err.status === 404) return of(null); // treat 404 as new asset
        throw err;
      })
    );
  }

  addAsset(asset: Asset): Observable<any> {
    return this.http.post(this.apiUrl + '/assign', asset);
  }

  addNewAsset(asset: Asset): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, asset); // new for adding assets  not assigning the asset it is using the add assets button
  }


  updateAsset(code: string, asset: Asset): Observable<any> {
    return this.http.put(`${this.apiUrl}/${code}`, asset);
  }
}
