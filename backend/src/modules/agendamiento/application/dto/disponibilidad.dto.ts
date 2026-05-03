import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class DisponibilidadDto {
  @ApiProperty({ example: 'esp-123' })
  @IsString()
  especialistaId: string;

  @ApiProperty({ example: '2026-05-10' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener formato YYYY-MM-DD',
  })
  fecha: string;
}
