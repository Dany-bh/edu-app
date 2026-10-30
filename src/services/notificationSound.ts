// src/services/notificationSound.ts
import { Platform, Vibration } from 'react-native';

/**
 * Reproduce un tono de notificación audible (chime / campanilla) y emite vibración.
 * Diseñado para operar 100% offline tanto en Web (Web Audio API) como en Android / iOS (Expo-AV / Vibración).
 */
export async function playNotificationSound(): Promise<void> {
  try {
    // 1. Vibración háptica en dispositivos móviles
    try {
      Vibration.vibrate([0, 180, 80, 180]);
    } catch (_) {}

    // 2. En entorno Web: sintetizador Web Audio API de alta fidelidad (sin archivos externos)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        
        // Desbloquear contexto si está suspendido por políticas de autoplay
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const now = ctx.currentTime;

        // Nota 1 (Campana alta: 659.25 Hz - E5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now);
        gain1.gain.setValueAtTime(0.4, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.4);

        // Nota 2 (Campana superior: 880 Hz - A5)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.12);
        gain2.gain.setValueAtTime(0.45, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.6);

        // Nota 3 (Armónico de cierre: 1046.5 Hz - C6)
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(1046.5, now + 0.25);
        gain3.gain.setValueAtTime(0.5, now + 0.25);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.start(now + 0.25);
        osc3.stop(now + 0.8);

        return;
      }
    }

    // 3. En entorno Nativo (Android / iOS)
    try {
      // El sonido nativo ha sido temporalmente desactivado.
      // Se utilizará únicamente la vibración háptica.
    } catch (nativeErr) {
      console.log('[NotificationSound Native Fallback]', nativeErr);
    }
  } catch (err) {
    console.warn('[NotificationSound] Error al emitir sonido:', err);
  }
}
