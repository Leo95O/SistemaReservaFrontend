import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'playground', // Opcional: Para que entre directo al abrir la app
    pathMatch: 'full'
  },
  {
  path: 'blueprint-editor',
  loadChildren: () => import('./modules/admin/pages/blueprint-editor/blueprint-editor.module').then(m => m.BlueprintEditorModule)
}
];





@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
