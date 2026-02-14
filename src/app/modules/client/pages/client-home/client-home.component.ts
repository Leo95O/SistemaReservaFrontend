import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { BranchService } from '../../../../core/services/branch.service';
import { ZoneService } from '../../../../core/services/zone.service';
import { Branch } from '../../../../core/models/branch.interface';
import { Zone } from '../../../../core/models/zone.interface';

@Component({
  selector: 'app-client-home',
  standalone: false,
  templateUrl: './client-home.component.html',

})
export class ClientHomeComponent implements OnInit {
  private branchService = inject(BranchService);
  private zoneService = inject(ZoneService);
  private router = inject(Router);

  // Streams de datos (Observables)
  branches$: Observable<Branch[]> = of([]); 
  zones$: Observable<Zone[]> = of([]);

  // Estado local para UI
  selectedBranchId: string | null = null;

  ngOnInit() {
    // Carga inicial de sucursales
    this.branches$ = this.branchService.getAll().pipe(
      catchError(err => {
        console.error('Error cargando sedes', err);
        return of([]); // Retorna array vacío si falla
      })
    );
  }

  onSelectBranch(branch: Branch) {
    if (this.selectedBranchId === branch.id) return; // Evitar recarga innecesaria

    this.selectedBranchId = branch.id;
    
    // Cargar zonas de la sucursal seleccionada (Lazy Load)
    this.zones$ = this.zoneService.getZonesByBranch(branch.id).pipe(
      catchError(() => of([]))
    );
  }

  onSelectZone(zone: Zone) {
    // Navegación a la reserva
    this.router.navigate(['/client/booking', zone.id]);
  }
}