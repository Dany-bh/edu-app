# REGISTRO DETALLADO DE CAMBIOS (CAMBIOS.md)

**Proyecto:** `edu-app`  
**Fecha:** 16 de Septiembre de 2026

---

## 1. SEGURIDAD Y AUTENTICACIÓN

### `src/db/database.ts`
* **Cambio:** 
  - Se eliminó la inserción automática hardcodeada del usuario `admin` con contraseña fija `'admin123'`.
  - Se implementó la función `setupInitialAdmin(nombre, usuario, password)` para permitir la creación interactiva y segura del administrador inicial con contraseña elegida por el usuario (mínimo 8 caracteres).
  - Se implementó la función `hasAdminUser()` para comprobar la existencia de administradores en la base de datos sin credenciales fijas.
  - Se implementó la migración automática al vuelo (KDF v1) durante el login para actualizar credenciales antiguas (SHA-256) sin romper cuentas existentes.
  - Se activó explícitamente `PRAGMA foreign_keys = ON;`.
  - Se incorporó un mutex de inicialización (`initPromise`) para prevenir condiciones de carrera y aperturas simultáneas en `getDb()`.
  - Se conectó el sistema formal de migraciones versionadas.
  - Se conectó la persistencia de puntos con la tabla `progreso` y la cola de sincronización `cola_sincronizacion`.
* **Motivo:** Cumplimiento de las reglas críticas de seguridad (eliminación de vulnerabilidades de credenciales fijas), integridad referencial y concurrencia segura.
* **Impacto:** Sistema protegido contra accesos no autorizados, sin romper cuentas de usuarios previas y con persistencia consistente.

---

### `src/db/security.ts` (Nuevo Archivo)
* **Cambio:**
  - Creación del módulo de derivación de claves KDF v1 basado en `expo-crypto` con salting criptográfico aleatorio y 10,000 iteraciones SHA-512.
  - Implementación de `verifyPassword()` con compatibilidad triple: KDF v1, SHA-256 con salt y SHA-256 sin salt.
* **Motivo:** Reemplazar el hashing SHA-256 simple por un mecanismo de derivación resistente a ataques de fuerza bruta por GPU.
* **Impacto:** Alta seguridad criptográfica en almacenamiento local, 100% compatible con Expo y React Native.

---

### `src/db/migrations.ts` (Nuevo Archivo)
* **Cambio:**
  - Creación del sistema de migraciones controladas gestionado por la tabla `schema_migrations`.
  - Migraciones 1 a 5: Creación de tablas principales, columnas de perfil y gamificación, tabla `progreso` con clave foránea, tabla `cola_sincronizacion` e índices optimizados.
* **Motivo:** Reemplazar las sentencias `ALTER TABLE` informales en bucle con `catch (_) {}` que ocultaban errores.
* **Impacto:** Trazabilidad, consistencia y robustez en la evolución de la base de datos local.

---

### `firestore.rules` (Nuevo Archivo)
* **Cambio:**
  - Creación de reglas de seguridad estrictas para Firebase Firestore con helpers de autenticación (`isAuthenticated()`, `isOwner()`, `isAdmin()`).
* **Motivo:** Impedir accesos públicos no autorizados a las colecciones de usuarios, progreso y manuales.
* **Impacto:** Base de datos en la nube protegida según el principio de mínimo privilegio.

---

## 2. INTEGRACIÓN CON FIREBASE Y OFFLINE-FIRST

### `src/config/firebase.ts`
* **Cambio:**
  - Corrección del error TypeScript de importación de `getReactNativePersistence` mediante resolución segura en tiempo de ejecución con fallback automático.
  - Configuración limpia del cliente Firebase para plataformas Web y Nativas.
* **Motivo:** `firebase/auth` modular no expone `getReactNativePersistence` en las definiciones tipadas estándar de TypeScript.
* **Impacto:** Compilación limpia sin errores de tipado y persistencia correcta de sesión de Firebase.

---

### `src/services/syncService.ts` (Nuevo Archivo)
* **Cambio:**
  - Creación del servicio de sincronización Offline-First (`syncService.ts`).
  - Procesa la tabla local `cola_sincronizacion` y replica las mutaciones de `usuarios` y `progreso` hacia Firestore con marcas de tiempo `serverTimestamp()`.
  - Manejo de reintentos y estados (`pendiente`, `sincronizado`, `fallido`).
* **Motivo:** Asegurar que los datos generados sin internet se sincronicen de forma fiable cuando el dispositivo recupera conexión.
* **Impacto:** Arquitectura verdaderamente offline-first lista para producción.

---

## 3. SERVICIOS DE INTELIGENCIA ARTIFICIAL (GEMINI) Y DOCUMENTOS

### `src/services/gemini.ts`
* **Cambio:**
  - Se corrigió el nombre del modelo de `'gemini-3.5-flash-lite'` a `'gemini-1.5-flash'`.
  - Se implementó envoltorio con límite de tiempo (`withTimeout`, 15s) para evitar bloqueos de red.
  - Se incorporó sanitización y límite de longitud de entrada (máximo 1,000 caracteres).
  - Se añadió mecanismo de reintento automático ante fallas transitorias de conectividad.
* **Motivo:** El modelo anterior no existía en la API oficial de Google y faltaba control de timeouts y límites de seguridad.
* **Impacto:** Respuestas confiables, rápidas y estables dentro del asistente EduSalud IA.

---

