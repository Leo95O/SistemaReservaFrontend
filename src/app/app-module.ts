import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // ✅ Importar withInterceptors

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

// FontAwesome
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/pro-solid-svg-icons';
import { fad } from '@fortawesome/pro-duotone-svg-icons';
import { far } from '@fortawesome/pro-regular-svg-icons';
import { fal } from '@fortawesome/pro-light-svg-icons';

import { AppRoutingModule } from './app-routing-module';

// 👇 CORRECCIÓN 1: Importamos la clase real "App" del archivo "./app"
import { App } from './app'; 
// 👇 CORRECCIÓN 2: Importamos el interceptor desde su ubicación correcta
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

@NgModule({
  declarations: [
    App // ✅ Declaramos App
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    FontAwesomeModule
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    
    // 👇 CORRECCIÓN 3: Registramos el interceptor aquí
    provideHttpClient(withInterceptors([jwtInterceptor])) 
  ],
  bootstrap: [App] // ✅ Arrancamos con App
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas, fad, far, fal);
  }
}