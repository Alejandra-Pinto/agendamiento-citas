import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { KeycloakService } from 'keycloak-angular';

@Injectable()
export class TokenRefreshInterceptor implements HttpInterceptor {
  constructor(private keycloak: KeycloakService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // No intentar renovar en rutas públicas
    if (this.isPublicUrl(request.url)) {
      return next.handle(request);
    }

    return from(this.tryRefreshToken()).pipe(
      switchMap(() => next.handle(request)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token definitivamente inválido → logout limpio
          this.keycloak.logout(window.location.origin + '/home');
        }
        return throwError(() => error);
      })
    );
  }

  private async tryRefreshToken(): Promise<void> {
    try {
      const isLoggedIn = await this.keycloak.isLoggedIn();
      if (isLoggedIn) {
        // Renueva si expira en menos de 30 segundos
        await this.keycloak.updateToken(30);
      }
    } catch {
      // Si no puede renovar, deja que el 401 del backend maneje el logout
    }
  }

  private isPublicUrl(url: string): boolean {
    const publicPatterns = ['/assets', '/administrador/horario-general', 'keycloak-clinica.onrender.com'];
    return publicPatterns.some((pattern) => url.includes(pattern));
  }
}
