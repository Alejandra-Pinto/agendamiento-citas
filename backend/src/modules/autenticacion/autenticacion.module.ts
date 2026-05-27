/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  KeycloakConnectModule,
  //ResourceGuard,
  RoleGuard,
  AuthGuard,
  PolicyEnforcementMode, // <-- Agregar esta importación
  TokenValidation, // <-- Agregar esta importación
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
        policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
        tokenValidation: TokenValidation.OFFLINE,

        // IMPORTANTE: Ahora que el Mapper pone los roles en la raíz del token,
        // le decimos a NestJS que los busque ahí.
        //roleSource: 'roles' as any,
        excludePatterns: ['/health', '/metrics'],
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    //{ provide: APP_GUARD, useClass: ResourceGuard },
    { provide: APP_GUARD, useClass: RoleGuard },
  ],
})
export class AutenticacionModule {}
