import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { BranchService } from '../../../../core/services/branch.service';
import { BlueprintService } from '../../../../core/services/blueprints.service'; // Asegúrate de tenerlo
import { ZoneService } from '../../../../core/services/zone.service';
import { Branch } from '../../../../core/models/branch.interface';
import { Blueprint } from '../../../../core/models/blueprint.interface';

@Component({
  selector: 'app-branch-manager',
  standalone: false,
  templateUrl: './branch-manager.component.html'
})
export class BranchManagerComponent implements OnInit {

  // Inyecciones
  private branchService = inject(BranchService);
  private blueprintService = inject(BlueprintService);
  private zoneService = inject(ZoneService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  // Estado
  branches: Branch[] = [];
  selectedBranch: Branch | null = null; // Si es null, mostramos lista. Si tiene valor, mostramos detalle.
  availableBlueprints: Blueprint[] = [];
  isLoading = true;

  constructor() {}

  ngOnInit() {
    this.loadBranches();
    this.loadBlueprints(); // Precargamos los planos disponibles
  }

  // --- CARGA DE DATOS ---
  loadBranches() {
    this.isLoading = true;
    this.branchService.getAll().subscribe({
      next: (data) => {
        this.branches = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.presentToast('Error al cargar sucursales', 'danger');
      }
    });
  }

  loadBlueprints() {
    this.blueprintService.getAll().subscribe(data => this.availableBlueprints = data);
  }

  // --- NAVEGACIÓN ---
  selectBranch(branch: Branch) {
    this.selectedBranch = branch;
    // Opcional: Podrías recargar la sucursal específica aquí si getAll no trae las zonas completas
  }

  goBack() {
    this.selectedBranch = null;
  }

  goToFurnitureEditor(zoneId: string) {
    // Navegamos al editor de mesas pasando el ID de la ZONA REAL
    this.router.navigate(['/admin/furniture-editor', zoneId]);
  }

  // --- ACCIONES DE CREACIÓN ---

    async openCreateBranchModal() {
     const alert = await this.alertCtrl.create({
      header: 'Nueva Sucursal',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Nombre (ej: Sede Central)' },
        { name: 'address', type: 'text', placeholder: 'Dirección' },
        { name: 'imageUrl', type: 'url', placeholder: 'URL de Imagen (Opcional)' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: (data) => {
            // 1. Validación básica (Bloqueo si faltan requeridos)
            if (!data.name || !data.address) return false;

            // 2. Lógica de Sanitización (Interceptamos el valor)
            // Trim() elimina espacios accidentales al inicio/final.
            // Si queda vacío, enviamos null explícitamente.
            const cleanImageUrl = (data.imageUrl && data.imageUrl.trim() !== '') 
                                  ? data.imageUrl.trim() 
                                  : null;

            const payload = {
              name: data.name,
              address: data.address,
              imageUrl: cleanImageUrl
            };

            // 3. Enviamos el payload ya limpio al servicio
            this.createBranch(payload);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  createBranch(data: any) {
    this.branchService.create(data).subscribe({
      next: (newBranch) => {
        this.branches.push(newBranch);
        this.presentToast('Sucursal creada exitosamente', 'success');
      },
      error: () => this.presentToast('Error al crear sucursal', 'danger')
    });
  }

  async openCreateZoneModal() {
    if (!this.selectedBranch) return;

    // Generamos inputs dinámicos (Radio buttons) para los Blueprints
    const inputs: any[] = this.availableBlueprints.map(bp => ({
      type: 'radio',
      label: bp.name || 'Sin Nombre',
      value: bp.id
    }));

    if (inputs.length === 0) {
      this.presentToast('No hay planos base creados. Ve al Editor de Muros primero.', 'warning');
      return;
    }

    // 1. Elegir Blueprint
    const alertSelect = await this.alertCtrl.create({
      header: 'Selecciona un Plano Base',
      inputs: inputs,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente',
          handler: (blueprintId) => {
            if (blueprintId) this.askZoneName(blueprintId);
          }
        }
      ]
    });
    await alertSelect.present();
  }

  // 2. Dar nombre a la Zona
  async askZoneName(blueprintId: string) {
    const alertName = await this.alertCtrl.create({
      header: 'Nombrar Zona',
      message: 'Ej: Terraza, Salón Principal, VIP',
      inputs: [{ name: 'name', type: 'text', placeholder: 'Nombre de la zona' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear Zona',
          handler: (data) => {
            if (data.name) this.instantiateZone(blueprintId, data.name);
          }
        }
      ]
    });
    await alertName.present();
  }

  // 3. Llamada al Backend (Instanciación)
  instantiateZone(blueprintId: string, name: string) {
    if (!this.selectedBranch) return;

    this.zoneService.instantiateBlueprint(blueprintId, this.selectedBranch.id, name).subscribe({
      next: (newZone) => {
        // Actualizamos la lista localmente
        if (!this.selectedBranch!.zones) this.selectedBranch!.zones = [];
        this.selectedBranch!.zones.push(newZone);
        this.presentToast('✅ Zona creada correctamente', 'success');
      },
      error: (err) => {
        console.error(err);
        this.presentToast('Error al crear la zona', 'danger');
      }
    });
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    await toast.present();
  }
}