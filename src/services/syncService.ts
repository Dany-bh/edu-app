// src/services/syncService.ts
// ── Sincronización Offline-First con Firestore (importación diferida segura) ──
import { getDb } from '../db/database';

export interface SyncResult {
  total: number;
  sincronizados: number;
  fallidos: number;
}

/**
 * Servicio de sincronización Offline-First.
 * Procesa la cola local de SQLite y replica los datos a Firebase Firestore.
 * Todas las importaciones de Firebase son diferidas (lazy) para evitar
 * crasheos en Android/Hermes si Firebase no se inicializó correctamente.
 */
class SyncService {
  private isSyncing = false;

  /**
   * Ejecuta la sincronización de elementos pendientes en la cola local hacia Firestore.
   */
  public async syncPendingQueue(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { total: 0, sincronizados: 0, fallidos: 0 };
    }

    this.isSyncing = true;
    const result: SyncResult = { total: 0, sincronizados: 0, fallidos: 0 };

    try {
      // Importar Firebase de forma diferida y segura
      let firestoreDb: any = null;
      let doc: any, setDoc: any, collection: any, addDoc: any, serverTimestamp: any;
      try {
        const firebaseConfig = require('../config/firebase');
        firestoreDb = firebaseConfig.db;
        const firestoreModule = require('firebase/firestore');
        doc = firestoreModule.doc;
        setDoc = firestoreModule.setDoc;
        collection = firestoreModule.collection;
        addDoc = firestoreModule.addDoc;
        serverTimestamp = firestoreModule.serverTimestamp;
      } catch (_) {
        console.warn('[SyncService] Firebase no disponible, sync cancelado.');
        this.isSyncing = false;
        return result;
      }

      if (!firestoreDb) {
        this.isSyncing = false;
        return result;
      }

      const db = await getDb();
      if (!db) {
        this.isSyncing = false;
        return result;
      }
      const pendingItems = await db.getAllAsync<{
        id: number;
        tabla: string;
        registro_id: string;
        accion: string;
        datos: string;
        intentos: number;
      }>(
        "SELECT id, tabla, registro_id, accion, datos, intentos FROM cola_sincronizacion WHERE estado = 'pendiente' ORDER BY id ASC LIMIT 50;"
      );

      result.total = pendingItems.length;

      for (const item of pendingItems) {
        try {
          const payload = JSON.parse(item.datos);
          const docId = item.registro_id;

          if (item.tabla === 'usuarios') {
            // Sincronizar documento de usuario a Firestore
            const userRef = doc(firestoreDb, 'usuarios', docId);
            await setDoc(
              userRef,
              {
                ...payload,
                updatedAt: serverTimestamp(),
                syncOrigin: 'sqlite_mobile',
              },
              { merge: true }
            );
          } else if (item.tabla === 'progreso') {
            // Sincronizar eventos de progreso a la subcolección de actividades
            const progressCol = collection(firestoreDb, 'progreso');
            await addDoc(progressCol, {
              ...payload,
              createdAt: serverTimestamp(),
            });
          }

          // Marcar como sincronizado en SQLite
          await db.runAsync(
            "UPDATE cola_sincronizacion SET estado = 'sincronizado', sincronizado_en = CURRENT_TIMESTAMP WHERE id = ?;",
            [item.id]
          );
          result.sincronizados++;
        } catch (err: any) {
          result.fallidos++;
          const nextAttempts = (item.intentos || 0) + 1;
          const status = nextAttempts >= 5 ? 'fallido' : 'pendiente';

          await db.runAsync(
            'UPDATE cola_sincronizacion SET intentos = ?, estado = ?, error_mensaje = ? WHERE id = ?;',
            [nextAttempts, status, err?.message || 'Error de red en sincronización', item.id]
          );
        }
      }
    } catch (globalErr) {
      console.warn('[SyncService Warn] Fallo en ciclo de sincronización offline:', globalErr);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }
}

export const syncService = new SyncService();
