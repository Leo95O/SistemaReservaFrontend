import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular'; // Usamos Ionic services
import { BlueprintService } from '../../../../core/services/blueprints.service';
import { Blueprint } from '../../../../core/models/blueprint.interface';

@Component({
  selector: 'app-blueprint-list',
  templateUrl: './blueprint-list.component.html',
  styleUrls: ['./blueprint-list.component.scss'],
  standalone: false
})
export class BlueprintListComponent implements OnInit {
  private blueprintService = inject(BlueprintService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);

  blueprints: Blueprint[] = [];
  isLoading = true;

  ngOnInit() {
    this.loadBlueprints();
  }

  ionViewWillEnter() {
    this.loadBlueprints();
  }

  loadBlueprints() {
    this.isLoading = true;
    this.blueprintService.getAll().subscribe({
      next: (data) => {
        this.blueprints = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.presentToast('Error al cargar planos', 'danger');
      }
    });
  }

  createBlueprint() {
    // Redirige al editor existente
    this.router.navigate(['/admin/blueprint-editor', 'new']);
  }

  editBlueprint(id: string) {
    this.router.navigate(['/admin/blueprint-editor', id]);
  }

  async confirmDelete(blueprint: Blueprint) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Plano',
      message: `¿Borrar "${blueprint.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.deleteBlueprint(blueprint.id)
        }
      ]
    });
    await alert.present();
  }

  deleteBlueprint(id: string) {
    this.blueprintService.delete(id).subscribe({
      next: () => {
        this.blueprints = this.blueprints.filter(b => b.id !== id);
        this.presentToast('Plano eliminado', 'success');
      },
      error: () => this.presentToast('No se pudo eliminar', 'danger')
    });
  }

  private async presentToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    toast.present();
  }
}