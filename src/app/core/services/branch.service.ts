import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Branch } from '../models/branch.interface';

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/branches`;

  /**
   * Obtiene todas las sucursales con sus zonas
   */
  getAll(): Observable<Branch[]> {
    return this.http.get<Branch[]>(this.apiUrl);
  }

  /**
   * Obtiene una sucursal específica por ID (útil para el detalle)
   */
  getOne(id: string): Observable<Branch> {
    return this.http.get<Branch>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea una nueva sucursal
   */
  create(branch: { name: string; address: string; imageUrl?: string }): Observable<Branch> {
    return this.http.post<Branch>(this.apiUrl, branch);
  }
}