import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    children: [
      // Redirección por defecto (opcional, por si entran a /admin directo)
      {
        path: '',
        redirectTo: 'branches',
        pathMatch: 'full'
      },
      {
        path: 'branches',
        loadChildren: () => import('./pages/branch-manager/branch-manager.module').then(m => m.BranchManagerModule)
      },
      // 👇 ESTA ES LA NUEVA RUTA QUE AGREGAMOS
      {
        path: 'blueprints',
        loadChildren: () => import('./pages/blueprint-list/blueprint-list.module').then(m => m.BlueprintListModule)
      },
      // 👆
      {
        path: 'blueprint-editor/:id',
        loadChildren: () => import('./pages/blueprint-editor/blueprint-editor.module').then(m => m.BlueprintEditorModule)
      },
      {
        path: 'furniture-editor/:zoneId', // Ojo: verifica si tu parámetro es :id o :zoneId en tu código
        loadChildren: () => import('./pages/furniture-editor/furniture-editor.module').then(m => m.FurnitureEditorModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }