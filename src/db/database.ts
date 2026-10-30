// src/db/database.ts
import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';
import { hashPassword, verifyPassword } from './security';
import { User, UserRole, UserStatus, AuthResult, SolicitudPassword, EvaluacionPrePost, MetricasSaludSalon } from '../types';
import {
  calcularRacha,
  nivelDesdeXp,
  evaluarAntiFarmeo,
  evaluarMetaDiaria,
  evaluarCongeladorSemanal,
  evaluarLogros,
  CATALOGO_LOGROS,
  LogroCatalogoItem,
  EstadoUsuarioParaLogros,
} from '../lib/gamificacion';
import { 
  realtimeEvents, 
  EVENT_NEW_REGISTRATION, 
  EVENT_NEW_PASSWORD_REQUEST, 
  EVENT_USER_APPROVED, 
  EVENT_PASSWORD_RESOLVED 
} from '../services/realtimeEvents';
import { networkSync } from '../services/networkSync';
import sharedNetworkDb from '../data/shared_network_db.json';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Retorna la instancia única de SQLite garantizando inicialización segura y secuencial.
 * Activa claves foráneas y ejecuta migraciones pendientes.
 * En la Web, maneja reintentos con retraso para permitir que el navegador libere los locks de OPFS/VFS al recargar.
 */
export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const isWeb = Platform.OS === 'web';
    const maxRetries = isWeb ? 4 : 1;
    let lastError: any = null;

    for (let intento = 1; intento <= maxRetries; intento++) {
      try {
        const db = await SQLite.openDatabaseAsync('saludadolescente.db');
        
        // 1. Activar verificación de claves foráneas
        await db.execAsync('PRAGMA foreign_keys = ON;');

        // 2. Ejecutar sistema de migraciones formales
        await runMigrations(db);

        // 3. Sincronizar registros locales con el servidor Wi-Fi local
        networkSync.syncAllLocal(db).catch(() => {});

        dbInstance = db;
        return db;
      } catch (error: any) {
        lastError = error;
        const msg = String(error?.message || error);
        const esErrorVfsWeb = isWeb && (msg.includes('VFS') || msg.includes('lock') || msg.includes('AccessHandle') || msg.includes('Invalid'));

        if (esErrorVfsWeb && intento < maxRetries) {
          // El navegador está liberando el lock del Web Worker / OPFS del refresco anterior
          await new Promise(resolve => setTimeout(resolve, intento * 350));
          continue;
        }

        break;
      }
    }

    // Si en web persiste el bloqueo de VFS/OPFS tras refrescar la pestaña
    if (isWeb) {
      console.warn('[DB Web] Conflicto transitorio de VFS en navegador al recargar. Reintentando apertura suave...');
      try {
        await new Promise(resolve => setTimeout(resolve, 600));
        const dbRetry = await SQLite.openDatabaseAsync('saludadolescente.db');
        await dbRetry.execAsync('PRAGMA foreign_keys = ON;');
        await runMigrations(dbRetry);
        dbInstance = dbRetry;
        return dbRetry;
      } catch (retryErr) {
        console.warn('[DB Web] No fue posible adquirir el lock de saludadolescente.db en OPFS:', retryErr);
      }
    }

    console.warn('[DB Init Warning] La base de datos SQLite no pudo vincularse en este ciclo:', lastError);
    if (!isWeb) {
      throw lastError;
    }
    // En web, no tirar error fatal no capturado para no bloquear la interfaz
    return null as any;
  })();

  try {
    return await initPromise;
  } finally {
    if (!dbInstance) {
      initPromise = null;
    }
  }
};

// Cerrar conexión limpiamente al recargar la pestaña en navegador web para evitar bloqueos de VFS/OPFS
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  const cleanupDb = () => {
    if (dbInstance) {
      try {
        dbInstance.closeAsync().catch(() => {});
      } catch (_) {}
    }
  };
  window.addEventListener('beforeunload', cleanupDb);
  window.addEventListener('pagehide', cleanupDb);
}

/**
 * Verifica si existe algún usuario con rol de administrador registrado.
 */
export const hasAdminUser = async (): Promise<boolean> => {
  try {
    const db = await getDb();
    if (!db) return true;
    const row = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM usuarios WHERE rol = 'admin';"
    );
    return (row?.count || 0) > 0;
  } catch (err) {
    console.warn('[hasAdminUser] Advertencia al verificar administrador:', err);
    return true;
  }
};

/**
 * Registra o configura de manera segura la cuenta del administrador inicial.
 * No utiliza contraseñas fijas ni valores hardcodeados en el código.
 */
