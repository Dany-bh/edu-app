// src/services/notificaciones.web.ts
// Implementación web segura para notificaciones (sin dependencias nativas de expo-notifications)

export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }
  return false;
}

export async function tienePermisoNotificaciones(): Promise<boolean> {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission === 'granted';
  }
  return false;
}

export async function programarRecordatorioDiario(
  hora: number,
  minuto: number = 0
): Promise<boolean> {
  console.log(`[Notificaciones Web] Recordatorio diario programado para las ${hora}:${minuto < 10 ? '0' : ''}${minuto}`);
  return true;
}

export async function cancelarRecordatorios(): Promise<void> {
  console.log('[Notificaciones Web] Recordatorios cancelados.');
}

export async function enviarNotificacionInmediata(
  titulo: string,
  cuerpo: string
): Promise<boolean> {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(titulo, { body: cuerpo });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
