import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular'; // Solución al error #3

// Asegúrate de que este import coincida con el nombre de tu archivo de componente
import { BlueprintListComponent } from './blueprint-list.component';

const routes: Routes = [
  {
    path: '',
    component: BlueprintListComponent // Solución al error #4 (Ruta por defecto)
  }
];

@NgModule({
  declarations: [
    BlueprintListComponent // Solución al error #2 (Declaración)
  ],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes) // Configuración de Lazy Loading
  ]
})
export class BlueprintListModule { }