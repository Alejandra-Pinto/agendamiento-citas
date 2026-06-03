import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  KeycloakConnectModule,
  RoleGuard,
  AuthGuard,
  PolicyEnforcementMode,
  TokenValidation,
} from 'nest-keycloak-connect';

@Module({
  imports: [
    KeycloakConnectModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        authServerUrl: config.get<string>('KEYCLOAK_AUTH_SERVER_URL')!,
        realm: config.get<string>('KEYCLOAK_REALM')!,
        clientId: config.get<string>('KEYCLOAK_CLIENT_ID')!,
        secret: config.get<string>('KEYCLOAK_SECRET') || '',

        // STRICT: si el token falla, se rechaza.
        policyEnforcement: PolicyEnforcementMode.ENFORCING,

        tokenValidation: TokenValidation.OFFLINE,

        excludePatterns: [
          '/health',
          '/metrics',
          '/metrics-public',
          // La ruta de disponibilidad es pública (pacientes sin login la consultan)
          { url: '/citas/disponibilidad', method: 'GET' },
        ],
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    // AuthGuard primero: verifica que el token sea válido
    { provide: APP_GUARD, useClass: AuthGuard },
    // RoleGuard segundo: verifica que el rol sea el requerido
    { provide: APP_GUARD, useClass: RoleGuard },
  ],
})
export class AutenticacionModule {}
