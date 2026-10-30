// src/services/networkSync.ts
import { Platform } from 'react-native';
import { User, SolicitudPassword } from '../types';

const LOCAL_SERVER_IP = process.env.EXPO_PUBLIC_SYNC_HOST || '';
const PORT = process.env.EXPO_PUBLIC_SYNC_PORT || '8082';

export const getSyncServerUrl = (): string => {
  if (!LOCAL_SERVER_IP) return ''; // Desactivar si no hay host
  if (Platform.OS === 'web') {
    return `http://localhost:${PORT}`;
  }
  return `http://${LOCAL_SERVER_IP}:${PORT}`;
};

/**
 * Cliente de sincronización Wi-Fi local para conectar celular y PC en tiempo real.
 */
class NetworkSyncService {
  private isSyncing = false;

  /**
   * Obtiene las solicitudes de registro y claves directamente del servidor local Wi-Fi.
   */
  public async fetchNetworkData(): Promise<{
    pendingUsers: User[];
    activeUsers: User[];
    inactiveUsers?: User[];
    pendingPasswords: SolicitudPassword[];
    eliminados: string[];
  } | null> {
    const baseUrl = getSyncServerUrl();
    if (!baseUrl) return null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${baseUrl}/api/sync`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        return {
          pendingUsers: json.pendingUsers || [],
          activeUsers: json.activeUsers || [],
          inactiveUsers: json.inactiveUsers || [],
          pendingPasswords: json.pendingPasswords || [],
          eliminados: json.eliminados || [],
        };
      }
    } catch (_) {
      // Servidor no disponible o fuera de red
    }
    return null;
  }

  /**
   * Envía un registro al servidor compartido en red local
   */
  public async pushRegistration(userPayload: any): Promise<boolean> {
    const baseUrl = getSyncServerUrl();
    if (!baseUrl) return false;
    try {
      const res = await fetch(`${baseUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPayload),
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  }

  /**
   * Notifica la aprobación de un usuario en la red local
   */
  public async pushApproval(userId: number, usuario: string): Promise<boolean> {
    const baseUrl = getSyncServerUrl();
    if (!baseUrl) return false;
    try {
      const res = await fetch(`${baseUrl}/api/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, usuario }),
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  }

  /**
   * Notifica el rechazo de un usuario en la red local
   */
  public async pushReject(userId: number, usuario?: string): Promise<boolean> {
    const baseUrl = getSyncServerUrl();
    if (!baseUrl) return false;
    try {
      const res = await fetch(`${baseUrl}/api/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, usuario }),
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  }

  /**
   * Notifica la eliminación de un usuario en la red local
   */
  public async pushDeleteUser(userId: number, usuario?: string): Promise<boolean> {
    const baseUrl = getSyncServerUrl();
    if (!baseUrl) return false;
    try {
      const res = await fetch(`${baseUrl}/api/delete-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, usuario }),
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  }

  public async pushStudentStatus(db: any, userId: number): Promise<boolean> {
    const baseUrl = getSyncServerUrl();
    if (!baseUrl) return false;
    try {
      const user = await db.getFirstAsync(
        "SELECT id, nombre_completo, usuario, password_hash, salt, grado, genero, rol, estado, salon, puntos, nivel, fecha_registro FROM usuarios WHERE id = ? AND rol = 'estudiante';",
        [userId]
      );
      if (!user) return false;
      const res = await fetch(`${baseUrl}/api/sync-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarios: [user] }),
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  }