export const setupInitialAdmin = async (
  nombre: string,
  usuario: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  if (password.length < 8) {
    return { success: false, error: 'La contraseña del administrador debe tener al menos 8 caracteres' };
  }
  if (!usuario.trim() || !nombre.trim()) {
    return { success: false, error: 'Todos los campos son obligatorios' };
  }

  const db = await getDb();
  const existingAdmin = await hasAdminUser();
  if (existingAdmin) {
    return { success: false, error: 'Ya existe un administrador en el sistema' };
  }

  const { hash, salt } = await hashPassword(password);

  try {
    await db.runAsync(
      `INSERT INTO usuarios (nombre_completo, usuario, password_hash, salt, grado, genero, rol)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [nombre.trim(), usuario.trim().toLowerCase(), hash, salt, 'Administración', 'Otro', 'admin']
    );

    // Encolar evento de sincronización
    await queueSync(db, 'usuarios', usuario.trim().toLowerCase(), 'INSERT', {
      nombre_completo: nombre.trim(),
      usuario: usuario.trim().toLowerCase(),
      rol: 'admin',
      fecha_creacion: new Date().toISOString()
    });

    return { success: true };
  } catch (err: any) {
    console.error('[Admin Setup Error]', err);
    return { success: false, error: 'No se pudo crear la cuenta de administrador' };
  }
};

/**
 * Autentica un usuario verificando credenciales con KDF.
 * Valida si la cuenta ha sido aprobada por el administrador.
 * Si el usuario proviene de un esquema anterior (SHA-256), actualiza su hash al vuelo de forma transparente.
 */
export const authenticateUser = async (usuario: string, password: string): Promise<AuthResult> => {
  if (!usuario || !password) {
    return { success: false, error: 'Por favor ingresa usuario y contraseña' };
  }

  const db = await getDb();
  const cleanUsername = usuario.trim().toLowerCase();
  const lookupUsername = cleanUsername;

  // 1. Verificación instantánea en SQLite local (tarda < 2ms)
  let userRow = await db.getFirstAsync<{
    id: number;
    nombre_completo: string;
    usuario: string;
    grado: string;
    genero: string;
    rol: string;
    estado?: string;
    salon?: string | null;
    password_hash: string;
    salt: string;
    puntos: number;
    nivel: number;
    fecha_registro?: string;
    racha_actual?: number;
    racha_maxima?: number;
    ultimo_dia_activo?: string | null;
    recordatorio_hora?: string;
    recordatorio_activo?: number;
    congeladores_disponibles?: number;
    congelador_ultimo_uso?: string | null;
    meta_diaria_completada_fecha?: string | null;
  }>(
    'SELECT id, nombre_completo, usuario, grado, genero, rol, estado, salon, password_hash, salt, puntos, nivel, fecha_registro, racha_actual, racha_maxima, ultimo_dia_activo, recordatorio_hora, recordatorio_activo, congeladores_disponibles, congelador_ultimo_uso, meta_diaria_completada_fecha FROM usuarios WHERE LOWER(usuario) = ?;',
    [lookupUsername]
  );

  if (!userRow) {
    // 1. Comprobar si es un usuario preconfigurado en shared_network_db.json
    try {
      const seedUser = (sharedNetworkDb.usuarios as any[])?.find(
        (u) => u.usuario.toLowerCase() === cleanUsername
      );
      if (seedUser && seedUser.password_hash) {
        try {
          await db.runAsync(
            `INSERT OR REPLACE INTO usuarios (nombre_completo, usuario, password_hash, salt, grado, genero, rol, estado, salon, puntos, nivel)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              seedUser.nombre_completo,
              seedUser.usuario.toLowerCase(),
              seedUser.password_hash,
              seedUser.salt || '',
              seedUser.grado || '5to',
              seedUser.genero || 'Otro',
              seedUser.rol || 'estudiante',
              seedUser.estado || 'activo',
              seedUser.salon ?? null,
              seedUser.puntos || 50,
              seedUser.nivel || 1
            ]
          );
        } catch (_) {}

        userRow = await db.getFirstAsync<any>(
          'SELECT id, nombre_completo, usuario, grado, genero, rol, estado, salon, password_hash, salt, puntos, nivel, fecha_registro, racha_actual, racha_maxima, ultimo_dia_activo, recordatorio_hora, recordatorio_activo, congeladores_disponibles, congelador_ultimo_uso, meta_diaria_completada_fecha FROM usuarios WHERE LOWER(usuario) = ?;',
          [cleanUsername]
        );

        if (!userRow) {
          userRow = {
            id: seedUser.id,
            nombre_completo: seedUser.nombre_completo,
            usuario: seedUser.usuario.toLowerCase(),
            grado: seedUser.grado || '5to',
            genero: seedUser.genero || 'Masculino',
            rol: seedUser.rol || 'estudiante',
            estado: 'activo',
            salon: seedUser.salon ?? null,
            password_hash: seedUser.password_hash,
            salt: seedUser.salt || '',
            puntos: seedUser.puntos || 50,
            nivel: seedUser.nivel || 1
          };
        }
      }
    } catch (_) {}
  }

  if (!userRow) {
    // Si no existe localmente, comprobar si fue creado en el servidor
    try {
      const netData = await networkSync.fetchNetworkData();
      if (netData) {
        const remoteUser = netData.activeUsers.find(
          u => u.usuario.toLowerCase() === cleanUsername
        );
        if (remoteUser && (remoteUser as any).password_hash) {
          await db.runAsync(
            'INSERT OR REPLACE INTO usuarios (nombre_completo, usuario, password_hash, salt, grado, genero, rol, estado, salon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
            [remoteUser.nombre_completo, remoteUser.usuario.toLowerCase(), (remoteUser as any).password_hash, (remoteUser as any).salt || '', remoteUser.grado || '', remoteUser.genero || 'Otro', remoteUser.rol, 'activo', remoteUser.salon ?? null]
          );
          userRow = await db.getFirstAsync<any>(
            'SELECT id, nombre_completo, usuario, grado, genero, rol, estado, salon, password_hash, salt, puntos, nivel, fecha_registro, racha_actual, racha_maxima, ultimo_dia_activo FROM usuarios WHERE LOWER(usuario) = ?;',
            [cleanUsername]
          );
        }
      }
    } catch (_) {}
  }

  if (!userRow) {
    // Intentar buscar en Firebase Firestore si existe en la Nube (Backup)
    try {
      const firebaseConfig = require('../config/firebase');
      const firestoreDb = firebaseConfig.db;
      if (firestoreDb) {
        const { collection, query, where, getDocs } = require('firebase/firestore');
        const usersRef = collection(firestoreDb, 'usuarios');
        const q = query(usersRef, where('usuario', '==', cleanUsername));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const remoteUser = querySnapshot.docs[0].data();
          if (remoteUser.password_hash) {
            await db.runAsync(
              'INSERT OR REPLACE INTO usuarios (nombre_completo, usuario, password_hash, salt, grado, genero, rol, estado, puntos, nivel, salon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
              [
                remoteUser.nombre_completo, 
                remoteUser.usuario, 
                remoteUser.password_hash, 
                remoteUser.salt || '', 
                remoteUser.grado || '', 
                remoteUser.genero || 'Otro', 
                remoteUser.rol || 'estudiante', 
                remoteUser.estado || 'activo',
                remoteUser.puntos || 0,
                remoteUser.nivel || 1,
                remoteUser.salon ?? null
              ]
            );
            userRow = await db.getFirstAsync<any>(
              'SELECT id, nombre_completo, usuario, grado, genero, rol, estado, salon, password_hash, salt, puntos, nivel, fecha_registro, racha_actual, racha_maxima, ultimo_dia_activo FROM usuarios WHERE LOWER(usuario) = ?;',
              [cleanUsername]
            );
          }
        }
      }
    } catch (fbErr) {
      console.warn('[Firebase Auth] Error intentando recuperar usuario de la nube:', fbErr);
    }
  }

  if (!userRow) {
    return { success: false, error: 'Usuario o contraseña incorrectos' };
  }

  let { isValid, needsUpgrade } = await verifyPassword(
    password,
    userRow.password_hash,
    userRow.salt
  );

  if (!isValid) {
    return { success: false, error: 'Usuario o contraseña incorrectos' };
  }

  const networkData = await networkSync.fetchNetworkData();
  const inactiveOnServer = (networkData?.inactiveUsers || []).some(
    (remoteUser) => remoteUser.usuario.toLowerCase() === cleanUsername
  );

  // Comprobar estado de aprobación del usuario
  let userStatus = (userRow.estado || 'activo') as UserStatus;
  if (userStatus === 'inactivo' || inactiveOnServer) {
    return {
      success: false,
      status: 'inactivo',
      error: 'Tu cuenta se encuentra desactivada. Contacta al administrador.'
    };
  }

  if (userRow.rol === 'docente' && userStatus === 'pendiente') {
    return {
      success: false,
      status: 'pendiente',
      error: 'Tu cuenta de docente está pendiente de aprobación por el administrador del colegio.'
    };
  }

  if (userStatus === 'pendiente') {
    userStatus = 'activo';
    await db.runAsync("UPDATE usuarios SET estado = 'activo' WHERE id = ?;", [userRow.id]);
  }

  if (userStatus === 'rechazado') {
    return {
      success: false,
      status: 'rechazado',
      error: 'Tu solicitud de registro ha sido rechazada por el administrador.'
    };
  }

  // Migración transparente al nuevo estándar KDF seguro
  if (needsUpgrade) {
    try {
      const { hash: newHash, salt: newSalt } = await hashPassword(password);
      await db.runAsync(
        'UPDATE usuarios SET password_hash = ?, salt = ? WHERE id = ?;',
        [newHash, newSalt, userRow.id]
      );
      console.log(`[Security Upgrade] Usuario '${cleanUsername}' migrado a KDF v1.`);
    } catch (upgradeErr) {
      console.warn('[Security Upgrade Warn] No se pudo migrar el hash en este inicio de sesión:', upgradeErr);
    }
  }

  // Sincronizar puntos de red en segundo plano sin retrasar el acceso.
  if (networkData) {
    const remoteUser = networkData.activeUsers.find(
        u => u.usuario.toLowerCase() === cleanUsername
    );
    if (remoteUser && typeof remoteUser.puntos === 'number' && remoteUser.puntos > (userRow.puntos || 0)) {
      db.runAsync('UPDATE usuarios SET puntos = ?, nivel = ? WHERE id = ?;', [
          remoteUser.puntos,
          Math.max(userRow.nivel || 1, remoteUser.nivel || 1),
          userRow.id,
      ]).catch(() => {});
    }
  }

  const rolMapeado: UserRole = 
    userRow.rol === 'admin' ? 'admin' :
    userRow.rol === 'docente' ? 'docente' : 'estudiante';

  return {
    success: true,
    status: 'activo',
    user: {
      id: userRow.id,
      nombre_completo: userRow.nombre_completo,
      usuario: userRow.usuario,
      grado: userRow.grado,
      genero: userRow.genero,
      rol: rolMapeado,
      estado: userStatus,
      salon: userRow.salon ?? null,
      puntos: userRow.puntos || 0,
      nivel: userRow.nivel || 1,
      fecha_registro: userRow.fecha_registro,
      racha_actual: userRow.racha_actual || 0,
      racha_maxima: userRow.racha_maxima || 0,
      ultimo_dia_activo: userRow.ultimo_dia_activo || null,
      recordatorio_hora: userRow.recordatorio_hora || '18:00',
      recordatorio_activo: userRow.recordatorio_activo ? 1 : 0,
      congeladores_disponibles: userRow.congeladores_disponibles ?? 1,
      congelador_ultimo_uso: userRow.congelador_ultimo_uso || null,
      meta_diaria_completada_fecha: userRow.meta_diaria_completada_fecha || null,
    },
  };
};

