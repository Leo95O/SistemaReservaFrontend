import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // 1. Redirección inicial (Por ahora al gestor de sucursales, que es el "Home" del admin)
  {
    path: '',
    redirectTo: 'admin/branches', 
    pathMatch: 'full'
  },

  // 2. Rutas de ADMINISTRACIÓN
  {
    path: 'admin/branches',
    loadChildren: () => import('./modules/admin/pages/branch-manager/branch-manager.module').then(m => m.BranchManagerModule)
  },
  {
    path: 'admin/blueprint-editor/:id', // Recibe ID para editar o 'new'
    loadChildren: () => import('./modules/admin/pages/blueprint-editor/blueprint-editor.module').then(m => m.BlueprintEditorModule)
  },
  {
    path: 'admin/furniture-editor/:id', // Recibe ID de la ZONA REAL
    loadChildren: () => import('./modules/admin/pages/furniture-editor/furniture-editor.module').then(m => m.FurnitureEditorModule)
  },
  {
  path: 'client',
  loadChildren: () => import('./modules/client/client.module').then(m => m.ClientModule)
  },

  // 3. Ruta Comodín (Opcional, por si escriben mal la URL)
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