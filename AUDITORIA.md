# AUDITORÍA TÉCNICA Y DE SEGURIDAD - EDU-APP

**Fecha de Auditoría:** 16 de Septiembre de 2026  
**Proyecto:** `edu-app` (Salud Integral y Prevención de ENT para Adolescentes)  
**Entorno:** Expo SDK 57 · React Native 0.86.2 · React 19.2.3 · TypeScript · SQLite · Firebase

---

## RESUMEN EJECUTIVO

Se ha realizado una auditoría exhaustiva del proyecto `edu-app` cubriendo código fuente, arquitectura, seguridad, base de datos local SQLite, configuración de Firebase, integración con Gemini IA, soporte multimedia (audio/TTS), procesamiento de PDFs y compatibilidad con Expo SDK 57.

El proyecto cuenta con una base conceptual sólida y una interfaz visual atractiva, pero presenta vulnerabilidades críticas de seguridad (contraseña fija de administrador embebida en SQLite), fallos de compilación TypeScript, discrepancias de versiones con Expo SDK 57, falta de sincronización offline-first formal con Firebase, y ausencia de un sistema estructurado de migraciones.

---

## TABLA DE HALLAZGOS POR SEVERIDAD

| ID | Problema | Archivo | Severidad | Estado |
|---|---|---|---|---|
| SEC-01 | Contraseña administrativa fija hardcodeada (`admin/admin123`) | `src/db/database.ts` | **CRÍTICO** | Pendiente Corrección |
| SEC-02 | Hashing simple SHA-256 + salt sin KDF robusto | `src/db/database.ts` | **ALTO** | Pendiente Corrección |
| DEP-01 | Desalineación de versiones con Expo SDK 57 (`async-storage` v3 vs v2) | `package.json` | **ALTO** | Pendiente Corrección |
| TS-01 | Error de importación `getReactNativePersistence` en Firebase Auth | `src/config/firebase.ts` | **ALTO** | Pendiente Corrección |
| DB-01 | Migraciones SQLite no versionadas y fallos silenciados con `catch (_) {}` | `src/db/database.ts` | **ALTO** | Pendiente Corrección |
| DB-02 | Claves foráneas desactivadas (`PRAGMA foreign_keys = ON;` ausente) | `src/db/database.ts` | **ALTO** | Pendiente Corrección |
| DB-03 | Carrera de inicialización en `getDb()` (concurrencia) | `src/db/database.ts` | **MEDIO** | Pendiente Corrección |
| ARC-01 | Ausencia de cola de sincronización Offline-First con Firebase | `src/services/` | **ALTO** | Pendiente Corrección |
| SEC-03 | Inexistencia de reglas de seguridad Firestore (`firestore.rules`) | Raíz del proyecto | **ALTO** | Pendiente Corrección |
| AI-01 | Modelo inexistente `'gemini-3.5-flash-lite'` en Google Generative AI | `src/services/gemini.ts` | **MEDIO** | Pendiente Corrección |
| TS-02 | Errores de tipos en `login.tsx`, `admin.tsx`, `enfermedad/[id].tsx` y componentes | Múltiples pantallas | **MEDIO** | Pendiente Corrección |
| AUD-01 | Fuga de audio: `Speech.stop()` no se cancela al desmontar pantalla | `src/app/(tabs)/asistente.tsx` | **MEDIO** | Pendiente Corrección |
| AUD-02 | Fuga de grabación de audio por cierre en estado desactualizado | `src/app/(tabs)/asistente.tsx` | **MEDIO** | Pendiente Corrección |
| NAV-01 | Enrutamiento tipado inválido en Expo Router (`router.replace('/(tabs)/')`) | `admin.tsx`, `[id].tsx` | **MEDIO** | Pendiente Corrección |
| TYP-01 | Duplicación y dispersión de tipos (`User`, `Usuario`, etc.) | `src/types/` (ausente) | **MEJORA** | Pendiente Corrección |
| PDF-01 | Falta de aislamiento modular de procesamiento de documentos | `scripts/extractPdfs.js` | **MEJORA** | Pendiente Corrección |

---

## DETALLE DE HALLAZGOS

