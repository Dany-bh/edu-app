// src/db/migrations.ts
import * as SQLite from 'expo-sqlite';

export interface Migration {
  version: number;
  name: string;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'create_initial_tables',
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre_completo TEXT NOT NULL,
          usuario TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          grado TEXT,
          fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    },
  },
  {
    version: 2,
    name: 'add_user_attributes',
    up: async (db) => {
      // Verificar columnas existentes antes de agregar
      const tableInfo = await db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(usuarios);"
      );
      const existingColumns = new Set(tableInfo.map((col) => col.name));

      if (!existingColumns.has('genero')) {
        await db.execAsync("ALTER TABLE usuarios ADD COLUMN genero TEXT DEFAULT 'Otro';");
      }
      if (!existingColumns.has('rol')) {
        await db.execAsync("ALTER TABLE usuarios ADD COLUMN rol TEXT DEFAULT 'estudiante';");
      }
      if (!existingColumns.has('salt')) {
        await db.execAsync("ALTER TABLE usuarios ADD COLUMN salt TEXT DEFAULT '';");
      }
      if (!existingColumns.has('puntos')) {
        await db.execAsync("ALTER TABLE usuarios ADD COLUMN puntos INTEGER DEFAULT 0;");
      }
      if (!existingColumns.has('nivel')) {
        await db.execAsync("ALTER TABLE usuarios ADD COLUMN nivel INTEGER DEFAULT 1;");
      }
    },
  },
  {
    version: 3,
    name: 'create_progreso_table',
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS progreso (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          usuario_id INTEGER NOT NULL,
          tipo TEXT NOT NULL,
          puntos INTEGER DEFAULT 0,
          fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        );
      `);
    },
  },
  {
    version: 4,
    name: 'create_sync_queue_table',
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS cola_sincronizacion (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tabla TEXT NOT NULL,
          registro_id TEXT NOT NULL,
          accion TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
          datos TEXT NOT NULL,  -- JSON serializado
          intentos INTEGER DEFAULT 0,
          estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'sincronizado', 'fallido'
          error_mensaje TEXT,
          creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
          sincronizado_en DATETIME
        );
      `);
    },
  },
  {
    version: 5,
    name: 'create_indexes',
    up: async (db) => {
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_usuarios_usuario ON usuarios(usuario);
        CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
        CREATE INDEX IF NOT EXISTS idx_progreso_usuario ON progreso(usuario_id);
        CREATE INDEX IF NOT EXISTS idx_progreso_fecha ON progreso(fecha);
        CREATE INDEX IF NOT EXISTS idx_cola_sync_estado ON cola_sincronizacion(estado);
      `);
    },
  },
  {
    version: 6,
    name: 'add_user_approval_and_password_resets',
    up: async (db) => {
      const tableInfo = await db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(usuarios);"
      );
      const existingColumns = new Set(tableInfo.map((col) => col.name));

      if (!existingColumns.has('estado')) {
        await db.execAsync("ALTER TABLE usuarios ADD COLUMN estado TEXT DEFAULT 'activo';");
      }

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS solicitudes_password (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          usuario_id INTEGER NOT NULL,
          usuario TEXT NOT NULL,
          nombre_completo TEXT NOT NULL,
          estado TEXT DEFAULT 'pendiente',
          nueva_password_temporal TEXT,
          fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
          fecha_atencion DATETIME,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_solicitudes_pw_estado ON solicitudes_password(estado);
        CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado);
      `);
    },
  },
  {
    version: 7,
    name: 'fix_previous_registrations_to_pending',
    up: async (db) => {
      // Cualquier estudiante registrado previamente debe figurar en 'pendiente' para ser aprobado
      await db.execAsync("UPDATE usuarios SET estado = 'pendiente' WHERE rol = 'estudiante';");
    },
  },
  {
    version: 8,
    name: 'update_admin_to_fernando_and_activate_all_students',
    up: async (db) => {
      // 2. Activar a todos los estudiantes para acceso directo e inmediato
      await db.execAsync(`
        UPDATE usuarios 
        SET estado = 'activo' 
        WHERE rol = 'estudiante';
      `);
    },
  },
  {
    version: 9,
    name: 'set_fernando_gonzales_zavaleta_owner_and_dany_student',
    up: async (db) => {
      // Ignorado por seguridad
    },
  },
  {
    version: 10,
    name: 'fix_dany_to_admin_rename_and_create_student_dany',
    up: async (db) => {
      // Ignorado por seguridad
    },
  },
  {
    version: 11,
    name: 'remove_duplicate_fernando_admin_account',
    up: async (db) => {
      // Ignorado por seguridad
    },
  },
  {
    version: 12,
    name: 'add_streak_and_activity_to_users',
    up: async (db) => {
      const tableInfo = await db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(usuarios);"
      );
      const existingColumns = new Set(tableInfo.map((col) => col.name));

      if (!existingColumns.has('racha_actual')) {
        await db.execAsync("ALTER TABLE usuarios ADD COLUMN racha_actual INTEGER DEFAULT 0;");
      }
      if (!existingColumns.has('racha_maxima')) {
        await db.execAsync("ALTER TABLE usuarios ADD COLUMN racha_maxima INTEGER DEFAULT 0;");
      }
      if (!existingColumns.has('ultimo_dia_activo')) {
        await db.execAsync("ALTER TABLE usuarios ADD COLUMN ultimo_dia_activo TEXT;");
      }
    },
  },
  {
    version: 13,
    name: 'add_consentimiento_fecha',
    up: async (db) => {
      const tableInfo = await db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(usuarios);"
      );
      const existingColumns = new Set(tableInfo.map((col) => col.name));

      if (!existingColumns.has('consentimiento_fecha')) {
        await db.execAsync("ALTER TABLE usuarios ADD COLUMN consentimiento_fecha DATETIME;");
      }
    },
  },
  {
    version: 14,
    name: 'add_retention_and_achievements_system',
    up: async (db) => {
      // 1. Tabla catálogo de logros
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS logros_catalogo (
          id TEXT PRIMARY KEY,
          titulo TEXT NOT NULL,
          descripcion TEXT NOT NULL,
          icono TEXT NOT NULL,
          categoria TEXT NOT NULL,
          xp_recompensa INTEGER DEFAULT 50,
          orden INTEGER DEFAULT 0
        );
      `);

      // 2. Sembrar catálogo de logros
      const { CATALOGO_LOGROS } = await import('../lib/gamificacion');
      for (const logro of CATALOGO_LOGROS) {
        await db.runAsync(
          `INSERT OR REPLACE INTO logros_catalogo (id, titulo, descripcion, icono, categoria, xp_recompensa, orden)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [logro.id, logro.titulo, logro.descripcion, logro.icono, logro.categoria, logro.xpRecompensa, logro.orden]
        );
      }

      // 3. Tabla logros desbloqueados por usuario
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS logros_usuario (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          usuario_id INTEGER NOT NULL,
          logro_id TEXT NOT NULL,
          desbloqueado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
          UNIQUE(usuario_id, logro_id)
        );
        CREATE INDEX IF NOT EXISTS idx_logros_usuario_uid ON logros_usuario(usuario_id);
        CREATE INDEX IF NOT EXISTS idx_logros_usuario_lid ON logros_usuario(logro_id);
      `);

      // 4. Columnas de retención en tabla usuarios
      const tableInfo = await db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(usuarios);"
      );
      const existingColumns = new Set(tableInfo.map((col) => col.name));

      if (!existingColumns.has('recordatorio_hora')) {
        await db.execAsync("ALTER TABLE usuarios ADD COLUMN recordatorio_hora TEXT DEFAULT '18:00';");
      }
      if (!existingColumns.has('recordatorio_activo')) {
        await db.execAsync("ALTER TABLE usuarios ADD COLUMN recordatorio_activo INTEGER DEFAULT 0;");
      }
      if (!existingColumns.has('congeladores_disponibles')) {
        await db.execAsync("ALTER TABLE usuarios ADD COLUMN congeladores_disponibles INTEGER DEFAULT 1;");
      }
      if (!existingColumns.has('congelador_ultimo_uso')) {
        await db.execAsync("ALTER TABLE usuarios ADD COLUMN congelador_ultimo_uso TEXT;");
      }
      if (!existingColumns.has('meta_diaria_completada_fecha')) {
        await db.execAsync("ALTER TABLE usuarios ADD COLUMN meta_diaria_completada_fecha TEXT;");
      }
    },
  },
  {
    version: 15,
    name: 'add_docente_role_and_prepost_system',
    up: async (db) => {
      // 1. Campo salón en usuarios
      const tableInfo = await db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(usuarios);"
      );
      const existingColumns = new Set(tableInfo.map((col) => col.name));

      if (!existingColumns.has('salon')) {
        await db.execAsync("ALTER TABLE usuarios ADD COLUMN salon TEXT DEFAULT '5to A';");
      }

      // Asegurar salón por defecto a estudiantes existentes
      await db.runAsync("UPDATE usuarios SET salon = '5to A' WHERE salon IS NULL OR salon = '';");

      // 2. Tabla de evaluaciones Pre-test y Post-test
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS evaluaciones_pre_post (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          usuario_id INTEGER NOT NULL,
          enfermedad_id TEXT NOT NULL,
          pre_puntaje INTEGER NOT NULL,
          pre_fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
          post_puntaje INTEGER,
          post_fecha DATETIME,
          mejora INTEGER,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
          UNIQUE(usuario_id, enfermedad_id)
        );
        CREATE INDEX IF NOT EXISTS idx_prepost_usuario ON evaluaciones_pre_post(usuario_id);
        CREATE INDEX IF NOT EXISTS idx_prepost_enfermedad ON evaluaciones_pre_post(enfermedad_id);
      `);

      // 3. Tabla de conteo anónimo de alertas de seguridad del asistente
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS alertas_seguridad (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          salon TEXT,
          fecha DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_alertas_salon ON alertas_seguridad(salon);
      `);

      // 4. Tabla de registro de errores por enfermedad en quizzes
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS registro_errores_enfermedad (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          enfermedad_id TEXT NOT NULL,
          salon TEXT,
          fecha DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_errores_enf ON registro_errores_enfermedad(enfermedad_id);
      `);
    },
  },
  {
    version: 16,
    name: 'ensure_fernando_admin_and_dany_student_accounts',
    up: async (db) => {
      const defaultHash = 'kdf_v1$10000$b5d0fa5f-5e3a-49a4-a8c2-3e87a0421798$2383d70a2b84b446b47149210b0e137cadbbe2e591898e560a1ed34c8edd73b6a9a2054f01931ffa3e2871763d5abf0cf01ac89682f6b86deb63acfde13a419c';
      const defaultSalt = 'b5d0fa5f-5e3a-49a4-a8c2-3e87a0421798';

      // 1. Asegurar al Administrador: Fernando Gonzales Zavaleta
      const adminRow = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM usuarios WHERE LOWER(usuario) = 'admin';"
      );
      if (adminRow) {
        await db.runAsync(
          "UPDATE usuarios SET nombre_completo = 'Fernando Gonzales Zavaleta', rol = 'admin', estado = 'activo', grado = 'Super Administrador', password_hash = ?, salt = ? WHERE id = ?;",
          [defaultHash, defaultSalt, adminRow.id]
        );
      } else {
        await db.runAsync(
          `INSERT INTO usuarios (nombre_completo, usuario, password_hash, salt, grado, genero, rol, estado, salon, puntos, nivel)
           VALUES ('Fernando Gonzales Zavaleta', 'admin', ?, ?, 'Super Administrador', 'Masculino', 'admin', 'activo', '5to A', 100, 1);`,
          [defaultHash, defaultSalt]
        );
      }

      // 2. Asegurar al Estudiante: Dany
      const danyRow = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM usuarios WHERE LOWER(usuario) = 'dany';"
      );
      if (danyRow) {
        await db.runAsync(
          "UPDATE usuarios SET nombre_completo = 'Dany', rol = 'estudiante', estado = 'activo', grado = '5to', salon = '5to A', password_hash = ?, salt = ? WHERE id = ?;",
          [defaultHash, defaultSalt, danyRow.id]
        );
      } else {
        await db.runAsync(
          `INSERT INTO usuarios (nombre_completo, usuario, password_hash, salt, grado, genero, rol, estado, salon, puntos, nivel)
           VALUES ('Dany', 'dany', ?, ?, '5to', 'Masculino', 'estudiante', 'activo', '5to A', 50, 1);`,
          [defaultHash, defaultSalt]
        );
      }
    },
  },
];

/**
 * Ejecuta el sistema de migraciones controladas sobre SQLite.
 */
export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Asegurar tabla de control de versiones
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      aplicado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const appliedRows = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM schema_migrations ORDER BY version ASC;'
  );
  const appliedVersions = new Set(appliedRows.map((r) => r.version));

  for (const migration of MIGRATIONS) {
    if (!appliedVersions.has(migration.version)) {
      try {
        console.log(`[DB Migration] Aplicando migración ${migration.version}: ${migration.name}`);
        await migration.up(db);
        await db.runAsync(
          'INSERT INTO schema_migrations (version, name) VALUES (?, ?);',
          [migration.version, migration.name]
        );
        console.log(`[DB Migration] Migración ${migration.version} completada.`);
      } catch (error) {
        console.error(`[DB Migration Error] Fallo al aplicar migración ${migration.version}:`, error);
        // No lanzar error fatal — continuar con las siguientes migraciones
        // para que la app pueda arrancar incluso si una migración individual falla
      }
    }
  }
}
