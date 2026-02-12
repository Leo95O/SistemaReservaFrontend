import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '', // Estando ya en /admin
    children: [
      {
        path: 'branches',
        loadChildren: () => import('./pages/branch-manager/branch-manager.module').then(m => m.BranchManagerModule)
      },
      {
        path: 'blueprint-editor/:id',
        loadChildren: () => import('./pages/blueprint-editor/blueprint-editor.module').then(m => m.BlueprintEditorModule)
      },
      {
        path: 'furniture-editor/:id',
        loadChildren: () => import('./pages/furniture-editor/furniture-editor.module').then(m => m.FurnitureEditorModule)
      },
      {
        path: '',
        redirectTo: 'branches',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }