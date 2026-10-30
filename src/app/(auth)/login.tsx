import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  Alert, 
  ScrollView, 
  Modal, 
  useWindowDimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { authenticateUser, setupInitialAdmin, requestPasswordReset } from '../../db/database';
import { useAuth } from '../../context/AuthContext';
import { useTema } from '../../hooks/useTema';
import { tokens } from '../../constants/theme';
import { Pantalla } from '../../components/ui/Pantalla';
import { Tarjeta } from '../../components/ui/Tarjeta';
import { Boton } from '../../components/ui/Boton';
import { CampoTexto } from '../../components/ui/CampoTexto';
import { Insignia } from '../../components/ui/Insignia';
import { Mascota } from '../../components/Mascota';

export default function LoginScreen() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [errorUsuario, setErrorUsuario] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const passwordInputRef = useRef<any>(null);

  // Modal de configuración inicial de admin
  const [showAdminSetup, setShowAdminSetup] = useState(false);
  const [adminNombre, setAdminNombre] = useState('');
  const [adminUsuario, setAdminUsuario] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Modal de ayuda / recuperación
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login, hasAdmin, refreshAdminStatus } = useAuth();
  const { tema } = useTema();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const esWebGrande = Platform.OS === 'web' && width >= 768;

  const usuarioRef = useRef(usuario);
  const passwordRef = useRef(password);

  useEffect(() => {
    usuarioRef.current = usuario;
  }, [usuario]);

  useEffect(() => {
    passwordRef.current = password;
  }, [password]);

  const handleLogin = useCallback(async () => {
    const userVal = (usuarioRef.current || usuario).trim();
    const passVal = (passwordRef.current || password).trim();

    setErrorUsuario('');
    setErrorPassword('');

    if (!userVal) {
      setErrorUsuario('Por favor escribe tu nombre de usuario');
      return;
    }
    if (!passVal) {
      setErrorPassword('Ingresa tu contraseña');
      passwordInputRef.current?.focus();
      return;
    }

    if (isLoggingIn) return;
    setIsLoggingIn(true);

    try {
      const authResult = await authenticateUser(userVal, passVal);

      if (authResult.success && authResult.user) {
        await login(authResult.user);
        router.replace('/(tabs)');
      } else if (authResult.status === 'pendiente') {
        setIsLoggingIn(false);
        const msg = 'Tu cuenta aún está en proceso de activación por tu tutor o administrador. Vuelve a intentarlo en unos momentos.';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Cuenta en Proceso', msg);
      } else if (authResult.status === 'rechazado') {
        setIsLoggingIn(false);
        const msg = 'Tu cuenta no pudo ser activada. Conversa con el docente o tutor de tu colegio.';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Solicitud no aprobada', msg);
      } else {
        setIsLoggingIn(false);
        setErrorPassword(authResult.error || 'Usuario o contraseña no coinciden.');
      }
    } catch (e) {
      setIsLoggingIn(false);
      console.error(e);
      setErrorPassword('No se pudo conectar con el servicio. Intenta nuevamente.');
    }
  }, [usuario, password, isLoggingIn, login, router]);

  // Listener para capturar la tecla Enter en la versión Web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          if (!showAdminSetup && !showForgotModal) {
            e.preventDefault();
            handleLogin();
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleLogin, showAdminSetup, showForgotModal]);

  const handleRequestReset = async () => {
    if (!forgotUsername.trim()) {
      Alert.alert('Atención', 'Por favor ingresa tu nombre de usuario.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await requestPasswordReset(forgotUsername.trim());
      if (res.success) {
        const msg = res.message || 'Solicitud enviada a tu docente tutor para actualizar tu clave.';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Solicitud Enviada', msg);
        setShowForgotModal(false);
        setForgotUsername('');
      } else {
        if (Platform.OS === 'web') window.alert(res.error || 'No se pudo enviar la solicitud');
        else Alert.alert('Aviso', res.error || 'No se pudo enviar la solicitud');
      }
    } catch {
      if (Platform.OS === 'web') window.alert('Error de conexión local');
      else Alert.alert('Error', 'Error de conexión local');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCreateInitialAdmin = async () => {
    if (!adminNombre.trim() || !adminUsuario.trim() || !adminPassword) {
      Alert.alert('Atención', 'Todos los campos son obligatorios');
      return;
    }
    if (adminPassword.length < 8) {
      Alert.alert('Atención', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    const res = await setupInitialAdmin(adminNombre, adminUsuario, adminPassword);
    if (res.success) {
      Alert.alert('Éxito', 'Administrador configurado de forma segura. Ya puedes iniciar sesión.');
      setShowAdminSetup(false);
      setUsuario(adminUsuario);
      setPassword('');
      await refreshAdminStatus();
    } else {
      Alert.alert('Error', res.error || 'No se pudo configurar el administrador');
    }
  };

  return (
    <Pantalla centrarWeb={false} style={styles.screen}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            !esWebGrande && styles.mobileScrollContent,
            esWebGrande && styles.webWrapper,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {esWebGrande && (
            <LinearGradient
              colors={['rgba(6, 72, 68, 0)', 'rgba(8, 103, 94, 0.4)', 'rgba(6, 72, 68, 0)']}
              locations={[0, 0.52, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.desktopSceneGlow}
            />
          )}

          {/* Lado Izquierdo (Web): Ilustración y Propuesta de Valor */}
          {esWebGrande && (
            <View style={styles.leftCol}>
              <View style={styles.botanicalSprig}>
                <View style={styles.botanicalStem} />
                <View style={[styles.botanicalLeaf, styles.botanicalLeafOne]} />
                <View style={[styles.botanicalLeaf, styles.botanicalLeafTwo]} />
                <View style={[styles.botanicalLeaf, styles.botanicalLeafThree]} />
                <View style={[styles.botanicalLeaf, styles.botanicalLeafFour]} />
              </View>

              <View style={styles.brandLockup}>
                <View style={styles.brandMark}>
                  <Mascota estado="feliz" size={38} />
                </View>
                <View>
                  <Text style={styles.brandName}>EduSalud</Text>
                  <Text style={styles.brandCaption}>Salud Viva</Text>
                </View>
              </View>

              <Insignia
                texto="Educación preventiva para adolescentes"
                variante="primario"
                style={[
                  styles.educationBadge,
                  tema.primario === tokens.colores.oscuro.primario
                    ? styles.educationBadgeDark
                    : styles.educationBadgeLight,
                ]}
              />

              <Text style={styles.heroTitle}>
                Aprende a cuidar tu{' '}
                <Text style={styles.heroAccent}>salud</Text>
                {'\n'}sin complicaciones
              </Text>

              <Text style={styles.heroSubtitle}>
                Descubre hábitos saludables, prevención de enfermedades no transmisibles, retos diarios y orientación con nuestro tutor interactivo.
              </Text>

              <View style={styles.benefitsRow}>
                <View style={styles.benefitPill}>
                  <Text style={styles.benefitText}>✓ Aprende</Text>
                </View>
                <View style={styles.benefitPill}>
                  <Text style={styles.benefitText}>✓ Previene</Text>
                </View>
                <View style={styles.benefitPill}>
                  <Text style={styles.benefitText}>✓ Cuida tu salud</Text>
                </View>
              </View>

              <View style={styles.heroMascotSlot}>
                <View style={styles.mascotHalo} />
                <View style={styles.mascotHaloInner} />
                <View style={[styles.healthBubble, styles.healthBubbleHeart]}>
                  <Text style={styles.healthBubbleIcon}>💗</Text>
                </View>
                <View style={[styles.healthBubble, styles.healthBubbleBrain]}>
                  <Text style={styles.healthBubbleIcon}>🧠</Text>
                </View>
                <View style={[styles.healthBubble, styles.healthBubbleLeaf]}>
                  <Text style={styles.healthBubbleIcon}>🍃</Text>
                </View>
                <Mascota estado="animando" size={250} />
              </View>
            </View>
          )}

          {!esWebGrande && (
            <View style={styles.mobileHero}>
              <View style={styles.mobileBrand}>
                <View style={styles.mobileBrandMark}>
                  <Mascota estado="feliz" size={42} />
                </View>
                <View>
                  <Text style={styles.mobileEyebrow}>EduSalud</Text>
                  <Text style={styles.mobileBrandCaption}>Salud Viva</Text>
                </View>
              </View>
              <Insignia
                texto="Educación preventiva para adolescentes"
                variante="primario"
                style={[
                  styles.mobileEducationBadge,
                  tema.primario === tokens.colores.oscuro.primario
                    ? styles.educationBadgeDark
                    : styles.educationBadgeLight,
                ]}
              />
              <Text style={styles.mobileTitle}>Aprende a cuidar tu salud sin complicaciones</Text>
              <Text style={styles.mobileSubtitle}>Descubre hábitos saludables, prevención de enfermedades no transmisibles, retos diarios y orientación con nuestro tutor interactivo.</Text>
              <View style={styles.mobileMascot}>
                <View style={styles.mobileMascotHalo} />
                <View style={[styles.mobileHealthBubble, styles.mobileHealthBubbleHeart]}>
                  <Text style={styles.mobileHealthBubbleIcon}>💗</Text>
                </View>
                <View style={[styles.mobileHealthBubble, styles.mobileHealthBubbleLeaf]}>
                  <Text style={styles.mobileHealthBubbleIcon}>🍃</Text>
                </View>
                <Mascota estado="animando" size={104} />
              </View>
            </View>
          )}

          {/* Formulario / Tarjeta de Login */}
          <View style={[styles.rightCol, esWebGrande && styles.rightColWeb]}>
            <Tarjeta style={[styles.tarjetaLogin, !esWebGrande && styles.tarjetaLoginMobile]}>
              <View style={[styles.headerMascota, !esWebGrande && styles.headerMascotaMobile]}>
                <Mascota estado="feliz" size={esWebGrande ? 58 : 44} />
                <View style={styles.loginHeaderCopy}>
                  {esWebGrande && <Text style={styles.logoText}>EduSalud</Text>}
                  <Text style={[styles.welcomeTitle, !esWebGrande && styles.welcomeTitleMobile]}>Bienvenido a EduSalud</Text>
                  <Text style={[styles.loginSub, !esWebGrande && styles.loginSubMobile]}>
                    Continúa aprendiendo a cuidar tu salud
                  </Text>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Usuario</Text>
              <CampoTexto
                placeholder="Ej. dany o admin"
                placeholderTextColor={tokens.colores.oscuro.textoSecundario}
                value={usuario}
                onChangeText={(val) => {
                  setUsuario(val);
                  if (errorUsuario) setErrorUsuario('');
                }}
                autoCapitalize="none"
                style={[styles.input, !esWebGrande && styles.inputMobile]}
                returnKeyType={password ? "go" : "next"}
                onSubmitEditing={() => {
                  if (passwordRef.current?.trim()) {
                    handleLogin();
                  } else {
                    passwordInputRef.current?.focus();
                  }
                }}
                onKeyPress={(e: any) => {
                  if (e.nativeEvent?.key === 'Enter' || e.key === 'Enter') {
                    if (passwordRef.current?.trim()) {
                      handleLogin();
                    } else {
                      passwordInputRef.current?.focus();
                    }
                  }
                }}
                onKeyDown={(e: any) => {
                  if (e.key === 'Enter') {
                    e.preventDefault?.();
                    if (passwordRef.current?.trim()) {
                      handleLogin();
                    } else {
                      passwordInputRef.current?.focus();
                    }
                  }
                }}
                error={errorUsuario}
              />

              <Text style={styles.fieldLabel}>Contraseña</Text>
              <CampoTexto
                ref={passwordInputRef}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor={tokens.colores.oscuro.textoSecundario}
                secureTextEntry
                style={[styles.input, !esWebGrande && styles.inputMobile]}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorPassword) setErrorPassword('');
                }}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
                onKeyPress={(e: any) => {
                  if (e.nativeEvent?.key === 'Enter' || e.key === 'Enter') {
                    handleLogin();
                  }
                }}
                onKeyDown={(e: any) => {
                  if (e.key === 'Enter') {
                    e.preventDefault?.();
                    handleLogin();
                  }
                }}
                error={errorPassword}
              />

              <Boton
                titulo="Iniciar Sesión"
                cargando={isLoggingIn}
                style={[styles.loginButton, !esWebGrande && styles.loginButtonMobile]}
                onPress={handleLogin}
              />

              <Boton
                titulo="¿Olvidaste tu contraseña o necesitas ayuda?"
                variante="fantasma"
                onPress={() => {
                  setForgotUsername(usuario || '');
                  setShowForgotModal(true);
                }}
                style={[
                  styles.helpButton,
                  !esWebGrande && styles.helpButtonMobile,
                  tema.primario !== tokens.colores.oscuro.primario && styles.lightSurfaceAction,
                ]}
              />

              <View style={[styles.divider, !esWebGrande && styles.dividerMobile]} />

              <Boton
                titulo="¿Nuevo estudiante? Crear una cuenta"
                variante="secundario"
                style={[
                  styles.secondaryButton,
                  tema.primario !== tokens.colores.oscuro.primario && styles.lightSurfaceAction,
                ]}
                onPress={() => router.push('/(auth)/registro')}
              />

              {!hasAdmin && (
                <Boton
                  titulo="Configurar Administrador Inicial"
                  variante="fantasma"
                  onPress={() => setShowAdminSetup(true)}
                  style={[
                    styles.adminButton,
                    tema.primario !== tokens.colores.oscuro.primario && styles.lightSurfaceAction,
                  ]}
                />
              )}
            </Tarjeta>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Ayuda y Recuperación */}
      <Modal visible={showForgotModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Tarjeta style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ayuda con tu cuenta</Text>
            <Text style={styles.modalDesc}>
              Si olvidaste tu contraseña, escribe tu usuario. Le enviaremos un aviso al docente administrador para que restablezca tu clave de acceso.
            </Text>

            <Text style={styles.fieldLabel}>Tu nombre de usuario</Text>
            <CampoTexto
              placeholder="Ej. maria.lopez"
              placeholderTextColor={tokens.colores.oscuro.textoSecundario}
              value={forgotUsername}
              onChangeText={setForgotUsername}
              autoCapitalize="none"
              style={styles.input}
            />

            <View style={styles.modalButtons}>
              <Boton
                titulo="Cancelar"
                variante="secundario"
                onPress={() => setShowForgotModal(false)}
                style={[
                  { flex: 1, marginRight: tokens.espaciado.sm },
                  tema.primario !== tokens.colores.oscuro.primario && styles.lightSurfaceAction,
                ]}
              />
              <Boton
                titulo="Solicitar"
                cargando={forgotLoading}
                onPress={handleRequestReset}
                style={[styles.modalPrimaryButton, { flex: 1 }]}
              />
            </View>
          </Tarjeta>
        </View>
      </Modal>

      {/* Modal de Configuración Inicial de Administrador */}
      <Modal visible={showAdminSetup} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Tarjeta style={styles.modalCard}>
            <Text style={styles.modalTitle}>Configuración Inicial</Text>
            <Text style={styles.modalDesc}>
              Crea la cuenta de docente o administrador responsable de este dispositivo o aula.
            </Text>

            <Text style={styles.fieldLabel}>Nombre completo</Text>
            <CampoTexto
              placeholder="Prof. Juan Pérez"
              placeholderTextColor={tokens.colores.oscuro.textoSecundario}
              value={adminNombre}
              onChangeText={setAdminNombre}
              style={styles.input}
            />
            <Text style={styles.fieldLabel}>Usuario de acceso</Text>
            <CampoTexto
              placeholder="admin"
              placeholderTextColor={tokens.colores.oscuro.textoSecundario}
              value={adminUsuario}
              onChangeText={setAdminUsuario}
              autoCapitalize="none"
              style={styles.input}
            />
            <Text style={styles.fieldLabel}>Contraseña (mín. 8 caracteres)</Text>
            <CampoTexto
              placeholder="Crea una clave segura"
              placeholderTextColor={tokens.colores.oscuro.textoSecundario}
              secureTextEntry
              value={adminPassword}
              onChangeText={setAdminPassword}
              style={styles.input}
            />

            <View style={styles.modalButtons}>
              <Boton
                titulo="Cancelar"
                variante="secundario"
                onPress={() => setShowAdminSetup(false)}
                style={[
                  { flex: 1, marginRight: tokens.espaciado.sm },
                  tema.primario !== tokens.colores.oscuro.primario && styles.lightSurfaceAction,
                ]}
              />
              <Boton
                titulo="Guardar"
                onPress={handleCreateInitialAdmin}
                style={[styles.modalPrimaryButton, { flex: 1 }]}
              />
            </View>
          </Tarjeta>
        </View>
      </Modal>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#041514',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: tokens.espaciado.md,
    paddingVertical: tokens.espaciado.lg,
  },
  mobileScrollContent: {
    paddingTop: tokens.espaciado.sm,
    paddingBottom: tokens.espaciado.xl,
  },
  webWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    maxWidth: 1240,
    marginHorizontal: 'auto',
    width: '100%',
    minHeight: 650,
    gap: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#17605A',
    backgroundColor: '#06201F',
    shadowColor: '#05C8B8',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 36,
    elevation: 12,
  },
  desktopSceneGlow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '14%',
    right: 0,
  },
  leftCol: {
    flex: 1.3,
    position: 'relative',
    justifyContent: 'flex-start',
    minHeight: 650,
    padding: 42,
    paddingBottom: 190,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.espaciado.sm,
    marginBottom: 28,
  },
  brandMark: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2CA99D',
    borderRadius: tokens.radios.md,
    backgroundColor: '#0A3633',
    shadowColor: '#28D8C6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  brandName: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: tokens.tipografia.tamanos.subtitulo,
    color: tokens.colores.oscuro.texto,
  },
  brandCaption: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    color: tokens.colores.oscuro.textoSecundario,
    marginTop: 1,
  },
  educationBadge: {
    marginBottom: tokens.espaciado.md,
    backgroundColor: '#0B3A36',
    borderColor: '#247F75',
  },
  educationBadgeDark: {
    backgroundColor: '#0B3A36',
    borderColor: '#247F75',
  },
  educationBadgeLight: {
    backgroundColor: '#D1FAF4',
    borderColor: '#63CDBD',
  },
  rightCol: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  rightColWeb: {
    flex: 1,
    maxWidth: 520,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 32,
  },
  heroTitle: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: 40,
    color: tokens.colores.oscuro.texto,
    maxWidth: 540,
    marginVertical: tokens.espaciado.sm,
    lineHeight: 47,
  },
  heroAccent: {
    color: tokens.colores.oscuro.primarioClaro,
  },
  heroSubtitle: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 510,
    color: tokens.colores.oscuro.textoSecundario,
    marginBottom: tokens.espaciado.md,
  },
  benefitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.espaciado.sm,
    marginTop: tokens.espaciado.xs,
  },
  benefitPill: {
    borderWidth: 1,
    borderColor: '#21665F',
    backgroundColor: '#0A302D',
    borderRadius: tokens.radios.redondo,
    paddingHorizontal: 12,
    paddingVertical: tokens.espaciado.xs,
  },
  benefitText: {
    fontFamily: tokens.tipografia.familias.subtitulo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    color: '#9AE7DC',
  },
  heroMascotSlot: {
    position: 'absolute',
    right: 18,
    bottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  healthBubble: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(86, 230, 214, 0.45)',
    backgroundColor: 'rgba(7, 48, 45, 0.9)',
    zIndex: 2,
  },
  healthBubbleHeart: {
    left: -18,
    top: 30,
  },
  healthBubbleBrain: {
    right: -8,
    top: 58,
  },
  healthBubbleLeaf: {
    left: 10,
    bottom: 42,
  },
  healthBubbleIcon: {
    fontSize: 21,
  },
  mascotHaloInner: {
    position: 'absolute',
    width: 206,
    height: 206,
    borderRadius: 103,
    borderWidth: 1,
    borderColor: 'rgba(105, 246, 227, 0.3)',
    backgroundColor: 'rgba(12, 196, 178, 0.1)',
  },
  mascotHalo: {
    position: 'absolute',
    width: 310,
    height: 310,
    borderRadius: 155,
    top: -34,
    left: -30,
    borderWidth: 1,
    borderColor: 'rgba(87, 237, 219, 0.32)',
    backgroundColor: 'rgba(20, 184, 166, 0.16)',
    shadowColor: '#1AD8C6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 42,
  },
  botanicalSprig: {
    position: 'absolute',
    width: 170,
    height: 170,
    left: 20,
    bottom: 3,
    opacity: 0.92,
    transform: [{ rotate: '-14deg' }],
  },
  botanicalStem: {
    position: 'absolute',
    width: 2,
    height: 145,
    left: 65,
    bottom: 0,
    borderRadius: 2,
    backgroundColor: '#23786D',
    transform: [{ rotate: '-25deg' }],
  },
  botanicalLeaf: {
    position: 'absolute',
    width: 28,
    height: 46,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 28,
    borderWidth: 1,
    borderColor: '#37AA9C',
    backgroundColor: 'rgba(20, 135, 118, 0.48)',
  },
  botanicalLeafOne: {
    left: 28,
    bottom: 22,
    transform: [{ rotate: '-48deg' }],
  },
  botanicalLeafTwo: {
    left: 79,
    bottom: 42,
    transform: [{ rotate: '42deg' }],
  },
  botanicalLeafThree: {
    left: 42,
    bottom: 73,
    transform: [{ rotate: '-42deg' }],
  },
  botanicalLeafFour: {
    left: 87,
    bottom: 94,
    transform: [{ rotate: '43deg' }],
  },
  mobileHero: {
    alignItems: 'center',
    paddingTop: tokens.espaciado.xs,
    marginBottom: tokens.espaciado.sm,
  },
  mobileBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.espaciado.sm,
    marginBottom: tokens.espaciado.sm,
  },
  mobileBrandMark: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2CA99D',
    borderRadius: tokens.radios.md,
    backgroundColor: '#0C3835',
  },
  mobileEyebrow: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: tokens.tipografia.tamanos.subtitulo,
    color: tokens.colores.oscuro.texto,
  },
  mobileBrandCaption: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
    color: tokens.colores.oscuro.textoSecundario,
  },
  mobileEducationBadge: {
    marginBottom: tokens.espaciado.xs,
    backgroundColor: '#0A3632',
    borderColor: '#176F66',
  },
  mobileTitle: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
    color: tokens.colores.oscuro.texto,
  },
  mobileSubtitle: {
    maxWidth: 480,
    marginTop: 2,
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    color: tokens.colores.oscuro.textoSecundario,
  },
  mobileMascot: {
    marginTop: 0,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 112,
    height: 92,
  },
  mobileMascotHalo: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(89, 236, 218, 0.3)',
    backgroundColor: 'rgba(20, 184, 166, 0.16)',
  },
  mobileHealthBubble: {
    position: 'absolute',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(86, 230, 214, 0.5)',
    backgroundColor: 'rgba(7, 48, 45, 0.94)',
    zIndex: 2,
  },
  mobileHealthBubbleHeart: {
    top: 8,
    left: -2,
  },
  mobileHealthBubbleLeaf: {
    right: -2,
    bottom: 8,
  },
  mobileHealthBubbleIcon: {
    fontSize: 16,
  },
  tarjetaLogin: {
    padding: 22,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#0B302D',
    borderColor: '#1B625B',
    borderRadius: 26,
    borderWidth: 1,
    shadowColor: '#00CBB9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
  },
  tarjetaLoginMobile: {
    padding: tokens.espaciado.md,
    marginBottom: tokens.espaciado.md,
  },
  headerMascota: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.espaciado.md,
    marginBottom: tokens.espaciado.md,
  },
  headerMascotaMobile: {
    gap: tokens.espaciado.sm,
    marginBottom: tokens.espaciado.sm,
  },
  loginHeaderCopy: {
    flex: 1,
  },
  logoText: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: tokens.tipografia.tamanos.subtitulo,
    color: tokens.colores.oscuro.primarioClaro,
  },
  welcomeTitle: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: 19,
    lineHeight: 23,
    color: tokens.colores.oscuro.texto,
  },
  welcomeTitleMobile: {
    fontSize: 17,
    lineHeight: 20,
  },
  loginSub: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: 12,
    lineHeight: 16,
    color: tokens.colores.oscuro.textoSecundario,
    marginTop: tokens.espaciado.xs,
  },
  loginSubMobile: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
  input: {
    minHeight: 50,
    paddingVertical: 2,
    backgroundColor: '#08211F',
    color: tokens.colores.oscuro.texto,
    borderWidth: 1,
    borderColor: '#20514C',
    borderRadius: tokens.radios.md,
  },
  inputMobile: {
    minHeight: 46,
  },
  fieldLabel: {
    marginBottom: 6,
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: 13,
    color: '#B5D5D0',
  },
  loginButton: {
    minHeight: 52,
    marginTop: 12,
    backgroundColor: '#09C9B8',
    shadowColor: '#00D7C3',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.27,
    shadowRadius: 16,
    elevation: 5,
  },
  loginButtonMobile: {
    minHeight: 48,
    marginTop: tokens.espaciado.xs,
  },
  modalPrimaryButton: {
    minHeight: 48,
    backgroundColor: '#09C9B8',
  },
  helpButton: {
    minHeight: 44,
    marginTop: 2,
    paddingVertical: tokens.espaciado.sm,
  },
  helpButtonMobile: {
    minHeight: 40,
  },
  secondaryButton: {
    minHeight: 48,
    backgroundColor: '#0C302D',
    borderColor: '#267D73',
  },
  lightSurfaceAction: {
    backgroundColor: '#D1FAF4',
    borderColor: '#63CDBD',
  },
  adminButton: {
    marginTop: tokens.espaciado.md,
  },
  divider: {
    height: 1,
    marginVertical: tokens.espaciado.md,
    backgroundColor: '#20413D',
  },
  dividerMobile: {
    marginVertical: tokens.espaciado.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 13, 13, 0.84)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.espaciado.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    padding: tokens.espaciado.xl,
    backgroundColor: '#0B2423',
    borderColor: '#17433F',
  },
  modalTitle: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.subtitulo,
    color: tokens.colores.oscuro.texto,
    marginBottom: tokens.espaciado.xs,
  },
  modalDesc: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    lineHeight: 20,
    color: tokens.colores.oscuro.textoSecundario,
    marginBottom: tokens.espaciado.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: tokens.espaciado.sm,
  },
});
