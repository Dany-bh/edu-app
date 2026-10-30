// src/services/realtimeEvents.ts
import { Platform } from 'react-native';

type EventCallback = (data?: any) => void;

class RealtimeEvents {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private broadcastChannel: any = null;

  constructor() {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new (window as any).BroadcastChannel('eduapp_realtime_channel');
        this.broadcastChannel.onmessage = (event: MessageEvent) => {
          if (event?.data?.type) {
            this.notifyLocal(event.data.type, event.data.payload);
          }
        };
      } catch (e) {
        console.warn('[RealtimeEvents] BroadcastChannel no disponible:', e);
      }
    }
  }

  public subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  public emit(eventType: string, payload?: any): void {
    // 1. Notificar a oyentes locales dentro del mismo proceso
    this.notifyLocal(eventType, payload);

    // 2. Transmitir a otras pestañas/ventanas del navegador en tiempo real
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: eventType, payload });
      } catch (err) {
        console.warn('[RealtimeEvents] Error emitiendo BroadcastChannel:', err);
      }
    }
  }

  private notifyLocal(eventType: string, payload?: any): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error('[RealtimeEvents] Error en callback de evento:', e);
        }
      });
    }
  }
}

export const realtimeEvents = new RealtimeEvents();

// Nombres de eventos tipados
export const EVENT_NEW_REGISTRATION = 'EVENT_NEW_REGISTRATION';
export const EVENT_NEW_PASSWORD_REQUEST = 'EVENT_NEW_PASSWORD_REQUEST';
export const EVENT_USER_APPROVED = 'EVENT_USER_APPROVED';
export const EVENT_PASSWORD_RESOLVED = 'EVENT_PASSWORD_RESOLVED';
