import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { BlueprintEditorComponent } from './blueprint-editor.component';

@NgModule({
  declarations: [BlueprintEditorComponent],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: BlueprintEditorComponent }])
  ]
})
export class BlueprintEditorModule { }