import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Asset } from '../shared/models/asset';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private apiUrl = `${environment.baseUrl}/assets`;

  constructor(private http: HttpClient) { }

  // Add new asset
  addAsset(asset: Asset): Observable<any> {
    return this.http.post<any>(this.apiUrl, asset);
  }

  // Get all assets
  getAssets(): Observable<Asset[]> {
    return this.http.get<Asset[]>(`${this.apiUrl}`);
  }

  // Get asset by code
  getAssetByCode(code: string): Observable<Asset> {
    return this.http.get<Asset>(`${this.apiUrl}/${code}`);
  }

  // Update asset
  updateAsset(code: string, asset: Asset): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${code}`, asset);
  }

  // Delete asset
  deleteAsset(code: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${code}`);
  }
}

export type { Asset };