  /**
   * Notifica el descarte/eliminación de una solicitud de contraseña en la red local
   */
  public async pushRejectPassword(solicitudId: number): Promise<boolean> {
    const baseUrl = getSyncServerUrl();
    if (!baseUrl) return false;
    try {
      const res = await fetch(`${baseUrl}/api/reject-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitudId }),
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  }

  /**
   * Envía una solicitud de restablecimiento de contraseña en la red local
   */
  public async pushPasswordRequest(payload: any): Promise<boolean> {
    const baseUrl = getSyncServerUrl();
    if (!baseUrl) return false;
    try {
      const res = await fetch(`${baseUrl}/api/request-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  }

  /**
   * Envía la resolución de contraseña en la red local
   */
  public async pushPasswordResolution(payload: any): Promise<boolean> {
    const baseUrl = getSyncServerUrl();
    if (!baseUrl) return false;
    try {
      const res = await fetch(`${baseUrl}/api/resolve-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  }

  /**
   * Envía la actualización de puntos y nivel de un usuario en la red local
   */
  public async pushPoints(userId: number, usuario: string, puntos: number, nivel: number): Promise<boolean> {
    const baseUrl = getSyncServerUrl();
    if (!baseUrl) return false;
    try {
      const res = await fetch(`${baseUrl}/api/update-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, usuario, puntos, nivel }),
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  }

  /**
   * Sube todos los registros locales de SQLite a la red para rescatar registros previos
   */
  public async syncAllLocal(db: any): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    const baseUrl = getSyncServerUrl();
    if (!baseUrl) {
      this.isSyncing = false;
      return;
    }

    try {
      // 1. Consultar estado del servidor para purgar usuarios eliminados
      const netData = await this.fetchNetworkData();
      if (netData) {
        const pendingStatusChanges = await db.getAllAsync(
          "SELECT registro_id, datos FROM cola_sincronizacion WHERE tabla = 'usuarios' AND accion = 'UPDATE' AND estado = 'pendiente' ORDER BY id DESC;"
        );
        const localStatusOverrides = new Set<string>();
        for (const item of pendingStatusChanges) {
          const username = String(item.registro_id || '').toLowerCase();
          if (!username || localStatusOverrides.has(username)) continue;
          try {
            const status = JSON.parse(item.datos)?.estado;
            if (status === 'activo' || status === 'inactivo' || status === 'pendiente') {
              localStatusOverrides.add(username);
            }
          } catch (error) {
            console.warn('[SyncAll] No se pudo leer un cambio de estado pendiente:', error);
          }
        }

        // Eliminar cualquier usuario que esté en la lista de eliminados
        if (netData.eliminados && netData.eliminados.length > 0) {
          for (const delU of netData.eliminados) {
            await db.runAsync('DELETE FROM usuarios WHERE LOWER(usuario) = ?;', [delU.toLowerCase()]);
          }
        }

        const remoteStudents = [
          ...netData.activeUsers,
          ...netData.pendingUsers,
          ...(netData.inactiveUsers || []),
        ].filter((user) => user.rol === 'estudiante' && user.estado);
        for (const remoteUser of remoteStudents) {
          if (localStatusOverrides.has(remoteUser.usuario.toLowerCase())) continue;
          await db.runAsync(
            "UPDATE usuarios SET estado = ? WHERE LOWER(usuario) = ? AND rol = 'estudiante' AND COALESCE(estado, '') != ?;",
            [remoteUser.estado, remoteUser.usuario.toLowerCase(), remoteUser.estado]
          );
        }

        // Si el servidor está accesible, purgar estudiantes locales que ya no existan en el servidor
        const remoteUsernames = new Set([
          ...netData.activeUsers.map(u => u.usuario.toLowerCase()),
          ...netData.pendingUsers.map(u => u.usuario.toLowerCase()),
          ...(netData.inactiveUsers || []).map(u => u.usuario.toLowerCase()),
        ]);

        const localStudents = await db.getAllAsync(
          "SELECT id, usuario FROM usuarios WHERE rol = 'estudiante';"
        );

        for (const s of localStudents) {
          const uLower = (s.usuario || '').toLowerCase();
          if (!remoteUsernames.has(uLower) || netData.eliminados.includes(uLower)) {
            console.log(`[SyncAll] Purgando usuario eliminado en el servidor: @${s.usuario}`);
            await db.runAsync('DELETE FROM usuarios WHERE id = ?;', [s.id]);
          }
        }
      }

      // 2. Ahora enviar únicamente los usuarios válidos actuales incluyendo puntos y nivel
      const allUsers = await db.getAllAsync(
        'SELECT id, nombre_completo, usuario, password_hash, salt, grado, genero, rol, estado, salon, puntos, nivel, fecha_registro FROM usuarios;'
      );

      let allPwRequests: any[] = [];
      try {
        allPwRequests = await db.getAllAsync('SELECT * FROM solicitudes_password;');
      } catch (_) {}

      await fetch(`${baseUrl}/api/sync-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarios: allUsers,
          solicitudes_password: allPwRequests,
        }),
      });
    } catch (_) {
    } finally {
      this.isSyncing = false;
    }
  }
}

export const networkSync = new NetworkSyncService();
