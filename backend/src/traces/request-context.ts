import { Injectable, NestMiddleware } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { NextFunction, Request, Response } from 'express';

// Contexto del request vigente, disponible en cualquier punto del call stack
// sin pasarlo por parámetro: TracesService lo lee al registrar una traza.
export interface RequestContext {
  ip?: string;
  userAgent?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

// Captura IP y user-agent de cada request (con trust proxy, req.ip trae la
// IP real del cliente detrás del proxy de Render).
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    requestContext.run(
      { ip: req.ip, userAgent: req.headers['user-agent'] },
      next,
    );
  }
}