/**
 * Registra un nuevo estudiante en estado 'pendiente' de aprobación.
 */
export const registerUser = async (
  nombre: string,
  usuario: string,
  password: string,
  genero: string,
  consentimiento: boolean = false,
  rol: UserRole = 'estudiante',
  salon: string | null = null
): Promise<{ success: boolean; error?: string; message?: string }> => {
  if (password.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }
  const cleanUsername = usuario.trim().toLowerCase();
  if (cleanUsername.length < 3) {
    return { success: false, error: 'El nombre de usuario debe tener al menos 3 caracteres' };
  }
  if (!consentimiento) {
    return { success: false, error: 'Debes aceptar los términos de privacidad y consentimiento' };
  }

  const db = await getDb();

  const existing = await db.getFirstAsync(
    'SELECT id FROM usuarios WHERE LOWER(usuario) = ?;',
    [cleanUsername]
  );
  if (existing) {
    return { success: false, error: 'El nombre de usuario ya está en uso' };
  }

  const { hash, salt } = await hashPassword(password);
  const isoDate = new Date().toISOString();
  const estado: UserStatus = rol === 'docente' ? 'pendiente' : 'activo';
  const salonValue = salon?.trim() || null;

  try {
    const result = await db.runAsync(
      'INSERT INTO usuarios (nombre_completo, usuario, password_hash, salt, genero, rol, estado, salon, consentimiento_fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [nombre.trim(), cleanUsername, hash, salt, genero, rol, estado, salonValue, isoDate]
    );

    await queueSync(db, 'usuarios', cleanUsername, 'INSERT', {
      id: result.lastInsertRowId,
      nombre_completo: nombre.trim(),
      usuario: cleanUsername,
      genero,
      rol,
      estado,
      salon: salonValue,
      puntos: 0,
      nivel: 1,
      consentimiento_fecha: isoDate
    });

    // Notificar en tiempo real al panel administrativo para conteo en vivo
    realtimeEvents.emit(EVENT_NEW_REGISTRATION, {
      id: result.lastInsertRowId,
      nombre_completo: nombre.trim(),
      usuario: cleanUsername,
      genero,
      rol,
      salon: salonValue,
      estado
    });

    // Enviar por red Wi-Fi al servidor local
    networkSync.pushRegistration({
      id: result.lastInsertRowId,
      nombre_completo: nombre.trim(),
      usuario: cleanUsername,
      password_hash: hash,
      salt,
      genero,
      rol,
      estado,
      salon: salonValue
    }).catch(() => {});

    return { 
      success: true,
      message: rol === 'docente' 
        ? '¡Registro de docente enviado! Tu cuenta está en revisión y el administrador del colegio la activará pronto.'
        : '¡Registro exitoso! Tu cuenta ha sido creada y activada. Ya puedes iniciar sesión con tu usuario y contraseña.'
    };
  } catch (err: any) {
    console.error('[Register Error]', err);
    if (err.message?.includes('UNIQUE constraint failed')) {
      return { success: false, error: 'El nombre de usuario ya está en uso' };
    }
    return { success: false, error: 'No se pudo completar el registro' };
  }
};

/**
 * Crea un usuario directamente desde el panel administrativo (con estado 'activo').
 */
export const createUserAdmin = async (
  nombre: string,
  usuario: string,
  password: string,
  grado: string,
  genero: string,
  rol: string,
  salon: string | null = null
): Promise<{ success: boolean; error?: string }> => {
  if (password.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }

  const cleanUsername = usuario.trim().toLowerCase();
  const db = await getDb();
  const { hash, salt } = await hashPassword(password);

  const assignedRole: UserRole = rol === 'admin' ? 'admin' : (rol === 'docente' ? 'docente' : 'estudiante');

  try {
    const result = await db.runAsync(
      'INSERT INTO usuarios (nombre_completo, usuario, password_hash, salt, grado, genero, rol, estado, salon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [nombre.trim(), cleanUsername, hash, salt, grado, genero, assignedRole, 'activo', salon?.trim() || null]
    );

    await queueSync(db, 'usuarios', cleanUsername, 'INSERT', {
      id: result.lastInsertRowId,
      nombre_completo: nombre.trim(),
      usuario: cleanUsername,
      grado,
      genero,
      rol: assignedRole,
      estado: 'activo',
      salon: salon?.trim() || null
    });

    return { success: true };
  } catch (e: any) {
    if (e.message?.includes('UNIQUE constraint failed')) {
      return { success: false, error: 'El nombre de usuario ya existe' };
    }
    return { success: false, error: 'No se pudo crear el usuario' };
  }
};

/**
 * Obtiene usuarios con solicitudes de registro pendientes (estudiantes o docentes).
 */
export const getPendingUsers = async (): Promise<User[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    "SELECT id, nombre_completo, usuario, grado, genero, rol, estado, salon, puntos, nivel, fecha_registro FROM usuarios WHERE estado = 'pendiente' AND rol IN ('estudiante', 'docente') ORDER BY id DESC;"
  );
  return rows.map(r => ({
    id: r.id,
    nombre_completo: r.nombre_completo,
    usuario: r.usuario,
    grado: r.grado || '',
    genero: r.genero || 'Otro',
    rol: (r.rol === 'docente' ? 'docente' : 'estudiante') as UserRole,
    estado: (r.estado || 'pendiente') as UserStatus,
    salon: r.salon ?? null,
    puntos: r.puntos || 0,
    nivel: r.nivel || 1,
    fecha_registro: r.fecha_registro
  }));
};

export interface AdminStudentAccount {
  id: number;
  usuario: string;
  estado: 'activo' | 'inactivo';
}

export const getAdminStudentAccounts = async (): Promise<AdminStudentAccount[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<AdminStudentAccount>(
    "SELECT id, usuario, estado FROM usuarios WHERE rol = 'estudiante' AND estado IN ('activo', 'inactivo') ORDER BY usuario COLLATE NOCASE ASC;"
  );
  return rows;
};

const updateStudentAccountStatus = async (
  userId: number,
  expectedStatus: 'activo' | 'inactivo',
  nextStatus: 'activo' | 'inactivo'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const db = await getDb();
    const result = await db.runAsync(
      "UPDATE usuarios SET estado = ? WHERE id = ? AND rol = 'estudiante' AND estado = ?;",
      [nextStatus, userId, expectedStatus]
    );
    if (result.changes === 0) {
      return { success: false, error: 'No se pudo actualizar el estado de esta cuenta.' };
    }

    const account = await db.getFirstAsync<{ usuario: string }>(
      "SELECT usuario FROM usuarios WHERE id = ? AND rol = 'estudiante';",
      [userId]
    );
    if (account) {
      await queueSync(db, 'usuarios', account.usuario, 'UPDATE', { estado: nextStatus });
    }
    const synced = await networkSync.pushStudentStatus(db, userId);
    if (!synced) {
      console.warn('[Student Status Sync] El servidor local no confirmó el cambio; se conserva localmente para el modo offline.');
    }

    return { success: true };
  } catch (error) {
    console.error('[Student Status Update Error]', error);
    return { success: false, error: 'No se pudo actualizar el estado de esta cuenta.' };
  }
};

export const deactivateStudentAccount = (userId: number) =>
  updateStudentAccountStatus(userId, 'activo', 'inactivo');

export const reactivateStudentAccount = (userId: number) =>
  updateStudentAccountStatus(userId, 'inactivo', 'activo');

/**
 * Aprueba el registro de un estudiante (estado pasa a 'activo').
 */
