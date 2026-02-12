import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';
import { ZoneService } from '../../../../core/services/zone.service';
import { Zone } from '../../../../core/models/zone.interface';
import { Table } from '../../../../core/models/table.interface';

@Component({
  selector: 'app-furniture-editor',
  standalone: false,
  templateUrl: './furniture-editor.component.html'
})
export class FurnitureEditorComponent implements OnInit, OnDestroy {

  // --- INYECCIONES ---
  private zoneService = inject(ZoneService);
  private route = inject(ActivatedRoute);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);

  // --- ESTADO ---
  currentZone: Zone | null = null;
  isEditing = false; // Controla si el mapa es interactivo (mode='admin') o solo lectura (mode='client')
  isLoading = true;
  zoneId: string | null = null;

  constructor() {}

  ngOnInit() {
    this.zoneId = this.route.snapshot.paramMap.get('id');
    if (this.zoneId) {
      this.loadZoneData(this.zoneId);
    } else {
      this.isLoading = false;
      this.presentToast('Error: ID de zona no válido', 'danger');
    }
  }

  // 1. CARGA INICIAL
  private loadZoneData(id: string) {
    this.isLoading = true;
    this.zoneService.getZone(id).subscribe({
      next: (zone) => {
        this.currentZone = zone;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.presentToast('Error al cargar la zona', 'danger');
      }
    });
  }

  // 2. ACTIVAR MODO EDICIÓN (LOCK)
  async toggleEditMode() {
    if (!this.currentZone || !this.zoneId) return;

    if (!this.isEditing) {
      // INTENTAR BLOQUEAR (LOCK)
      const loading = await this.loadingCtrl.create({ message: 'Solicitando permisos de edición...' });
      await loading.present();

      this.zoneService.lockZone(this.zoneId).subscribe({
        next: () => {
          loading.dismiss();
          this.isEditing = true;
          this.presentToast('Modo edición activado. Zona bloqueada para otros.', 'success');
        },
        error: (err) => {
          loading.dismiss();
          if (err.status === 409) {
            this.presentAlert('Zona Bloqueada', 'Otro administrador está editando esta zona actualmente.');
          } else {
            this.presentToast('No se pudo activar el modo edición.', 'danger');
          }
        }
      });

    } else {
      // SALIR DEL MODO EDICIÓN (Preguntar si guardar)
      this.confirmExitEdit();
    }
  }

  // 3. GUARDAR CAMBIOS Y SALIR (UNLOCK)
  async saveAndExit() {
    if (!this.currentZone || !this.zoneId) return;

    const loading = await this.loadingCtrl.create({ message: 'Guardando distribución...' });
    await loading.present();

    // Enviamos el array COMPLETO de mesas
    this.zoneService.saveLayout(this.zoneId, this.currentZone.tables || []).subscribe({
      next: () => {
        // Una vez guardado, desbloqueamos
        this.unlockAndReset(loading, 'Distribución guardada correctamente.');
      },
      error: (err) => {
        loading.dismiss();
        console.error(err);
        this.presentToast('Error al guardar. Intenta nuevamente.', 'danger');
      }
    });
  }

  // 4. CANCELAR CAMBIOS (UNLOCK SIN GUARDAR)
  async cancelEdit() {
    if (!this.zoneId) return;
    const loading = await this.loadingCtrl.create({ message: 'Cancelando...' });
    await loading.present();
    
    // Recargamos los datos originales para deshacer cambios visuales
    this.loadZoneData(this.zoneId); 
    this.unlockAndReset(loading, 'Edición cancelada.');
  }

  private unlockAndReset(loading: HTMLIonLoadingElement, msg: string) {
    if (!this.zoneId) return;

    this.zoneService.unlockZone(this.zoneId).subscribe({
      next: () => {
        loading.dismiss();
        this.isEditing = false;
        this.presentToast(msg, 'success');
      },
      error: () => {
        loading.dismiss();
        this.isEditing = false; // Forzamos salida local aunque falle red
        this.presentToast('Advertencia: No se pudo desbloquear la zona en el servidor.', 'warning');
      }
    });
  }

  // --- MANEJO DEL MAPA (DRAG & DROP) ---

  onDragStart(event: DragEvent, shape: 'rect' | 'circle', seats: number, w: number, h: number) {
    if (!this.isEditing) return; // Solo permitir arrastrar si estamos editando
    if (event.dataTransfer) {
      const payload = { shape, seats, width: w, height: h };
      event.dataTransfer.setData('application/json', JSON.stringify(payload));
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  onTableAdded(newTable: Table) {
    if (!this.isEditing || !this.currentZone) return;
    
    const count = (this.currentZone.tables?.length || 0) + 1;
    newTable.code = `M-${count}`;

    this.currentZone = {
      ...this.currentZone,
      tables: [...(this.currentZone.tables || []), newTable]
    };
  }

  onTableUpdated(updatedTable: Table) {
    if (!this.isEditing || !this.currentZone?.tables) return;

    this.currentZone = {
      ...this.currentZone,
      tables: this.currentZone.tables.map(t => t.id === updatedTable.id ? updatedTable : t)
    };
  }

  onTableSelected(table: Table) {
    if (this.isEditing) {
      this.presentActionSheet(table); // Mostrar opciones (Borrar, Rotar)
    }
  }

  // --- UTILIDADES UI ---

  async presentActionSheet(table: Table) {
    const alert = await this.alertCtrl.create({
      header: `Mesa ${table.code}`,
      buttons: [
        {
          text: 'Rotar +45°',
          handler: () => this.rotateTable(table, 45)
        },
        {
          text: 'Eliminar Mesa',
          role: 'destructive',
          handler: () => this.deleteTable(table.id)
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  rotateTable(table: Table, angle: number) {
    if (!this.currentZone?.tables) return;
    const newRotation = (table.rotation || 0) + angle;
    
    const updated = { ...table, rotation: newRotation };
    this.onTableUpdated(updated);
  }

  deleteTable(tableId: string) {
    if (!this.currentZone?.tables) return;
    this.currentZone = {
      ...this.currentZone,
      tables: this.currentZone.tables.filter(t => t.id !== tableId)
    };
  }

  async confirmExitEdit() {
    const alert = await this.alertCtrl.create({
      header: 'Salir de Edición',
      message: '¿Quieres guardar los cambios antes de salir?',
      buttons: [
        { text: 'Descartar', role: 'cancel', handler: () => this.cancelEdit() },
        { text: 'Guardar', handler: () => this.saveAndExit() }
      ]
    });
    await alert.present();
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    await toast.present();
  }

  private async presentAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }

  // Liberar bloqueo si el usuario cierra la pestaña o navega fuera
  @HostListener('window:beforeunload')
  ngOnDestroy() {
    if (this.isEditing && this.zoneId) {
      // Intentamos desbloquear "fire and forget" usando sendBeacon si es posible, 
      // o suscripción simple (aunque al destruir componente puede no completarse).
      this.zoneService.unlockZone(this.zoneId).subscribe();
    }
  }
}