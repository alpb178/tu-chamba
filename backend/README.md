# Tu Chamba — Backend (API)

NestJS + Prisma + PostgreSQL. API REST con auth JWT y roles.

## Requisitos
- Node 18+ y PostgreSQL en ejecución.

## Configuración
```bash
cp .env.example .env
# Edita DATABASE_URL y JWT_SECRET
```

## Instalar y arrancar
```bash
npm install
npm run prisma:generate          # genera el cliente Prisma
npm run prisma:migrate -- --name init   # crea las tablas
npm run seed                     # datos de ejemplo
npm run start:dev                # API en http://localhost:3001/api
```

- Swagger: **http://localhost:3001/docs**
- Prefijo global de la API: **/api**

## Usuarios del seed (password: `Password123`)
| Email | Rol |
|-------|-----|
| admin@tuchamba.com | ADMIN |
| empleador@tuchamba.com | EMPLEADOR |
| trabajador@tuchamba.com | TRABAJADOR |

## Despliegue en Vercel

El backend está adaptado a serverless (`api/index.ts` envuelve la app Nest sin `listen()`; `vercel.json` enruta todo a esa función).

1. **Base de datos con pooling.** Vercel es serverless: usa un Postgres con pooler (Neon, Supabase/pgbouncer o Prisma Accelerate). Ver `DATABASE_URL` en `.env.example`.
2. **Proyecto en Vercel** apuntando a este repo con **Root Directory = `backend`**.
3. **Variables de entorno** (Project Settings → Environment Variables):
   - `DATABASE_URL` (URL con pooling)
   - `JWT_SECRET`, `JWT_EXPIRES_IN`
   - `CORS_ORIGINS` (dominios de `web` y `admin` en Vercel, separados por coma)
   - `PORT` **no** hace falta en Vercel.
4. **Migraciones**: se corren fuera del deploy (no en serverless):
   ```bash
   DATABASE_URL="<url-directa-no-pooled>" npx prisma migrate deploy
   ```
5. La API queda en `https://<tu-deploy>.vercel.app/api` y Swagger en `/docs`.

> Nota: NestJS + Prisma en serverless tiene cold starts. Si necesitas conexiones persistentes o websockets, un host de servidor (Railway/Fly) encaja mejor — pero para esta API REST, Vercel funciona.

## Endpoints
| Método | Ruta | Acceso |
|--------|------|--------|
| POST | `/api/auth/register` | público (TRABAJADOR/EMPLEADOR) |
| POST | `/api/auth/login` | público |
| GET | `/api/auth/me` | autenticado |
| GET | `/api/anuncios` | autenticado (`?tipoJornada=&search=&page=&limit=`) |
| GET | `/api/anuncios/mis-anuncios` | autenticado |
| GET | `/api/anuncios/:id` | autenticado |
| POST | `/api/anuncios` | EMPLEADOR / ADMIN |
| PATCH | `/api/anuncios/:id` | dueño / ADMIN |
| DELETE | `/api/anuncios/:id` | dueño / ADMIN |
| GET | `/api/users` | ADMIN |
| PATCH | `/api/users/:id/role` | ADMIN |
| DELETE | `/api/users/:id` | ADMIN |

## Ejemplos rápidos (curl)
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"empleador@tuchamba.com","password":"Password123"}'

# Crear anuncio (usa el accessToken del login)
curl -X POST http://localhost:3001/api/anuncios \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"descripcion":"Mesero para restaurante","salario":2000,"telefono":"71111111","tipoJornada":"TIEMPO_COMPLETO"}'
```
