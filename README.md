# Tu Chamba — Portal de empleos

Monorepo con 4 proyectos independientes que comparten la misma API REST.

```
tu-chamba/
  api/       NestJS + Prisma + PostgreSQL  (API)         -> http://localhost:3001
  web/       Next.js + Tailwind (sitio público + panel admin en /admin) -> http://localhost:3000
  mobile/    React Native (Expo) + NativeWind (APK)
```

## Roles
- **ADMIN** — gestiona usuarios y todos los anuncios (solo en el panel `/admin` de `web`).
- **EMPLEADOR** — publica anuncios de trabajo.
- **TRABAJADOR** — busca empleos y ve detalles.

## Orden de arranque
1. `api` (necesita PostgreSQL). Ver [api/README.md](api/README.md).
2. `web`, `mobile` — cada uno apunta a la API vía variable de entorno.

## Sistema de diseño (compartido)
Inspirado en los clasificados de El Deber: marca **verde** sobre fondo blanco.

| Token | Valor |
|-------|-------|
| brand (primario) | `#1E8E3E` |
| brand-dark | `#166b2e` |
| Badge DIARIA | naranja |
| Badge TIEMPO_COMPLETO | verde |
| Badge MEDIA_JORNADA | azul |
