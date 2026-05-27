import { Module } from '@nestjs/common';
import { MetricsPublicController } from './metrics-public.controller';

@Module({
  controllers: [MetricsPublicController],
})
export class MetricsPublicModule {}