export const approveUser = async (userId: number, username?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const db = await getDb();
    const cleanUsername = username ? username.trim().toLowerCase() : '';
    
    if (cleanUsername) {
      await db.runAsync("UPDATE usuarios SET estado = 'activo' WHERE id = ? OR LOWER(usuario) = ?;", [userId, cleanUsername]);
    } else {
      await db.runAsync("UPDATE usuarios SET estado = 'activo' WHERE id = ?;", [userId]);
    }

    const user = await db.getFirstAsync<{ id: number; usuario: string }>(
      cleanUsername 
        ? "SELECT id, usuario FROM usuarios WHERE LOWER(usuario) = ? OR id = ?;" 
        : "SELECT id, usuario FROM usuarios WHERE id = ?;",
      cleanUsername ? [cleanUsername, userId] : [userId]
    );

    const finalUsername = user?.usuario || cleanUsername;
    const finalUserId = user?.id || userId;

    if (finalUsername) {
      await queueSync(db, 'usuarios', finalUsername, 'UPDATE', { estado: 'activo' });
      try {
        await networkSync.pushApproval(finalUserId, finalUsername);
      } catch (_) {}
    }
    realtimeEvents.emit(EVENT_USER_APPROVED, { userId: finalUserId });
    return { success: true };
  } catch (e: any) {
    console.error('[Approve User Error]', e);
    return { success: false, error: 'No se pudo aprobar al usuario' };
  }
};

/**
 * Rechaza y elimina permanentemente la solicitud de un usuario.
 */
export const rejectUser = async (userId: number, username?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const db = await getDb();
    const cleanUsername = username ? username.trim().toLowerCase() : '';

    if (cleanUsername) {
      await db.runAsync("DELETE FROM usuarios WHERE id = ? OR LOWER(usuario) = ?;", [userId, cleanUsername]);
    } else {
      await db.runAsync("DELETE FROM usuarios WHERE id = ?;", [userId]);
    }

    try {
      await networkSync.pushReject(userId, cleanUsername);
    } catch (_) {}
    return { success: true };
  } catch (e: any) {
    console.error('[Reject User Error]', e);
    return { success: false, error: 'No se pudo rechazar la solicitud' };
  }
};

/**
 * Cambia la contraseña de cualquier usuario directamente (por parte del Administrador).
 */
export const adminChangeUserPassword = async (
  userId: number,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  if (newPassword.length < 6) {
    return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' };
  }
  try {
    const db = await getDb();
    const { hash, salt } = await hashPassword(newPassword);
    await db.runAsync(
      'UPDATE usuarios SET password_hash = ?, salt = ? WHERE id = ?;',
      [hash, salt, userId]
    );

    const userRow = await db.getFirstAsync<{ usuario: string }>('SELECT usuario FROM usuarios WHERE id = ?;', [userId]);
    if (userRow) {
      await queueSync(db, 'usuarios', userRow.usuario, 'UPDATE', { password_hash: hash, salt });
      networkSync.pushPasswordResolution({
        solicitudId: 0,
        userId,
        usuario: userRow.usuario,
        newPassword,
        newHash: hash,
        newSalt: salt
      } as any).catch(() => {});
    }

    return { success: true };
  } catch (e: any) {
    console.error('[Admin Change Password Error]', e);
    return { success: false, error: 'No se pudo cambiar la contraseña' };
  }
};

/**
 * Solicita el restablecimiento de contraseña (por parte del Estudiante en Login).
 */
export const requestPasswordReset = async (
  usuario: string
): Promise<{ success: boolean; error?: string; message?: string }> => {
  if (!usuario || !usuario.trim()) {
    return { success: false, error: 'Por favor ingresa tu nombre de usuario' };
  }
  const cleanUsername = usuario.trim().toLowerCase();
  try {
    const db = await getDb();
    const user = await db.getFirstAsync<{ id: number; nombre_completo: string }>(
      'SELECT id, nombre_completo FROM usuarios WHERE LOWER(usuario) = ?;',
      [cleanUsername]
    );
    if (!user) {
      return { success: false, error: 'No se encontró ninguna cuenta con ese usuario' };
    }

    // Verificar si ya tiene una solicitud pendiente
    const existing = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM solicitudes_password WHERE usuario_id = ? AND estado = 'pendiente';",
      [user.id]
    );
    if (existing) {
      return { 
        success: true, 
        message: 'Ya enviaste una solicitud previamente. El administrador la revisará pronto.' 
      };
    }

    await db.runAsync(
      `INSERT INTO solicitudes_password (usuario_id, usuario, nombre_completo, estado)
       VALUES (?, ?, ?, 'pendiente');`,
      [user.id, cleanUsername, user.nombre_completo]
    );

    // Notificar en tiempo real al panel administrativo
    realtimeEvents.emit(EVENT_NEW_PASSWORD_REQUEST, {
      usuario_id: user.id,
      usuario: cleanUsername,
      nombre_completo: user.nombre_completo,
    });

    // Enviar a servidor Wi-Fi local
    networkSync.pushPasswordRequest({
      usuario_id: user.id,
      usuario: cleanUsername,
      nombre_completo: user.nombre_completo,
    }).catch(() => {});

    return { 
      success: true, 
      message: 'Solicitud enviada al administrador. Tu profesor/administrador revisará tu solicitud y te asignará una nueva contraseña.' 
    };
  } catch (e: any) {
    console.error('[Request Reset Error]', e);
    return { success: false, error: 'No se pudo registrar la solicitud' };
  }
};

/**
 * Obtiene las solicitudes de restablecimiento de contraseña pendientes.
 */
export const getPendingPasswordRequests = async (): Promise<SolicitudPassword[]> => {
  const db = await getDb();
  return await db.getAllAsync<SolicitudPassword>(
    "SELECT id, usuario_id, usuario, nombre_completo, estado, nueva_password_temporal, fecha_solicitud, fecha_atencion FROM solicitudes_password WHERE estado = 'pendiente' ORDER BY id DESC;"
  );
};

/**
 * Resuelve una solicitud de restablecimiento asignando una nueva contraseña al estudiante.
 */
export const resolvePasswordReset = async (
  solicitudId: number,
  userId: number,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  if (newPassword.length < 6) {
    return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' };
  }
  try {
    const db = await getDb();
    const { hash, salt } = await hashPassword(newPassword);

    await db.runAsync(
      'UPDATE usuarios SET password_hash = ?, salt = ? WHERE id = ?;',
      [hash, salt, userId]
    );

    await db.runAsync(
      "UPDATE solicitudes_password SET estado = 'atendido', nueva_password_temporal = ?, fecha_atencion = CURRENT_TIMESTAMP WHERE id = ?;",
      [newPassword, solicitudId]
    );

    realtimeEvents.emit(EVENT_PASSWORD_RESOLVED, { solicitudId, userId });

    // Notificar al servidor Wi-Fi local
    try {
      await networkSync.pushPasswordResolution({
        solicitudId,
        userId,
        newPassword,
        newHash: hash,
        newSalt: salt,
      });
    } catch (_) {}

    return { success: true };
  } catch (e: any) {
    console.error('[Resolve Reset Error]', e);
    return { success: false, error: 'No se pudo actualizar la contraseña del estudiante' };
  }
};

/**
 * Rechaza y elimina permanentemente una solicitud de restablecimiento de contraseña.
 */
export const rejectPasswordReset = async (solicitudId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const db = await getDb();
    await db.runAsync("DELETE FROM solicitudes_password WHERE id = ?;", [solicitudId]);
    try {
      await networkSync.pushRejectPassword(solicitudId);
    } catch (_) {}
    return { success: true };
  } catch (e: any) {
    console.error('[Reject Reset Error]', e);
    return { success: false, error: 'No se pudo rechazar la solicitud' };
  }
};

/**
 * Actualiza los puntos, nivel y racha de un usuario en SQLite y registra el evento en progreso.
 */
