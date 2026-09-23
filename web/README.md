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

## Idiomas (i18n)
El sitio público es bilingüe con [next-intl](https://next-intl.dev): toda URL
lleva el idioma (`/es/...`, `/en/...`). Las URLs sin prefijo (incluidas las
antiguas en español de `next.config.js` y los enlaces de los correos) se
redirigen al idioma de la cookie `NEXT_LOCALE` o del navegador; por defecto,
español. El panel `/admin` queda fuera: solo español y sin prefijo.

- Textos: `locales/<es|en>/<namespace>.json` (el español es la referencia de
  tipos; `src/i18n/messages.test.ts` exige las mismas claves en inglés).
- Enlaces y navegación: `Link`, `useRouter`, `usePathname` de `@/i18n/navigation`
  (rutas sin idioma: `/listings/new`).
- Etiquetas de enums, fechas y montos: `useLabels()` / `getLabels(locale)`.

## Páginas
Todas bajo `/es` y `/en`.

| Ruta | Descripción |
|------|-------------|
| `/` | Portada: ofertas con buscador, filtros y paginación |
| `/jobs/[department]` | Ofertas por departamento |
| `/listings/[id]` | Detalle de la oferta |
| `/listings/new` | Publicar o editar una oferta |
| `/my-listings`, `/interests`, `/alerts`, `/profile` | Área de la cuenta |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify` | Acceso |
| `/privacy`, `/cookies` | Páginas legales |

Las rutas protegidas redirigen a `/login` si no hay sesión.
