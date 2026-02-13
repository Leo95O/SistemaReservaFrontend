import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

// 1. Importaciones de Ionic
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

// 2. Importaciones de FontAwesome
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/pro-solid-svg-icons';
import { fad } from '@fortawesome/pro-duotone-svg-icons';
import { far } from '@fortawesome/pro-regular-svg-icons';
import { fal } from '@fortawesome/pro-light-svg-icons';

// 👇 3. IMPORTAR provideHttpClient (CRÍTICO PARA SOLUCIONAR EL ERROR)
import { provideHttpClient } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

@NgModule({
  declarations: [
    App
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    FontAwesomeModule
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    
    // 👇 4. AGREGAR EL PROVEEDOR AQUÍ
    provideHttpClient()
  ],
  bootstrap: [App]
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas, fad, far, fal);
  }
}