export const updateUserPoints = async (
  userId: number,
  puntos: number,
  nivel: number,
  tipoEvento: string = 'actividad_educativa',
  streakData?: { racha_actual: number; racha_maxima: number; ultimo_dia_activo: string }
) => {
  const db = await getDb();
  
  // Transacción lógica para garantizar consistencia entre usuario y tabla progreso
  if (streakData) {
    await db.runAsync(
      'UPDATE usuarios SET puntos = ?, nivel = ?, racha_actual = ?, racha_maxima = ?, ultimo_dia_activo = ? WHERE id = ?;',
      [puntos, nivel, streakData.racha_actual, streakData.racha_maxima, streakData.ultimo_dia_activo, userId]
    );
  } else {
    await db.runAsync(
      'UPDATE usuarios SET puntos = ?, nivel = ? WHERE id = ?;',
      [puntos, nivel, userId]
    );
  }

  await db.runAsync(
    'INSERT INTO progreso (usuario_id, tipo, puntos) VALUES (?, ?, ?);',
    [userId, tipoEvento, puntos]
  );

  await queueSync(db, 'progreso', `${userId}_${Date.now()}`, 'INSERT', {
    usuario_id: userId,
    tipo: tipoEvento,
    puntos,
    nivel,
    streak: streakData,
    fecha: new Date().toISOString()
  });

  // Notificar al servidor en tiempo real
  networkSync.pushPoints(userId, '', puntos, nivel).catch(() => {});
};

/**
 * Consulta la XP acumulada hoy por el usuario para un tipo o prefijo de actividad (para control anti-farmeo).
 */
export const obtenerXpHoyPorTipo = async (userId: number, tipoPrefix: string): Promise<number> => {
  try {
    const db = await getDb();
    if (!db) return 0;
    const hoyIso = new Date().toISOString().split('T')[0];
    const row = await db.getFirstAsync<{ total: number }>(
      "SELECT COALESCE(SUM(puntos), 0) as total FROM progreso WHERE usuario_id = ? AND tipo LIKE ? AND fecha LIKE ?;",
      [userId, `${tipoPrefix}%`, `${hoyIso}%`]
    );
    return row?.total || 0;
  } catch (err) {
    console.warn('[AntiFarmeo DB] Error obteniendo XP acumulada:', err);
    return 0;
  }
};

/**
 * Verifica si el usuario ya respondió premiadamente una pregunta de reto en el día de hoy.
 */
export const haRespondidoPreguntaHoy = async (userId: number, preguntaId: string): Promise<boolean> => {
  try {
    const db = await getDb();
    if (!db) return false;
    const hoyIso = new Date().toISOString().split('T')[0];
    const tipoTarget = `reto:${preguntaId}`;
    const row = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM progreso WHERE usuario_id = ? AND tipo = ? AND fecha LIKE ?;",
      [userId, tipoTarget, `${hoyIso}%`]
    );
    return (row?.count || 0) > 0;
  } catch (err) {
    console.warn('[AntiFarmeo DB] Error verificando pregunta de hoy:', err);
    return false;
  }
};

/**
 * Registra un evento en la tabla progreso (por ejemplo para anti-farmeo o actividades específicas).
 */
export const registrarEventoProgreso = async (
  userId: number,
  tipo: string,
  puntos: number
): Promise<void> => {
  try {
    const db = await getDb();
    if (!db) return;
    await db.runAsync(
      'INSERT INTO progreso (usuario_id, tipo, puntos) VALUES (?, ?, ?);',
      [userId, tipo, puntos]
    );
  } catch (err) {
    console.warn('[Progreso DB] Error registrando evento en progreso:', err);
  }
};

/**
 * Encola un evento de sincronización para Firebase / Nube.
 */
async function queueSync(
  db: SQLite.SQLiteDatabase,
  tabla: string,
  registroId: string,
  accion: 'INSERT' | 'UPDATE' | 'DELETE',
  datos: Record<string, any>
) {
  try {
    await db.runAsync(
      'INSERT INTO cola_sincronizacion (tabla, registro_id, accion, datos) VALUES (?, ?, ?, ?);',
      [tabla, registroId, accion, JSON.stringify(datos)]
    );
  } catch (err) {
    console.warn('[SyncQueue Error] No se pudo encolar evento de sincronización:', err);
  }
}

/**
 * Obtiene la información completa de un usuario por su ID.
 */
export const obtenerUsuarioPorId = async (userId: number): Promise<User | null> => {
  const db = await getDb();
  if (!db) return null;
  const row = await db.getFirstAsync<any>(
    'SELECT id, nombre_completo, usuario, grado, genero, rol, estado, puntos, nivel, fecha_registro, racha_actual, racha_maxima, ultimo_dia_activo, recordatorio_hora, recordatorio_activo, congeladores_disponibles, congelador_ultimo_uso, meta_diaria_completada_fecha FROM usuarios WHERE id = ?;',
    [userId]
  );
  if (!row) return null;
  return {
    id: row.id,
    nombre_completo: row.nombre_completo,
    usuario: row.usuario,
    grado: row.grado || '',
    genero: row.genero || 'Otro',
    rol: row.rol,
    estado: row.estado,
    puntos: row.puntos || 0,
    nivel: row.nivel || 1,
    fecha_registro: row.fecha_registro,
    racha_actual: row.racha_actual || 0,
    racha_maxima: row.racha_maxima || 0,
    ultimo_dia_activo: row.ultimo_dia_activo || null,
    recordatorio_hora: row.recordatorio_hora || '18:00',
    recordatorio_activo: row.recordatorio_activo ? 1 : 0,
    congeladores_disponibles: row.congeladores_disponibles ?? 1,
    congelador_ultimo_uso: row.congelador_ultimo_uso || null,
    meta_diaria_completada_fecha: row.meta_diaria_completada_fecha || null,
  };
};

export interface LogroConEstado extends LogroCatalogoItem {
  desbloqueado: boolean;
  desbloqueadoEn?: string;
}

/**
 * Obtiene el catálogo completo de logros con el estado (bloqueado/desbloqueado) para un usuario.
 */
export const obtenerLogrosUsuario = async (userId: number): Promise<LogroConEstado[]> => {
  const db = await getDb();
  if (!db) {
    return CATALOGO_LOGROS.map((l) => ({
      ...l,
      desbloqueado: false,
    }));
  }
  try {
    const catalogoRows = await db.getAllAsync<any>(
      'SELECT id, titulo, descripcion, icono, categoria, xp_recompensa, orden FROM logros_catalogo ORDER BY orden ASC;'
    );
    const usuarioLogros = await db.getAllAsync<{ logro_id: string; desbloqueado_en: string }>(
      'SELECT logro_id, desbloqueado_en FROM logros_usuario WHERE usuario_id = ?;',
      [userId]
    );

    const mapaDesbloqueados = new Map(usuarioLogros.map((u) => [u.logro_id, u.desbloqueado_en]));
    const baseCatalogo = catalogoRows.length > 0 ? catalogoRows : CATALOGO_LOGROS;

    return baseCatalogo.map((cat: any) => ({
      id: cat.id,
      titulo: cat.titulo,
      descripcion: cat.descripcion,
      icono: cat.icono,
      categoria: cat.categoria,
      xpRecompensa: cat.xp_recompensa ?? cat.xpRecompensa ?? 50,
      orden: cat.orden ?? 0,
      desbloqueado: mapaDesbloqueados.has(cat.id),
      desbloqueadoEn: mapaDesbloqueados.get(cat.id),
    }));
  } catch (err) {
    console.warn('[Logros DB] Error obteniendo logros:', err);
    return CATALOGO_LOGROS.map((l) => ({
      ...l,
      desbloqueado: false,
    }));
  }
};

/**
 * Consulta el estado actual de la meta diaria del alumno (1 mini-reto + 1 ficha leída).
 */
