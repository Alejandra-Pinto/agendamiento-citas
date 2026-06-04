import {
  ApplicationConfig,
  LOCALE_ID,
  provideZoneChangeDetection,
  APP_INITIALIZER,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { routes } from './app.routes';
import {
  KeycloakAngularModule,
  KeycloakService,
  KeycloakBearerInterceptor,
} from 'keycloak-angular';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { TokenRefreshInterceptor } from './core/interceptors/token-refresh.interceptor';

registerLocaleData(localeEs, 'es-ES');

export function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: 'https://keycloak-clinica.onrender.com',
        realm: 'clinica-piedra-azul',
        clientId: 'frontend-clinica',
      },
      initOptions: {
        onLoad: 'check-sso',
        checkLoginIframe: false,
        pkceMethod: 'S256',
      },
      enableBearerInterceptor: true,
      bearerPrefix: 'Bearer',
      bearerExcludedUrls: [
        '/assets',
        'https://keycloak-clinica.onrender.com',
      ],
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(KeycloakAngularModule),

    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService],
    },

    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenRefreshInterceptor,
      multi: true,
    },

    {
      provide: HTTP_INTERCEPTORS,
      useClass: KeycloakBearerInterceptor,
      multi: true,
    },

    { provide: LOCALE_ID, useValue: 'es-ES' },
  ],
};
