import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme, Platform, View, Text, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState, Component, ReactNode } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { TemaProvider } from '../hooks/useTema';

// ── Importar CSS solo en web, de forma segura ──
if (Platform.OS === 'web') {
  try {
    require('../global.css');
  } catch (_) {}
}

// ── Splash Screen: capturar CUALQUIER error de importación o ejecución ──
let SplashScreen: any = null;
try {
  SplashScreen = require('expo-splash-screen');
  SplashScreen.preventAutoHideAsync().catch(() => {});
} catch (_) {}

// ── Error Boundary: atrapa errores de renderizado fatales ──
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    console.error('[ErrorBoundary] Crash capturado:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0A0A14', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#FF6B6B', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>
            Error inesperado
          </Text>
          <Text style={{ color: '#AAA', fontSize: 14, textAlign: 'center' }}>
            La aplicación encontró un problema. Por favor ciérrala y vuelve a abrirla.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ── Componente de navegación con protección de autenticación ──
function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    try {
      SplashScreen?.hideAsync?.().catch(() => {});
    } catch (_) {}

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7FAF9', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="enfermedad/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="evaluacion" options={{ headerShown: false }} />
      <Stack.Screen name="retos" options={{ headerShown: false }} />
      <Stack.Screen name="logros" options={{ headerShown: false }} />
      <Stack.Screen name="galeria" options={{ headerShown: false }} />
    </Stack>
  );
}

// ── Root Layout principal con inicialización segura de BD ──
import { useFonts } from 'expo-font';
import { useFonts as usePlusJakarta, PlusJakartaSans_800ExtraBold, PlusJakartaSans_700Bold, PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts as useInter, Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [ready, setReady] = useState(false);
  const [forceReady, setForceReady] = useState(false);

  const [pjLoaded, pjError] = usePlusJakarta({
    PlusJakartaSans_800ExtraBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_600SemiBold,
  });
  const [interLoaded, interError] = useInter({
    Inter_400Regular,
    Inter_500Medium,
  });
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    ...MaterialIcons.font,
  });

  useEffect(() => {
    // Si tras 1.2 segundos las fuentes de red tardan (por ejemplo offline), continuar con fuentes del sistema
    const timer = setTimeout(() => {
      setForceReady(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Importar getDb dinámicamente para que si falla, no mate la app
        const { getDb } = require('../db/database');
        await getDb();
      } catch (err) {
        console.warn('[RootLayout] BD init falló, continuando sin BD:', err);
      }
      if (mounted) setReady(true);
    };

    init();
    return () => { mounted = false; };
  }, []);

  const fontsReady = forceReady || (
    (fontsLoaded || !!fontError) &&
    (pjLoaded || !!pjError) &&
    (interLoaded || !!interError)
  );

  if (!ready || !fontsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7FAF9', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <TemaProvider>
          <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
          </TemaProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
