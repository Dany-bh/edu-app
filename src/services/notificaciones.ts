// src/services/notificaciones.ts
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configurar el manejador de notificaciones locales solo en plataformas compatibles
if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn('[Notificaciones] Error al inicializar manejador:', err);
  }
}

/**
 * Solicita permisos de notificación al usuario de manera diferida (solo cuando el estudiante activa el recordatorio).
 */
export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('[Notificaciones] Error solicitando permisos:', error);
    return false;
  }
}

/**
 * Verifica si los permisos de notificación ya están concedidos.
 */
export async function tienePermisoNotificaciones(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Programa el recordatorio diario a la hora especificada por el estudiante.
 * Garantiza un máximo de 1 notificación diaria y funciona de manera 100% offline.
 */
export async function programarRecordatorioDiario(
  hora: number,
  minuto: number = 0
): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.log(`[Notificaciones Web Mock] Recordatorio programado para las ${hora}:${minuto < 10 ? '0' : ''}${minuto}`);
    return true;
  }

  try {
    const tienePermiso = await solicitarPermisoNotificaciones();
    if (!tienePermiso) {
      return false;
    }

    // Cancelar recordatorios previos para evitar duplicados
    await cancelarRecordatorios();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌟 Tu meta de salud de 3 minutos',
        body: '¡Hola! Dedica 3 minutos hoy para aprender sobre salud, responder tu reto y cuidar tu racha.',
        sound: true,
        data: { ruta: '/(tabs)' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hora,
        minute: minuto,
      },
    });

    console.log(`[Notificaciones] Recordatorio programado para las ${hora}:${minuto < 10 ? '0' : ''}${minuto}`);
    return true;
  } catch (err) {
    console.error('[Notificaciones] Error programando recordatorio:', err);
    return false;
  }
}

/**
 * Cancela todos los recordatorios programados del dispositivo.
 */
export async function cancelarRecordatorios(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notificaciones] Recordatorios cancelados.');
  } catch (err) {
    console.warn('[Notificaciones] Error al cancelar notificaciones:', err);
  }
}
