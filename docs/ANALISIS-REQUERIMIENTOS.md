# Tu Chamba — Análisis de negocio y requerimientos

> Analista/dev: Claude · Fecha: 2026-07-07 · Base: rama `develop`

---

## 1. Análisis del negocio actual

### 1.1 Arquitectura

Monorepo con 4 proyectos que comparten una API REST:

| Proyecto  | Stack                          | Puerto | Rol |
|-----------|--------------------------------|--------|-----|
| `backend` | NestJS 10 + Prisma 5 + PostgreSQL | 3001 (`/api`, Swagger en `/docs`) | API |
| `web`     | Next.js 16 (App Router) + Tailwind | 3000 | Sitio público (candidatos y empleadores) |
| `admin`   | Next.js 16 + Tailwind          | 3002 | Panel de administración |
| `mobile`  | React Native (Expo)            | —    | Fuera de alcance en esta iteración |

### 1.2 Tipos de usuario

- **TRABAJADOR** (candidato): busca ofertas, ve el detalle y contacta al empleador.
- **EMPLEADOR**: publica y gestiona sus anuncios.
- **ADMIN**: gestiona usuarios y todos los anuncios desde el panel `admin` (se crea con `seed:admin`, no por registro público).

Registro público (`POST /auth/register`): email, password, nombre, **teléfono (hoy obligatorio para todos los roles)** y rol (TRABAJADOR | EMPLEADOR). Login con JWT (`POST /auth/login`). No existe OAuth.

### 1.3 Modelo de datos actual

```prisma
User    { id, email @unique, password, nombre, telefono, role, createdAt, updatedAt }
Anuncio { id, descripcion, salario Decimal, telefono, tipoJornada, createdById → User, createdAt, updatedAt }
```

### 1.4 Flujo de publicación y ciclo de vida de un anuncio

1. El EMPLEADOR (o ADMIN) crea el anuncio (`POST /anuncios`): descripción, salario, **teléfono escrito a mano** (no se precarga del perfil), tipo de jornada.
2. El anuncio queda visible **inmediatamente y para siempre**: la lista pública (`GET /anuncios`) no filtra por estado ni fecha.
3. El detalle (`GET /anuncios/:id`) **requiere sesión** — es donde se expone el teléfono de contacto (botón "Llamar" con `tel:`).
4. Baja = **borrado físico** (`DELETE /anuncios/:id`, dueño o admin). No hay estados, ni vencimiento, ni papelera.

**Hallazgo clave:** el ciclo de vida "creación → publicación → vencimiento → baja" que asume el enunciado **no existe hoy**; los requerimientos 1 y 9 lo crean. No hay sistema de postulaciones: el contacto es directo por teléfono (esto condiciona el requerimiento de reviews).

### 1.5 Otros hallazgos relevantes

- Los teléfonos se guardan **sin código de país** (ej. `71111111`, Bolivia). `wa.me` exige código de país → hay que normalizar a `591XXXXXXXX` al generar el enlace.
- El anuncio no tiene título, ubicación, requisitos ni horario; solo un campo `descripcion` libre.
- La búsqueda pública filtra por `descripcion` y `tipoJornada` con paginación.
- Deploy en Render free tier → **evitar depender de cron jobs** para el vencimiento (resolver al leer).

---

## 2. Requerimientos: validación, criterios y prioridad

Prioridades: **P0** = base/bloqueante, **P1** = alto valor, **P2** = depende de terceros o decisión de negocio.

### R1. Duración de publicación por defecto: 3 días — **P0**

**Descripción funcional.** Todo anuncio nace con fecha de expiración `expiraEn = publicación + duración`. El empleador elige la duración (3/7/15/30 días) con **3 días preseleccionado**. Vencido, deja de aparecer en la lista pública y su detalle indica "vencido"; el dueño lo sigue viendo en "Mis anuncios" y puede republicarlo.

**Criterios de aceptación**
- Al crear un anuncio sin indicar duración, `expiraEn = createdAt + 3 días`.
- El empleador puede elegir 3, 7, 15 o 30 días; otros valores se rechazan (400).
- `GET /anuncios` (público) solo devuelve anuncios vigentes (`estado = ACTIVO` y `expiraEn > ahora`).
- "Mis anuncios" muestra también los vencidos, distinguidos visualmente, con acción "Republicar" (nueva ventana con la misma duración).
- No requiere cron: el vencimiento se resuelve por filtro/estado calculado al leer.

**Impacto BD/API.** `Anuncio.expiraEn DateTime`, `Anuncio.duracionDias Int default 3`, `Anuncio.estado enum(ACTIVO, DADO_DE_BAJA)` (VENCIDO se calcula al leer); migración con backfill para anuncios existentes. `POST /anuncios` calcula `expiraEn`; `GET /anuncios` filtra; `POST /anuncios/:id/republicar`.

