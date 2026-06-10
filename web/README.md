# Tu Chamba — Web pública

Next.js (App Router) + Tailwind. Sitio público de empleos que consume la API.

## Configuración
```bash
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Arrancar
```bash
npm install
npm run dev        # http://localhost:3000
```
> Requiere el backend corriendo en el puerto 3001.

## Páginas
| Ruta | Descripción |
|------|-------------|
| `/` | Lista de anuncios con buscador + filtro por tipo de jornada + paginación |
| `/login` | Iniciar sesión |
| `/register` | Registro (rol TRABAJADOR o EMPLEADOR) |
| `/anuncios/[id]` | Detalle (con botón de llamada al teléfono) |
| `/anuncios/nuevo` | Crear/editar anuncio (solo EMPLEADOR/ADMIN) |
| `/mis-anuncios` | Anuncios propios del EMPLEADOR |

El botón "Publicar anuncio" solo aparece para EMPLEADOR/ADMIN, y las rutas
protegidas redirigen a `/login` si no hay sesión.
