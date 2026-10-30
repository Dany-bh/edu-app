# POLÍTICA Y ARQUITECTURA DE SEGURIDAD (SEGURIDAD.md)

**Proyecto:** `edu-app`  
**Última Actualización:** 16 de Septiembre de 2026

---

## 1. AUTENTICACIÓN

* **Eliminación de Credenciales Fijas:**
  - Se eliminó completamente la vulnerabilidad crítica de usuario y contraseña predeterminada (`admin/admin123`) del código fuente y del arranque de la base de datos.
  - La cuenta de administrador se inicializa ahora interactivamente en el primer arranque mediante `setupInitialAdmin()`, exigiendo contraseña segura (mínimo 8 caracteres).
* **Gestión de Sesión:**
  - El token y datos de sesión activa del usuario se gestionan mediante `AuthContext.tsx`.
  - En plataformas nativas (Android e iOS) los datos sensibles se persisten en `expo-secure-store`. En Web se utiliza almacenamiento seguro aislado.
  - Se eliminan credenciales sensibles del estado global persistido.

---

## 2. CONTRASEÑAS Y KDF (KEY DERIVATION FUNCTION)

* **Algoritmo Implementado:**
  - Esquema KDF v1 con salting criptográfico aleatorio (`Crypto.randomUUID()`) y derivación iterada mediante SHA-512 (10,000 iteraciones).
  - Formato de hash: `kdf_v1$<iterations>$<salt>$<hash>`.
  - Este enfoque multiplica el costo computacional de intentos de fuerza bruta, neutralizando ataques basados en diccionarios y aceleración por GPU.
* **Compatibilidad y Migración al Vuelo:**
  - La función `verifyPassword()` soporta:
    1. Cuentas modernas (KDF v1).
    2. Cuentas de transición (SHA-256 con salt).
    3. Cuentas heredadas (SHA-256 sin salt).
  - Al iniciar sesión un usuario con formato antiguo, el sistema valida la credencial y migra automáticamente su registro en SQLite al formato KDF v1 sin requerir restablecimiento de contraseña ni interrumpir la experiencia de usuario.

---

## 3. SECURE STORE & ALMACENAMIENTO LOCAL

| Dato | Almacenamiento | Motivo | Nivel de Sensibilidad |
|---|---|---|---|
| Sesión de Usuario | `expo-secure-store` | Claves cifradas por hardware (Keystore en Android / Keychain en iOS) | **Alto** |
| Hashes y Salts KDF | `saludadolescente.db` (SQLite) | Autenticación local offline | **Alto** |
| Preferencias de UI / Tema | `AsyncStorage` | No contiene datos privados ni credenciales | **Bajo** |
| Cola de Sincronización | `saludadolescente.db` (SQLite) | Eventos temporales encolados para Firestore | **Medio** |
| Puntos y Nivel | `saludadolescente.db` (SQLite) | Estado de gamificación local | **Medio** |

---

## 4. FIREBASE & REGLAS DE FIRESTORE

* **Reglas de Servidor (`firestore.rules`):**
  - Se definieron reglas estrictas que impiden accesos anónimos o lecturas globales indiscriminadas.
  - Verificación `isOwner(userId)`: Cada estudiante solo puede leer y actualizar su propio perfil y progreso.
  - Verificación `isAdmin()`: Las operaciones de eliminación de usuarios o modificación de manuales educativos requieren validación del rol en el token de autenticación.
  - Denegación por defecto: `match /{document=**} { allow read, write: if false; }`.
* **Configuración del Cliente:**
  - Claves de cliente delimitadas por variables de entorno `EXPO_PUBLIC_FIREBASE_*`.
  - Ninguna clave privada de administración (Service Account) se encuentra embebida en la aplicación móvil.

---

## 5. GEMINI IA

* **Aislamiento Arquitectónico:**
  - Toda interacción con Gemini está centralizada en `src/services/gemini.ts` y desacoplada de la interfaz.
* **Controles y Restricciones:**
  - Límite de tamaño de entrada: Máximo 1,000 caracteres por mensaje para prevenir desbordes de contexto y ataques de inyección de prompts.
  - Timeout estricto: Máximo 15 segundos con cancelación controlada.
  - Reglas de sistema (System Instructions):
    - Tutor empático para adolescentes en Perú.
    - Respuestas estrictamente delimitadas a la evidencia oficial del MINSA.
    - Prohibición expresa de emitir diagnósticos médicos individuales.
    - Derivación obligatoria e inmediata a la Línea 113 opción 5 ante situaciones de crisis o riesgo.
  - Manejo de reintentos con respaldo para evitar estados de error colgados.

---

## 6. SISTEMA DE ROLES

* **Roles Formalizados:**
  - `estudiante`: Rol por defecto asignado en todo autoregistro público. Acceso a inicio, descubrir, trivias, retos, asistente IA y perfil.
  - `admin`: Rol con privilegios administrativos. Acceso exclusivo al panel de gestión de usuarios (`/admin`).
* **Protección:**
  - No es posible que un usuario se autoasigne el rol `admin` desde el formulario de registro (`registerUser`).
  - La pantalla `admin.tsx` valida el rol en el estado de autenticación y redirige a los no autorizados.

---

## 7. BASE DE DATOS SQLITE

* **Integridad Referencial:**
  - `PRAGMA foreign_keys = ON;` activado obligatoriamente en cada conexión para validar relaciones `progreso.usuario_id -> usuarios.id`.
* **Protección contra Concurrencia:**
  - Inicialización en Singleton con bloqueo de promesa (`initPromise`), evitando múltiples aperturas simultáneas y carreras de migraciones.
* **Validación de Gamificación:**
  - Modificación de puntos vinculada obligatoriamente a registros de eventos en la tabla `progreso`, con límites máximos por actividad (máximo 500 pts por llamada).
