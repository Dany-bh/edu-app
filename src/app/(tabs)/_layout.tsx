import React from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  useWindowDimensions, 
  Platform 
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTema } from '../../hooks/useTema';
import { tokens } from '../../constants/theme';
import { AdminGlobalNotifier } from '../../components/AdminGlobalNotifier';
import { Insignia } from '../../components/ui/Insignia';
import { Mascota } from '../../components/Mascota';
import * as Speech from 'expo-speech';

export default function TabLayout() {
  const { user, logout } = useAuth();
  const { tema } = useTema();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const esWebGrande = Platform.OS === 'web' && width >= 768;

  const navItems = [
    {
      key: 'index',
      label: 'Inicio',
      desc: 'Módulos y prevención',
      icon: 'home-outline',
      activeIcon: 'home',
      route: '/(tabs)',
    },
    {
      key: 'descubrir',
      label: 'Descubrir',
      desc: 'Biblioteca de salud',
      icon: 'compass-outline',
      activeIcon: 'compass',
      route: '/(tabs)/descubrir',
    },
    {
      key: 'asistente',
      label: 'Asistente IA',
      desc: 'Tutor interactivo IA',
      icon: 'sparkles-outline',
      activeIcon: 'sparkles',
      route: '/(tabs)/asistente',
    },
    {
      key: 'perfil',
      label: 'Perfil',
      desc: 'Progreso y rachas',
      icon: 'person-outline',
      activeIcon: 'person',
      route: '/(tabs)/perfil',
    },
    ...((user?.rol === 'admin' || user?.rol === 'docente') ? [{
      key: 'admin',
      label: user?.rol === 'docente' ? 'Docente' : 'Admin',
      desc: user?.rol === 'docente' ? 'Impacto y salones' : 'Gestión y métricas',
      icon: user?.rol === 'docente' ? 'school-outline' : 'shield-checkmark-outline',
      activeIcon: user?.rol === 'docente' ? 'school' : 'shield-checkmark',
      route: '/(tabs)/admin',
    }] : []),
  ];

  const handleNavigate = (route: string, key: string) => {
    if (key !== 'asistente') {
      try { Speech.stop(); } catch {}
    }
    router.push(route as any);
  };

  const handleLogout = async () => {
    try { Speech.stop(); } catch {}
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={[styles.root, { backgroundColor: tema.fondo, flexDirection: esWebGrande ? 'row' : 'column' }]}>
      <AdminGlobalNotifier />

      {/* ── BARRA LATERAL FIJA EN WEB (>= 768px) ── */}
      {esWebGrande && (
        <View style={[styles.sidebar, { borderRightColor: `${tema.primario}35` }]}>
          {/* Logo / Cabecera */}
          <View style={styles.sidebarHeader}>
            <View style={[styles.logoBadge, { backgroundColor: `${tema.primario}18`, borderColor: `${tema.primario}40` }]}>
              <Mascota estado="feliz" size={36} />
            </View>
            <View style={{ marginLeft: tokens.espaciado.sm }}>
              <Text style={[styles.sidebarTitle, { color: tema.texto }]}>EduSalud</Text>
              <Text style={[styles.sidebarSubtitle, { color: tema.textoSecundario }]}>Salud Viva</Text>
            </View>
          </View>

          {/* Tarjeta de Usuario */}
          <View style={[styles.userCard, { borderColor: `${tema.primario}28` }]}>
            <View style={[styles.avatarBox, { backgroundColor: `${tema.primario}15`, borderColor: `${tema.primario}30` }]}>
              <Ionicons name="person" size={18} color={tema.primario} />
            </View>
            <View style={{ flex: 1, marginLeft: tokens.espaciado.sm }}>
              <Text style={[styles.userName, { color: tema.texto }]} numberOfLines={1}>
                {user?.nombre_completo || user?.usuario || 'Estudiante'}
              </Text>
              <Insignia 
                texto={user?.rol === 'admin' ? 'Administrador' : user?.rol === 'docente' ? 'Docente' : 'Estudiante'}
                variante={user?.rol === 'admin' ? 'energia' : 'primario'}
              />
            </View>
            <Ionicons name="chevron-forward" size={18} color={tema.textoSecundario} />
          </View>

          {/* Navegación Vertical */}
          <ScrollView style={styles.sidebarNav} showsVerticalScrollIndicator={false}>
            <Text style={[styles.navSectionTitle, { color: tema.textoSecundario }]}>NAVEGACIÓN</Text>

            {navItems.map((item) => {
              const isActive =
                (item.key === 'index' && (pathname === '/' || pathname === '/(tabs)' || pathname === '')) ||
                (item.key !== 'index' && pathname.includes(item.key));

              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.sidebarItem,
                    isActive && {
                      backgroundColor: `${tema.primario}1C`,
                      borderColor: `${tema.primario}55`,
                      shadowColor: tema.primario,
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.16,
                      shadowRadius: 10,
                      elevation: 2,
                    }
                  ]}
                  onPress={() => handleNavigate(item.route, item.key)}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityLabel={item.label}
                >
                  {isActive && <View style={[styles.activeIndicator, { backgroundColor: tema.primarioClaro }]} />}
                  <View style={[styles.itemIcon, { backgroundColor: isActive ? `${tema.primario}24` : 'transparent' }]}>
                    <Ionicons 
                      name={(isActive ? item.activeIcon : item.icon) as any} 
                      size={20} 
                      color={isActive ? tema.primario : tema.textoSecundario} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.itemLabel, 
                      { color: isActive ? tema.primario : tema.texto, fontFamily: isActive ? tokens.tipografia.familias.titulo : tokens.tipografia.familias.cuerpo }
                    ]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.itemDesc, { color: tema.textoSecundario }]} numberOfLines={1}>
                      {item.desc}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Cerrar Sesión */}
          <TouchableOpacity 
            style={[styles.logoutBtn, { borderColor: `${tema.error}30`, backgroundColor: `${tema.error}08` }]} 
            onPress={handleLogout}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
          >
            <Ionicons name="log-out-outline" size={18} color={tema.error} />
            <Text style={[styles.logoutText, { color: tema.error }]}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── CONTENIDO PRINCIPAL: PESTAÑAS (TABS) ── */}
      <View style={styles.mainArea}>
        <Tabs
          screenListeners={{
            state: (e) => {
              try {
                const state = (e.data as any)?.state;
                const currentRoute = state?.routes?.[state?.index]?.name;
                if (currentRoute !== 'asistente') {
                  Speech.stop();
                }
              } catch {}
            }
          }}
          screenOptions={{
            headerShown: false,
            tabBarHideOnKeyboard: true,
            tabBarStyle: esWebGrande 
              ? { display: 'none' } 
              : {
                  backgroundColor: '#061A19',
                  borderTopColor: `${tema.primario}35`,
                  borderTopWidth: 1,
                  height: 68,
                  paddingBottom: 9,
                  paddingTop: 7,
                },
            tabBarActiveTintColor: tema.primario,
            tabBarInactiveTintColor: tema.textoSecundario,
            tabBarItemStyle: {
              paddingTop: 2,
            },
            tabBarLabelStyle: {
              fontFamily: tokens.tipografia.familias.cuerpoMedio,
              fontSize: tokens.tipografia.tamanos.mini,
            }
          }}>
          <Tabs.Screen 
            name="index" 
            options={{ 
              title: 'Inicio',
              tabBarIcon: ({ color, focused }) => (
                <View style={[styles.mobileTabIcon, focused && { backgroundColor: `${tema.primario}24` }]}>
                  <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
                </View>
              )
            }} 
          />
          <Tabs.Screen 
            name="descubrir" 
            options={{ 
              title: 'Descubrir',
              tabBarIcon: ({ color, focused }) => (
                <View style={[styles.mobileTabIcon, focused && { backgroundColor: `${tema.primario}24` }]}>
                  <Ionicons name={focused ? "compass" : "compass-outline"} size={22} color={color} />
                </View>
              )
            }} 
          />
          <Tabs.Screen 
            name="asistente" 
            options={{ 
              title: 'Asistente IA',
              tabBarIcon: ({ color, focused }) => (
                <View style={[styles.mobileTabIcon, focused && { backgroundColor: `${tema.primario}24` }]}>
                  <Ionicons name={focused ? "sparkles" : "sparkles-outline"} size={22} color={color} />
                </View>
              )
            }} 
          />
          <Tabs.Screen 
            name="manual" 
            options={{ 
              href: null, 
              title: 'Manual' 
            }} 
          />
          <Tabs.Screen 
            name="perfil" 
            options={{ 
              title: 'Perfil',
              tabBarIcon: ({ color, focused }) => (
                <View style={[styles.mobileTabIcon, focused && { backgroundColor: `${tema.primario}24` }]}>
                  <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
                </View>
              )
            }} 
          />
          <Tabs.Screen
            name="admin"
            options={{
              href: (user?.rol === 'admin' || user?.rol === 'docente') ? '/admin' : null,
              title: user?.rol === 'docente' ? 'Docente' : 'Admin',
              tabBarIcon: ({ color, focused }) => (
                <View style={[styles.mobileTabIcon, focused && { backgroundColor: `${tema.primario}24` }]}>
                  <Ionicons
                    name={
                      focused
                        ? user?.rol === 'docente'
                          ? 'school'
                          : 'shield-checkmark'
                        : user?.rol === 'docente'
                        ? 'school-outline'
                        : 'shield-checkmark-outline'
                    }
                    size={22}
                    color={color}
                  />
                </View>
              )
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  mainArea: {
    flex: 1,
    height: '100%',
    minWidth: 0,
  },
  sidebar: {
    width: 248,
    borderRightWidth: 1,
    paddingHorizontal: tokens.espaciado.md,
    paddingTop: tokens.espaciado.lg,
    paddingBottom: tokens.espaciado.md,
    backgroundColor: '#041716',
    shadowColor: '#00BFAE',
    shadowOffset: { width: 3, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.espaciado.lg,
    paddingHorizontal: tokens.espaciado.xs,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: tokens.radios.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sidebarTitle: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: tokens.tipografia.tamanos.etiqueta + 4,
  },
  sidebarSubtitle: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.espaciado.sm + 2,
    borderRadius: tokens.radios.md,
    borderWidth: 1,
    marginBottom: tokens.espaciado.lg,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  userName: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    marginBottom: 2,
  },
  sidebarNav: {
    flex: 1,
  },
  navSectionTitle: {
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.mini,
    letterSpacing: 1,
    marginBottom: tokens.espaciado.md,
    paddingHorizontal: tokens.espaciado.xs,
  },
  sidebarItem: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.espaciado.sm,
    paddingVertical: tokens.espaciado.sm,
    borderRadius: tokens.radios.md,
    marginBottom: tokens.espaciado.xs,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: tokens.espaciado.sm,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 9,
    bottom: 9,
    width: 3,
    borderRadius: 2,
  },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: tokens.radios.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
  itemDesc: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
  },
  mobileTabIcon: {
    width: 42,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radios.redondo,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.espaciado.sm + 4,
    borderRadius: tokens.radios.lg,
    borderWidth: 1,
    gap: tokens.espaciado.xs,
    marginTop: tokens.espaciado.md,
  },
  logoutText: {
    fontFamily: tokens.tipografia.familias.subtitulo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
});
