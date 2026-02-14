import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Blueprint } from '../models/blueprint.interface';

@Injectable({
  providedIn: 'root'
})
export class BlueprintService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/blueprints`;

  getAll(): Observable<Blueprint[]> {
    return this.http.get<Blueprint[]>(this.apiUrl);
  }

  getOne(id: string): Observable<Blueprint> {
    return this.http.get<Blueprint>(`${this.apiUrl}/${id}`);
  }

  // ACTUALIZADO: Acepta width y height
  create(data: { name: string; description?: string; width: number; height: number }): Observable<Blueprint> {
    return this.http.post<Blueprint>(this.apiUrl, data);
  }

  updateLayout(id: string, payload: any): Observable<Blueprint> {
    return this.http.patch<Blueprint>(`${this.apiUrl}/${id}`, payload);
  }

  // NUEVO: Método para borrar
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}