export const obtenerEstadoMetaDiaria = async (
  userId: number
): Promise<{
  retosHoy: number;
  fichasLeidasHoy: number;
  metaCumplida: boolean;
  yaPremiadaHoy: boolean;
  progresoFraccion: number;
}> => {
  try {
    const db = await getDb();
    const hoyIso = new Date().toISOString().split('T')[0];

    const user = await db.getFirstAsync<{ meta_diaria_completada_fecha?: string | null }>(
      'SELECT meta_diaria_completada_fecha FROM usuarios WHERE id = ?;',
      [userId]
    );

    const retosRow = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM progreso WHERE usuario_id = ? AND tipo LIKE 'reto:%' AND fecha LIKE ?;",
      [userId, `${hoyIso}%`]
    );

    const fichasRow = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(DISTINCT tipo) as count FROM progreso WHERE usuario_id = ? AND tipo LIKE 'ficha_leida:%' AND fecha LIKE ?;",
      [userId, `${hoyIso}%`]
    );

    const retosHoy = retosRow?.count || 0;
    const fichasLeidasHoy = fichasRow?.count || 0;

    const evaluacion = evaluarMetaDiaria({
      retosHoy,
      fichasLeidasHoy,
      fechaUltimaCompletada: user?.meta_diaria_completada_fecha,
      fechaHoy: hoyIso,
    });

    return {
      retosHoy,
      fichasLeidasHoy,
      metaCumplida: evaluacion.cumplida,
      yaPremiadaHoy: evaluacion.yaPremiadaHoy,
      progresoFraccion: evaluacion.progresoFraccion,
    };
  } catch (err) {
    console.warn('[MetaDiaria DB] Error consultando meta diaria:', err);
    return {
      retosHoy: 0,
      fichasLeidasHoy: 0,
      metaCumplida: false,
      yaPremiadaHoy: false,
      progresoFraccion: 0,
    };
  }
};

/**
 * Actualiza la configuración de recordatorio local del usuario.
 */
export const actualizarConfigRecordatorio = async (
  userId: number,
  hora: string,
  activo: boolean
): Promise<void> => {
  const db = await getDb();
  const valActivo = activo ? 1 : 0;
  await db.runAsync(
    'UPDATE usuarios SET recordatorio_hora = ?, recordatorio_activo = ? WHERE id = ?;',
    [hora, valActivo, userId]
  );

  await queueSync(db, 'usuarios', `${userId}`, 'UPDATE', {
    recordatorio_hora: hora,
    recordatorio_activo: valActivo,
    actualizado_en: new Date().toISOString(),
  });
};

export type AccionGamificada =
  | { tipo: 'reto'; preguntaId: string; esCorrecta: boolean }
  | { tipo: 'ficha_leida'; enfermedadId: string }
  | { tipo: 'quiz'; enfermedadId: string; esPerfecto: boolean; score: number; total: number }
  | { tipo: 'pre_test_completado'; enfermedadId: string; puntaje: number }
  | { tipo: 'post_test_completado'; enfermedadId: string; puntaje: number; mejora: number }
  | { tipo: 'asistente' }
  | { tipo: 'evaluacion_imc' }
  | { tipo: 'manual_xp'; puntos: number; razon: string };

export interface ResultadoAccionGamificada {
  success: boolean;
  puntosGanados: number;
  puntosTotales: number;
  nivel: number;
  subioNivel: boolean;
  rachaActual: number;
  rachaMaxima: number;
  congeladoresDisponibles: number;
  metaDiariaCumplida: boolean;
  metaDiariaRecienCompletada: boolean;
  logrosDesbloqueados: LogroCatalogoItem[];
  avisoRacha: boolean;
}

/**
 * FUNCIÓN CENTRALIZADA DE GAMIFICACIÓN Y RETENCIÓN.
 * Toda entrega de XP, actualización de racha, evaluación de meta diaria y desbloqueo
 * de logros se procesa exclusivamente por esta función para garantizar consistencia.
 */
