# Tu Chamba — Portal de empleos

Monorepo con 4 proyectos independientes que comparten la misma API REST.

```
tu-chamba/
  backend/   NestJS + Prisma + PostgreSQL  (API)         -> http://localhost:3001
  web/       Next.js + Tailwind (sitio público)          -> http://localhost:3000
  admin/     Next.js + Tailwind (panel de administración)-> http://localhost:3002
  mobile/    React Native (Expo) + NativeWind (APK)
```

## Roles
- **ADMIN** — gestiona usuarios y todos los anuncios (solo en el panel `admin`).
- **EMPLEADOR** — publica anuncios de trabajo.
- **TRABAJADOR** — busca empleos y ve detalles.

## Orden de arranque
1. `backend` (necesita PostgreSQL). Ver [backend/README.md](backend/README.md).
2. `web`, `admin`, `mobile` — cada uno apunta al backend vía variable de entorno.

## Sistema de diseño (compartido)
Inspirado en los clasificados de El Deber: marca **verde** sobre fondo blanco.

| Token | Valor |
|-------|-------|
| brand (primario) | `#1E8E3E` |
| brand-dark | `#166b2e` |
| Badge DIARIA | naranja |
| Badge TIEMPO_COMPLETO | verde |
| Badge MEDIA_JORNADA | azul |
