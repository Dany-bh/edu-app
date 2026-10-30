// src/config/firebase.ts
// ── Inicialización ULTRA-SEGURA de Firebase para Android/Hermes ──
// Cada operación está envuelta en try-catch individual para que NUNCA cause crash fatal.

import { Platform } from 'react-native';

let app: any = null;
let auth: any = null;
let db: any = null;

try {
  const { initializeApp, getApps, getApp } = require('firebase/app');

  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'edu-app.firebaseapp.com',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'edu-app-default',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'edu-app.appspot.com',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
  };

  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.warn('[Firebase] App init falló (no-fatal):', e);
}

// ── Auth ──
try {
  if (app) {
    const FirebaseAuth = require('firebase/auth');

    if (Platform.OS === 'web') {
      auth = FirebaseAuth.getAuth(app);
    } else {
      // En React Native, intentar initializeAuth con persistencia AsyncStorage
      // Firebase JS SDK v10+ usa getReactNativePersistence
      // Firebase JS SDK v12+ puede no tenerlo — detectar y manejar
      try {
        const getPersistence = FirebaseAuth.getReactNativePersistence;
        if (typeof getPersistence === 'function') {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          auth = FirebaseAuth.initializeAuth(app, {
            persistence: getPersistence(AsyncStorage),
          });
        } else {
          // Fallback: usar getAuth sin persistencia nativa
          auth = FirebaseAuth.getAuth(app);
        }
      } catch (_inner) {
        // Último fallback: getAuth básico
        try {
          auth = FirebaseAuth.getAuth(app);
        } catch (_) {}
      }
    }
  }
} catch (e) {
  console.warn('[Firebase] Auth init falló (no-fatal):', e);
}

// ── Firestore ──
try {
  if (app) {
    const { getFirestore } = require('firebase/firestore');
    db = getFirestore(app);
  }
} catch (e) {
  console.warn('[Firebase] Firestore init falló (no-fatal):', e);
}

export { app, auth, db };
