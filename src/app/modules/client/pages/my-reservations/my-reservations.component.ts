import { Component, OnInit, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ReservationsService } from '../../../../core/services/reservations.service';
import { Reservation } from '../../../../core/models/reservation.interface';

@Component({
  selector: 'app-my-reservations',
  standalone: false,
  templateUrl: './my-reservations.component.html'
})
export class MyReservationsComponent implements OnInit {
  private resService = inject(ReservationsService);

  reservations$: Observable<Reservation[]> = of([]);

  ngOnInit() {
    this.reservations$ = this.resService.getMyReservations().pipe(
      catchError(err => {
        console.error('Error cargando historial', err);
        return of([]); 
      })
    );
  }

  // Helper para el color del badge según estado
  getStatusColor(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'success'; // Verde
      case 'PENDING': return 'warning';   // Amarillo
      case 'CANCELLED': return 'danger';  // Rojo
      default: return 'medium';
    }
  }
}