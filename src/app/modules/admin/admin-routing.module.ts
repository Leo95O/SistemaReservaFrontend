import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BranchManagerComponent } from './pages/branch-manager/branch-manager.component';
// Asegúrate de tener el componente lista de blueprints o el editor
import { BlueprintEditorComponent } from './pages/blueprint-editor/blueprint-editor.component'; 

const routes: Routes = [
  {
    path: '',
    // Si tienes un Layout (AdminLayoutComponent), úsalo aquí. Si no, déjalo sin component y usa solo children.
    children: [
      {
        path: 'branches',
        component: BranchManagerComponent
      },
      {
        path: 'blueprints', // OJO: Sin slash '/' al inicio
        component: BlueprintEditorComponent // O el componente que lista los blueprints
      },
      {
        path: '', 
        redirectTo: 'branches', // Redirige a branches si entran a /admin solo
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