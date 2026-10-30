import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform, 
  useWindowDimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTema } from '../../hooks/useTema';
import { tokens, TipoEnfermedad } from '../../constants/theme';
import { ENFERMEDADES_PRINCIPALES } from '../../constants/enfermedades';
import { 
  nivelDesdeXp, 
  rangoDeNivel, 
  xpEnNivel, 
  xpParaSiguiente,
  verificarAvisoRacha,
} from '../../lib/gamificacion';
import { getDb, obtenerEstadoMetaDiaria } from '../../db/database';
import { Pantalla } from '../../components/ui/Pantalla';
import { Tarjeta } from '../../components/ui/Tarjeta';
import { Boton } from '../../components/ui/Boton';
import { Insignia } from '../../components/ui/Insignia';
import { BarraProgreso } from '../../components/ui/BarraProgreso';
import { AnilloProgreso } from '../../components/ui/AnilloProgreso';
import { Mascota } from '../../components/Mascota';
import { IconoEnfermedad } from '../../components/IconoEnfermedad';
import { Esqueleto } from '../../components/ui/Esqueleto';

export default function HomeScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { tema } = useTema();
  const { width } = useWindowDimensions();
  const esWebGrande = Platform.OS === 'web' && width >= 768;

  const [metaDiaria, setMetaDiaria] = useState({
    retosHoy: 0,
    fichasLeidasHoy: 0,
    metaCumplida: false,
    yaPremiadaHoy: false,
    progresoFraccion: 0,
  });

  const [adminStats, setAdminStats] = useState({
    totalEstudiantes: 0,
    solicitudesClave: 0,
    totalXp: 0,
  });

  useEffect(() => {
    if (user?.id) {
      let isMounted = true;
      obtenerEstadoMetaDiaria(user.id).then((res) => {
        if (isMounted) {
          setMetaDiaria(res);
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [user?.id, user?.puntos]);

  useEffect(() => {
    if (user?.rol === 'admin') {
      let isMounted = true;
      const loadStats = async () => {
        try {
          const db = await getDb();
          const estRow = await db.getFirstAsync<{ total: number }>(
            "SELECT COUNT(*) as total FROM usuarios WHERE rol = 'estudiante';"
          );
          const solRow = await db.getFirstAsync<{ total: number }>(
            "SELECT COUNT(*) as total FROM solicitudes_password WHERE estado = 'pendiente';"
          );
          const xpRow = await db.getFirstAsync<{ total: number }>(
            "SELECT SUM(COALESCE(puntos, 0)) as total FROM usuarios WHERE rol = 'estudiante';"
          );
          if (isMounted) {
            setAdminStats({
              totalEstudiantes: estRow?.total || 0,
              solicitudesClave: solRow?.total || 0,
              totalXp: xpRow?.total || 0,
            });
          }
        } catch (err) {
          console.warn('Error cargando estadísticas de admin en Home', err);
        }
      };
      loadStats();
      return () => {
        isMounted = false;
      };
    }
  }, [user?.rol]);

  if (authLoading) {
    return (
      <Pantalla style={{ backgroundColor: tema.fondo }}>
        <View style={{ padding: tokens.espaciado.lg }}>
          <Esqueleto height={80} style={{ marginBottom: tokens.espaciado.md }} />
          <Esqueleto height={140} style={{ marginBottom: tokens.espaciado.md }} />
          <Esqueleto height={200} />
        </View>
      </Pantalla>
    );
  }

  const puntosTotales = user?.puntos || 0;
  const nivel = nivelDesdeXp(puntosTotales);
  const rango = rangoDeNivel(nivel);
  const xpActual = xpEnNivel(puntosTotales);
  const xpMeta = xpParaSiguiente(nivel);
  const progresoXp = xpMeta > 0 ? Math.min(1, xpActual / xpMeta) : 1;
  const rachaActual = user?.racha_actual || 0;
  const rachaMaxima = user?.racha_maxima || rachaActual;
  const congeladoresDisp = user?.congeladores_disponibles ?? 1;
  const avisoRacha = verificarAvisoRacha({
    rachaActual,
    rachaMaxima,
    metaDiariaCumplidaHoy: metaDiaria.metaCumplida,
    congeladoresDisponibles: congeladoresDisp,
  });

  const mapTipoEnfermedad = (id: string): TipoEnfermedad => {
    switch (id) {
      case 'cardiovascular': return 'cardiovascular';
      case 'cancer': return 'cancer';
      case 'respiratoria':
      case 'respiratorias': return 'respiratorias';
      case 'diabetes': return 'diabetes';
      case 'obesidad': return 'obesidad';
      case 'renal': return 'renal';
      case 'salud_mental': return 'salud_mental';
      default: return 'cardiovascular';
    }
  };

  return (
    <Pantalla style={{ backgroundColor: tema.fondo }}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={Platform.OS === 'web'}
      >
        {/* Encabezado: identidad y rango */}
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: tokens.espaciado.md }}>
            {user?.rol === 'admin' && (
              <Insignia
                texto="PANEL DE GESTIÓN EDUCATIVA"
                variante="energia"
                style={{ marginBottom: tokens.espaciado.xs }}
              />
            )}
            <Text style={[styles.saludoNombre, { color: tema.texto }]}>
              ¡Hola, {user?.nombre_completo?.split(' ')[0] || user?.usuario || 'Estudiante'}!
            </Text>
            <Text style={[styles.saludoSub, { color: tema.textoSecundario }]}>
              Rango actual: <Text style={{ color: tema.primario, fontFamily: tokens.tipografia.familias.titulo }}>{rango}</Text>
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.hero,
            !esWebGrande && styles.heroMobile,
            { backgroundColor: tema.superficie, borderColor: tema.borde },
          ]}
        >
          <View
            style={[styles.heroAtmosphere, { backgroundColor: `${tema.primario}16` }]}
            pointerEvents="none"
          />
          <View
            style={[styles.heroOrbit, { borderColor: `${tema.energia}28` }]}
            pointerEvents="none"
          />
          <View
            style={[styles.heroBloom, !esWebGrande && styles.heroBloomMobile, { backgroundColor: `${tema.energia}0D` }]}
            pointerEvents="none"
          />
          <View style={styles.heroCopy}>
            <Text style={[styles.heroTitle, !esWebGrande && styles.heroTitleMobile, { color: tema.texto }]}>
              Cuida tu salud hoy para un mejor mañana
            </Text>
            <Text style={[styles.heroDescription, !esWebGrande && styles.heroDescriptionMobile, { color: tema.textoSecundario }]}>
              Aprende, practica y desarrolla hábitos saludables con tu tutor interactivo.
            </Text>
          </View>
          <View style={[styles.heroMascotaWrap, !esWebGrande && styles.heroMascotaWrapMobile]}>
            <View
              style={[
                styles.heroHalo,
                !esWebGrande && styles.heroHaloMobile,
                { backgroundColor: `${tema.primario}24`, borderColor: `${tema.primario}40` },
              ]}
            />
            <View
              style={[
                styles.heroOrbitMark,
                { backgroundColor: `${tema.energia}10`, borderColor: `${tema.energia}40` },
              ]}
              pointerEvents="none"
            />
            <View
              style={[styles.heroParticle, styles.heroParticleTop, { backgroundColor: `${tema.energia}80` }]}
              pointerEvents="none"
            />
            <View
              style={[styles.heroParticle, styles.heroParticleBottom, { backgroundColor: `${tema.primario}80` }]}
              pointerEvents="none"
            />
            <Mascota estado={metaDiaria.metaCumplida ? 'feliz' : 'animando'} size={esWebGrande ? 160 : 104} />
          </View>
        </View>

        <View style={[styles.metricsGrid, esWebGrande && styles.metricsGridWeb]}>
          <View style={[styles.metricCard, esWebGrande && styles.metricCardWeb, { borderColor: `${tema.energia}55` }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: `${tema.energia}20` }]}>
              <Text style={styles.metricIcon}>🔥</Text>
            </View>
            <View style={styles.metricCopy}>
              <Text style={[styles.metricValue, { color: tema.texto }]}>{rachaActual}</Text>
              <Text style={[styles.metricLabel, { color: tema.textoSecundario }]}>Días activos</Text>
            </View>
          </View>
          <View style={[styles.metricCard, esWebGrande && styles.metricCardWeb, { borderColor: `${tema.logro}55` }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: `${tema.logro}20` }]}>
              <Text style={styles.metricIcon}>🏆</Text>
            </View>
            <View style={styles.metricCopy}>
              <Text style={[styles.metricValue, { color: tema.texto }]}>{rachaMaxima}</Text>
              <Text style={[styles.metricLabel, { color: tema.textoSecundario }]}>Récord de racha</Text>
            </View>
          </View>
          <View style={[styles.metricCard, esWebGrande && styles.metricCardWeb, { borderColor: `${tema.primario}55` }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: `${tema.primario}20` }]}>
              <Text style={styles.metricIcon}>⭐</Text>
            </View>
            <View style={styles.metricCopy}>
              <Text style={[styles.metricValue, { color: tema.texto }]}>{puntosTotales} XP</Text>
              <Text style={[styles.metricLabel, { color: tema.textoSecundario }]}>Puntos actuales</Text>
            </View>
          </View>
          <View style={[styles.metricCard, esWebGrande && styles.metricCardWeb, { borderColor: `${tema.exito}55` }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: `${tema.exito}20` }]}>
              <Text style={styles.metricIcon}>👑</Text>
            </View>
            <View style={styles.metricCopy}>
              <Text style={[styles.metricValue, { color: tema.texto }]}>Nivel {nivel}</Text>
              <Text style={[styles.metricLabel, { color: tema.textoSecundario }]}>{rango}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.primaryPanels, esWebGrande && styles.primaryPanelsWeb]}>
        {/* Tarjeta 1: Meta Diaria de 3 Minutos */}
        <Tarjeta style={[styles.tarjetaMetaDiaria, esWebGrande && styles.panelDesktop]}>
          <View style={styles.metaDiariaHeader}>
            <View style={{ flex: 1, paddingRight: tokens.espaciado.sm }}>
              <Text style={[styles.rachaTitulo, { color: tema.texto }]}>Meta Diaria (3 min)</Text>
              <Text style={[styles.rachaSub, { color: tema.textoSecundario }]}>
                1 mini-reto + 1 ficha leída para cuidar tu bienestar.
              </Text>
            </View>
            <Insignia
              texto={metaDiaria.metaCumplida ? '¡Cumplida hoy! 🎉' : 'En curso'}
              variante={metaDiaria.metaCumplida ? 'exito' : 'primario'}
            />
          </View>

          <View style={styles.anilloFila}>
            <AnilloProgreso
              progreso={metaDiaria.progresoFraccion}
              size={esWebGrande ? 84 : 72}
              strokeWidth={esWebGrande ? 8 : 7}
              colorBase={metaDiaria.metaCumplida ? tema.exito : tema.primario}
              colorFondo={`${tema.borde}60`}
              mostrarTextoCentro
              textoCentro={`${Math.round(metaDiaria.progresoFraccion * 100)}%`}
              subtextoCentro="3 min"
            />
            <View style={styles.pasosMetaContainer}>
              <TouchableOpacity
                style={[
                  styles.pasoItem,
                  {
                    backgroundColor: metaDiaria.retosHoy >= 1 ? `${tema.exito}15` : `${tema.primario}10`,
                    borderColor: metaDiaria.retosHoy >= 1 ? `${tema.exito}40` : tema.borde,
                  }
                ]}
                onPress={() => router.push('/retos')}
                accessibilityRole="button"
                accessibilityLabel="Ir a responder mini-reto"
              >
                <Text style={{ fontSize: 16 }}>{metaDiaria.retosHoy >= 1 ? '✅' : '🎯'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pasoTitulo, { color: tema.texto }]}>
                    {metaDiaria.retosHoy >= 1 ? 'Mini-reto completado' : 'Responder 1 mini-reto'}
                  </Text>
                  <Text style={[styles.pasoSub, { color: tema.textoSecundario }]}>
                    {metaDiaria.retosHoy >= 1 ? '¡Paso cumplido hoy!' : 'Toca para resolverlo (+50 XP)'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pasoItem,
                  {
                    backgroundColor: metaDiaria.fichasLeidasHoy >= 1 ? `${tema.exito}15` : `${tema.primario}10`,
                    borderColor: metaDiaria.fichasLeidasHoy >= 1 ? `${tema.exito}40` : tema.borde,
                  }
                ]}
                onPress={() => router.push('/enfermedad/cardiovascular')}
                accessibilityRole="button"
                accessibilityLabel="Ir a leer una ficha de salud"
              >
                <Text style={{ fontSize: 16 }}>{metaDiaria.fichasLeidasHoy >= 1 ? '✅' : '📖'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pasoTitulo, { color: tema.texto }]}>
                    {metaDiaria.fichasLeidasHoy >= 1 ? 'Ficha de salud leída' : 'Leer 1 ficha preventiva'}
                  </Text>
                  <Text style={[styles.pasoSub, { color: tema.textoSecundario }]}>
                    {metaDiaria.fichasLeidasHoy >= 1 ? '¡Paso cumplido hoy!' : 'Toca para aprender (+25 XP)'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {metaDiaria.metaCumplida && (
            <View style={[styles.celebracionBanner, { backgroundColor: `${tema.exito}15`, borderColor: `${tema.exito}35` }]}>
              <Text style={{ fontSize: 24, marginRight: tokens.espaciado.xs }}>🎉</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.celebracionTitulo, { color: tema.texto }]}>
                  ¡Meta de hoy completada con éxito!
                </Text>
                <Text style={[styles.celebracionDesc, { color: tema.textoSecundario }]}>
                  Ganaste el bono diario de +60 XP. ¡Vuelve mañana para seguir cuidando tu salud!
                </Text>
              </View>
            </View>
          )}
        </Tarjeta>

        {/* Tarjeta 2: Racha y Constancia */}
        <Tarjeta style={[styles.tarjetaRacha, esWebGrande && styles.panelDesktop]}>
          <View style={styles.rachaHeader}>
            <View>
              <Text style={[styles.rachaTitulo, { color: tema.texto }]}>Racha y Constancia</Text>
              <Text style={[styles.rachaSub, { color: tema.textoSecundario }]}>
                {rachaActual > 0 
                  ? `🔥 ¡Llevas una racha de ${rachaActual} día${rachaActual > 1 ? 's' : ''} consecutivo${rachaActual > 1 ? 's' : ''}!` 
                  : 'Comienza tu racha de hoy respondiendo un reto.'}
              </Text>
            </View>
            <Insignia 
              texto={`Nivel ${nivel}`} 
              variante="logro" 
            />
          </View>

          {/* Estadísticas de racha y congelador */}
          <View style={styles.rachaStatsRow}>
            <View style={[styles.rachaStatBox, { backgroundColor: `${tema.energia}12`, borderColor: `${tema.energia}35` }]}>
              <Text style={[styles.rachaStatValor, !esWebGrande && styles.rachaStatValorMobile, { color: tema.energia }]}>🔥 {rachaActual}</Text>
              <Text style={[styles.rachaStatLabel, { color: tema.textoSecundario }]}>Días activos</Text>
            </View>
            <View style={[styles.rachaStatBox, { backgroundColor: `${tema.logro}12`, borderColor: `${tema.logro}35` }]}>
              <Text style={[styles.rachaStatValor, !esWebGrande && styles.rachaStatValorMobile, { color: tema.logro }]}>🏆 {rachaMaxima}</Text>
              <Text style={[styles.rachaStatLabel, { color: tema.textoSecundario }]}>Récord racha</Text>
            </View>
            <View style={[styles.rachaStatBox, { backgroundColor: `${tema.primario}12`, borderColor: `${tema.primario}35` }]}>
              <Text style={[styles.rachaStatValor, !esWebGrande && styles.rachaStatValorMobile, { color: tema.primario }]}>
                ❄️ {congeladoresDisp > 0 ? '1 activo' : '0/1'}
              </Text>
              <Text style={[styles.rachaStatLabel, { color: tema.textoSecundario }]}>Congelador semanal</Text>
            </View>
          </View>

          {/* Aviso: tu racha vence esta noche */}
          {avisoRacha.mostrarAviso && (
            <View style={[styles.avisoRachaBox, { backgroundColor: `${tema.energia}15`, borderColor: `${tema.energia}40` }]}>
              <Text style={[styles.avisoRachaTexto, { color: tema.energia }]}>
                ⚠️ {avisoRacha.mensajeAviso}
              </Text>
            </View>
          )}
          
          <View style={styles.barraMetaContainer}>
            <View style={styles.barraMetaLabels}>
              <Text style={[styles.metaTexto, { color: tema.textoSecundario }]}>
                Progreso del nivel: {xpActual} / {xpMeta} XP
              </Text>
              <Text style={[styles.metaTexto, { color: tema.primario }]}>
                {Math.round(progresoXp * 100)}%
              </Text>
            </View>
            <BarraProgreso progreso={progresoXp} colorBase={tema.primario} />
          </View>
        </Tarjeta>
        </View>

        {/* Si es Admin, mostrar resumen de aula */}
        {user?.rol === 'admin' && (
          <View style={styles.seccion}>
            <Text style={[styles.seccionTitulo, { color: tema.texto }]}>Resumen del Aula</Text>
            <View style={[styles.adminGrid, esWebGrande && styles.gridTresCol]}>
              <Tarjeta style={styles.adminCard}>
                <Text style={[styles.adminCardNum, { color: tema.primario }]}>{adminStats.totalEstudiantes}</Text>
                <Text style={[styles.adminCardLabel, { color: tema.textoSecundario }]}>Estudiantes Registrados</Text>
              </Tarjeta>
              <Tarjeta style={styles.adminCard}>
                <Text style={[styles.adminCardNum, { color: adminStats.solicitudesClave > 0 ? tema.error : tema.texto }]}>
                  {adminStats.solicitudesClave}
                </Text>
                <Text style={[styles.adminCardLabel, { color: tema.textoSecundario }]}>Solicitudes de Clave</Text>
              </Tarjeta>
              <Tarjeta style={styles.adminCard}>
                <Text style={[styles.adminCardNum, { color: tema.logro }]}>{adminStats.totalXp}</Text>
                <Text style={[styles.adminCardLabel, { color: tema.textoSecundario }]}>Puntos XP Colectivos</Text>
              </Tarjeta>
            </View>
          </View>
        )}

        {/* Continuar donde lo dejaste */}
        <View style={styles.seccion}>
          <Text style={[styles.seccionTitulo, { color: tema.texto }]}>Continuar donde lo dejaste</Text>
          <Tarjeta style={styles.tarjetaContinuar}>
            <View style={{ flex: 1 }}>
              <Insignia texto="Recomendado hoy" variante="energia" style={{ marginBottom: tokens.espaciado.xs }} />
              <Text style={[styles.continuarTitulo, { color: tema.texto }]}>
                Prevención Cardiovascular y Presión Arterial
              </Text>
              <Text style={[styles.continuarDesc, { color: tema.textoSecundario }]}>
                Aprende qué es la presión arterial en adolescentes y cómo la actividad física la mantiene saludable.
              </Text>
            </View>
            <Boton
              titulo="Continuar"
              variante="principal"
              onPress={() => router.push('/enfermedad/cardiovascular')}
              style={styles.continuarBtn}
            />
          </Tarjeta>
        </View>

        {/* Enfermedades No Transmisibles */}
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <Text style={[styles.seccionTitulo, { color: tema.texto }]}>Enfermedades No Transmisibles</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/descubrir')}>
              <Text style={[styles.verTodoLink, { color: tema.primario }]}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.enfermedadesGrid, esWebGrande && styles.gridTresCol]}>
            {ENFERMEDADES_PRINCIPALES.map((enf) => {
              const tipo = mapTipoEnfermedad(enf.id);
              const colorAcento = tokens.colores.enfermedades[tipo] || tema.primario;

              return (
                <TouchableOpacity
                  key={enf.id}
                  activeOpacity={0.8}
                  style={[styles.enfCardWrapper, esWebGrande && styles.enfCardWrapperWeb]}
                  onPress={() => router.push(`/enfermedad/${enf.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Aprender sobre ${enf.nombre}`}
                >
                  <Tarjeta style={[styles.enfCard, { borderColor: `${colorAcento}35` }]}>
                    <View style={[styles.enfIconWrap, { backgroundColor: `${colorAcento}15` }]}>
                      <IconoEnfermedad enfermedad={tipo} size={30} color={colorAcento} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.enfNombre, { color: tema.texto }]}>{enf.nombre}</Text>
                      <Text style={[styles.enfDesc, { color: tema.textoSecundario }]} numberOfLines={2}>
                        {enf.subtitulo || enf.queEs || 'Guía de prevención y autocuidado.'}
                      </Text>
                    </View>
                  </Tarjeta>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Accesos Rápidos: Retos, Evaluación y Asistente */}
        <View style={styles.seccion}>
          <Text style={[styles.seccionTitulo, { color: tema.texto }]}>Herramientas Rápidas</Text>
          <View style={[styles.herramientasGrid, esWebGrande && styles.gridTresCol]}>
            <TouchableOpacity
              style={[styles.herramientaItem, esWebGrande && styles.herramientaItemWeb]}
              activeOpacity={0.8}
              onPress={() => router.push('/retos')}
              accessibilityRole="button"
              accessibilityLabel="Ir a Retos y Quiz"
            >
              <Tarjeta style={[styles.herramientaCard, !esWebGrande && styles.herramientaCardMobile]}>
                <Text style={[styles.herramientaEmoji, !esWebGrande && styles.herramientaEmojiMobile, { color: tema.energia }]}>🎯</Text>
                <View style={[styles.herramientaText, !esWebGrande && styles.herramientaTextMobile]}>
                  <Text style={[styles.herramientaTitulo, !esWebGrande && styles.herramientaTituloMobile, { color: tema.texto }]}>Retos y Quizzes</Text>
                  <Text style={[styles.herramientaSub, !esWebGrande && styles.herramientaSubMobile, { color: tema.textoSecundario }]}>
                    Gana XP contestando preguntas rápidas
                  </Text>
                </View>
              </Tarjeta>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.herramientaItem, esWebGrande && styles.herramientaItemWeb]}
              activeOpacity={0.8}
              onPress={() => router.push('/evaluacion')}
              accessibilityRole="button"
              accessibilityLabel="Ir a Evaluación de IMC"
            >
              <Tarjeta style={[styles.herramientaCard, !esWebGrande && styles.herramientaCardMobile]}>
                <Text style={[styles.herramientaEmoji, !esWebGrande && styles.herramientaEmojiMobile, { color: tema.primario }]}>⚖️</Text>
                <View style={[styles.herramientaText, !esWebGrande && styles.herramientaTextMobile]}>
                  <Text style={[styles.herramientaTitulo, !esWebGrande && styles.herramientaTituloMobile, { color: tema.texto }]}>Calculadora de IMC</Text>
                  <Text style={[styles.herramientaSub, !esWebGrande && styles.herramientaSubMobile, { color: tema.textoSecundario }]}>
                    Referencia OMS 2007 para adolescentes
                  </Text>
                </View>
              </Tarjeta>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.herramientaItem, esWebGrande && styles.herramientaItemWeb]}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/asistente')}
              accessibilityRole="button"
              accessibilityLabel="Ir a Asistente EduSalud"
            >
              <Tarjeta style={[styles.herramientaCard, !esWebGrande && styles.herramientaCardMobile]}>
                <Text style={[styles.herramientaEmoji, !esWebGrande && styles.herramientaEmojiMobile, { color: tema.logro }]}>💬</Text>
                <View style={[styles.herramientaText, !esWebGrande && styles.herramientaTextMobile]}>
                  <Text style={[styles.herramientaTitulo, !esWebGrande && styles.herramientaTituloMobile, { color: tema.texto }]}>Tutor EduSalud</Text>
                  <Text style={[styles.herramientaSub, !esWebGrande && styles.herramientaSubMobile, { color: tema.textoSecundario }]}>
                    Resuelve dudas sobre hábitos y salud
                  </Text>
                </View>
              </Tarjeta>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.herramientaItem, esWebGrande && styles.herramientaItemWeb]}
              activeOpacity={0.8}
              onPress={() => router.push('/logros')}
              accessibilityRole="button"
              accessibilityLabel="Ir a Medallas y Logros"
            >
              <Tarjeta style={[styles.herramientaCard, !esWebGrande && styles.herramientaCardMobile]}>
                <Text style={[styles.herramientaEmoji, !esWebGrande && styles.herramientaEmojiMobile, { color: tema.logro }]}>🏅</Text>
                <View style={[styles.herramientaText, !esWebGrande && styles.herramientaTextMobile]}>
                  <Text style={[styles.herramientaTitulo, !esWebGrande && styles.herramientaTituloMobile, { color: tema.texto }]}>Medallas y Logros</Text>
                  <Text style={[styles.herramientaSub, !esWebGrande && styles.herramientaSubMobile, { color: tema.textoSecundario }]}>
                    Insignias y medallas por constancia
                  </Text>
                </View>
              </Tarjeta>
            </TouchableOpacity>
          </View>
        </View>

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
    marginBottom: tokens.espaciado.md,
  },
  saludoNombre: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: tokens.tipografia.tamanos.titulo,
    marginVertical: tokens.espaciado.xs,
  },
  saludoSub: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
  },
  hero: {
    minHeight: 190,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.espaciado.lg,
    marginBottom: tokens.espaciado.md,
    borderWidth: 1,
    borderRadius: tokens.radios.lg,
    overflow: 'hidden',
  },
  heroMobile: {
    minHeight: 150,
    padding: tokens.espaciado.md,
  },
  heroAtmosphere: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: tokens.radios.redondo,
    top: -140,
    right: 90,
  },
  heroOrbit: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: tokens.radios.redondo,
    borderWidth: 1,
    top: -112,
    right: -54,
  },
  heroBloom: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: tokens.radios.redondo,
    right: -48,
    bottom: -124,
  },
  heroBloomMobile: {
    width: 160,
    height: 160,
    right: -42,
    bottom: -114,
  },
  heroCopy: {
    flex: 1,
    zIndex: 1,
  },
  heroTitle: {
    maxWidth: 560,
    fontFamily: tokens.tipografia.familias.display,
    fontSize: tokens.tipografia.tamanos.display,
    lineHeight: 38,
    marginBottom: tokens.espaciado.sm,
  },
  heroTitleMobile: {
    fontSize: 20,
    lineHeight: 26,
    marginBottom: tokens.espaciado.xs,
  },
  heroDescription: {
    maxWidth: 460,
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    lineHeight: 22,
  },
  heroDescriptionMobile: {
    fontSize: tokens.tipografia.tamanos.etiqueta,
    lineHeight: 18,
  },
  heroMascotaWrap: {
    width: 190,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMascotaWrapMobile: {
    width: 108,
    height: 128,
    marginLeft: tokens.espaciado.xs,
  },
  heroHalo: {
    position: 'absolute',
    width: 208,
    height: 208,
    borderRadius: tokens.radios.redondo,
    borderWidth: 1,
  },
  heroHaloMobile: {
    width: 140,
    height: 140,
  },
  heroOrbitMark: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: tokens.radios.redondo,
    borderWidth: 1,
    top: 16,
    right: 6,
  },
  heroParticle: {
    position: 'absolute',
    borderRadius: tokens.radios.redondo,
  },
  heroParticleTop: {
    width: 7,
    height: 7,
    top: 9,
    left: 22,
  },
  heroParticleBottom: {
    width: 5,
    height: 5,
    bottom: 15,
    left: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.espaciado.sm,
    marginBottom: tokens.espaciado.md,
  },
  metricsGridWeb: {
    flexWrap: 'nowrap',
  },
  metricCard: {
    width: '47%',
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.espaciado.sm,
    gap: tokens.espaciado.sm,
    borderWidth: 1,
    borderRadius: tokens.radios.md,
  },
  metricCardWeb: {
    width: 'auto',
    flex: 1,
  },
  metricIconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radios.sm,
  },
  metricIcon: {
    fontSize: 20,
  },
  metricCopy: {
    flex: 1,
  },
  metricValue: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.subtitulo,
  },
  metricLabel: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
  },
  primaryPanels: {
    gap: tokens.espaciado.md,
  },
  primaryPanelsWeb: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  panelDesktop: {
    flex: 1,
    marginBottom: 0,
  },
  tarjetaMetaDiaria: {
    padding: tokens.espaciado.lg,
    marginBottom: tokens.espaciado.md,
  },
  metaDiariaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.espaciado.md,
  },
  anilloFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.espaciado.md,
    marginBottom: tokens.espaciado.sm,
  },
  pasosMetaContainer: {
    flex: 1,
    gap: tokens.espaciado.xs,
  },
  pasoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.espaciado.sm,
    borderRadius: tokens.radios.sm,
    borderWidth: 1,
    gap: tokens.espaciado.xs,
  },
  pasoTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    fontWeight: '700',
  },
  pasoSub: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
  },
  celebracionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.espaciado.sm,
    borderRadius: tokens.radios.sm,
    borderWidth: 1,
    marginTop: tokens.espaciado.xs,
  },
  celebracionTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    fontWeight: '700',
  },
  celebracionDesc: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
  },
  tarjetaRacha: {
    padding: tokens.espaciado.lg,
    marginBottom: tokens.espaciado.xl,
  },
  rachaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.espaciado.md,
  },
  rachaTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.subtitulo,
    marginBottom: tokens.espaciado.xs,
  },
  rachaSub: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
  rachaStatsRow: {
    flexDirection: 'row',
    gap: tokens.espaciado.xs,
    marginBottom: tokens.espaciado.md,
  },
  rachaStatBox: {
    flex: 1,
    paddingVertical: tokens.espaciado.sm,
    paddingHorizontal: tokens.espaciado.xs,
    borderRadius: tokens.radios.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  rachaStatValor: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    fontWeight: '800',
    marginBottom: 2,
  },
  rachaStatValorMobile: {
    fontSize: tokens.tipografia.tamanos.etiqueta,
    textAlign: 'center',
    flexShrink: 1,
  },
  rachaStatLabel: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini - 1,
    textAlign: 'center',
  },
  avisoRachaBox: {
    padding: tokens.espaciado.sm,
    borderRadius: tokens.radios.sm,
    borderWidth: 1,
    marginBottom: tokens.espaciado.md,
  },
  avisoRachaTexto: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    fontWeight: '600',
  },
  barraMetaContainer: {
    marginTop: tokens.espaciado.xs,
  },
  barraMetaLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: tokens.espaciado.xs,
  },
  metaTexto: {
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.mini,
  },
  seccion: {
    marginBottom: tokens.espaciado.xl,
  },
  seccionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.espaciado.md,
  },
  seccionTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.subtitulo,
    marginBottom: tokens.espaciado.md,
  },
  verTodoLink: {
    fontFamily: tokens.tipografia.familias.subtitulo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
  gridTresCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.espaciado.md,
  },
  adminGrid: {
    flexDirection: 'row',
    gap: tokens.espaciado.sm,
  },
  adminCard: {
    flex: 1,
    padding: tokens.espaciado.md,
    alignItems: 'center',
  },
  adminCardNum: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: tokens.tipografia.tamanos.titulo,
  },
  adminCardLabel: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
    textAlign: 'center',
    marginTop: tokens.espaciado.xs,
  },
  tarjetaContinuar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.espaciado.lg,
    flexWrap: 'wrap',
    gap: tokens.espaciado.md,
  },
  continuarTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    marginBottom: tokens.espaciado.xs,
  },
  continuarDesc: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    lineHeight: 18,
  },
  continuarBtn: {
    minWidth: 120,
  },
  enfermedadesGrid: {
    gap: tokens.espaciado.sm,
  },
  enfCardWrapper: {
    width: '100%',
  },
  enfCardWrapperWeb: {
    width: '31.5%',
  },
  enfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.espaciado.md,
    gap: tokens.espaciado.md,
  },
  enfIconWrap: {
    width: 48,
    height: 48,
    borderRadius: tokens.radios.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enfNombre: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    marginBottom: tokens.espaciado.xs,
  },
  enfDesc: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
    lineHeight: 15,
  },
  herramientasGrid: {
    gap: tokens.espaciado.sm,
  },
  herramientaItem: {
    width: '100%',
  },
  herramientaItemWeb: {
    width: '31%',
    flexGrow: 0,
    flexShrink: 0,
  },
  herramientaCard: {
    padding: tokens.espaciado.lg,
    alignItems: 'center',
  },
  herramientaCardMobile: {
    flexDirection: 'row',
    padding: tokens.espaciado.sm,
  },
  herramientaText: {
    alignSelf: 'stretch',
  },
  herramientaTextMobile: {
    flex: 1,
  },
  herramientaEmoji: {
    fontSize: 28,
    marginBottom: tokens.espaciado.xs,
  },
  herramientaEmojiMobile: {
    fontSize: 24,
    marginBottom: 0,
    marginRight: tokens.espaciado.sm,
  },
  herramientaTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    textAlign: 'center',
    marginBottom: tokens.espaciado.xs,
  },
  herramientaTituloMobile: {
    textAlign: 'left',
  },
  herramientaSub: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
    textAlign: 'center',
    lineHeight: 16,
  },
  herramientaSubMobile: {
    textAlign: 'left',
  },
});
