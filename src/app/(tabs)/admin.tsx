// src/app/(tabs)/admin.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform, 
  useWindowDimensions, 
  RefreshControl,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTema } from '../../hooks/useTema';
import { tokens } from '../../constants/theme';
import { Pantalla } from '../../components/ui/Pantalla';
import { Tarjeta } from '../../components/ui/Tarjeta';
import { Boton } from '../../components/ui/Boton';
import { Insignia } from '../../components/ui/Insignia';
import { Esqueleto } from '../../components/ui/Esqueleto';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { Mascota } from '../../components/Mascota';
import GraficoEstadistico from '../../components/GraficoEstadistico';
import { 
  obtenerMetricasDocente, 
  obtenerSalonesDisponibles, 
  getPendingUsers, 
  approveUser,
  getAdminStudentAccounts,
  deactivateStudentAccount,
  reactivateStudentAccount,
  getPendingPasswordRequests,
  resolvePasswordReset
} from '../../db/database';
import { generarInformeDocentePDF, generarInformeDocenteCSV } from '../../services/pdfService';
import { MetricasSaludSalon, User, SolicitudPassword } from '../../types';

function generarPasswordTemporal(): string {
  return `Temp${Date.now().toString().slice(-4)}`;
}

export default function AdminDocenteScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { tema } = useTema();
  const { width } = useWindowDimensions();
  const esWebGrande = Platform.OS === 'web' && width >= 768;

  const esAdmin = user?.rol === 'admin';
  const salonDocente = user?.salon?.trim() || 'Sin asignar';

  // Pestaña activa (solo relevante para administradores)
  const [tabAdmin, setTabAdmin] = useState<'tablero' | 'aprobaciones' | 'claves'>('tablero');

  // Filtro de salón
  const [salones, setSalones] = useState<string[]>([]);
  const [salonSeleccionado, setSalonSeleccionado] = useState<string>(esAdmin ? 'Todos' : salonDocente);

  // Estados de datos
  const [metricas, setMetricas] = useState<MetricasSaludSalon | null>(null);
  const [solicitudesRegistro, setSolicitudesRegistro] = useState<User[]>([]);
  const [solicitudesClaves, setSolicitudesClaves] = useState<SolicitudPassword[]>([]);
  const [cuentasEstudiantes, setCuentasEstudiantes] = useState<Awaited<ReturnType<typeof getAdminStudentAccounts>>>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [exportandoCSV, setExportandoCSV] = useState(false);
  const [mensajeExitoExport, setMensajeExitoExport] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/(auth)/login');
    } else if (user.rol !== 'admin') {
      router.replace('/(tabs)');
    }
  }, [authLoading, user, router]);

  // Carga principal de datos
  const cargarDatos = useCallback(async () => {
    if (!user || user.rol !== 'admin') {
      setCargando(false);
      return;
    }
    try {
      // 1. Cargar salones disponibles
      const salonesList = await obtenerSalonesDisponibles();
      setSalones(salonesList);

      // Si es docente y no es admin, fijar su salón
      const filtro = esAdmin ? salonSeleccionado : salonDocente;

      // 2. Cargar métricas agregadas pedagógicas
      const resMetricas = await obtenerMetricasDocente(filtro === 'Todos' ? null : filtro);
      setMetricas(resMetricas);

      // 3. Si es admin, cargar aprobaciones pendientes
      if (esAdmin) {
        const pendientes = await getPendingUsers();
        setSolicitudesRegistro(pendientes);
        const claves = await getPendingPasswordRequests();
        setSolicitudesClaves(claves);
        setCuentasEstudiantes(await getAdminStudentAccounts());
      }
    } catch (err) {
      console.error('[AdminDocenteScreen Error]', err);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [esAdmin, salonSeleccionado, salonDocente, user]);

  useEffect(() => {
    if (authLoading || !esAdmin) return;
    cargarDatos();
  }, [authLoading, esAdmin, cargarDatos]);

  const onRefresh = () => {
    if (!user || user.rol !== 'admin') return;
    setRefrescando(true);
    cargarDatos();
  };

  const handleAprobarUsuario = async (userId: number, nombre: string) => {
    if (!user || user.rol !== 'admin') return;
    try {
      await approveUser(userId);
      if (Platform.OS === 'web') {
        alert(`La cuenta de ${nombre} ha sido activada con éxito.`);
      } else {
        Alert.alert('Aprobado', `La cuenta de ${nombre} ha sido activada.`);
      }
      cargarDatos();
    } catch {
      Alert.alert('Error', 'No se pudo aprobar la cuenta.');
    }
  };

  const handleResolverClave = async (solicitud: SolicitudPassword) => {
    if (!user || user.rol !== 'admin') return;
    try {
      const passTemporal = generarPasswordTemporal();
      await resolvePasswordReset(solicitud.id, solicitud.usuario_id, passTemporal);
      const msg = `Contraseña temporal asignada a ${solicitud.usuario}: ${passTemporal}`;
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Clave Restablecida', msg);
      }
      cargarDatos();
    } catch {
      Alert.alert('Error', 'No se pudo restablecer la clave.');
    }
  };

  const handleExportarPDF = async () => {
    if (!user || user.rol !== 'admin') return;
    if (!metricas) return;
    setExportandoPDF(true);
    setMensajeExitoExport(null);
    try {
      const res = await generarInformeDocentePDF(metricas, salonSeleccionado);
      if (res.success) {
        setMensajeExitoExport('Informe pedagógico en PDF exportado correctamente.');
      } else {
        Alert.alert('Aviso', res.error || 'No se pudo generar el PDF.');
      }
    } catch {
      Alert.alert('Error', 'Hubo un error al generar el informe PDF.');
    } finally {
      setExportandoPDF(false);
    }
  };

  const handleExportarCSV = async () => {
    if (!user || user.rol !== 'admin') return;
    if (!metricas) return;
    setExportandoCSV(true);
    setMensajeExitoExport(null);
    try {
      const res = await generarInformeDocenteCSV(metricas, salonSeleccionado);
      if (res.success) {
        setMensajeExitoExport('Datos del salón exportados en archivo CSV.');
      } else {
        Alert.alert('Aviso', res.error || 'No se pudo generar el CSV.');
      }
    } catch {
      Alert.alert('Error', 'Hubo un error al generar el archivo CSV.');
    } finally {
      setExportandoCSV(false);
    }
  };

  const ejecutarCambioEstadoCuenta = async (id: number, estadoActual: 'activo' | 'inactivo') => {
    if (!user || user.rol !== 'admin') return;
    const resultado = estadoActual === 'activo'
      ? await deactivateStudentAccount(id)
      : await reactivateStudentAccount(id);
    if (!resultado.success) {
      const mensaje = resultado.error || 'No se pudo actualizar la cuenta.';
      if (Platform.OS === 'web') window.alert(mensaje);
      else Alert.alert('No se pudo actualizar', mensaje);
      return;
    }
    await cargarDatos();
  };

  const confirmarDesactivacion = (id: number, usuario: string) => {
    if (!user || user.rol !== 'admin') return;
    const mensaje = 'El estudiante no podrá iniciar sesión hasta que un administrador reactive su cuenta. Su progreso y sus datos se conservarán.';
    if (Platform.OS === 'web') {
      if (window.confirm(`¿Desactivar a @${usuario}?\n\n${mensaje}`)) {
        void ejecutarCambioEstadoCuenta(id, 'activo');
      }
      return;
    }
    Alert.alert(`¿Desactivar a @${usuario}?`, mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desactivar', style: 'destructive', onPress: () => void ejecutarCambioEstadoCuenta(id, 'activo') },
    ]);
  };

  // Datos para el gráfico estadístico de aprendizaje (Pre vs Post)
  const datosGrafico = metricas?.comparativaEnfermedades
    ? metricas.comparativaEnfermedades.map(c => ({
        label: c.nombre.replace('Salud ', '').replace('Prevención de ', ''),
        value: Math.round((c.promedioPost / 5) * 100),
        color: [tema.primario, tema.primarioClaro],
      }))
    : [];

  if (authLoading || !user || user.rol !== 'admin') return null;

  const cuentasActivas = cuentasEstudiantes.filter((cuenta) => cuenta.estado === 'activo');
  const cuentasInactivas = cuentasEstudiantes.filter((cuenta) => cuenta.estado === 'inactivo');

  return (
    <Pantalla style={{ backgroundColor: tema.fondo }}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} />}
      >
        {/* Cabecera Principal */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.espaciado.xs, marginBottom: tokens.espaciado.xs }}>
              <Insignia 
                texto={esAdmin ? 'Panel Directivo' : 'Panel de Tutoría Docente'} 
                variante={esAdmin ? 'logro' : 'primario'} 
              />
              <Insignia texto="Datos Agregados Seguros" variante="neutro" />
            </View>
            <Text style={[styles.tituloPrincipal, { color: tema.texto }]}>
              {esAdmin ? 'Impacto Pedagógico y Gestión Escolar' : `Seguimiento de Salud • ${salonDocente}`}
            </Text>
            <Text style={[styles.subtituloPrincipal, { color: tema.textoSecundario }]}>
              Medición de efectividad en prevención de enfermedades no transmisibles (DNT) según MINSA y OMS.
            </Text>
          </View>
          <View style={styles.mascotaHeader}>
            <Mascota estado="feliz" size={54} />
          </View>
        </View>

        {/* Selector de Pestañas para Administrador */}
        {esAdmin && (
          <View style={[styles.tabsBar, { backgroundColor: tema.superficie, borderColor: tema.borde }]}>
            <TouchableOpacity
              onPress={() => setTabAdmin('tablero')}
              style={[
                styles.tabBtn,
                tabAdmin === 'tablero' && { borderBottomColor: tema.primario, borderBottomWidth: 3 }
              ]}
              accessibilityRole="tab"
              accessibilityLabel="Pestaña Tablero Pedagógico"
            >
              <Text style={[styles.tabTxt, { color: tabAdmin === 'tablero' ? tema.primario : tema.textoSecundario }]}>
                Tablero Pedagógico
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTabAdmin('aprobaciones')}
              style={[
                styles.tabBtn,
                tabAdmin === 'aprobaciones' && { borderBottomColor: tema.primario, borderBottomWidth: 3 }
              ]}
              accessibilityRole="tab"
              accessibilityLabel="Pestaña Aprobaciones Pendientes"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.espaciado.xs }}>
                <Text style={[styles.tabTxt, { color: tabAdmin === 'aprobaciones' ? tema.primario : tema.textoSecundario }]}>
                  Aprobaciones
                </Text>
                {solicitudesRegistro.length > 0 && (
                  <Insignia texto={String(solicitudesRegistro.length)} variante="error" />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTabAdmin('claves')}
              style={[
                styles.tabBtn,
                tabAdmin === 'claves' && { borderBottomColor: tema.primario, borderBottomWidth: 3 }
              ]}
              accessibilityRole="tab"
              accessibilityLabel="Pestaña Restablecimiento de Claves"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.espaciado.xs }}>
                <Text style={[styles.tabTxt, { color: tabAdmin === 'claves' ? tema.primario : tema.textoSecundario }]}>
                  Claves
                </Text>
                {solicitudesClaves.length > 0 && (
                  <Insignia texto={String(solicitudesClaves.length)} variante="logro" />
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Selector de Salones */}
        <View style={styles.selectorSalonesContainer}>
          <Text style={[styles.selectorLabel, { color: tema.textoSecundario }]}>Filtrar Salón:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.salonesChipsScroll}>
            {esAdmin && (
              <TouchableOpacity
                onPress={() => setSalonSeleccionado('Todos')}
                style={[
                  styles.salonChip,
                  {
                    backgroundColor: salonSeleccionado === 'Todos' ? tema.primario : tema.superficie,
                    borderColor: salonSeleccionado === 'Todos' ? tema.primario : tema.borde,
                  }
                ]}
                accessibilityRole="button"
                accessibilityLabel="Ver todos los salones"
              >
                <Text style={[styles.salonChipTxt, { color: salonSeleccionado === 'Todos' ? '#FFFFFF' : tema.texto }]}>
                  Todos los salones
                </Text>
              </TouchableOpacity>
            )}

            {salones.map(s => {
              const activo = salonSeleccionado === s;
              const deshabilitado = !esAdmin && s !== salonDocente;
              if (deshabilitado) return null;

              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSalonSeleccionado(s)}
                  style={[
                    styles.salonChip,
                    {
                      backgroundColor: activo ? tema.primario : tema.superficie,
                      borderColor: activo ? tema.primario : tema.borde,
                    }
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Filtrar por salón ${s}`}
                >
                  <Text style={[styles.salonChipTxt, { color: activo ? '#FFFFFF' : tema.texto }]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Mensaje de éxito de exportación */}
        {mensajeExitoExport && (
          <Tarjeta style={[styles.exportExitoBanner, { borderColor: tema.exito }]}>
            <Ionicons name="checkmark-circle" size={20} color={tema.exito} />
            <Text style={[styles.exportExitoTxt, { color: tema.exito }]}>{mensajeExitoExport}</Text>
          </Tarjeta>
        )}

        {/* ─── VISTA 1: TABLERO PEDAGÓGICO DE IMPACTO ─── */}
        {(!esAdmin || tabAdmin === 'tablero') && (
          <View style={styles.seccionTablero}>
            {cargando ? (
              <View style={{ gap: tokens.espaciado.md }}>
                <Esqueleto height={100} />
                <Esqueleto height={180} />
                <Esqueleto height={140} />
              </View>
            ) : !metricas ? (
              <EstadoVacio
                titulo="Sin datos registrados"
                descripcion="Aún no hay estudiantes registrados en este salón o sección."
              />
            ) : (
              <>
                {/* Grilla Responsiva de Tarjetas KPI */}
                <View style={[styles.kpiContainer, esWebGrande ? styles.kpiGridWeb : styles.kpiStackMobile]}>
                  {/* KPI 1: Alumnos y Actividad */}
                  <Tarjeta style={styles.kpiCard}>
                    <View style={styles.kpiCardHeader}>
                      <View style={[styles.kpiIconBox, { backgroundColor: `${tema.primario}18` }]}>
                        <Ionicons name="people" size={20} color={tema.primario} />
                      </View>
                      <Insignia texto="Participación" variante="primario" />
                    </View>
                    <Text style={[styles.kpiValor, { color: tema.texto }]}>
                      {metricas.alumnosActivosSemana}
                      <Text style={[styles.kpiValorSub, { color: tema.textoSecundario }]}> / {metricas.totalAlumnos}</Text>
                    </Text>
                    <Text style={[styles.kpiTitulo, { color: tema.textoSecundario }]}>Alumnos activos esta semana</Text>
                    <Text style={[styles.kpiDetalle, { color: tema.textoSecundario }]}>
                      {metricas.totalAlumnos > 0
                        ? `${Math.round((metricas.alumnosActivosSemana / metricas.totalAlumnos) * 100)}% de cobertura del aula`
                        : 'Sin registros'}
                    </Text>
                  </Tarjeta>

                  {/* KPI 2: Mejora Pre/Post Test */}
                  <Tarjeta style={[styles.kpiCard, { borderColor: `${tema.exito}50` }]}>
                    <View style={styles.kpiCardHeader}>
                      <View style={[styles.kpiIconBox, { backgroundColor: `${tema.exito}18` }]}>
                        <Ionicons name="trending-up" size={20} color={tema.exito} />
                      </View>
                      <Insignia texto="Impacto Formativo" variante="exito" />
                    </View>
                    <Text style={[styles.kpiValor, { color: tema.exito }]}>
                      +{metricas.mejoraPromedio} pts
                    </Text>
                    <Text style={[styles.kpiTitulo, { color: tema.textoSecundario }]}>Mejora promedio Pre/Post</Text>
                    <Text style={[styles.kpiDetalle, { color: tema.textoSecundario }]}>
                      Pre-test: {metricas.promedioPreTest}/5 → Post-test: {metricas.promedioPostTest}/5
                    </Text>
                  </Tarjeta>

                  {/* KPI 3: Racha Media */}
                  <Tarjeta style={styles.kpiCard}>
                    <View style={styles.kpiCardHeader}>
                      <View style={[styles.kpiIconBox, { backgroundColor: `${tema.energia}18` }]}>
                        <Ionicons name="flame" size={20} color={tema.energia} />
                      </View>
                      <Insignia texto="Constancia" variante="energia" />
                    </View>
                    <Text style={[styles.kpiValor, { color: tema.energia }]}>
                      {metricas.rachaMedia} días
                    </Text>
                    <Text style={[styles.kpiTitulo, { color: tema.textoSecundario }]}>Racha media del aula</Text>
                    <Text style={[styles.kpiDetalle, { color: tema.textoSecundario }]}>
                      Puntaje medio: {metricas.promedioPuntos} XP
                    </Text>
                  </Tarjeta>

                  {/* KPI 4: Tema a Reforzar (Enfermedad con más errores) */}
                  <Tarjeta style={[styles.kpiCard, { borderColor: `${tema.energia}40` }]}>
                    <View style={styles.kpiCardHeader}>
                      <View style={[styles.kpiIconBox, { backgroundColor: `${tema.energia}15` }]}>
                        <Ionicons name="alert-circle" size={20} color={tema.energia} />
                      </View>
                      <Insignia texto="Tema Crítico" variante="logro" />
                    </View>
                    <Text style={[styles.kpiValor, { fontSize: 18, color: tema.texto }]} numberOfLines={1}>
                      {metricas.enfermedadMasErrores ? metricas.enfermedadMasErrores.nombre : 'Sin errores'}
                    </Text>
                    <Text style={[styles.kpiTitulo, { color: tema.textoSecundario }]}>Módulo con mayor tasa de error</Text>
                    <Text style={[styles.kpiDetalle, { color: tema.textoSecundario }]}>
                      {metricas.enfermedadMasErrores
                        ? `${metricas.enfermedadMasErrores.totalErrores} fallos en quizzes • Reforzar en tutoría`
                        : 'Comprensión uniforme en todos los temas'}
                    </Text>
                  </Tarjeta>

                  {/* KPI 5: Alertas de Seguridad Asistente (Solo Conteo) */}
                  <Tarjeta style={styles.kpiCard}>
                    <View style={styles.kpiCardHeader}>
                      <View style={[styles.kpiIconBox, { backgroundColor: `${tema.error}15` }]}>
                        <Ionicons name="shield-half" size={20} color={tema.error} />
                      </View>
                      <Insignia texto="Conteo Preventivo" variante="neutro" />
                    </View>
                    <Text style={[styles.kpiValor, { color: tema.texto }]}>
                      {metricas.alertasSeguridadConteo}
                    </Text>
                    <Text style={[styles.kpiTitulo, { color: tema.textoSecundario }]}>Alertas preventivas de seguridad</Text>
                    <Text style={[styles.kpiDetalle, { color: tema.textoSecundario }]}>
                      Conteo anónimo del asistente • Cero datos de chat
                    </Text>
                  </Tarjeta>
                </View>

                {/* Gráfico Estadístico de Aprendizaje */}
                {datosGrafico.length > 0 && (
                  <Tarjeta style={styles.graficoContainer}>
                    <View style={styles.graficoHeader}>
                      <View>
                        <Text style={[styles.seccionTitulo, { color: tema.texto }]}>Efectividad de Aprendizaje por Módulo</Text>
                        <Text style={[styles.seccionSubtitulo, { color: tema.textoSecundario }]}>
                          Porcentaje de acierto post-test en {salonSeleccionado}
                        </Text>
                      </View>
                      <Insignia texto="Evaluación Formativa" variante="primario" />
                    </View>
                    <GraficoEstadistico
                      titulo=""
                      datos={datosGrafico}
                      tipo="barras"
                    />
                  </Tarjeta>
                )}

                {/* Lista de Alumnos Inactivos hace 7 días */}
                <Tarjeta style={styles.inactivosCard}>
                  <View style={styles.inactivosHeader}>
                    <View>
                      <Text style={[styles.seccionTitulo, { color: tema.texto }]}>Gestión de estudiantes</Text>
                      <Text style={[styles.seccionSubtitulo, { color: tema.textoSecundario }]}>
                        Desactiva o reactiva cuentas sin borrar su progreso.
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.seccionTitulo, styles.estadoListaTitulo, { color: tema.texto }]}>
                    Activos ({cuentasActivas.length})
                  </Text>
                  {cuentasActivas.length === 0 ? (
                    <Text style={[styles.seccionSubtitulo, styles.estadoListaVacio, { color: tema.textoSecundario }]}>
                      No hay estudiantes con cuenta activa.
                    </Text>
                  ) : cuentasActivas.map((cuenta) => (
                    <View key={cuenta.id} style={[styles.cuentaAdminFila, { backgroundColor: tema.superficie, borderColor: tema.borde }]}>
                      <View style={styles.inactivoAvatar}>
                        <Ionicons name="person-outline" size={18} color={tema.textoSecundario} />
                      </View>
                      <Text style={[styles.inactivoAlias, styles.cuentaAdminAlias, { color: tema.texto }]} numberOfLines={1}>
                        @{cuenta.usuario}
                      </Text>
                      <TouchableOpacity
                        style={[styles.cuentaAdminAccion, { borderColor: tema.error }]}
                        onPress={() => confirmarDesactivacion(cuenta.id, cuenta.usuario)}
                        accessibilityRole="button"
                        accessibilityLabel={`Desactivar cuenta de ${cuenta.usuario}`}
                      >
                        <Text style={[styles.cuentaAdminAccionTexto, { color: tema.error }]}>Desactivar cuenta</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  <Text style={[styles.seccionTitulo, styles.estadoListaTitulo, { color: tema.texto }]}>
                    Inactivos ({cuentasInactivas.length})
                  </Text>
                  {cuentasInactivas.length === 0 ? (
                    <Text style={[styles.seccionSubtitulo, styles.estadoListaVacio, { color: tema.textoSecundario }]}>
                      No hay estudiantes con cuenta desactivada.
                    </Text>
                  ) : cuentasInactivas.map((cuenta) => (
                    <View key={cuenta.id} style={[styles.cuentaAdminFila, { backgroundColor: tema.superficie, borderColor: tema.borde }]}>
                      <View style={styles.inactivoAvatar}>
                        <Ionicons name="person-outline" size={18} color={tema.textoSecundario} />
                      </View>
                      <View style={styles.cuentaAdminDatos}>
                        <Text style={[styles.inactivoAlias, { color: tema.texto }]} numberOfLines={1}>
                          @{cuenta.usuario}
                        </Text>
                        <Text style={[styles.inactivoDetalle, { color: tema.error }]}>Estado: Inactivo</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.cuentaAdminAccion, { borderColor: tema.exito }]}
                        onPress={() => void ejecutarCambioEstadoCuenta(cuenta.id, 'inactivo')}
                        accessibilityRole="button"
                        accessibilityLabel={`Reactivar cuenta de ${cuenta.usuario}`}
                      >
                        <Text style={[styles.cuentaAdminAccionTexto, { color: tema.exito }]}>Reactivar cuenta</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </Tarjeta>

                {/* Lista de Alumnos Inactivos hace 7 días */}
                <Tarjeta style={styles.inactivosCard}>
                  <View style={styles.inactivosHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.espaciado.xs, marginBottom: 2 }}>
                        <Text style={[styles.seccionTitulo, { color: tema.texto }]}>Alumnos sin actividad reciente</Text>
                        <Insignia texto={`${metricas.alumnosInactivos.length} inactivos`} variante={metricas.alumnosInactivos.length > 0 ? 'error' : 'exito'} />
                      </View>
                      <Text style={[styles.seccionSubtitulo, { color: tema.textoSecundario }]}>
                        Estudiantes con 7 o más días desde su último ingreso o sin actividad registrada. Solo alias público.
                      </Text>
                    </View>
                  </View>

                  {metricas.alumnosInactivos.length === 0 ? (
                    <View style={styles.inactivosVacio}>
                      <Ionicons name="checkmark-done-circle" size={36} color={tema.exito} />
                      <Text style={[styles.inactivosVacioTxt, { color: tema.texto }]}>
                        ¡Excelente! Todos los estudiantes de este grupo han ingresado durante la última semana.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.inactivosLista}>
                      {metricas.alumnosInactivos.map((al) => (
                        <View 
                          key={al.id} 
                          style={[styles.inactivoFila, { backgroundColor: tema.superficie, borderColor: tema.borde }]}
                        >
                          <View style={styles.inactivoAvatar}>
                            <Ionicons name="person-outline" size={18} color={tema.textoSecundario} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.inactivoAlias, { color: tema.texto }]}>{al.alias}</Text>
                            <Text style={[styles.inactivoDetalle, { color: tema.textoSecundario }]}>
                              {al.ultimoAcceso
                                ? `Último ingreso: hace ${al.diasInactivo} días · ${new Date(al.ultimoAcceso).toLocaleDateString('es-PE')}`
                                : 'Último ingreso: Nunca · Sin actividad registrada'}
                            </Text>
                          </View>
                          {al.diasInactivo !== null && (
                            <Insignia texto={`${al.diasInactivo} días sin actividad`} variante="error" />
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </Tarjeta>

                {/* Acciones de Exportación de Informes */}
                <Tarjeta style={styles.exportCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.espaciado.sm, marginBottom: tokens.espaciado.sm }}>
                    <Ionicons name="document-text-outline" size={24} color={tema.primario} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.seccionTitulo, { color: tema.texto }]}>Exportar Informes de Impacto</Text>
                      <Text style={[styles.seccionSubtitulo, { color: tema.textoSecundario }]}>
                        Descarga el informe pedagógico oficial sin datos personales sensibles.
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.exportBtnGroup, esWebGrande && styles.exportBtnGroupWeb]}>
                    <Boton
                      titulo={exportandoPDF ? 'Generando PDF...' : 'Exportar Informe PDF'}
                      variante="principal"
                      cargando={exportandoPDF}
                      onPress={handleExportarPDF}
                      style={{ flex: 1 }}
                    />
                    <Boton
                      titulo={exportandoCSV ? 'Generando CSV...' : 'Exportar Datos CSV'}
                      variante="secundario"
                      cargando={exportandoCSV}
                      onPress={handleExportarCSV}
                      style={{ flex: 1 }}
                    />
                  </View>
                </Tarjeta>
              </>
            )}
          </View>
        )}

        {/* ─── VISTA 2: APROBACIONES PENDIENTES (SOLO ADMIN) ─── */}
        {esAdmin && tabAdmin === 'aprobaciones' && (
          <View style={styles.seccionAdminTab}>
            <Text style={[styles.seccionTitulo, { color: tema.texto, marginBottom: tokens.espaciado.sm }]}>
              Solicitudes de Registro Pendientes ({solicitudesRegistro.length})
            </Text>
            {solicitudesRegistro.length === 0 ? (
              <EstadoVacio
                titulo="Sin solicitudes pendientes"
                descripcion="No hay nuevas cuentas pendientes de aprobación en este momento."
              />
            ) : (
              <View style={{ gap: tokens.espaciado.sm }}>
                {solicitudesRegistro.map((sol) => (
                  <Tarjeta key={sol.id} style={styles.solicitudCard}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.espaciado.xs, marginBottom: 2 }}>
                        <Text style={[styles.solicitudNombre, { color: tema.texto }]}>{sol.nombre_completo}</Text>
                        <Insignia 
                          texto={sol.rol === 'docente' ? 'Docente' : 'Estudiante'} 
                          variante={sol.rol === 'docente' ? 'logro' : 'primario'} 
                        />
                      </View>
                      <Text style={[styles.solicitudSub, { color: tema.textoSecundario }]}>
                        Usuario: @{sol.usuario} • {sol.salon?.trim() ? `Salón: ${sol.salon} • ` : ''}Género: {sol.genero}
                      </Text>
                    </View>
                    <Boton
                      titulo="Aprobar"
                      variante="principal"
                      onPress={() => handleAprobarUsuario(sol.id, sol.nombre_completo)}
                    />
                  </Tarjeta>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ─── VISTA 3: CLAVES Y ACCESOS (SOLO ADMIN) ─── */}
        {esAdmin && tabAdmin === 'claves' && (
          <View style={styles.seccionAdminTab}>
            <Text style={[styles.seccionTitulo, { color: tema.texto, marginBottom: tokens.espaciado.sm }]}>
              Solicitudes de Restablecimiento de Contraseña ({solicitudesClaves.length})
            </Text>
            {solicitudesClaves.length === 0 ? (
              <EstadoVacio
                titulo="Sin solicitudes de clave"
                descripcion="No hay estudiantes ni docentes solicitando reseteo de contraseña."
              />
            ) : (
              <View style={{ gap: tokens.espaciado.sm }}>
                {solicitudesClaves.map((sol) => (
                  <Tarjeta key={sol.id} style={styles.solicitudCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.solicitudNombre, { color: tema.texto }]}>{sol.nombre_completo}</Text>
                      <Text style={[styles.solicitudSub, { color: tema.textoSecundario }]}>
                        Usuario: @{sol.usuario} • Fecha: {new Date(sol.fecha_solicitud).toLocaleDateString('es-PE')}
                      </Text>
                    </View>
                    <Boton
                      titulo="Generar Temporal"
                      variante="secundario"
                      onPress={() => handleResolverClave(sol)}
                    />
                  </Tarjeta>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: tokens.espaciado.xxl }} />
      </ScrollView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: tokens.espaciado.lg,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.espaciado.lg,
    gap: tokens.espaciado.md,
  },
  tituloPrincipal: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: tokens.tipografia.tamanos.titulo,
    lineHeight: 28,
  },
  subtituloPrincipal: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    marginTop: tokens.espaciado.xs,
    lineHeight: 18,
  },
  mascotaHeader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsBar: {
    flexDirection: 'row',
    borderRadius: tokens.radios.md,
    borderWidth: 1,
    marginBottom: tokens.espaciado.md,
    overflow: 'hidden',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: tokens.espaciado.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTxt: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
  selectorSalonesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.espaciado.lg,
    gap: tokens.espaciado.sm,
  },
  selectorLabel: {
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
  salonesChipsScroll: {
    gap: tokens.espaciado.xs,
  },
  salonChip: {
    paddingHorizontal: tokens.espaciado.md,
    paddingVertical: 8,
    borderRadius: tokens.radios.lg,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  salonChipTxt: {
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
  exportExitoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.espaciado.sm,
    padding: tokens.espaciado.md,
    marginBottom: tokens.espaciado.md,
    borderWidth: 1,
  },
  exportExitoTxt: {
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    flex: 1,
  },
  seccionTablero: {
    gap: tokens.espaciado.lg,
  },
  kpiContainer: {
    gap: tokens.espaciado.md,
  },
  kpiStackMobile: {
    flexDirection: 'column',
  },
  kpiGridWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 260,
    padding: tokens.espaciado.md,
    borderWidth: 1,
  },
  kpiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.espaciado.xs,
  },
  kpiIconBox: {
    width: 36,
    height: 36,
    borderRadius: tokens.radios.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValor: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: 26,
    marginVertical: tokens.espaciado.xs,
  },
  kpiValorSub: {
    fontSize: 16,
    fontFamily: tokens.tipografia.familias.cuerpo,
  },
  kpiTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    marginBottom: 2,
  },
  kpiDetalle: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
  },
  graficoContainer: {
    padding: tokens.espaciado.lg,
  },
  graficoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.espaciado.md,
  },
  seccionTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.subtitulo,
  },
  seccionSubtitulo: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    marginTop: 2,
  },
  estadoListaTitulo: {
    fontSize: tokens.tipografia.tamanos.cuerpo,
    marginTop: tokens.espaciado.md,
    marginBottom: tokens.espaciado.xs,
  },
  estadoListaVacio: {
    marginBottom: tokens.espaciado.sm,
  },
  cuentaAdminFila: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.espaciado.sm,
    borderRadius: tokens.radios.sm,
    borderWidth: 1,
    gap: tokens.espaciado.sm,
    marginBottom: tokens.espaciado.xs,
  },
  cuentaAdminAlias: {
    flex: 1,
  },
  cuentaAdminDatos: {
    flex: 1,
    minWidth: 80,
  },
  cuentaAdminAccion: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: tokens.espaciado.sm,
    borderWidth: 1,
    borderRadius: tokens.radios.sm,
  },
  cuentaAdminAccionTexto: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.mini,
  },
  inactivosCard: {
    padding: tokens.espaciado.md,
  },
  inactivosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.espaciado.md,
  },
  inactivosVacio: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.espaciado.lg,
    gap: tokens.espaciado.xs,
  },
  inactivosVacioTxt: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    textAlign: 'center',
  },
  inactivosLista: {
    gap: tokens.espaciado.xs,
  },
  inactivoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.espaciado.sm,
    borderRadius: tokens.radios.sm,
    borderWidth: 1,
    gap: tokens.espaciado.sm,
  },
  inactivoAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  inactivoAlias: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
  inactivoDetalle: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
  },
  exportCard: {
    padding: tokens.espaciado.lg,
  },
  exportBtnGroup: {
    flexDirection: 'column',
    gap: tokens.espaciado.sm,
    marginTop: tokens.espaciado.sm,
  },
  exportBtnGroupWeb: {
    flexDirection: 'row',
  },
  seccionAdminTab: {
    gap: tokens.espaciado.md,
  },
  solicitudCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.espaciado.md,
    gap: tokens.espaciado.md,
  },
  solicitudNombre: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
  },
  solicitudSub: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    marginTop: 2,
  },
});
