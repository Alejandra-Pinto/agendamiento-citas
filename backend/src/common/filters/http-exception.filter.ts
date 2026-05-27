/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {

  private readonly logger = new Logger(
    GlobalExceptionFilter.name,
  );

  catch(exception: unknown, host: ArgumentsHost) {

    const ctx = host.switchToHttp();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const response = ctx.getResponse();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = ctx.getRequest();

    // Manejo errores HTTP controlados
    if (exception instanceof HttpException) {

      const status = exception.getStatus();

      const res = exception.getResponse();

      const message =
        typeof res === 'string'
          ? res
          : (res as any).message || 'Error';

      // LOG DEL ERROR
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${message}`,
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return response.status(status).json({
        statusCode: status,
        message,
      });
    }

    // LOG ERROR INTERNO
    this.logger.error(
      `${request.method} ${request.url} - 500 - Error interno del servidor`,
    );

    // Ocultar errores internos
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      message: 'Error interno del servidor',
    });
  }
}
