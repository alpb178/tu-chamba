import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Autenticación opcional: si hay token válido, popula request.user; si no,
// deja pasar como anónimo (no lanza 401). Se usa en rutas públicas que
// muestran más datos a usuarios con sesión.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Siempre permite continuar; el resultado real se resuelve en handleRequest.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      /* sin token o token inválido: continúa como anónimo */
    }
    return true;
  }

  // No lanzar si no hay usuario; devolvemos null para anónimo.
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user || (null as TUser);
  }
}
