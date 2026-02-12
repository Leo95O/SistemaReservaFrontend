import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importamos las rutas que ya creaste
import { AdminRoutingModule } from './admin-routing.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AdminRoutingModule // 👈 ESTO ES LO QUE FALTABA: Conectar las rutas al módulo
  ]
})
export class AdminModule { }