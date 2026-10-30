import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useTema } from '../../hooks/useTema';
import { tokens } from '../../constants/theme';
import { nivelDesdeXp, xpEnNivel, xpParaSiguiente, rangoDeNivel } from '../../lib/gamificacion';
import { generarHtmlCarneSalud, DatosCarneSalud } from '../../lib/carneSalud';
import { Pantalla } from '../../components/ui/Pantalla';
import { Tarjeta } from '../../components/ui/Tarjeta';
import { Boton } from '../../components/ui/Boton';
import { Insignia } from '../../components/ui/Insignia';
import { BarraProgreso } from '../../components/ui/BarraProgreso';
import { Mascota } from '../../components/Mascota';
import { 
  obtenerLogrosUsuario, 
  actualizarConfigRecordatorio, 
  obtenerTodasEvaluacionesUsuario, 
  LogroConEstado 
} from '../../db/database';
import {
  solicitarPermisoNotificaciones,
  programarRecordatorioDiario,
  cancelarRecordatorios,
} from '../../services/notificaciones';

const HORAS_RECORDATORIO = ['16:00', '18:00', '20:00', '21:00'];

export default function ProfileScreen() {
  const { user, logout, refrescarUsuario } = useAuth();
  const { modo, setModo, tema } = useTema();
  const router = useRouter();

  const [logros, setLogros] = useState<LogroConEstado[]>([]);
  const [recordatorioActivo, setRecordatorioActivo] = useState(Boolean(user?.recordatorio_activo));
  const [recordatorioHora, setRecordatorioHora] = useState(user?.recordatorio_hora || '18:00');
  const [mensajeNotif, setMensajeNotif] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      obtenerLogrosUsuario(user.id).then(setLogros).catch(() => {});
    }
  }, [user?.id, user?.puntos]);

  useEffect(() => {
    if (user) {
      setRecordatorioActivo(Boolean(user.recordatorio_activo));
      if (user.recordatorio_hora) {
        setRecordatorioHora(user.recordatorio_hora);
      }
    }
  }, [user?.recordatorio_activo, user?.recordatorio_hora]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleToggleRecordatorio = async (nuevoValor: boolean) => {
    setMensajeNotif(null);
    if (nuevoValor) {
      const concedido = await solicitarPermisoNotificaciones();
      if (!concedido && Platform.OS !== 'web') {
        setMensajeNotif('Para recibir recordatorios, debes habilitar notificaciones en tu celular.');
        setRecordatorioActivo(false);
        return;
      }

      const [h, m] = recordatorioHora.split(':').map(Number);
      await programarRecordatorioDiario(h, m || 0);
      setRecordatorioActivo(true);
      if (user?.id) {
        await actualizarConfigRecordatorio(user.id, recordatorioHora, true);
        await refrescarUsuario();
      }
      setMensajeNotif(`¡Recordatorio programado a las ${recordatorioHora}!`);
    } else {
      await cancelarRecordatorios();
      setRecordatorioActivo(false);
      if (user?.id) {
        await actualizarConfigRecordatorio(user.id, recordatorioHora, false);
        await refrescarUsuario();
      }
      setMensajeNotif('Recordatorios desactivados.');
    }
  };

  const handleCambiarHora = async (hora: string) => {
    setRecordatorioHora(hora);
    setMensajeNotif(null);
    if (recordatorioActivo) {
      const [h, m] = hora.split(':').map(Number);
      await programarRecordatorioDiario(h, m || 0);
      setMensajeNotif(`Horario actualizado a las ${hora}`);
    }
    if (user?.id) {
      await actualizarConfigRecordatorio(user.id, hora, recordatorioActivo);
      await refrescarUsuario();
    }
  };

  const puntos = user?.puntos || 0;
  const nivel = nivelDesdeXp(puntos);
  const rango = rangoDeNivel(nivel);
  const xpActual = xpEnNivel(puntos);
  const xpMeta = xpParaSiguiente(nivel);
  const progresoXp = xpMeta > 0 ? Math.min(1, xpActual / xpMeta) : 1;
  const rachaActual = user?.racha_actual || 0;
  const rachaMaxima = user?.racha_maxima || rachaActual;
  const congeladoresDisp = user?.congeladores_disponibles ?? 1;

  const totalLogrosDesbloqueados = logros.filter((l) => l.desbloqueado).length;

  const [generandoPdf, setGenerandoPdf] = useState(false);

  const handleDescargarCarnePdf = async () => {
    if (!user) return;
    setGenerandoPdf(true);

    try {
      // 1. Obtener IMC más reciente si existe
      let ultimoImc: number | undefined;
      let ultimaCat: string | undefined;
      try {
        const storedImc = await AsyncStorage.getItem('historial_evaluaciones');
        if (storedImc) {
          const arr = JSON.parse(storedImc);
          if (Array.isArray(arr) && arr.length > 0) {
            const last = arr[arr.length - 1];
            ultimoImc = last.imc;
            ultimaCat = last.categoria;
          }
        }
      } catch {}

      // 2. Obtener evaluaciones pre/post completadas
      let evalsFormateadas: Array<{
        enfermedad: string;
        preAciertos: number;
        postAciertos: number;
        mejoraPorcentaje: number;
      }> = [];

      if (user.id) {
        try {
          const evals = await obtenerTodasEvaluacionesUsuario(user.id);
          evalsFormateadas = evals.map(e => ({
            enfermedad: e.enfermedad_id,
            preAciertos: e.pre_puntaje || 0,
            postAciertos: e.post_puntaje || 0,
            mejoraPorcentaje: e.mejora || 0
          }));
        } catch {}
      }

      const fechaHoy = new Date().toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      const datosCarne: DatosCarneSalud = {
        nombreEstudiante: user.nombre_completo || 'Estudiante EduSalud',
        usuario: user.usuario || 'estudiante',
        salon: user.salon ?? null,
        genero: user.genero || 'Masculino',
        fechaEmision: fechaHoy,
        puntosXP: puntos,
        nivel,
        rango,
        rachaDias: rachaActual,
        imc: ultimoImc,
        categoriaImc: ultimaCat,
        evaluaciones: evalsFormateadas,
        totalLogros: totalLogrosDesbloqueados
      };

      const html = generarHtmlCarneSalud(datosCarne);

      if (Platform.OS === 'web') {
        // En navegador Web: abrir vista previa de impresión / guardar como PDF
        await Print.printAsync({ html });
      } else {
        // En Móvil: generar archivo PDF y compartir con la app de visor de PDF / imprimir
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Carné Escolar de Salud Preventiva - EduSalud',
            UTI: 'com.adobe.pdf'
          });
        } else {
          Alert.alert('Carné Generado', `Tu carné se guardó en: ${uri}`);
        }
      }
    } catch (err: any) {
      console.error('[Error generando PDF]', err);
      Alert.alert('Error', 'No se pudo generar el carné en PDF. Intenta nuevamente.');
    } finally {
      setGenerandoPdf(false);
    }
  };

  return (
    <Pantalla style={{ backgroundColor: tema.fondo }}>
      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={Platform.OS === 'web'}
      >
        {/* Cabecera / Avatar */}
        <View style={styles.avatarSeccion}>
          <Mascota estado="feliz" size={96} />
          <Text style={[styles.nombre, { color: tema.texto }]}>
            {user?.nombre_completo || 'Estudiante'}
          </Text>
          <Text style={[styles.usuario, { color: tema.textoSecundario }]}>
            @{user?.usuario || 'usuario'}
          </Text>
          <View style={{ marginTop: tokens.espaciado.xs }}>
            <Insignia texto={`Rango: ${rango}`} variante="primario" />
          </View>
        </View>

        {/* Nivel y Progreso de XP */}
        <Tarjeta style={styles.card}>
          <View style={styles.nivelHeader}>
            <View>
              <Text style={[styles.cardEtiqueta, { color: tema.textoSecundario }]}>Nivel de Conocimiento</Text>
              <Text style={[styles.nivelValor, { color: tema.texto }]}>Nivel {nivel}</Text>
            </View>
            <Insignia texto={`${puntos} XP`} variante="logro" />
          </View>

          <View style={styles.barraWrap}>
            <View style={styles.metaRow}>
              <Text style={[styles.metaTexto, { color: tema.textoSecundario }]}>
                {xpActual} / {xpMeta} XP
              </Text>
              <Text style={[styles.metaTexto, { color: tema.primario }]}>
                {Math.round(progresoXp * 100)}%
              </Text>
            </View>
            <BarraProgreso progreso={progresoXp} colorBase={tema.primario} />
          </View>
        </Tarjeta>

        {/* Racha y Hábitos con Congelador Semanal */}
        <Tarjeta style={styles.card}>
          <Text style={[styles.cardTitulo, { color: tema.texto }]}>Racha y Constancia</Text>
          <View style={styles.rachaRow}>
            <View style={[styles.rachaItem, { backgroundColor: `${tema.energia}10`, borderColor: `${tema.energia}30` }]}>
              <Text style={[styles.rachaNum, { color: tema.energia }]}>{rachaActual}</Text>
              <Text style={[styles.rachaLabel, { color: tema.textoSecundario }]}>Días Activos</Text>
            </View>
            <View style={[styles.rachaItem, { backgroundColor: `${tema.logro}10`, borderColor: `${tema.logro}30` }]}>
              <Text style={[styles.rachaNum, { color: tema.logro }]}>{rachaMaxima}</Text>
              <Text style={[styles.rachaLabel, { color: tema.textoSecundario }]}>Récord de Racha</Text>
            </View>
            <View style={[styles.rachaItem, { backgroundColor: `${tema.primario}10`, borderColor: `${tema.primario}30` }]}>
              <Text style={[styles.rachaNum, { color: tema.primario }]}>
                ❄️ {congeladoresDisp > 0 ? '1' : '0'}
              </Text>
              <Text style={[styles.rachaLabel, { color: tema.textoSecundario }]}>
                {congeladoresDisp > 0 ? 'Congelador Activo' : 'En Recarga'}
              </Text>
            </View>
          </View>
        </Tarjeta>

        {/* Logros Escolares y Medallero */}
        <Tarjeta style={styles.card}>
          <View style={styles.logrosHeader}>
            <View>
              <Text style={[styles.cardTitulo, { color: tema.texto }]}>Medallas y Logros</Text>
              <Text style={[styles.logrosDesc, { color: tema.textoSecundario }]}>
                Has ganado {totalLogrosDesbloqueados} de {logros.length} insignias.
              </Text>
            </View>
            <Insignia
              texto={`${totalLogrosDesbloqueados}/${logros.length}`}
              variante={totalLogrosDesbloqueados > 0 ? 'logro' : 'neutro'}
            />
          </View>

          <Boton
            titulo="Ver todas mis medallas"
            variante="secundario"
            onPress={() => router.push('/logros')}
            style={{ marginTop: tokens.espaciado.sm }}
          />
        </Tarjeta>

        {/* Carné Escolar de Salud Preventiva (Reporte PDF) */}
        <Tarjeta style={styles.card}>
          <View style={styles.logrosHeader}>
            <View style={{ flex: 1, paddingRight: tokens.espaciado.sm }}>
              <Text style={[styles.cardTitulo, { color: tema.texto }]}>Carné Digital de Salud</Text>
              <Text style={[styles.logrosDesc, { color: tema.textoSecundario }]}>
                Reporte oficial con tus evaluaciones, IMC, rango y compromisos de prevención de ENT.
              </Text>
            </View>
            <Insignia texto="PDF Oficial" variante="primario" />
          </View>

          <Boton
            titulo="Descargar o Imprimir Carné en PDF"
            variante="principal"
            cargando={generandoPdf}
            onPress={handleDescargarCarnePdf}
            style={{ marginTop: tokens.espaciado.sm }}
          />
        </Tarjeta>

        {/* Notificaciones y Recordatorio Diario */}
        <Tarjeta style={styles.card}>
          <View style={styles.notifHeader}>
            <View style={{ flex: 1, paddingRight: tokens.espaciado.sm }}>
              <Text style={[styles.cardTitulo, { color: tema.texto }]}>Recordatorio Diario</Text>
              <Text style={[styles.temaSub, { color: tema.textoSecundario }]}>
                Recibe 1 notificación diaria en tu celular para cumplir tu meta de 3 minutos y cuidar tu racha.
              </Text>
            </View>
            <Switch
              value={recordatorioActivo}
              onValueChange={handleToggleRecordatorio}
              trackColor={{ false: tema.borde, true: tema.primario }}
              thumbColor={recordatorioActivo ? '#FFFFFF' : '#F4F3F4'}
              accessibilityLabel="Activar o desactivar recordatorio diario"
            />
          </View>

          {recordatorioActivo && (
            <View style={styles.horaSelectorContainer}>
              <Text style={[styles.horaSelectorTitulo, { color: tema.texto }]}>
                Hora del recordatorio:
              </Text>
              <View style={styles.horasRow}>
                {HORAS_RECORDATORIO.map((hora) => {
                  const seleccionada = recordatorioHora === hora;
                  return (
                    <TouchableOpacity
                      key={hora}
                      onPress={() => handleCambiarHora(hora)}
                      style={[
                        styles.horaBtn,
                        {
                          backgroundColor: seleccionada ? tema.primario : tema.fondo,
                          borderColor: seleccionada ? tema.primario : tema.borde,
                        }
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Fijar recordatorio a las ${hora}`}
                    >
                      <Text
                        style={[
                          styles.horaBtnTexto,
                          { color: seleccionada ? '#FFFFFF' : tema.texto }
                        ]}
                      >
                        {hora}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {mensajeNotif && (
            <Text style={[styles.notifFeedback, { color: tema.primario }]}>
              {mensajeNotif}
            </Text>
          )}
        </Tarjeta>

        {/* Ajuste de Tema Claro / Oscuro */}
        <Tarjeta style={styles.card}>
          <Text style={[styles.cardTitulo, { color: tema.texto }]}>Apariencia y Tema</Text>
          <Text style={[styles.temaSub, { color: tema.textoSecundario }]}>
            Elige el modo visual que mejor se adapte a tu entorno:
          </Text>

          <View style={styles.temaSelector}>
            <TouchableOpacity
              style={[
                styles.temaBtn,
                {
                  backgroundColor: modo === 'claro' ? tema.primario : tema.fondo,
                  borderColor: modo === 'claro' ? tema.primario : tema.borde,
                }
              ]}
              onPress={() => setModo('claro')}
              accessibilityRole="button"
              accessibilityLabel="Tema Claro"
            >
              <Text style={[styles.temaBtnTexto, { color: modo === 'claro' ? '#FFFFFF' : tema.textoSecundario }]}>
                ☀️ Claro
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.temaBtn,
                {
                  backgroundColor: modo === 'oscuro' ? tema.primario : tema.fondo,
                  borderColor: modo === 'oscuro' ? tema.primario : tema.borde,
                }
              ]}
              onPress={() => setModo('oscuro')}
              accessibilityRole="button"
              accessibilityLabel="Tema Oscuro"
            >
              <Text style={[styles.temaBtnTexto, { color: modo === 'oscuro' ? '#FFFFFF' : tema.textoSecundario }]}>
                🌙 Oscuro
              </Text>
            </TouchableOpacity>
          </View>
        </Tarjeta>

        {/* Acceso a Privacidad y Administración */}
        {user?.rol === 'admin' && (
          <Boton
            titulo="Panel de Docente / Administrador"
            variante="secundario"
            onPress={() => router.push('/admin')}
            style={{ marginBottom: tokens.espaciado.sm }}
          />
        )}

        <Boton
          titulo="Privacidad y Protección de Datos"
          variante="secundario"
          onPress={() => router.push('/privacidad')}
          style={{ marginBottom: tokens.espaciado.sm }}
        />

        <Boton
          titulo="Cerrar Sesión"
          variante="peligro"
          onPress={handleLogout}
          style={{ marginBottom: tokens.espaciado.xl }}
        />

        <View style={{ height: 80 }} />
      </ScrollView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: tokens.espaciado.lg,
    paddingBottom: 90,
  },
  avatarSeccion: {
    alignItems: 'center',
    marginBottom: tokens.espaciado.xl,
  },
  nombre: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: tokens.tipografia.tamanos.titulo,
    marginTop: tokens.espaciado.sm,
  },
  usuario: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    marginTop: 2,
  },
  card: {
    padding: tokens.espaciado.lg,
    marginBottom: tokens.espaciado.md,
  },
  nivelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.espaciado.sm,
  },
  cardEtiqueta: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
  nivelValor: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.subtitulo,
    fontWeight: '800',
  },
  barraWrap: {
    marginTop: tokens.espaciado.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: tokens.espaciado.xs,
  },
  metaTexto: {
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.mini,
  },
  cardTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.subtitulo,
    fontWeight: '700',
    marginBottom: tokens.espaciado.xs,
  },
  rachaRow: {
    flexDirection: 'row',
    gap: tokens.espaciado.sm,
    marginTop: tokens.espaciado.sm,
  },
  rachaItem: {
    flex: 1,
    padding: tokens.espaciado.md,
    borderRadius: tokens.radios.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  rachaNum: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: tokens.tipografia.tamanos.titulo,
    marginBottom: 2,
  },
  rachaLabel: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
    textAlign: 'center',
  },
  logrosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logrosDesc: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    marginTop: 2,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horaSelectorContainer: {
    marginTop: tokens.espaciado.md,
    paddingTop: tokens.espaciado.sm,
    borderTopWidth: 1,
    borderTopColor: `${tokens.colores.claro.borde}60`,
  },
  horaSelectorTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    fontWeight: '600',
    marginBottom: tokens.espaciado.xs,
  },
  horasRow: {
    flexDirection: 'row',
    gap: tokens.espaciado.xs,
  },
  horaBtn: {
    flex: 1,
    paddingVertical: tokens.espaciado.sm,
    borderRadius: tokens.radios.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  horaBtnTexto: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    fontWeight: '700',
  },
  notifFeedback: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
    marginTop: tokens.espaciado.xs,
    fontStyle: 'italic',
  },
  temaSub: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    lineHeight: 18,
  },
  temaSelector: {
    flexDirection: 'row',
    gap: tokens.espaciado.sm,
    marginTop: tokens.espaciado.md,
  },
  temaBtn: {
    flex: 1,
    paddingVertical: tokens.espaciado.sm,
    borderRadius: tokens.radios.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  temaBtnTexto: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    fontWeight: '600',
  },
});
