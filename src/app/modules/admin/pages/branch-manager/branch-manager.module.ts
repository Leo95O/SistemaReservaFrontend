import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular'; // 👈 1. IMPORTANTE AQUÍ

import { BranchManagerComponent } from './branch-manager.component';

@NgModule({
  declarations: [BranchManagerComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule, // 👈 2. IMPORTANTE AQUÍ (Sin esto, <ion-content> falla)
    RouterModule.forChild([{ path: '', component: BranchManagerComponent }])
  ]
})
export class BranchManagerModule { }