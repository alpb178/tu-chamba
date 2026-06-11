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
