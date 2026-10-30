// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  hasAdminUser,
  procesarAccionGamificada,
  obtenerUsuarioPorId,
  AccionGamificada,
  ResultadoAccionGamificada,
} from '../db/database';
import { syncService } from '../services/syncService';
import { networkSync } from '../services/networkSync';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasAdmin: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updatePoints: (points: number, reason?: string) => Promise<void>;
  procesarAccion: (accion: AccionGamificada) => Promise<ResultadoAccionGamificada | null>;
  refrescarUsuario: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  hasAdmin: true,
  login: async () => {},
  logout: async () => {},
  updatePoints: async () => {},
  procesarAccion: async () => null,
  refrescarUsuario: async () => {},
  refreshAdminStatus: async () => {},
});

// Helper para almacenamiento multiplataforma seguro
const storage = {
  get: async (key: string) => {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  set: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      return AsyncStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  },
  remove: async (key: string) => {
    if (Platform.OS === 'web') {
      return AsyncStorage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(true);

  const persistUser = useCallback(async (userData: User) => {
    const jsonValue = JSON.stringify(userData);
    await storage.set('user_session', jsonValue);
  }, []);

  const checkAdminStatus = useCallback(async () => {
    try {
      const exists = await hasAdminUser();
      setHasAdmin(exists);
    } catch (e) {
      console.warn('[AuthContext] Error comprobando estado de administrador:', e);
    }
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const userData = await storage.get('user_session');
      if (userData) {
        let parsed: User = JSON.parse(userData);
        const storedUser = await obtenerUsuarioPorId(parsed.id);
        if (storedUser) {
          parsed = { ...parsed, rol: storedUser.rol, estado: storedUser.estado };
          await persistUser(parsed);
        }
        const uLower = (parsed.usuario || '').trim().toLowerCase();

        if (parsed.estado === 'inactivo' && parsed.rol !== 'admin') {
          await storage.remove('user_session');
          setUser(null);
          return;
        }

        try {
          const netData = await networkSync.fetchNetworkData();
          if (netData) {
            const isDeleted = netData.eliminados?.includes(uLower);
            const isInactive = (netData.inactiveUsers || []).some(u => u.usuario.toLowerCase() === uLower);

            if (parsed.rol !== 'admin' && (isDeleted || isInactive)) {
              console.log(`[AuthContext] Sesión descartada: @${parsed.usuario} no tiene una cuenta activa`);
              await storage.remove('user_session');
              setUser(null);
              return;
            }

            // Sincronizar puntos más altos de la red al iniciar sesión
            const remoteUser = netData.activeUsers.find(u => u.usuario.toLowerCase() === uLower);
            if (remoteUser && typeof remoteUser.puntos === 'number') {
              const maxPoints = Math.max(parsed.puntos || 0, remoteUser.puntos);
              const maxLevel = Math.max(parsed.nivel || 1, remoteUser.nivel || 1);
              if (maxPoints !== parsed.puntos || maxLevel !== parsed.nivel) {
                parsed = { ...parsed, puntos: maxPoints, nivel: maxLevel };
                await persistUser(parsed);
              }
            }
          }
        } catch {}
        setUser(parsed);
      }
    } catch (e) {
      console.error('[AuthContext] Error cargando sesión:', e);
    }
  }, [persistUser]);

  useEffect(() => {
    (async () => {
      try {
        await checkAdminStatus();
        await loadUser();
        // Disparar sincronización offline pendiente en segundo plano
        syncService.syncPendingQueue().catch(() => {});
      } finally {
        setLoading(false);
      }
    })();
  }, [checkAdminStatus, loadUser]);

  // Verificación periódica para expulsar estudiantes eliminados y sincronizar puntos en tiempo real
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const storedUser = await obtenerUsuarioPorId(user.id);
        if (storedUser?.estado === 'inactivo' && user.rol !== 'admin') {
          await logout();
          return;
        }

        const netData = await networkSync.fetchNetworkData();
        if (netData) {
          const uLower = (user.usuario || '').trim().toLowerCase();
          const isDeleted = netData.eliminados?.includes(uLower);
          const isInactive = (netData.inactiveUsers || []).some(u => u.usuario.toLowerCase() === uLower);

          if (user.rol !== 'admin' && (isDeleted || isInactive)) {
            console.log(`[AuthContext] Cuenta de @${user.usuario} desactivada o eliminada. Cerrando sesión.`);
            await logout();
            return;
          }

          // Sincronizar puntos en tiempo real si el servidor tiene un puntaje más alto
          const remoteUser = netData.activeUsers.find(u => u.usuario.toLowerCase() === uLower);
          if (remoteUser && typeof remoteUser.puntos === 'number') {
            if (remoteUser.puntos > (user.puntos || 0)) {
              console.log(`[AuthContext] Sincronizando puntos desde la red para @${user.usuario}: ${remoteUser.puntos} XP`);
              const updated = {
                ...user,
                puntos: remoteUser.puntos,
                nivel: Math.max(user.nivel || 1, remoteUser.nivel || 1),
              };
              setUser(updated);
              await persistUser(updated);
            }
          }
        }
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [user, persistUser]);

  const login = async (userData: User) => {
    let finalUser = userData;
    // Comprobar si el servidor ya tiene un puntaje más actualizado
    try {
      const netData = await networkSync.fetchNetworkData();
      if (netData) {
        const uLower = (userData.usuario || '').trim().toLowerCase();
        const remoteUser = netData.activeUsers.find(u => u.usuario.toLowerCase() === uLower);
        if (remoteUser && typeof remoteUser.puntos === 'number') {
          const maxPoints = Math.max(userData.puntos || 0, remoteUser.puntos);
          const maxLevel = Math.max(userData.nivel || 1, remoteUser.nivel || 1);
          finalUser = { ...userData, puntos: maxPoints, nivel: maxLevel };
        }
      }
    } catch {}

    setUser(finalUser);
    await persistUser(finalUser);
    // Sincronizar cola pendiente tras login
    syncService.syncPendingQueue().catch(() => {});
  };

  const logout = async () => {
    setUser(null);
    await storage.remove('user_session');
  };

  const refrescarUsuario = async () => {
    if (!user) return;
    try {
      const freshUser = await obtenerUsuarioPorId(user.id);
      if (freshUser) {
        setUser(freshUser);
        await persistUser(freshUser);
      }
    } catch (e) {
      console.warn('[AuthContext] Error refrescando usuario:', e);
    }
  };

  const handleProcesarAccion = async (
    accion: AccionGamificada
  ): Promise<ResultadoAccionGamificada | null> => {
    if (!user) return null;
    try {
      const resultado = await procesarAccionGamificada(user.id, accion);
      if (!resultado) return null;
      const freshUser = await obtenerUsuarioPorId(user.id);
      if (freshUser) {
        setUser(freshUser);
        await persistUser(freshUser);
      }
      return resultado;
    } catch (err) {
      console.warn('[AuthContext] No se pudo procesar acción gamificada:', err);
      return null;
    }
  };

  const handleUpdatePoints = async (pointsToAdd: number, reason: string = 'actividad_educativa') => {
    if (!user) return;
    await handleProcesarAccion({
      tipo: 'manual_xp',
      puntos: pointsToAdd,
      razon: reason,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasAdmin,
        login,
        logout,
        updatePoints: handleUpdatePoints,
        procesarAccion: handleProcesarAccion,
        refrescarUsuario,
        refreshAdminStatus: checkAdminStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