**Decisión (2026-07-07):** duración **elegible** (3/7/15/30) con 3 por defecto.

### R2. Ubicación en el detalle — **P0**

**Descripción funcional.** El anuncio incluye un campo `ubicacion` (texto: ciudad/zona) que se captura al publicar y se muestra en el detalle (y en la tarjeta del listado).

**Criterios de aceptación**
- El formulario de publicación exige ubicación.
- El detalle muestra la ubicación con ícono/etiqueta clara; la tarjeta del listado también.
- Anuncios antiguos sin ubicación muestran "No especificada" (columna nullable o backfill `''`).

**Impacto BD/API.** `Anuncio.ubicacion String` (nullable en migración, requerido en DTO de creación). Sin endpoints nuevos. (Extensión futura: filtro por ubicación en `QueryAnuncioDto`.)

**Extensión (2026-07-07):** además del texto, el empleador puede **marcar el lugar en un mapa** (Leaflet + OpenStreetMap): pin arrastrable o clic en el formulario, botón "Usar mi ubicación", y autocompletado del campo de texto por geocodificación inversa (Nominatim, best effort). Se guarda en `Anuncio.latitud/longitud Float?` y el detalle muestra el mapa de solo lectura cuando hay pin. También se muestra siempre la **fecha de publicación** (`createdAt`) en tarjetas, detalle y panel admin.

### R3. Botón "Chatear" (WhatsApp) — **P0**

**Descripción funcional.** En el detalle del anuncio, junto a "Llamar", un botón **"Chatear"** abre `https://wa.me/{número}` con el teléfono del anuncio (el del publicador, ver R6), con mensaje precargado opcional ("Hola, vi tu anuncio en Tu Chamba…"). No hay chat interno.

**Criterios de aceptación**
- Botón visible para usuarios con sesión (el detalle ya exige login).
- El enlace usa el número normalizado con código de país `591` (se anteponen solo si faltan); abre en pestaña nueva/app.
- Incluye `text=` con mensaje precargado que referencia el anuncio.

**Impacto BD/API.** Ninguno en BD. Frontend: helper `waLink(telefono, mensaje)` con normalización. Depende de R5/R6 para garantizar teléfono válido.

### R4. Descripción y requisitos separados — **P0**

**Descripción funcional.** El anuncio separa `descripcion` (el puesto) de `requisitos` (perfil del candidato). Se capturan en campos distintos y se muestran como secciones distintas en el detalle.

**Criterios de aceptación**
- Formulario con dos textareas: "Descripción del puesto" y "Requisitos del candidato".
- Detalle con dos secciones tituladas.
- Anuncios antiguos (sin requisitos) muestran solo descripción.

**Impacto BD/API.** `Anuncio.requisitos String?`. DTOs y tipos actualizados. La búsqueda podría extenderse a `requisitos` (se hará: `OR [descripcion, requisitos]`).

### R5. Teléfono obligatorio para empleadores — **P0**

**Descripción funcional.** En el registro, el teléfono es **obligatorio si el rol es EMPLEADOR**. Hoy es obligatorio para todos; se relaja a **opcional para TRABAJADOR** (el candidato no publica, su teléfono no se usa en ningún flujo actual).

**Criterios de aceptación**
- Registro como EMPLEADOR sin teléfono → error de validación claro (backend y frontend).
- Registro como TRABAJADOR permite omitir el teléfono; el campo se muestra como opcional al elegir ese rol.
- Validación de formato: 8 dígitos (fijo/celular Bolivia) o con prefijo `591`.

**Impacto BD/API.** `User.telefono String?` (nullable). `RegisterDto` con `@ValidateIf(role === EMPLEADOR)`. Nota: cuenta también para el alta con Google (R11): si elige EMPLEADOR debe completar teléfono.

### R6. Autocompletar teléfono al publicar — **P0**

**Descripción funcional.** Al abrir el formulario de publicación, el campo teléfono se precarga con `user.telefono`. El empleador puede sobreescribirlo para ese anuncio. Ese número alimenta "Chatear" y "Llamar".

**Criterios de aceptación**
- Con teléfono en perfil → campo precargado al crear (no al editar: se respeta el del anuncio).
- Editable antes de publicar; lo publicado es lo que quede en el campo.
- Sin teléfono en perfil → campo vacío y obligatorio.

**Impacto BD/API.** Ninguno en BD (el dato ya viaja en `useAuth().user`). Solo frontend.

### R7. Horario de trabajo (opcional) — **P0** (va en la misma migración)

**Descripción funcional.** Campo libre opcional `horario` (ej. "Lun–Vie 8:00–16:00") en el anuncio; se muestra en el detalle solo si existe.