export const procesarAccionGamificada = async (
  userId: number,
  accion: AccionGamificada
): Promise<ResultadoAccionGamificada> => {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      puntosGanados: 0,
      puntosTotales: 0,
      nivel: 1,
      subioNivel: false,
      rachaActual: 0,
      rachaMaxima: 0,
      congeladoresDisponibles: 1,
      metaDiariaCumplida: false,
      metaDiariaRecienCompletada: false,
      logrosDesbloqueados: [],
      avisoRacha: false,
    };
  }
  const user = await obtenerUsuarioPorId(userId);

  if (!user) {
    return {
      success: false,
      puntosGanados: 0,
      puntosTotales: 0,
      nivel: 1,
      subioNivel: false,
      rachaActual: 0,
      rachaMaxima: 0,
      congeladoresDisponibles: 1,
      metaDiariaCumplida: false,
      metaDiariaRecienCompletada: false,
      logrosDesbloqueados: [],
      avisoRacha: false,
    };
  }

  const hoyIso = new Date().toISOString();
  const hoyStr = hoyIso.split('T')[0];

  // 1. Evaluar congelador semanal
  const congeladorEval = evaluarCongeladorSemanal(
    user.congeladores_disponibles ?? 1,
    user.congelador_ultimo_uso,
    hoyStr
  );
  let congeladoresDisp = congeladorEval.congeladoresDisponibles;
  let congeladorUltimoUso = user.congelador_ultimo_uso;

  // 2. Evaluar racha
  const rachaCalc = calcularRacha(
    user.ultimo_dia_activo,
    hoyStr,
    user.racha_actual || 0,
    user.racha_maxima || 0
  );

  let nuevaRachaActual = rachaCalc.rachaActual;
  let usoCongelador = false;
  if (rachaCalc.usoGracia) {
    if (congeladoresDisp > 0) {
      congeladoresDisp = 0;
      congeladorUltimoUso = hoyStr;
      usoCongelador = true;
    } else {
      nuevaRachaActual = 1;
    }
  }
  const nuevaRachaMaxima = Math.max(user.racha_maxima || 0, nuevaRachaActual);

  // 3. Determinar puntos a otorgar según la acción
  let puntosAccion = 0;
  let tipoRegistroProgreso = '';

  switch (accion.tipo) {
    case 'reto': {
      tipoRegistroProgreso = `reto:${accion.preguntaId}`;
      if (accion.esCorrecta) {
        const yaRespondida = await haRespondidoPreguntaHoy(userId, accion.preguntaId);
        if (!yaRespondida) {
          const xpHoy = await obtenerXpHoyPorTipo(userId, 'reto:');
          const evalAnti = evaluarAntiFarmeo({
            preguntaId: accion.preguntaId,
            xpAcumuladaHoy: xpHoy,
            tipoActividad: 'reto_diario',
            puntosPorAcierto: 50,
          });
          puntosAccion = evalAnti.puntosOtorgados;
        }
      }
      break;
    }
    case 'ficha_leida': {
      tipoRegistroProgreso = `ficha_leida:${accion.enfermedadId}`;
      const yaLeidaHoy = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM progreso WHERE usuario_id = ? AND tipo = ? AND fecha LIKE ?;",
        [userId, tipoRegistroProgreso, `${hoyStr}%`]
      );
      if (!yaLeidaHoy || yaLeidaHoy.count === 0) {
        puntosAccion = 25; // Recompensa por lectura
      }
      break;
    }
    case 'quiz': {
      tipoRegistroProgreso = `quiz:${accion.enfermedadId}`;
      puntosAccion = Math.min(100, Math.max(20, accion.score * 20));
      if (accion.esPerfecto) {
        await db.runAsync(
          'INSERT INTO progreso (usuario_id, tipo, puntos) VALUES (?, ?, ?);',
          [userId, `quiz_perfecto:${accion.enfermedadId}`, 0]
        );
      }
      break;
    }
    case 'asistente': {
      tipoRegistroProgreso = 'asistente_consulta';
      const yaUsoHoy = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM progreso WHERE usuario_id = ? AND tipo = 'asistente_consulta' AND fecha LIKE ?;",
        [userId, `${hoyStr}%`]
      );
      if (!yaUsoHoy || yaUsoHoy.count === 0) {
        puntosAccion = 15;
      }
      break;
    }
    case 'evaluacion_imc': {
      tipoRegistroProgreso = 'evaluacion_imc';
      const yaEvalHoy = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM progreso WHERE usuario_id = ? AND tipo = 'evaluacion_imc' AND fecha LIKE ?;",
        [userId, `${hoyStr}%`]
      );
      if (!yaEvalHoy || yaEvalHoy.count === 0) {
        puntosAccion = 40;
      }
      break;
    }
    case 'pre_test_completado': {
      tipoRegistroProgreso = `pre_test:${accion.enfermedadId}`;
      puntosAccion = 35;
      break;
    }
    case 'post_test_completado': {
      tipoRegistroProgreso = `post_test:${accion.enfermedadId}`;
      puntosAccion = Math.min(100, Math.max(30, (accion.puntaje || 3) * 15 + Math.max(0, (accion.mejora || 0) * 10)));
      break;
    }
    case 'manual_xp': {
      tipoRegistroProgreso = accion.razon || 'actividad_educativa';
      puntosAccion = Math.max(0, Math.min(accion.puntos, 500));
      break;
    }
  }

  // Registrar progreso de la acción
  if (tipoRegistroProgreso) {
    await db.runAsync(
      'INSERT INTO progreso (usuario_id, tipo, puntos) VALUES (?, ?, ?);',
      [userId, tipoRegistroProgreso, puntosAccion]
    );
  }

  // 4. Evaluar Meta Diaria (1 mini-reto + 1 ficha)
  const retosHoyRow = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM progreso WHERE usuario_id = ? AND tipo LIKE 'reto:%' AND fecha LIKE ?;",
    [userId, `${hoyStr}%`]
  );
  const fichasHoyRow = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(DISTINCT tipo) as count FROM progreso WHERE usuario_id = ? AND tipo LIKE 'ficha_leida:%' AND fecha LIKE ?;",
    [userId, `${hoyStr}%`]
  );

  const metaDiariaEval = evaluarMetaDiaria({
    retosHoy: retosHoyRow?.count || 0,
    fichasLeidasHoy: fichasHoyRow?.count || 0,
    fechaUltimaCompletada: user.meta_diaria_completada_fecha,
    fechaHoy: hoyStr,
  });

  let puntosMetaDiaria = 0;
  let metaDiariaRecienCompletada = false;
  let metaFecha = user.meta_diaria_completada_fecha;

  if (metaDiariaEval.debePremiar) {
    puntosMetaDiaria = metaDiariaEval.xpOtorgar;
    metaDiariaRecienCompletada = true;
    metaFecha = hoyStr;
    await db.runAsync(
      'INSERT INTO progreso (usuario_id, tipo, puntos) VALUES (?, ?, ?);',
      [userId, 'meta_diaria', puntosMetaDiaria]
    );
    await queueSync(db, 'progreso', `${userId}_meta_${hoyStr}`, 'INSERT', {
      usuario_id: userId,
      tipo: 'meta_diaria',
      puntos: puntosMetaDiaria,
      fecha: hoyIso,
    });
  }

  // 5. Total de XP provisional
  let puntosTotales = (user.puntos || 0) + puntosAccion + puntosMetaDiaria;
  let nivelActual = nivelDesdeXp(puntosTotales);

  // 6. Evaluar Logros
  const quizzesRow = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM progreso WHERE usuario_id = ? AND tipo LIKE 'quiz:%';",
    [userId]
  );
  const quizPerfRow = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM progreso WHERE usuario_id = ? AND tipo LIKE 'quiz_perfecto:%';",
    [userId]
  );
  const enfLeidasRows = await db.getAllAsync<{ tipo: string }>(
    "SELECT DISTINCT tipo FROM progreso WHERE usuario_id = ? AND tipo LIKE 'ficha_leida:%';",
    [userId]
  );
  const totalRetosRow = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM progreso WHERE usuario_id = ? AND tipo LIKE 'reto:%';",
    [userId]
  );
  const asistenteRow = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM progreso WHERE usuario_id = ? AND tipo LIKE 'asistente%';",
    [userId]
  );
  const evalImcRow = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM progreso WHERE usuario_id = ? AND tipo LIKE 'evaluacion_imc%';",
    [userId]
  );
  const metasDiariasRow = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM progreso WHERE usuario_id = ? AND tipo = 'meta_diaria';",
    [userId]
  );
  const logrosUsuarioRows = await db.getAllAsync<{ logro_id: string }>(
    'SELECT logro_id FROM logros_usuario WHERE usuario_id = ?;',
    [userId]
  );

  const enfermedadesLeidasIds = enfLeidasRows.map((r) => r.tipo.replace('ficha_leida:', ''));
  const logrosYaDesbloqueados = logrosUsuarioRows.map((r) => r.logro_id);

  const estadoLogros: EstadoUsuarioParaLogros = {
    quizzesCompletados: quizzesRow?.count || 0,
    tieneQuizPerfecto: (quizPerfRow?.count || 0) > 0,
    enfermedadesLeidasIds,
    totalRetosRespondidos: totalRetosRow?.count || 0,
    retosRespondidosHoy: retosHoyRow?.count || 0,
    rachaActual: nuevaRachaActual,
    rachaMaxima: nuevaRachaMaxima,
    asistenteUsado: (asistenteRow?.count || 0) > 0,
    evaluacionesCompletadas: evalImcRow?.count || 0,
    metasDiariasCumplidas: metasDiariasRow?.count || 0,
    congeladorUsado: Boolean(congeladorUltimoUso || usoCongelador),
    nivel: nivelActual,
    logrosYaDesbloqueados,
  };

  const nuevosLogros = evaluarLogros(estadoLogros);
  let xpPorLogros = 0;

  for (const logro of nuevosLogros) {
    try {
      await db.runAsync(
        'INSERT OR IGNORE INTO logros_usuario (usuario_id, logro_id) VALUES (?, ?);',
        [userId, logro.id]
      );
      xpPorLogros += logro.xpRecompensa;
      await db.runAsync(
        'INSERT INTO progreso (usuario_id, tipo, puntos) VALUES (?, ?, ?);',
        [userId, `logro:${logro.id}`, logro.xpRecompensa]
      );
      await queueSync(db, 'logros_usuario', `${userId}_${logro.id}`, 'INSERT', {
        usuario_id: userId,
        logro_id: logro.id,
        desbloqueado_en: hoyIso,
      });
    } catch (e) {
      console.warn('[Logro Desbloqueo Error]', e);
    }
  }

  puntosTotales += xpPorLogros;
  nivelActual = nivelDesdeXp(puntosTotales);
  const subioNivel = nivelActual > (user.nivel || 1);

  // 7. Persistir estado en SQLite
  await db.runAsync(
    `UPDATE usuarios SET
       puntos = ?,
       nivel = ?,
       racha_actual = ?,
       racha_maxima = ?,
       ultimo_dia_activo = ?,
       congeladores_disponibles = ?,
       congelador_ultimo_uso = ?,
       meta_diaria_completada_fecha = ?
     WHERE id = ?;`,
    [
      puntosTotales,
      nivelActual,
      nuevaRachaActual,
      nuevaRachaMaxima,
      hoyStr,
      congeladoresDisp,
      congeladorUltimoUso ?? null,
      metaFecha ?? null,
      userId,
    ]
  );

  // 8. Encolar actualización para sincronización offline
  await queueSync(db, 'usuarios', user.usuario, 'UPDATE', {
    id: userId,
    puntos: puntosTotales,
    nivel: nivelActual,
    racha_actual: nuevaRachaActual,
    racha_maxima: nuevaRachaMaxima,
    ultimo_dia_activo: hoyStr,
    congeladores_disponibles: congeladoresDisp,
    congelador_ultimo_uso: congeladorUltimoUso,
    meta_diaria_completada_fecha: metaFecha,
  });

  networkSync.pushPoints(userId, user.usuario, puntosTotales, nivelActual).catch(() => {});

  const totalPuntosGanados = puntosAccion + puntosMetaDiaria + xpPorLogros;

  return {
    success: true,
    puntosGanados: totalPuntosGanados,
    puntosTotales,
    nivel: nivelActual,
    subioNivel,
    rachaActual: nuevaRachaActual,
    rachaMaxima: nuevaRachaMaxima,
    congeladoresDisponibles: congeladoresDisp,
    metaDiariaCumplida: metaDiariaEval.cumplida,
    metaDiariaRecienCompletada,
    logrosDesbloqueados: nuevosLogros,
    avisoRacha: nuevaRachaActual > 0 && !metaDiariaEval.cumplida,
  };
};

