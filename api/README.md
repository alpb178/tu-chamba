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
- Health check: **GET /api/health** → `200` con `{ status, database, uptime }`

## Despliegue en Render

Hay un blueprint en la raíz del repo (`render.yaml`) que crea la base de datos y el servicio web.

1. En Render: **New → Blueprint** y seleccionar este repo. Detecta `render.yaml`.
2. Crea:
   - **tu-chamba-db**: PostgreSQL gestionado (plan free).
   - **tu-chamba-api**: servicio web Node (`rootDir: backend`), con `DATABASE_URL` y `JWT_SECRET` cableados automáticamente.
3. Rellenar a mano la variable **`CORS_ORIGINS`** con los dominios de `web` y `admin`.
4. Build: `npm install && prisma generate && npm run build`. Migraciones vía `preDeployCommand` (`prisma migrate deploy`). Arranque: `node dist/main`.
5. Render comprueba **`/api/health`** para marcar el servicio como sano (debe devolver `200`).

> El seed (`npm run seed`) se ejecuta a mano una vez tras el primer deploy si quieres datos de ejemplo.

## Usuarios del seed (password: `Password123`)
| Email | Rol |
|-------|-----|
| admin@tuchamba.com | ADMIN |
| empleador@tuchamba.com | EMPLEADOR |
| trabajador@tuchamba.com | TRABAJADOR |

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
