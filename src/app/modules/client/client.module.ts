import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';

// Componentes
import { BookingMapComponent } from './pages/booking-map/booking-map.component';
import { ClientHomeComponent } from './pages/client-home/client-home.component';
import { MyReservationsComponent } from './pages/my-reservations/my-reservations.component';

// Módulos compartidos
import { MapRendererModule } from '../../shared/ui/map-renderer/map-renderer.module';

const routes: Routes = [
  { 
    path: '', 
    children: [
      { path: 'home', component: ClientHomeComponent },
      { path: 'history', component: MyReservationsComponent },
      { path: 'booking/:zoneId', component: BookingMapComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  declarations: [
    BookingMapComponent,
    ClientHomeComponent,
    MyReservationsComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    MapRendererModule,
    RouterModule.forChild(routes)
  ]
})
export class ClientModule { }