### 1. [SEC-01] Contraseña administrativa fija embebida en SQLite
* **Archivo:** `src/db/database.ts` (Líneas 56-74)
* **Severidad:** **CRÍTICO**
* **Motivo:** En cada inicialización de la base de datos se comprueba si existe el usuario `'admin'`, y de no existir, se crea automáticamente con la contraseña fija `'admin123'`. Cualquier persona que inspeccione el bundle compilado o el código puede obtener acceso administrativo completo a la aplicación.
* **Solución recomendada:** Eliminar la contraseña hardcodeada. Implementar una pantalla/modal de primer arranque (Setup Inicial) para configurar las credenciales del administrador de manera interactiva o generar un hash seguro administrado por autenticación robusta.

---

### 2. [SEC-02] Almacenamiento de contraseñas con SHA-256 + salt
* **Archivo:** `src/db/database.ts` (Líneas 64, 110, 155, 185)
* **Severidad:** **ALTO**
* **Motivo:** SHA-256 es una función hash criptográfica de un solo paso diseñada para velocidad de cómputo, no para almacenamiento de contraseñas. Es vulnerable a ataques de fuerza bruta mediante aceleración por GPU.
* **Solución recomendada:** Implementar un esquema KDF más resistente (ej. PBKDF2 con iteraciones elevadas mediante APIs compatibles con Expo/React Native) y una estrategia de migración al vuelo para cuentas preexistentes (migración transparente al iniciar sesión).

---

### 3. [DEP-01] Desalineación de paquetes con Expo SDK 57
* **Archivo:** `package.json`
* **Severidad:** **ALTO**
* **Motivo:** `npx expo-doctor` detecta un desajuste mayor (`@react-native-async-storage/async-storage` en 3.1.1 en lugar de 2.2.0) y más de 20 paquetes desfasados en versión patch respecto a Expo SDK 57.
* **Solución recomendada:** Normalizar las dependencias a las versiones estables recomendadas por Expo SDK 57 usando `npx expo install --fix` y fijar las dependencias compatibles.

---

### 4. [TS-01] Error de importación `getReactNativePersistence` en Firebase Auth
* **Archivo:** `src/config/firebase.ts` (Línea 3)
* **Severidad:** **ALTO**
* **Motivo:** El paquete `firebase/auth` en su versión modular no exporta `getReactNativePersistence` en los tipos TypeScript por defecto, lo que arroja `error TS2305: Module '"firebase/auth"' has no exported member 'getReactNativePersistence'` y detiene la compilación limpia del proyecto.
* **Solución recomendada:** Corregir el adaptador de persistencia para React Native de modo que compile perfectamente en TypeScript y opere correctamente tanto en plataformas nativas como en web.

---

### 5. [DB-01] Migraciones SQLite informales con excepciones silenciadas
* **Archivo:** `src/db/database.ts` (Líneas 26-41)
* **Severidad:** **ALTO**
* **Motivo:** Se ejecutan sentencias `ALTER TABLE` dentro de un bucle capturando todas las excepciones con `catch (_) {}`. Esto oculta errores graves de base de datos, no registra la versión actual del esquema (`schema_version`) y no permite auditorías.
* **Solución recomendada:** Crear un sistema formal de migraciones versionadas (`schema_migrations`), verificando la versión actual en la base de datos y aplicando ordenadamente únicamente las migraciones pendientes con manejo explícito de errores y logging.

---

### 6. [DB-02] Integridad referencial desactivada en SQLite
* **Archivo:** `src/db/database.ts` (Líneas 10-24)
* **Severidad:** **ALTO**
* **Motivo:** Por defecto, SQLite en motores móviles tiene deshabilitada la verificación de claves foráneas. No se invoca `PRAGMA foreign_keys = ON;`, por lo que la relación `FOREIGN KEY (usuario_id) REFERENCES usuarios(id)` en la tabla `progreso` no se valida, permitiendo inserciones huérfanas.
* **Solución recomendada:** Ejecutar inmediatamente `PRAGMA foreign_keys = ON;` al abrir la conexión en `getDb()`.

---

### 7. [DB-03] Concurrencia e inicialización en `getDb()`
* **Archivo:** `src/db/database.ts` (Líneas 10-13)
* **Severidad:** **MEDIO**
* **Motivo:** La variable `dbInstance` se asigna tras la resolución asíncrona de `openDatabaseAsync`. Llamadas concurrentes simultáneas al inicio de la aplicación pueden provocar que se abran múltiples conexiones o se intenten migraciones paralelas.
* **Solución recomendada:** Implementar un bloqueo mediante una promesa de inicialización única (`dbPromise`).

---

