# REGISTRO DE MIGRACIONES DE BASE DE DATOS (SQLITE)

**Base de datos:** `saludadolescente.db`  
**Motor:** `expo-sqlite` con `PRAGMA foreign_keys = ON;`

---

## ESTRUCTURA DEL SISTEMA DE MIGRACIONES

El sistema de migraciones se gestiona mediante la tabla interna:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  aplicado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Cada migración se ejecuta secuencialmente dentro de una transacción lógica y no vuelve a repetirse si ya fue registrada en `schema_migrations`.

---

## HISTORIAL DE VERSIONES

### Versión 1: `create_initial_tables`
* **Descripción:** Creación de la tabla principal `usuarios`.
* **Esquema:**
  ```sql
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_completo TEXT NOT NULL,
    usuario TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    grado TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  ```
* **Compatibilidad:** Compatible con la versión inicial del proyecto.

---

### Versión 2: `add_user_attributes`
* **Descripción:** Incorporación de atributos de gamificación y perfil de usuario con verificación previa de columnas existentes mediante `PRAGMA table_info(usuarios);`.
* **Columnas añadidas:**
  - `genero TEXT DEFAULT 'Otro'`
  - `rol TEXT DEFAULT 'estudiante'`
  - `salt TEXT DEFAULT ''`
  - `puntos INTEGER DEFAULT 0`
  - `nivel INTEGER DEFAULT 1`
* **Compatibilidad:** 100% retrocompatible. No modifica registros previos ni elimina datos de usuarios ya creados.

---

### Versión 3: `create_progreso_table`
* **Descripción:** Creación de la tabla `progreso` vinculada a la tabla `usuarios` mediante clave foránea explícita.
* **Esquema:**
  ```sql
  CREATE TABLE IF NOT EXISTS progreso (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    puntos INTEGER DEFAULT 0,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );
  ```
* **Compatibilidad:** Permite auditar el historial de puntos obtenidos por retos, quizzes y actividades educativas.

---

### Versión 4: `create_sync_queue_table`
* **Descripción:** Creación de la cola de sincronización Offline-First (`cola_sincronizacion`) para replicación asíncrona hacia Firebase Firestore.
* **Esquema:**
  ```sql
  CREATE TABLE IF NOT EXISTS cola_sincronizacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tabla TEXT NOT NULL,
    registro_id TEXT NOT NULL,
    accion TEXT NOT NULL,
    datos TEXT NOT NULL,
    intentos INTEGER DEFAULT 0,
    estado TEXT DEFAULT 'pendiente',
    error_mensaje TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    sincronizado_en DATETIME
  );
  ```
* **Compatibilidad:** Nueva infraestructura que opera en segundo plano sin interrumpir la experiencia de usuario.

---

### Versión 5: `create_indexes`
* **Descripción:** Creación de índices estratégicos para optimizar el rendimiento de lecturas y consultas frecuentes.
* **Índices creados:**
  - `idx_usuarios_usuario`: Búsqueda rápida por nombre de usuario durante el login.
  - `idx_usuarios_rol`: Filtrado por rol ('admin' o 'estudiante').
  - `idx_progreso_usuario`: Agrupación y consulta de historial de puntos por estudiante.
  - `idx_progreso_fecha`: Consultas temporales de progreso.
  - `idx_cola_sync_estado`: Filtrado rápido de elementos con estado `'pendiente'` en la sincronización.
