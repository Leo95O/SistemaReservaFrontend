import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { MapRendererModule } from '../../shared/ui/map-renderer/map-renderer.module';
import { BookingMapComponent } from '../admin/pages/booking-map/booking-map.component';
// Importa aquí tus componentes BranchSelector y ZoneSelector cuando los crees

const routes: Routes = [
  // { path: '', component: BranchSelectorComponent }, // Futuro
  // { path: 'zones/:branchId', component: ZoneSelectorComponent }, // Futuro
  { path: 'book/:zoneId', component: BookingMapComponent } // La ruta Core ahora
];

@NgModule({
  declarations: [BookingMapComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    MapRendererModule, // Vital para el mapa
    RouterModule.forChild(routes)
  ]
})
export class ClientModule { }