### 8. [ARC-01] Falta de sincronización Offline-First con Firebase
* **Archivo:** `src/services/`
* **Severidad:** **ALTO**
* **Motivo:** El proyecto tiene configurado Firebase pero no existe ninguna integración entre SQLite y Firestore. Si un alumno acumula puntos o realiza retos sin internet, estos datos nunca se sincronizan con la nube cuando regresa la conectividad.
* **Solución recomendada:** Implementar un servicio de sincronización (`syncService.ts`) que gestione una tabla `cola_sincronizacion` en SQLite y replique cambios a Firestore con estrategia de resolución de conflictos por timestamp (`updatedAt`).

---

### 9. [SEC-03] Reglas de seguridad de Firestore ausentes
* **Archivo:** Raíz del proyecto (`firestore.rules`)
* **Severidad:** **ALTO**
* **Motivo:** No existen reglas declaradas para el backend de Firebase, lo que expondría los datos de los usuarios si Firestore se activa con reglas por defecto.
* **Solución recomendada:** Crear `firestore.rules` con validaciones estrictas por usuario y verificación de rol administrativo.

---

### 10. [AI-01] Nombre de modelo inválido en Gemini AI
* **Archivo:** `src/services/gemini.ts` (Línea 18)
* **Severidad:** **MEDIO**
* **Motivo:** Se especifica el modelo `'gemini-3.5-flash-lite'`, el cual no existe en la API oficial de Google Generative AI (debe ser `gemini-1.5-flash` o `gemini-2.0-flash`), lo cual provocará un error de API en tiempo de ejecución.
* **Solución recomendada:** Actualizar al modelo oficial `gemini-1.5-flash` y agregar manejo de reintentos y timeouts.

---

### 11. [TS-02] Errores sintácticos de estilos y tipado en pantallas
* **Archivos:** `src/app/(auth)/login.tsx`, `src/app/(tabs)/admin.tsx`, `src/components/TarjetaEnfermedad.tsx`
* **Severidad:** **MEDIO**
* **Motivo:**
  - Uso de `StyleSheet.absoluteFillObject` en lugar de `StyleSheet.absoluteFill`.
  - Paso de `borderRadius` como propiedad directa de componente a `<LinearGradient>`.
* **Solución recomendada:** Corregir los estilos y las propiedades JSX según las firmas oficiales de `expo-linear-gradient` y `react-native`.

---

### 12. [AUD-01 & AUD-02] Fugas en Audio y Síntesis de Voz
* **Archivo:** `src/app/(tabs)/asistente.tsx`
* **Severidad:** **MEDIO**
* **Motivo:**
  - No se invoca `Speech.stop()` al desmontar la pantalla, permitiendo que el audio continúe reproduciéndose si el usuario cambia de pestaña.
  - La referencia a la grabación activa queda atrapada en el estado inicial de React, imposibilitando la cancelación de la grabación en el desmontaje si el usuario sale antes de detenerla.
* **Solución recomendada:** Usar referencias mutables (`useRef`) y ejecutar `Speech.stop()` y `recordingRef.current.stopAndUnloadAsync()` en la función de limpieza del `useEffect`.

---

### 13. [NAV-01] Error de rutas tipadas en Expo Router
* **Archivos:** `src/app/(tabs)/admin.tsx`, `src/app/enfermedad/[id].tsx`
* **Severidad:** **MEDIO**
* **Motivo:** Invocación de `router.replace('/(tabs)/')` (con barra final) la cual no es reconocida por el sistema de rutas tipadas (`typedRoutes: true`).
* **Solución recomendada:** Reemplazar por la ruta exacta tipada `/(tabs)` o `/`.

---

### 14. [TYP-01] Dispersión de interfaces TypeScript
* **Archivos:** Múltiples componentes y pantallas
* **Severidad:** **MEJORA**
* **Motivo:** Interfaces de `User`, `Usuario`, `Question`, etc., duplicadas y dispares entre archivos.
* **Solución recomendada:** Crear `src/types/index.ts` con todos los contratos de tipos unificados.

---

### 15. [PDF-01] Arquitectura de Procesamiento de PDF
* **Archivo:** `scripts/extractPdfs.js` / `src/services/`
* **Severidad:** **MEJORA**
* **Motivo:** `pdf-parse` es una librería específica para scripts de extracción en Node.js, pero la arquitectura debe formalizar un servicio para procesar fragmentos, limpiar texto y prepararlo para Gemini.
* **Solución recomendada:** Crear un servicio `pdfService.ts` que desacople la lógica de extracción, segmentación por fragmentos y paso controlado a la IA.