/**
 * Guarda el resultado del pre-test para una enfermedad.
 */
export async function guardarPreTest(
  usuarioId: number,
  enfermedadId: string,
  puntaje: number,
  salon: string | null = null
): Promise<{ success: boolean }> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO evaluaciones_pre_post (usuario_id, enfermedad_id, pre_puntaje, pre_fecha)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(usuario_id, enfermedad_id) DO UPDATE SET
       pre_puntaje = excluded.pre_puntaje,
       pre_fecha = CURRENT_TIMESTAMP;`,
    [usuarioId, enfermedadId, puntaje]
  );

  await queueSync(db, 'evaluaciones_pre_post', `${usuarioId}_${enfermedadId}`, 'INSERT', {
    usuario_id: usuarioId,
    enfermedad_id: enfermedadId,
    pre_puntaje: puntaje,
    salon,
  });

  return { success: true };
}

/**
 * Guarda el resultado del post-test para una enfermedad y calcula la mejora.
 */
export async function guardarPostTest(
  usuarioId: number,
  enfermedadId: string,
  puntaje: number,
  salon: string | null = null
): Promise<{ success: boolean; mejora: number; prePuntaje: number }> {
  const db = await getDb();
  const actual = await db.getFirstAsync<{ pre_puntaje: number }>(
    'SELECT pre_puntaje FROM evaluaciones_pre_post WHERE usuario_id = ? AND enfermedad_id = ?;',
    [usuarioId, enfermedadId]
  );

  const prePuntaje = actual ? actual.pre_puntaje : 0;
  const mejora = puntaje - prePuntaje;

  await db.runAsync(
    `INSERT INTO evaluaciones_pre_post (usuario_id, enfermedad_id, pre_puntaje, post_puntaje, post_fecha, mejora)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
     ON CONFLICT(usuario_id, enfermedad_id) DO UPDATE SET
       post_puntaje = excluded.post_puntaje,
       post_fecha = CURRENT_TIMESTAMP,
       mejora = excluded.mejora;`,
    [usuarioId, enfermedadId, prePuntaje, puntaje, mejora]
  );

  await queueSync(db, 'evaluaciones_pre_post', `${usuarioId}_${enfermedadId}`, 'UPDATE', {
    usuario_id: usuarioId,
    enfermedad_id: enfermedadId,
    pre_puntaje: prePuntaje,
    post_puntaje: puntaje,
    mejora,
    salon,
  });

  return { success: true, mejora, prePuntaje };
}

/**
 * Obtiene la evaluación pre/post guardada de un usuario para una enfermedad.
 */
export async function obtenerEvaluacionPrePost(
  usuarioId: number,
  enfermedadId: string
): Promise<EvaluacionPrePost | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    'SELECT id, usuario_id, enfermedad_id, pre_puntaje, pre_fecha, post_puntaje, post_fecha, mejora FROM evaluaciones_pre_post WHERE usuario_id = ? AND enfermedad_id = ?;',
    [usuarioId, enfermedadId]
  );
  if (!row) return null;
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    enfermedad_id: row.enfermedad_id,
    pre_puntaje: row.pre_puntaje,
    pre_fecha: row.pre_fecha,
    post_puntaje: row.post_puntaje,
    post_fecha: row.post_fecha,
    mejora: row.mejora,
  };
}

/**
 * Obtiene todas las evaluaciones pre/post guardadas de un usuario para todas las enfermedades.
 */
export async function obtenerTodasEvaluacionesUsuario(
  usuarioId: number
): Promise<EvaluacionPrePost[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      'SELECT id, usuario_id, enfermedad_id, pre_puntaje, pre_fecha, post_puntaje, post_fecha, mejora FROM evaluaciones_pre_post WHERE usuario_id = ?;',
      [usuarioId]
    );
    return rows.map(r => ({
      id: r.id,
      usuario_id: r.usuario_id,
      enfermedad_id: r.enfermedad_id,
      pre_puntaje: r.pre_puntaje,
      pre_fecha: r.pre_fecha,
      post_puntaje: r.post_puntaje,
      post_fecha: r.post_fecha,
      mejora: r.mejora,
    }));
  } catch (err) {
    console.warn('[DB Error] No se pudieron obtener las evaluaciones del usuario:', err);
    return [];
  }
}

/**
 * Registra un fallo o error en una pregunta sobre una enfermedad (agregación docente).
 */
export async function registrarErrorEnfermedad(enfermedadId: string, salon: string | null = null): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO registro_errores_enfermedad (enfermedad_id, salon) VALUES (?, ?);',
      [enfermedadId, salon]
    );
  } catch {}
}

/**
 * Registra un evento anónimo de alerta de seguridad del asistente (solo conteo, nunca textos ni datos personales).
 */
export async function registrarAlertaSeguridad(salon: string | null = null): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO alertas_seguridad (salon) VALUES (?, ?);',
      [salon]
    );
  } catch {}
}

/**
 * Obtiene la lista de salones registrados para estudiantes.
 */
export async function obtenerSalonesDisponibles(): Promise<string[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{ salon: string }>(
      "SELECT DISTINCT CASE WHEN salon IS NULL OR TRIM(salon) = '' THEN 'Sin asignar' ELSE TRIM(salon) END AS salon FROM usuarios WHERE rol = 'estudiante' ORDER BY salon ASC;"
    );
    const salones = rows.map(r => r.salon.trim()).filter(Boolean);
    return Array.from(new Set(salones));
  } catch {
    return [];
  }
}

/**
 * Obtiene métricas agregadas pedagógicas para el panel docente y exportación.
 */
export async function obtenerMetricasDocente(salonFiltro?: string | null): Promise<MetricasSaludSalon> {
  const db = await getDb();
  const alumnos = await db.getAllAsync<any>(
    "SELECT id, nombre_completo, usuario, grado, genero, rol, estado, salon, puntos, nivel, fecha_registro, racha_actual, ultimo_dia_activo FROM usuarios WHERE rol = 'estudiante' AND estado = 'activo' ORDER BY id ASC;"
  );

  const evaluaciones = await db.getAllAsync<any>(
    "SELECT ep.id, ep.usuario_id, ep.enfermedad_id, ep.pre_puntaje, ep.post_puntaje, ep.mejora, u.salon FROM evaluaciones_pre_post ep JOIN usuarios u ON u.id = ep.usuario_id ORDER BY ep.id ASC;"
  );

  const errores = await db.getAllAsync<any>(
    "SELECT enfermedad_id, salon FROM registro_errores_enfermedad ORDER BY id ASC;"
  );

  const esSinAsignar = salonFiltro?.toLowerCase() === 'sin asignar';
  const tieneFiltroSalon = Boolean(salonFiltro && salonFiltro.toLowerCase() !== 'todos');
  const alertasRow = await db.getFirstAsync<{ total: number }>(
    esSinAsignar
      ? "SELECT COUNT(*) as total FROM alertas_seguridad WHERE salon IS NULL OR TRIM(salon) = '';"
      : tieneFiltroSalon
        ? "SELECT COUNT(*) as total FROM alertas_seguridad WHERE LOWER(salon) = LOWER(?);"
        : "SELECT COUNT(*) as total FROM alertas_seguridad;",
    tieneFiltroSalon && !esSinAsignar ? [salonFiltro ?? null] : []
  );
  const alertasCount = alertasRow?.total || 0;

  const { calcularMetricasDocente } = await import('../lib/metricasDocente');
  return calcularMetricasDocente(alumnos, evaluaciones, errores, alertasCount, salonFiltro);
}
