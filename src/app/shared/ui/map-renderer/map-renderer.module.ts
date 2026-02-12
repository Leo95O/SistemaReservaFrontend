import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapRendererComponent } from './map-renderer.component';

@NgModule({
  declarations: [MapRendererComponent],
  imports: [
    CommonModule
  ],
  exports: [MapRendererComponent]
})
export class MapRendererModule { }