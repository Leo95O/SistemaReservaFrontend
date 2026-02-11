import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router'; // Necesario para la navegación móvil

// 1. Importaciones de Ionic
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

// 2. Importaciones de FontAwesome
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
// Importamos los paquetes completos de iconos (puedes importar solo lo que uses luego)
import { fas } from '@fortawesome/pro-solid-svg-icons';
import { fad } from '@fortawesome/pro-duotone-svg-icons';
import { far } from '@fortawesome/pro-regular-svg-icons';
import { fal } from '@fortawesome/pro-light-svg-icons';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app'; // Tu componente principal

@NgModule({
  declarations: [
    App
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(), // <--- AQUI INICIAMOS IONIC
    AppRoutingModule,
    FontAwesomeModule      // <--- AQUI INICIAMOS FONTAWESOME
  ],
  providers: [
    // Esto hace que la navegación se sienta como una app nativa (guarda el estado de las vistas)
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [App]
})
export class AppModule {
  // Constructor para cargar los iconos en toda la app
  constructor(library: FaIconLibrary) {
    // Añadimos TODOS los iconos a la librería (Solid, Duotone, Regular, Light)
    // Así podrás usar cualquier icono pro en tu HTML sin importarlo uno por uno
    library.addIconPacks(fas, fad, far, fal);
  }
}