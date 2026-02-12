import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // Asegúrate de tener tu environment creado
import { Blueprint, Wall } from '../models/blueprint.interface';

@Injectable({
  providedIn: 'root'
})
export class BlueprintService {
  private http = inject(HttpClient);
  // Asumimos que tu API corre en el puerto definido en environment
  private apiUrl = `${environment.apiUrl}/blueprints`; 

  /**
   * Obtiene todos los planos disponibles (para una lista de selección, por ejemplo)
   */
  getAll(): Observable<Blueprint[]> {
    return this.http.get<Blueprint[]>(this.apiUrl);
  }

  /**
   * Obtiene un plano específico con sus muros (walls)
   */
  getOne(id: string): Observable<Blueprint> {
    return this.http.get<Blueprint>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea un plano vacío (Metadatos)
   */
  create(data: { name: string; description?: string }): Observable<Blueprint> {
    return this.http.post<Blueprint>(this.apiUrl, data);
  }

  /**
   * Guarda la geometría de los muros y una miniatura visual
   */
  updateLayout(id: string, walls: Wall[], previewImageUrl: string): Observable<Blueprint> {
    const payload = { 
      walls, 
      previewImageUrl 
    };
    return this.http.patch<Blueprint>(`${this.apiUrl}/${id}`, payload);
  }
}