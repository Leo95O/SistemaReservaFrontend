import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular';
import { ZoneService } from '../../../../core/services/zone.service';
import { ReservationsService } from '../../../../core/services/reservations.service';
import { AuthService } from '../../../../core/services/auth.service'; // ✅ Nuevo
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
  private authService = inject(AuthService); // ✅ Nuevo
  private route = inject(ActivatedRoute);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController); // Solo para confirmar, no para pedir datos

  // Estado UI
  currentZone: Zone | null = null;
  isLoading = true;
  
  // Estado Lógico
  selectedDate: string = new Date().toISOString(); 
  occupiedTableIds: string[] = []; 
  selectedTables: Table[] = []; 

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
        this.checkAvailability();
      },
      error: () => this.isLoading = false
    });
  }

  onDateTimeChange(event: any) {
    this.selectedDate = event.detail.value;
    this.selectedTables = []; 
    this.checkAvailability();
  }

  checkAvailability() {
    if (!this.currentZone) return;
    this.resService.getAvailability(this.currentZone.id, this.selectedDate).subscribe({
      next: (occupiedIds) => this.occupiedTableIds = occupiedIds,
      error: () => console.error('Error verificando disponibilidad')
    });
  }

  onTableSelect(table: Table) {
    if (this.occupiedTableIds.includes(table.id)) return;
    const index = this.selectedTables.findIndex(t => t.id === table.id);
    if (index >= 0) this.selectedTables.splice(index, 1);
    else this.selectedTables.push(table);
    this.selectedTables = [...this.selectedTables]; 
  }

  // --- REFACTOR: Usar datos del usuario logueado ---
  async confirmBooking() {
    if (this.selectedTables.length === 0) return;

    // Obtenemos el usuario actual
    const user = this.authService.currentUser();
    
    if (!user) {
      this.presentToast('⚠️ Debes iniciar sesión para reservar', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Confirmar Reserva',
      subHeader: `Para: ${user.fullName}`,
      message: `Mesas: ${this.selectedTables.length} | Personas: ${this.totalCapacity}`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: '¡Reservar!',
          handler: () => {
            this.createReservation(user);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  createReservation(user: any) {
    if (!this.currentZone) return;

    const payload = {
      zoneId: this.currentZone.id,
      tableIds: this.selectedTableIds,
      datetime: this.selectedDate,
      // Backend debe priorizar el User del Token, pero enviamos esto por si acaso
      customerName: user.fullName, 
      customerEmail: user.email
    };

    this.resService.create(payload).subscribe({
      next: () => {
        this.presentToast('✅ ¡Reserva confirmada!', 'success');
        this.selectedTables = [];
        this.checkAvailability(); 
      },
      error: () => this.presentToast('❌ Error al reservar.', 'danger')
    });
  }

  private async presentToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color, position: 'bottom' });
    await toast.present();
  }
}