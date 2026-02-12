import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, ToastController, ModalController } from '@ionic/angular';
import { ZoneService } from '../../../../core/services/zone.service';
import { ReservationsService } from '../../../../core/services/reservations.service';
import { Zone } from '../../../../core/models/zone.interface';
import { Table } from '../../../../core/models/table.interface';

@Component({
  selector: 'app-booking-map',
  standalone: false,
  templateUrl: './booking-map.component.html'
})
export class BookingMapComponent implements OnInit {

  // Inyecciones
  private zoneService = inject(ZoneService);
  private resService = inject(ReservationsService);
  private route = inject(ActivatedRoute);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  // Estado UI
  currentZone: Zone | null = null;
  isLoading = true;
  
  // Estado Lógico
  selectedDate: string = new Date().toISOString(); // Default: Ahora
  occupiedTableIds: string[] = []; // IDs rojos
  selectedTables: Table[] = []; // Objetos mesa seleccionados (Verdes)

  get totalCapacity(): number {
    return this.selectedTables.reduce((acc, t) => acc + (t.seats || 4), 0);
  }

  get selectedTableIds(): string[] {
    return this.selectedTables.map(t => t.id);
  }

  ngOnInit() {
    const zoneId = this.route.snapshot.paramMap.get('zoneId');
    if (zoneId) {
      this.loadZone(zoneId);
    }
  }

  loadZone(id: string) {
    this.isLoading = true;
    this.zoneService.getZone(id).subscribe({
      next: (zone) => {
        this.currentZone = zone;
        this.isLoading = false;
        this.checkAvailability(); // Consultar disponibilidad inicial
      },
      error: () => this.isLoading = false
    });
  }

  // 1. CAMBIO DE FECHA -> Consultar Disponibilidad
  onDateTimeChange(event: any) {
    this.selectedDate = event.detail.value;
    this.selectedTables = []; // Limpiar selección al cambiar hora
    this.checkAvailability();
  }

  checkAvailability() {
    if (!this.currentZone) return;
    
    // Llamada al servicio
    this.resService.getAvailability(this.currentZone.id, this.selectedDate).subscribe({
      next: (occupiedIds) => {
        this.occupiedTableIds = occupiedIds;
      },
      error: () => console.error('Error verificando disponibilidad')
    });
  }

  // 2. SELECCIÓN DE MESA (Click en Mapa)
  onTableSelect(table: Table) {
    // Si está ocupada, el mapa ya no emite el evento (lógica en renderer), pero por seguridad:
    if (this.occupiedTableIds.includes(table.id)) return;

    const index = this.selectedTables.findIndex(t => t.id === table.id);
    
    if (index >= 0) {
      // Deseleccionar
      this.selectedTables.splice(index, 1);
    } else {
      // Seleccionar
      this.selectedTables.push(table);
    }
    // Forzamos actualización de referencia para que Angular detecte cambios en inputs getters
    this.selectedTables = [...this.selectedTables]; 
  }

  // 3. CONFIRMAR RESERVA
  async confirmBooking() {
    if (this.selectedTables.length === 0) return;

    const alert = await this.alertCtrl.create({
      header: 'Confirmar Reserva',
      subHeader: `${this.totalCapacity} Personas - ${this.selectedTables.length} Mesas`,
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Tu Nombre' },
        { name: 'email', type: 'email', placeholder: 'Tu Correo' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Reservar',
          handler: (data) => {
            if (!data.name || !data.email) return false;
            this.createReservation(data);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  createReservation(customerData: any) {
    if (!this.currentZone) return;

    const payload = {
      zoneId: this.currentZone.id,
      tableIds: this.selectedTableIds,
      datetime: this.selectedDate,
      customerName: customerData.name,
      customerEmail: customerData.email
    };

    this.resService.create(payload).subscribe({
      next: () => {
        this.presentToast('✅ ¡Reserva confirmada! Te esperamos.', 'success');
        this.selectedTables = [];
        this.checkAvailability(); // Refrescar para verlas rojas
      },
      error: () => this.presentToast('❌ Error al reservar. Intenta de nuevo.', 'danger')
    });
  }

  private async presentToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color, position: 'bottom' });
    await toast.present();
  }
}