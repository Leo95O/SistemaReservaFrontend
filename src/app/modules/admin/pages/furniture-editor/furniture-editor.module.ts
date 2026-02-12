import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FurnitureEditorComponent } from './furniture-editor.component';
import { MapRendererModule } from '../../../../shared/ui/map-renderer/map-renderer.module'; // 👈 Vital para ver el mapa

@NgModule({
  declarations: [FurnitureEditorComponent],
  imports: [
    CommonModule,
    IonicModule,
    MapRendererModule,
    RouterModule.forChild([{ path: '', component: FurnitureEditorComponent }])
  ]
})
export class FurnitureEditorModule { }