**Criterios de aceptación**
- Formulario con campo "Horario (opcional)"; se puede publicar sin él.
- Detalle lo muestra solo cuando tiene valor.

**Impacto BD/API.** `Anuncio.horario String?`. DTOs/tipos.

### R8. Sistema de reviews — **P1**

**Descripción funcional.** Los TRABAJADORES califican a EMPLEADORES: 1–5 estrellas + **comentario obligatorio**. El detalle del anuncio muestra el promedio y total de reseñas del empleador, con listado de comentarios. Una reseña por par (trabajador, empleador), editable por su autor; ADMIN puede eliminar reseñas.

**Criterios de aceptación**
- Solo rol TRABAJADOR puede crear reseñas; nunca sobre sí mismo ni sobre no-empleadores.
- Máx. 1 reseña por trabajador por empleador (constraint único); reintentos actualizan la existente o devuelven 409.
- Promedio y conteo visibles en el detalle del anuncio; listado paginado de reseñas.
- ADMIN puede eliminar cualquier reseña (moderación).

**Impacto BD/API.** Modelo `Review { id, rating Int(1..5), comentario String?, autorId → User, empleadorId → User, createdAt, updatedAt, @@unique([autorId, empleadorId]) }`. Endpoints: `POST /reviews`, `GET /reviews?empleadorId=`, `DELETE /reviews/:id` (autor o admin). El detalle del anuncio agrega `ratingPromedio`/`totalReviews` del autor.

**Decisión (2026-07-07):** reseña abierta a **cualquier trabajador autenticado**, con comentario obligatorio.

### R9. Sistema de bajas — **P0** (junto con R1)

**Descripción funcional.** Baja **manual**: el dueño (o admin) da de baja el anuncio sin borrarlo (estado `DADO_DE_BAJA`); deja de listarse públicamente. Baja **por vencimiento**: automática vía `expiraEn` (R1). El `DELETE` físico queda solo para ADMIN. El dueño puede reactivar/republicar.

**Criterios de aceptación**
- "Dar de baja" disponible para el dueño en detalle y en "Mis anuncios"; el anuncio desaparece del listado público pero no de "Mis anuncios".
- Republicar un anuncio de baja o vencido lo reactiva con nueva ventana de 3 días.
- El borrado definitivo solo lo puede hacer ADMIN (panel admin).
- El listado del panel admin distingue estados (ACTIVO / VENCIDO / DADO_DE_BAJA).

**Impacto BD/API.** Usa `estado` de R1. `POST /anuncios/:id/baja` (dueño/admin), `POST /anuncios/:id/republicar` (dueño/admin), `DELETE /anuncios/:id` restringido a ADMIN. Cambio de comportamiento para el frontend web: el botón "Eliminar" del dueño pasa a "Dar de baja".

### R10. Sistema de spam (reportes) — **P1**

**Descripción funcional.** Cualquier usuario autenticado puede reportar un anuncio (motivos: SPAM, FRAUDE, CONTENIDO_INAPROPIADO, OTRO + comentario). El ADMIN ve la cola de reportes en el panel, y resuelve: descartar el reporte o dar de baja el anuncio (y opcionalmente eliminar/suspender al usuario, ya soportado por `DELETE /users/:id`).

**Criterios de aceptación**
- Botón "Reportar" en el detalle del anuncio (requiere sesión); un usuario no puede reportar dos veces el mismo anuncio.
- El panel admin lista reportes pendientes con anuncio, motivo, reportante y fecha; permite marcar ATENDIDO/DESCARTADO y dar de baja el anuncio desde ahí.
- El anuncio reportado no cambia de visibilidad hasta decisión del admin (salvo variante auto-ocultar, ver duda).

**Impacto BD/API.** Modelo `Reporte { id, motivo enum, comentario String?, estado enum(PENDIENTE, ATENDIDO, DESCARTADO), anuncioId → Anuncio, reporterId → User, createdAt, @@unique([anuncioId, reporterId]) }`. Endpoints: `POST /anuncios/:id/reportes`, `GET /reportes?estado=` (admin), `PATCH /reportes/:id` (admin). Pantalla nueva en `admin`.

**Decisión (2026-07-07):** la visibilidad del anuncio solo cambia por **decisión manual del admin** (sin auto-ocultado por acumulación).

### R12. Notificaciones in-app — **P1** (agregado 2026-07-07)

**Descripción funcional.** Centro de notificaciones para usuarios autenticados (campana en el navbar con conteo de no leídas, refresco por polling cada 30 s). Eventos: para el **empleador**, alguien pulsó "Chatear" en su anuncio, recibió/actualizó una calificación, y el vencimiento de sus anuncios; para el **trabajador**, cada anuncio nuevo publicado con enlace al detalle.

