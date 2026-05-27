import { Controller, Get, Res } from '@nestjs/common';
import { Public } from 'nest-keycloak-connect';
import type { Response } from 'express';

import { register } from 'prom-client';

@Controller('metrics')
export class MetricsController {
  @Public()
  @Get()
  async metrics(@Res() res: Response) {
    res.set('Content-Type', register.contentType);

    const metrics = await register.metrics();

    res.end(metrics);
  }
}
