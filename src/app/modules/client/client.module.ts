import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

// 1. Importamos el Módulo Compartido del Mapa (VITAL)
import { MapRendererModule } from '../../shared/ui/map-renderer/map-renderer.module';

// 2. Importamos el Componente (Ahora en su nueva ubicación correcta)
import { BookingMapComponent } from './pages/booking-map/booking-map.component';

const routes: Routes = [
  // Ruta relativa: /client/book/:zoneId
  {
    path: 'book/:zoneId',
    component: BookingMapComponent
  }
];

@NgModule({
  declarations: [
    BookingMapComponent // Declaramos el componente aquí
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    MapRendererModule, // Importamos el mapa
    RouterModule.forChild(routes)
  ]
})
export class ClientModule { }