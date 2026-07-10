# Plan de migración: código legado en español → inglés

> Estado: propuesta · Julio 2026
> Regla origen: `FLUJO-TRABAJO-DEVS.md` → "Idioma del código: inglés"

## Objetivo

Renombrar a inglés los identificadores del código legado (modelos, enums,
servicios, rutas, claves JSON) **sin romper en ningún momento** el contrato de
la API que ya consumen `web`, `admin` y `mobile`, y sin downtime de la base de
datos. La interfaz sigue en español.

## Inventario del legado en español

**Prisma (`backend/prisma/schema.prisma`)**

- Modelos: `Anuncio`, `Reporte`, `Notificacion`, `AlertaEmpleo`
  (ya en inglés: `User`, `Review`, `VerificationToken`, `Visit`, `Trace`).
- Campos: `descripcion`, `requisitos`, `ubicacion`, `salario`, `telefono`,
  `horario`, `estado`, `duracionDias`, `expiraEn`, `vencimientoNotificado`,
  `nombre`, `motivo`, `comentario`, `leida`, `mensaje`, `tipo`, …
- Enums: `TipoJornada`, `Departamento`, `Categoria`, `EstadoAnuncio`,
  `MotivoReporte`, `EstadoReporte`, `TipoNotificacion` (+ sus valores).

**Backend (NestJS)** — módulos `anuncios`, `reportes`, `notificaciones`,
`alertas`; rutas `/api/anuncios`, `/api/reportes`, `/api/notificaciones`,
`/api/alertas`; DTOs y sus claves (`descripcion`, `anuncioId`, …).

**Consumidores** — `web` (SSR + cliente), `admin`, `mobile` (Expo/stores).
Los tres duplican tipos en `src/lib/types.ts`.

## Qué NO se migra (recomendación)

| Elemento | Motivo |
| --- | --- |
| Textos de UI y mensajes de error | Son producto, van en español. |
| URLs públicas del portal (`/anuncios/[id]`, `/empleos/[departamento]`) | SEO ya indexado; cambiarlas exigiría redirects 301 y no aporta. |
| **Valores** de enums persistidos (`VENTAS`, `LA_PAZ`, `ACTIVO`, …) | Son datos en BD y aparecen en filtros/URLs del portal; migrarlos exige migración de datos + compatibilidad con apps móviles viejas. Se tratan como códigos de dominio: solo se renombra el **tipo** (`Categoria` → `Category`), no los valores. |

## Fases (un PR pequeño y enfocado por paso)

### Fase 0 — Convención para código nuevo ✅ (hecha)

Regla en `FLUJO-TRABAJO-DEVS.md`; `Visit`, `Trace`, `/visits`,
`/admin/stats|traces` ya nacieron en inglés.

### Fase 1 — Interno del backend (riesgo bajo)

Renombrar lo que **no** toca el contrato HTTP ni Prisma: clases, archivos,
carpetas, variables y helpers (`AnunciosService` → `AdsService`,
`src/anuncios` → `src/ads`, `resumen()` → `summary()`, …). Los DTO conservan
sus claves (`descripcion`) aunque la clase se llame `CreateAdDto`.

- 1 PR por módulo: `refactor: rename anuncios module internals to English`.
- Verificación: `tsc` + smoke de los endpoints del módulo (sin cambios de
  respuesta esperados — diff de payloads antes/después).

### Fase 2 — API dual (aditivo, riesgo bajo)

Exponer rutas nuevas en inglés que deleguen en los mismos servicios, con
payloads en inglés vía mapper: `/ads`, `/reports`, `/notifications`,
`/alerts`. Las rutas españolas quedan intactas y marcadas `@deprecated` en
Swagger. Un interceptor/mapper traduce claves (`descripcion` ↔ `description`)
mientras Prisma siga en español.

### Fase 3 — Migrar consumidores

1. **admin** y **web**: cambiar a las rutas/claves inglesas y renombrar sus
   `types.ts`/componentes. Se despliegan junto al backend — rápido.
2. **mobile**: igual, pero requiere release en stores. Las rutas españolas se
   mantienen hasta que la versión vieja deje de usarse (ver decisión 3).

### Fase 4 — Prisma con `@map`/`@@map` (sin migración SQL, sin downtime)

```prisma
model Ad {
  description String  @map("descripcion")
  expiresAt   DateTime @map("expiraEn")
  // ...
  @@map("Anuncio")
}
```

El código pasa a usar nombres ingleses (`prisma.ad.findMany`), la BD no cambia
ni un byte. Al devolver Prisma claves inglesas, los mappers de la Fase 2
desaparecen. Renombrar también los tipos de enum (`Categoria` → `Category`)
manteniendo los valores.

### Fase 5 — Limpieza

- Retirar rutas y claves españolas cuando los logs muestren que ya nadie las
  llama (la tabla `Trace` / logs de acceso sirven de telemetría).
- Opcional: renombrar físicamente tablas/columnas con una migración SQL en
  ventana corta. **Recomendado: no hacerlo** — `@map` permanente es gratis y
  sin riesgo; el renombrado físico solo aporta estética en la BD.

## Riesgos principales

- **Mobile viejo en producción**: la Fase 5 no puede empezar hasta cerrar la
  ventana de compatibilidad (decisión 3).
- **Doble mantenimiento en Fase 2–3**: mantener alias españoles el menor
  tiempo posible; no añadir features solo a un lado.
- **`git blame`/historial**: los renombrados masivos ensucian blame — usar
  PRs `refactor:` puros, sin mezclar lógica.

## Decisiones abiertas

1. **¿`@map` permanente o renombrado físico de tablas al final?**
   Recomendación: `@map` permanente (Fase 5 SQL opcional descartada).
2. **¿Migrar los valores de enums?** Recomendación: no (son datos/códigos).
3. **Ventana de soporte mobile**: ¿cuánto tiempo viven las rutas españolas
   tras publicar la app actualizada? (p. ej. 2–3 meses o update forzado).

## Estimación gruesa

| Fase | Esfuerzo | Puede ir a producción sola |
| --- | --- | --- |
| 1 | 1–2 días (4 módulos) | Sí |
| 2 | 1–2 días | Sí |
| 3 web+admin | 1 día | Sí |
| 3 mobile | 0.5 día + ciclo de release | Sí |
| 4 | 1 día | Sí |
| 5 | 0.5 día (tras ventana mobile) | Sí |
