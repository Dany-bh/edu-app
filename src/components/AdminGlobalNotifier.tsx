// src/components/AdminGlobalNotifier.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { playNotificationSound } from '../services/notificationSound';
import { networkSync } from '../services/networkSync';
import { 
  realtimeEvents, 
  EVENT_NEW_REGISTRATION, 
  EVENT_NEW_PASSWORD_REQUEST 
} from '../services/realtimeEvents';

export const AdminGlobalNotifier = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [banner, setBanner] = useState<{
    visible: boolean;
    message: string;
    type: 'registro' | 'clave';
  }>({
    visible: false,
    message: '',
    type: 'registro',
  });

  const prevRegCountRef = useRef<number | null>(null);
  const prevPwCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user || user.rol !== 'admin') return;

    let isMounted = true;

    const checkServer = async () => {
      try {
        const netData = await networkSync.fetchNetworkData();
        if (!netData || !isMounted) return;

        const regCount = netData.pendingUsers.length;
        const pwCount = netData.pendingPasswords.length;

        if (prevRegCountRef.current !== null && prevPwCountRef.current !== null) {
          if (regCount > prevRegCountRef.current) {
            playNotificationSound();
            const latest = netData.pendingUsers[0];
            setBanner({
              visible: true,
              message: `🔔 ¡Nueva solicitud de registro: ${latest?.nombre_completo || 'Nuevo Estudiante'}! Toca para revisar.`,
              type: 'registro',
            });
          } else if (pwCount > prevPwCountRef.current) {
            playNotificationSound();
            const latest = netData.pendingPasswords[0];
            setBanner({
              visible: true,
              message: `🔑 ¡Solicitud de contraseña de @${latest?.usuario || 'Estudiante'}! Toca para revisar.`,
              type: 'clave',
            });
          }
        }

        prevRegCountRef.current = regCount;
        prevPwCountRef.current = pwCount;
      } catch (_) {}
    };

    // 1. Chequeo inicial
    checkServer();

    // 2. Intervalo continuo cada 2.5 segundos para escuchar por Wi-Fi
    const interval = setInterval(checkServer, 2500);

    // 3. Suscripción a eventos locales instantáneos
    const unsubReg = realtimeEvents.subscribe(EVENT_NEW_REGISTRATION, (payload) => {
      playNotificationSound();
      setBanner({
        visible: true,
        message: `🔔 ¡Nueva solicitud de registro: ${payload?.nombre_completo || 'Nuevo Estudiante'}! Toca para revisar.`,
        type: 'registro',
      });
      checkServer();
    });

    const unsubPw = realtimeEvents.subscribe(EVENT_NEW_PASSWORD_REQUEST, (payload) => {
      playNotificationSound();
      setBanner({
        visible: true,
        message: `🔑 ¡Solicitud de contraseña de @${payload?.usuario || 'Estudiante'}! Toca para revisar.`,
        type: 'clave',
      });
      checkServer();
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsubReg();
      unsubPw();
    };
  }, [user]);

  if (!user || user.rol !== 'admin' || !banner.visible) {
    return null;
  }

  const handlePressBanner = () => {
    setBanner(prev => ({ ...prev, visible: false }));
    router.push('/(tabs)/admin');
  };

  return (
    <Animated.View 
      entering={FadeInDown.duration(300)} 
      exiting={FadeOutUp.duration(250)} 
      style={styles.floatingBanner}
    >
      <TouchableOpacity 
        style={styles.bannerContent} 
        onPress={handlePressBanner}
        activeOpacity={0.85}
      >
        <Ionicons 
          name={banner.type === 'registro' ? 'person-add' : 'key'} 
          size={22} 
          color="#05050A" 
          style={{ marginRight: 10 }} 
        />
        <Text style={styles.bannerText} numberOfLines={2}>
          {banner.message}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => setBanner(prev => ({ ...prev, visible: false }))} 
        style={styles.closeBtn}
      >
        <Ionicons name="close" size={20} color="#05050A" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingBanner: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 48,
    left: 20,
    right: 20,
    zIndex: 99999,
    backgroundColor: '#00FFD1',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#00FFD1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 20,
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerText: {
    flex: 1,
    color: '#05050A',
    fontWeight: '700',
    fontSize: 14,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 8,
  },
});
