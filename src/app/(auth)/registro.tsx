import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  TouchableOpacity, 
  useWindowDimensions, 
  Switch 
} from 'react-native';
import { useRouter } from 'expo-router';
import { registerUser } from '../../db/database';
import { useTema } from '../../hooks/useTema';
import { tokens } from '../../constants/theme';
import { Pantalla } from '../../components/ui/Pantalla';
import { Tarjeta } from '../../components/ui/Tarjeta';
import { Boton } from '../../components/ui/Boton';
import { CampoTexto } from '../../components/ui/CampoTexto';
import { Insignia } from '../../components/ui/Insignia';
import { Mascota } from '../../components/Mascota';

export default function RegisterScreen() {
  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [genero, setGenero] = useState<'Femenino' | 'Masculino'>('Femenino');
  const [rol, setRol] = useState<'estudiante' | 'docente'>('estudiante');
  const [consentimiento, setConsentimiento] = useState(false);
  
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(false);

  const { tema } = useTema();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const esWebGrande = Platform.OS === 'web' && width >= 768;

  const handleRegister = async () => {
    const nuevosErrores: Record<string, string> = {};

    if (!nombre.trim()) nuevosErrores.nombre = 'Ingresa tus nombres y apellidos';
    if (!usuario.trim()) nuevosErrores.usuario = 'Elige un nombre de usuario';
    if (!password) {
      nuevosErrores.password = 'Crea una contraseña segura';
    } else if (password.length < 6) {
      nuevosErrores.password = 'La contraseña debe tener mínimo 6 caracteres';
    }
    if (!confirmPassword) {
      nuevosErrores.confirmPassword = 'Confirma tu contraseña';
    } else if (password !== confirmPassword) {
      nuevosErrores.confirmPassword = 'Las contraseñas no coinciden';
    }
    if (!consentimiento) {
      nuevosErrores.consentimiento = 'Debes aceptar la política de privacidad y tratamiento educativo de datos';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setErrores({});
    setLoading(true);

    try {
      const result = await registerUser(
        nombre.trim(),
        usuario.trim(),
        password,
        genero,
        consentimiento,
        rol
      );
      if (result.success) {
        setMensajeExito(true);
      } else {
        const isTaken = result.error?.toLowerCase().includes('en uso') || result.error?.toLowerCase().includes('ya existe');
        if (isTaken) {
          setErrores({ usuario: `El usuario "${usuario.trim()}" ya está en uso. Por favor prueba con otro.` });
        } else {
          setErrores({ general: result.error || 'No se pudo completar el registro. Intenta de nuevo.' });
        }
      }
    } catch {
      setErrores({ general: 'Hubo un error de conexión local al guardar tu registro.' });
    } finally {
      setLoading(false);
    }
  };

  if (mensajeExito) {
    return (
      <Pantalla style={{ backgroundColor: tema.fondo }}>
        <View style={styles.exitoContainer}>
          <Tarjeta style={styles.exitoTarjeta}>
            <Mascota estado={rol === 'docente' ? 'feliz' : 'animando'} size={100} />
            <Text style={[styles.exitoTitulo, { color: tema.texto }]}>
              {rol === 'docente' ? '¡Solicitud Docente Enviada!' : '¡Bienvenido a EduSalud!'}
            </Text>
            <Text style={[styles.exitoDesc, { color: tema.textoSecundario }]}>
              {rol === 'docente'
                ? 'Tu registro como docente ha sido guardado. Por protocolo escolar, el administrador del colegio activará tu acceso al panel pedagógico.'
                : 'Tu cuenta ha sido creada exitosamente. Ya puedes ingresar con tu nuevo usuario y contraseña.'}
            </Text>
            <Boton
              titulo="Ir a Iniciar Sesión"
              onPress={() => router.replace('/(auth)/login')}
              style={{ marginTop: tokens.espaciado.md, width: '100%' }}
            />
          </Tarjeta>
        </View>
      </Pantalla>
    );
  }

  return (
    <Pantalla style={{ backgroundColor: tema.fondo }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, esWebGrande && styles.webWrapper]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Lado Izquierdo (Web): Propuesta de valor */}
          {esWebGrande && (
            <View style={styles.leftCol}>
              <Insignia texto="Registro para estudiantes" variante="logro" />
              <Text style={[styles.heroTitle, { color: tema.texto }]}>
                Únete a la comunidad de aprendizaje en salud
              </Text>
              <Text style={[styles.heroSubtitle, { color: tema.textoSecundario }]}>
                Participa en retos semanales, mide tus hábitos preventivos y resuelve dudas en un entorno amigable diseñado para tu etapa escolar.
              </Text>
              <View style={styles.mascotaHeroWrapper}>
                <Mascota estado="feliz" size={160} />
              </View>
            </View>
          )}

          {/* Formulario */}
          <View style={[styles.rightCol, esWebGrande && styles.rightColWeb]}>
            <Tarjeta style={styles.tarjetaForm}>
              <View style={styles.formHeader}>
                <Text style={[styles.formTitle, { color: tema.texto }]}>Crear Cuenta</Text>
                <Text style={[styles.formSub, { color: tema.textoSecundario }]}>
                  Registro directo y privado para tu aprendizaje
                </Text>
              </View>

              {errores.general ? (
                <View style={[styles.errorBox, { backgroundColor: `${tema.error}15`, borderColor: `${tema.error}40` }]}>
                  <Text style={[styles.errorText, { color: tema.error }]}>{errores.general}</Text>
                </View>
              ) : null}

              <CampoTexto
                etiqueta="Nombres y apellidos"
                placeholder="Ej. Ana Belén Flores"
                value={nombre}
                onChangeText={(val) => {
                  setNombre(val);
                  if (errores.nombre) setErrores(prev => ({ ...prev, nombre: '' }));
                }}
                error={errores.nombre}
              />

              <CampoTexto
                etiqueta="Nombre de usuario"
                placeholder="Ej. ana.flores"
                value={usuario}
                onChangeText={(val) => {
                  setUsuario(val);
                  if (errores.usuario) setErrores(prev => ({ ...prev, usuario: '' }));
                }}
                autoCapitalize="none"
                error={errores.usuario}
              />

              <CampoTexto
                etiqueta="Contraseña (mínimo 6 caracteres)"
                placeholder="Crea una contraseña segura"
                secureTextEntry
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errores.password) setErrores(prev => ({ ...prev, password: '' }));
                }}
                error={errores.password}
              />

              <CampoTexto
                etiqueta="Confirmar contraseña"
                placeholder="Repite tu contraseña"
                secureTextEntry
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  if (errores.confirmPassword) setErrores(prev => ({ ...prev, confirmPassword: '' }));
                }}
                error={errores.confirmPassword}
              />

              {/* Selector de Rol */}
              <View style={styles.generoGroup}>
                <Text style={[styles.campoEtiqueta, { color: tema.textoSecundario }]}>Tipo de cuenta</Text>
                <View style={styles.generoButtons}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Registrarme como Estudiante"
                    style={[
                      styles.generoOpcion,
                      {
                        backgroundColor: rol === 'estudiante' ? `${tema.primario}18` : tema.superficie,
                        borderColor: rol === 'estudiante' ? tema.primario : tema.borde,
                      }
                    ]}
                    onPress={() => setRol('estudiante')}
                  >
                    <Text style={[
                      styles.generoTexto, 
                      { color: rol === 'estudiante' ? tema.primario : tema.textoSecundario }
                    ]}>
                      Estudiante
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Registrarme como Docente"
                    style={[
                      styles.generoOpcion,
                      {
                        backgroundColor: rol === 'docente' ? `${tema.primario}18` : tema.superficie,
                        borderColor: rol === 'docente' ? tema.primario : tema.borde,
                      }
                    ]}
                    onPress={() => setRol('docente')}
                  >
                    <Text style={[
                      styles.generoTexto, 
                      { color: rol === 'docente' ? tema.primario : tema.textoSecundario }
                    ]}>
                      Docente
                    </Text>
                  </TouchableOpacity>
                </View>
                {rol === 'docente' && (
                  <Text style={[styles.rolDocenteNota, { color: tema.primario }]}>
                    ⓘ Las cuentas docentes requieren aprobación del colegio para acceder al panel pedagógico.
                  </Text>
                )}
              </View>

              {/* Selector de Género */}
              <View style={styles.generoGroup}>
                <Text style={[styles.campoEtiqueta, { color: tema.textoSecundario }]}>Género</Text>
                <View style={styles.generoButtons}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Seleccionar género Femenino"
                    style={[
                      styles.generoOpcion,
                      {
                        backgroundColor: genero === 'Femenino' ? `${tema.primario}18` : tema.superficie,
                        borderColor: genero === 'Femenino' ? tema.primario : tema.borde,
                      }
                    ]}
                    onPress={() => setGenero('Femenino')}
                  >
                    <Text style={[
                      styles.generoTexto, 
                      { color: genero === 'Femenino' ? tema.primario : tema.textoSecundario }
                    ]}>
                      Femenino
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Seleccionar género Masculino"
                    style={[
                      styles.generoOpcion,
                      {
                        backgroundColor: genero === 'Masculino' ? `${tema.primario}18` : tema.superficie,
                        borderColor: genero === 'Masculino' ? tema.primario : tema.borde,
                      }
                    ]}
                    onPress={() => setGenero('Masculino')}
                  >
                    <Text style={[
                      styles.generoTexto, 
                      { color: genero === 'Masculino' ? tema.primario : tema.textoSecundario }
                    ]}>
                      Masculino
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Consentimiento Informado */}
              <View style={[styles.consentimientoRow, { borderColor: errores.consentimiento ? tema.error : tema.borde }]}>
                <Switch
                  value={consentimiento}
                  onValueChange={(val) => {
                    setConsentimiento(val);
                    if (errores.consentimiento) setErrores(prev => ({ ...prev, consentimiento: '' }));
                  }}
                  trackColor={{ false: tema.borde, true: tema.primario }}
                  thumbColor={tema.superficie}
                  accessibilityLabel="Acepto la política de consentimiento informado"
                />
                <Text style={[styles.consentimientoTexto, { color: tema.textoSecundario }]}>
                  Confirmo que mi apoderado y yo hemos leído y aceptamos la política de privacidad educativa y el uso exclusivo formativo de los datos.
                </Text>
              </View>
              {errores.consentimiento ? (
                <Text style={[styles.errorTextSmall, { color: tema.error }]}>{errores.consentimiento}</Text>
              ) : null}

              <Boton
                titulo="Crear Cuenta"
                cargando={loading}
                onPress={handleRegister}
                style={{ marginTop: tokens.espaciado.md }}
              />

              <Boton
                titulo="¿Ya tienes cuenta? Iniciar Sesión"
                variante="fantasma"
                onPress={() => router.replace('/(auth)/login')}
                style={{ marginTop: tokens.espaciado.sm }}
              />
            </Tarjeta>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: tokens.espaciado.lg,
  },
  webWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1040,
    marginHorizontal: 'auto',
    width: '100%',
    gap: tokens.espaciado.xxl,
  },
  leftCol: {
    flex: 1,
    paddingRight: tokens.espaciado.xl,
  },
  heroTitle: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: tokens.tipografia.tamanos.display,
    marginVertical: tokens.espaciado.md,
    lineHeight: 40,
  },
  heroSubtitle: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    lineHeight: 24,
    marginBottom: tokens.espaciado.xl,
  },
  mascotaHeroWrapper: {
    alignItems: 'flex-start',
    marginTop: tokens.espaciado.md,
  },
  rightCol: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  rightColWeb: {
    alignSelf: 'auto',
  },
  tarjetaForm: {
    padding: tokens.espaciado.xl,
  },
  formHeader: {
    marginBottom: tokens.espaciado.lg,
  },
  formTitle: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.titulo,
    marginBottom: tokens.espaciado.xs,
  },
  formSub: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
  errorBox: {
    borderWidth: 1,
    padding: tokens.espaciado.sm,
    borderRadius: tokens.radios.sm,
    marginBottom: tokens.espaciado.md,
  },
  errorText: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
  campoEtiqueta: {
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    marginBottom: tokens.espaciado.xs,
  },
  generoGroup: {
    marginBottom: tokens.espaciado.md,
  },
  rolDocenteNota: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
    marginTop: tokens.espaciado.xs,
    lineHeight: 16,
  },
  generoButtons: {
    flexDirection: 'row',
    gap: tokens.espaciado.sm,
  },
  generoOpcion: {
    flex: 1,
    height: 44,
    borderRadius: tokens.radios.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generoTexto: {
    fontFamily: tokens.tipografia.familias.subtitulo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
  },
  consentimientoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.espaciado.sm,
    padding: tokens.espaciado.sm,
    borderRadius: tokens.radios.md,
    borderWidth: 1,
    marginBottom: tokens.espaciado.xs,
  },
  consentimientoTexto: {
    flex: 1,
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
    lineHeight: 16,
  },
  errorTextSmall: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
    marginBottom: tokens.espaciado.sm,
  },
  exitoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.espaciado.lg,
  },
  exitoTarjeta: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    padding: tokens.espaciado.xl,
  },
  exitoTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.titulo,
    marginTop: tokens.espaciado.md,
    marginBottom: tokens.espaciado.xs,
    textAlign: 'center',
  },
  exitoDesc: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: tokens.espaciado.md,
  },
});
