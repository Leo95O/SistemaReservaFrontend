import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
  path: 'playground',
  loadChildren: () => import('./modules/admin/pages/map-playground/map-playground.module').then(m => m.MapPlaygroundModule)
  }
];





@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
