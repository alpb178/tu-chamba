# Tu Chamba — Móvil (Expo + NativeWind)

App Android/iOS en React Native (Expo) con NativeWind (Tailwind). Consume la misma API.

## Configuración
```bash
cp .env.example .env
# EXPO_PUBLIC_API_URL=http://<IP-de-tu-PC>:3001/api
```
> En dispositivo físico/emulador NO uses `localhost`: pon la IP de tu PC en la
> misma red (ej. `http://192.168.0.10:3001/api`). El backend debe permitir esa IP en CORS.

## Desarrollo
```bash
npm install
npm start              # abre Expo; escanea el QR con Expo Go o usa un emulador
# o build de desarrollo nativo:
npx expo run:android
```

## Generar APK (Android)
La forma más simple es **EAS Build** (en la nube, sin Android Studio):
```bash
npm install -g eas-cli
eas login
eas build:configure          # crea/asocia el projectId
eas build -p android --profile preview   # el perfil "preview" genera un APK instalable
```
Al terminar, EAS te da un enlace para descargar el `.apk`.

Build 100% local (requiere Android Studio + SDK):
```bash
npx expo run:android --variant release
```

## Pantallas
- **Login / Registro** (elige rol TRABAJADOR o EMPLEADOR)
- **Lista** de anuncios (búsqueda + filtro por tipo de jornada)
- **Detalle** (botón para llamar al teléfono de contacto)
- **Nuevo/Editar anuncio** (botón flotante "+", solo EMPLEADOR/ADMIN)
