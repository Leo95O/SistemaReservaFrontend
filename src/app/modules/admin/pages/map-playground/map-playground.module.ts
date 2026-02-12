import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { MapPlaygroundComponent } from './map-playground.component';
import { MapRendererModule } from '../../../../shared/ui/map-renderer/map-renderer.module'; // Importa tu UI

@NgModule({
  declarations: [MapPlaygroundComponent],
  imports: [
    CommonModule,
    IonicModule,
    MapRendererModule, // <--- Importante
    RouterModule.forChild([{ path: '', component: MapPlaygroundComponent }])
  ]
})
export class MapPlaygroundModule { }