**Criterios de aceptación**
- Solo usuarios autenticados: `GET /notificaciones` responde 401 sin sesión y la campana no se muestra a visitantes.
- Clic en "Chatear" → notificación al dueño del anuncio (nunca a uno mismo).
- Nueva reseña o actualización → notificación al empleador con rating y autor.
- Anuncio vencido → notificación única por ventana de publicación (se resetea al republicar). Sin cron: se genera al leer las notificaciones (lazy).
- Anuncio nuevo → notificación a todos los TRABAJADORES con acceso directo al detalle.
- Marcar leída individual y "marcar todas"; nadie puede marcar notificaciones ajenas.

**Impacto BD/API.** Modelo `Notificacion { tipo enum(CHAT_INICIADO, NUEVA_REVIEW, ANUNCIO_VENCIDO, NUEVO_ANUNCIO), mensaje, leida, userId, anuncioId?, createdAt }` + `Anuncio.vencimientoNotificado Boolean`. Endpoints: `GET /notificaciones` (lista + noLeidas), `POST /notificaciones/chat-click`, `POST /notificaciones/leer-todas`, `PATCH /notificaciones/:id/leida`. Hooks en `AnunciosService.create` (fan-out a trabajadores) y `ReviewsService.upsert`.

**Nota de escala:** el alta de un anuncio hace fan-out a todos los trabajadores (un `createMany`). Adecuado para el tamaño actual; si la base crece mucho, migrar a suscripciones/colas.

### R11. Autenticación con Google — **P2** (depende de credenciales externas)

**Descripción funcional.** Botón "Continuar con Google" en login/registro (Google Identity Services). El backend verifica el `idToken`. Si el email ya existe, inicia sesión (vinculando `googleId`); si no, flujo de completar perfil: elegir rol y, si es EMPLEADOR, teléfono (coherente con R5).

**Criterios de aceptación**
- Login con Google de un usuario existente entra directo con JWT propio de la plataforma.
- Alta nueva con Google pide rol (+ teléfono si EMPLEADOR) antes de crear la cuenta.
- Una cuenta creada con Google puede no tener contraseña local; el login por contraseña para esas cuentas da error claro.
- El `idToken` se verifica server-side (audiencia = `GOOGLE_CLIENT_ID`); sin credencial configurada, el endpoint responde 503 y el botón no se muestra.

**Impacto BD/API.** `User.googleId String? @unique`, `User.password String?`. `POST /auth/google { idToken, role?, telefono? }`. Config: `GOOGLE_CLIENT_ID` (backend y web). **Bloqueante externo:** crear OAuth Client en Google Cloud Console.

---

## 3. Dependencias y conflictos detectados

1. **R1 + R9 son un solo sistema** (ciclo de vida con `estado` + `expiraEn`); se implementan juntos.
2. **R3 depende de R5/R6**: sin teléfono garantizado del empleador no hay enlace de WhatsApp confiable. Además exige **normalización a formato internacional 591**.
3. **R5 modifica el flujo actual** (hoy el teléfono es obligatorio para todos): se propone volverlo opcional para TRABAJADOR — cambio de contrato del registro.
4. **R9 cambia semántica del botón "Eliminar"** del dueño en web: pasa a "Dar de baja" (el DELETE físico queda para admin).
5. **R8 sin postulaciones**: no es verificable que el trabajador haya interactuado con el empleador; requiere decisión de negocio.
6. **R11 con R5**: el alta por Google no trae teléfono ni rol → paso obligatorio de completar perfil; y requiere `GOOGLE_CLIENT_ID` (externo).
7. **Migración de datos**: anuncios existentes necesitan backfill (`estado = ACTIVO`, `expiraEn = createdAt + 3 días` — quedarán vencidos si son antiguos, lo cual es coherente con la nueva regla).

## 4. Orden de implementación propuesto

| Fase | Contenido | Reqs |
|------|-----------|------|
| 1 | Migración BD (campos anuncio + estado/expiración + user.telefono nullable) | R1 R2 R4 R7 R9 R5 |
| 2 | Backend: ciclo de vida, bajas, republicar, validación registro | R1 R9 R5 |
| 3 | Web: formulario nuevo (ubicación, requisitos, horario, prefill teléfono), detalle (ubicación, requisitos, horario, Chatear), mis-anuncios (estados, baja, republicar), registro | R2 R3 R4 R6 R7 |
| 4 | Reviews (backend + web) | R8 |
| 5 | Reportes (backend + web + admin) | R10 |
| 6 | Google Sign-In (backend + web) — al recibir `GOOGLE_CLIENT_ID` | R11 |
