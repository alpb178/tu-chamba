# Tu Chamba — Admin

Panel de administración (Next.js + Tailwind), **proyecto separado**. Solo acceden
usuarios con rol **ADMIN**.

## Configuración
```bash
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Arrancar
```bash
npm install
npm run dev        # http://localhost:3002
```
> Requiere el backend en el puerto 3001. Inicia sesión con `admin@tuchamba.com` / `Password123`.

## Páginas
| Ruta | Descripción |
|------|-------------|
| `/login` | Login (rechaza cualquier rol que no sea ADMIN) |
| `/` | Dashboard con totales (usuarios, anuncios) |
| `/usuarios` | Tabla de usuarios: cambiar rol, eliminar |
| `/anuncios` | Tabla de todos los anuncios: eliminar |
