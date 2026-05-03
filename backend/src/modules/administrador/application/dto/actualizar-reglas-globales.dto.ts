import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'

export class ActualizarReglasGlobalesDto {
  @ApiProperty({
    example: 4,
    description:
      'Número de semanas hacia adelante en las que se pueden agendar citas',
  })
  @IsInt()
  @Min(1)
  ventanaHabilitacionSemanas: number;
}
