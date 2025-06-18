import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // ✅ OK

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    importProvidersFrom(BrowserAnimationsModule) // ✅ GOOD
  ]
};