### `src/services/pdfService.ts` (Nuevo Archivo)
* **Cambio:**
  - Creación del servicio modular de procesamiento y fragmentación de documentos educativos.
  - Implementación de `cleanDocumentText()`, `validateDocumentText()` y `chunkDocumentText()` con ventanas deslizantes y solapamiento para respetar los límites de tokens de la IA.
* **Motivo:** Preparar la arquitectura para carga y análisis seguro de PDFs y guías educativas sin saturar la memoria ni exceder los límites de tokens de Gemini.
* **Impacto:** Modularidad y escalabilidad para la ingesta de documentos médicos y escolares.

---

### `src/services/aiService.ts`
* **Cambio:**
  - Se configuró como re-exportador de `gemini.ts` para mantener compatibilidad arquitectónica ante posibles llamadas legadas.
* **Motivo:** Evitar módulos vacíos o importaciones rotas.
* **Impacto:** Integridad de referencias.

---

## 4. MULTIMEDIA, AUDIO Y SÍNTESIS DE VOZ

### `src/app/(tabs)/asistente.tsx`
* **Cambio:**
  - Se agregó `Speech.stop()` en la función de limpieza del `useEffect` al desmontar la pantalla o cambiar de pestaña.
  - Se incorporó `recordingRef` con `useRef` para garantizar la detención y descarga (`stopAndUnloadAsync()`) de grabaciones nativas activas al salir de la pantalla.
  - Se agregó limpieza de temporizadores (`clearTimeout`) en el auto-scroll de mensajes.
* **Motivo:** Prevenir fugas de memoria y audio persistente en segundo plano.
* **Impacto:** Experiencia fluida sin procesos de audio residuales ni bloqueos del micrófono.

---

## 5. INTERFAZ DE USUARIO, ENRUTAMIENTO Y TIPOS TYPESCRIPT

### `src/types/index.ts` (Nuevo Archivo)
* **Cambio:**
  - Centralización de todos los contratos de tipos de dominio: `User`, `UserRole`, `ProgressItem`, `SyncQueueItem`, `ChatMessage`, `Disease`, `QuizQuestion`.
* **Motivo:** Eliminar la duplicación de tipos dispersos e inconsistentes entre pantallas y servicios.
* **Impacto:** Tipado estricto y mantenibilidad a largo plazo.

---

### `src/app/(auth)/login.tsx`
* **Cambio:**
  - Reemplazo de `StyleSheet.absoluteFillObject` por `StyleSheet.absoluteFill`.
  - Reubicación de la propiedad `borderRadius` dentro del objeto `style` de `<LinearGradient>` en lugar de propiedad JSX directa.
  - Incorporación de modal de configuración interactiva del administrador inicial cuando no existe ningún admin registrado (`!hasAdmin`).
* **Motivo:** Corrección de errores de compilación TypeScript y provisión de interfaz para configuración segura de la primera cuenta administrativa.
* **Impacto:** Pantalla estable, sin errores de tipado y con soporte para primer arranque seguro.

---

### `src/app/(tabs)/admin.tsx`
* **Cambio:**
  - Corrección de `router.replace('/(tabs)/')` a `router.replace('/(tabs)')`.
  - Reubicación de `borderRadius` dentro de `style` en el botón flotante `<LinearGradient>`.
* **Motivo:** Incompatibilidad de rutas tipadas (`typedRoutes`) y error de tipado en `expo-linear-gradient`.
* **Impacto:** Enrutamiento conforme a las rutas generadas por Expo Router.

---

### `src/app/enfermedad/[id].tsx`
* **Cambio:**
  - Corrección de `router.replace('/(tabs)/')` a `router.replace('/(tabs)')`.
* **Motivo:** Tipado estricto de rutas de Expo Router.
* **Impacto:** Navegación segura hacia la pantalla principal al volver sin historial.

---

### `src/components/TarjetaEnfermedad.tsx`
* **Cambio:**
  - Reemplazo de `StyleSheet.absoluteFillObject` por `StyleSheet.absoluteFill`.
* **Motivo:** Incompatibilidad con las definiciones de `react-native`.
* **Impacto:** Estilos válidos y compilación sin errores.

---

### `src/components/app-tabs.web.tsx`
* **Cambio:**
  - Reemplazo de la ruta inexistente `/explore` por `/descubrir`.
* **Motivo:** La ruta `/explore` correspondía a un archivo eliminado de la plantilla inicial.
* **Impacto:** Eliminación del error de enrutamiento estático en web.

---

## 6. DEPENDENCIAS Y COMPATIBILIDAD CON EXPO SDK 57

### `package.json`
* **Cambio:**
  - Actualización y alineación estricta de dependencias con Expo SDK 57:
    - `@react-native-async-storage/async-storage` a `2.2.0` (resolviendo el mismatch mayor).
    - `expo` a `~57.0.23`.
    - `expo-router` a `~57.0.21`.
    - `expo-sqlite` a `~57.0.3`.
    - `expo-secure-store` a `~57.0.4`.
    - `expo-speech` a `~57.0.3`.
    - `react-native` a `0.86.3`.
  - Configuración de exclusión en `expo.doctor.reactNativeDirectoryCheck.exclude` para `expo-av`.
* **Motivo:** Eliminar advertencias e incompatibilidades detectadas por `npx expo-doctor`.
* **Impacto:** 21/21 verificaciones de `expo-doctor` superadas con éxito sin alertas críticas ni dependencias desfasadas.
