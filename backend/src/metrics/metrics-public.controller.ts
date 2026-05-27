import { Controller, Get } from '@nestjs/common';
import { Public } from 'nest-keycloak-connect';

@Controller('metrics-public')
export class MetricsPublicController {
  @Public()
  @Get()
  test() {
    return { ok: true };
  }
}
