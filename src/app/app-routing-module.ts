import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // Redirección inicial (Admin o Client según prefieras, por ahora Admin)
  {
    path: '',
    redirectTo: 'admin/branches',
    pathMatch: 'full'
  },

  // 1. MÓDULO ADMIN (Privado)
  {
    path: 'admin/branches',
    loadChildren: () => import('./modules/admin/pages/branch-manager/branch-manager.module').then(m => m.BranchManagerModule)
  },
  {
    path: 'admin/blueprint-editor/:id',
    loadChildren: () => import('./modules/admin/pages/blueprint-editor/blueprint-editor.module').then(m => m.BlueprintEditorModule)
  },
  {
    path: 'admin/furniture-editor/:id',
    loadChildren: () => import('./modules/admin/pages/furniture-editor/furniture-editor.module').then(m => m.FurnitureEditorModule)
  },

  // 2. MÓDULO CLIENTE (Público) - ¡NUEVA RUTA!
  {
    path: 'client',
    loadChildren: () => import('./modules/client/client.module').then(m => m.ClientModule)
  },

  // Fallback
  {
    path: '**',
    redirectTo: 'admin/branches'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }