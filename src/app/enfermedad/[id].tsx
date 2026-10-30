import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  NativeSyntheticEvent, 
  NativeScrollEvent, 
  Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { ENFERMEDADES } from '../../constants/enfermedades';
import { useTema } from '../../hooks/useTema';
import { tokens, TipoEnfermedad } from '../../constants/theme';
import { Pantalla } from '../../components/ui/Pantalla';
import { Tarjeta } from '../../components/ui/Tarjeta';
import { Boton } from '../../components/ui/Boton';
import { Insignia } from '../../components/ui/Insignia';
import { BarraProgreso } from '../../components/ui/BarraProgreso';
import { IconoEnfermedad } from '../../components/IconoEnfermedad';
import { Mascota } from '../../components/Mascota';
import { obtenerPreguntasPrePost } from '../../data/prePost';
import { 
  guardarPreTest, 
  guardarPostTest, 
  obtenerEvaluacionPrePost, 
  registrarErrorEnfermedad 
} from '../../db/database';
import { EvaluacionPrePost, PrePostPregunta } from '../../types';

export default function DiseaseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { tema } = useTema();
  const { user, procesarAccion } = useAuth();

  const [progresoLectura, setProgresoLectura] = useState(0);
  const [estaHablando, setEstaHablando] = useState(false);
  const [fichaLeida, setFichaLeida] = useState(false);
  const haRegistradoLecturaRef = useRef(false);

  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({
    queEs: true,
    causas: false,
    sintomas: false,
    prevencion: false,
    consulta: false,
  });

  // Estado Pre/Post Test
  const [evaluacion, setEvaluacion] = useState<EvaluacionPrePost | null>(null);
  const [testActivo, setTestActivo] = useState<'pre' | 'post' | null>(null);
  const [preguntaIndex, setPreguntaIndex] = useState(0);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<number | null>(null);
  const [haRespondido, setHaRespondido] = useState(false);
  const [aciertosAcumulados, setAciertosAcumulados] = useState(0);
  const [bannerMejora, setBannerMejora] = useState<string | null>(null);

  const enfermedad = ENFERMEDADES.find(
    e => e.id === id || 
    (id === 'hipertension' && e.id === 'cardiovasculares') ||
    (id === 'asma' && e.id === 'respiratorias') ||
    (id === 'obesidad' && e.id === 'obesidad') ||
    (id === 'renal' && e.id === 'renal-cronica') ||
    (id === 'salud-mental' && e.id === 'salud-mental') ||
    (id === 'mental' && e.id === 'salud-mental') ||
    (id === 'depresion' && e.id === 'salud-mental')
  );

  const preguntas: PrePostPregunta[] = enfermedad
    ? obtenerPreguntasPrePost(enfermedad.id)
    : [];

  const mapTipoEnfermedad = (eid?: string): TipoEnfermedad => {
    if (!eid) return 'cardiovascular';
    if (eid.includes('cardio') || eid.includes('hipertension')) return 'cardiovascular';
    if (eid.includes('cancer')) return 'cancer';
    if (eid.includes('respirat') || eid.includes('asma')) return 'respiratorias';
    if (eid.includes('diabet')) return 'diabetes';
    if (eid.includes('obesidad')) return 'obesidad';
    if (eid.includes('renal')) return 'renal';
    if (eid.includes('mental')) return 'salud_mental';
    return 'cardiovascular';
  };

  const tipo = mapTipoEnfermedad(enfermedad?.id);
  const colorAcento = tokens.colores.enfermedades[tipo] || tema.primario;

  const userId = user?.id;
  const enfermedadId = enfermedad?.id;

  // Cargar estado de evaluación pre/post al iniciar
  const refrescarEvaluacion = async () => {
    if (!userId || !enfermedadId) return;
    try {
      const actual = await obtenerEvaluacionPrePost(userId, enfermedadId);
      setEvaluacion(actual);
      if (actual && actual.post_puntaje !== null && actual.post_puntaje !== undefined) {
        const mej = actual.mejora ?? (actual.post_puntaje - actual.pre_puntaje);
        if (mej > 0) {
          setBannerMejora(`¡Mejoraste +${mej} puntos! (Pre: ${actual.pre_puntaje}/5 → Post: ${actual.post_puntaje}/5)`);
        } else if (actual.post_puntaje === 5) {
          setBannerMejora(`¡Puntaje perfecto 5/5 mantenido en este módulo!`);
        }
      }
    } catch {}
  };

  useEffect(() => {
    refrescarEvaluacion();
  }, [userId, enfermedadId]);

  useEffect(() => {
    return () => {
      Speech.stop().catch(() => {});
    };
  }, []);

  const toggleSeccion = (clave: string) => {
    setSeccionesAbiertas(prev => ({
      ...prev,
      [clave]: !prev[clave]
    }));
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const totalScrollable = contentSize.height - layoutMeasurement.height;
    if (totalScrollable > 0) {
      const calculo = Math.min(1, Math.max(0, contentOffset.y / totalScrollable));
      setProgresoLectura(calculo);

      if (calculo >= 0.6 && !haRegistradoLecturaRef.current && enfermedad && user) {
        haRegistradoLecturaRef.current = true;
        setFichaLeida(true);
        procesarAccion({
          tipo: 'ficha_leida',
          enfermedadId: String(id || enfermedad.id),
        }).catch(() => {});
      }
    }
  };

  const toggleVoz = async () => {
    if (estaHablando) {
      await Speech.stop();
      setEstaHablando(false);
    } else {
      if (!enfermedad) return;
      const textoLectura = `${enfermedad.nombre}. ${enfermedad.queEs}. Causas: ${enfermedad.causas.join(', ')}. Síntomas: ${enfermedad.sintomas.join(', ')}. Prevención: ${enfermedad.prevencion.join(', ')}.`;
      setEstaHablando(true);
      Speech.speak(textoLectura, {
        language: 'es-PE',
        pitch: 1.0,
        rate: 0.95,
        onDone: () => setEstaHablando(false),
        onError: () => setEstaHablando(false),
      });
    }
  };

  // Manejo de Pre/Post Test
  const iniciarTest = (tipoTest: 'pre' | 'post') => {
    setTestActivo(tipoTest);
    setPreguntaIndex(0);
    setOpcionSeleccionada(null);
    setHaRespondido(false);
    setAciertosAcumulados(0);
  };

  const responderPregunta = (index: number) => {
    if (haRespondido || !testActivo || !enfermedad) return;

    setOpcionSeleccionada(index);
    setHaRespondido(true);

    const actual = preguntas[preguntaIndex];
    const esCorrecto = index === actual.respuestaCorrecta;

    if (esCorrecto) {
      setAciertosAcumulados(prev => prev + 1);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } else {
      // Registrar error para el panel docente
      registrarErrorEnfermedad(enfermedad.id, user?.salon ?? null).catch(() => {});
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    }
  };

  const siguientePregunta = async () => {
    if (preguntaIndex < preguntas.length - 1) {
      setPreguntaIndex(prev => prev + 1);
      setOpcionSeleccionada(null);
      setHaRespondido(false);
    } else {
      // Finalizó el test
      await finalizarTest();
    }
  };

  const finalizarTest = async () => {
    if (!user || !enfermedad || !testActivo) return;

    const totalAciertos = aciertosAcumulados;
    const salon = user.salon ?? null;

    if (testActivo === 'pre') {
      await guardarPreTest(user.id, enfermedad.id, totalAciertos, salon);
      await procesarAccion({
        tipo: 'pre_test_completado',
        enfermedadId: enfermedad.id,
        puntaje: totalAciertos,
      });
      setBannerMejora(`Pre-test completado: ${totalAciertos}/5. ¡Ahora lee la ficha para dominar el tema!`);
    } else {
      const res = await guardarPostTest(user.id, enfermedad.id, totalAciertos, salon);
      const mejora = res.mejora;
      await procesarAccion({
        tipo: 'post_test_completado',
        enfermedadId: enfermedad.id,
        puntaje: totalAciertos,
        mejora,
      });

      if (mejora > 0) {
        setBannerMejora(`¡Felicitaciones! Mejoraste +${mejora} puntos (Pre: ${res.prePuntaje}/5 → Post: ${totalAciertos}/5)`);
      } else if (totalAciertos === 5) {
        setBannerMejora(`¡Excelente! Mantuviste un puntaje perfecto de 5/5.`);
      } else {
        setBannerMejora(`Post-test completado: ${totalAciertos}/5. ¡Sigue repasando para subir tu puntaje!`);
      }
    }

    setTestActivo(null);
    setOpcionSeleccionada(null);
    setHaRespondido(false);
    await refrescarEvaluacion();
  };

  if (!enfermedad) {
    return (
      <Pantalla style={{ backgroundColor: tema.fondo, justifyContent: 'center', alignItems: 'center', padding: tokens.espaciado.lg }}>
        <Text style={{ fontFamily: tokens.tipografia.familias.titulo, fontSize: tokens.tipografia.tamanos.titulo, color: tema.error, marginBottom: tokens.espaciado.md }}>
          Enfermedad no encontrada
        </Text>
        <Boton titulo="Volver" onPress={() => router.back()} />
      </Pantalla>
    );
  }

  const renderSeccion = (clave: string, titulo: string, contenido: React.ReactNode) => {
    const abierta = !!seccionesAbiertas[clave];

    return (
      <Tarjeta style={[styles.seccionCard, abierta && { borderColor: `${colorAcento}40` }]}>
        <TouchableOpacity
          style={styles.seccionHeader}
          onPress={() => toggleSeccion(clave)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Sección ${titulo}`}
        >
          <Text style={[styles.seccionTitulo, { color: abierta ? colorAcento : tema.texto }]}>
            {titulo}
          </Text>
          <Text style={[styles.seccionChevron, { color: abierta ? colorAcento : tema.textoSecundario }]}>
            {abierta ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {abierta && (
          <View style={[styles.seccionContenido, { borderTopColor: tema.borde }]}>
            {contenido}
          </View>
        )}
      </Tarjeta>
    );
  };

  return (
    <Pantalla style={{ backgroundColor: tema.fondo }}>
      {/* Barra de progreso de lectura superior fija */}
      <View style={styles.barraLecturaContainer}>
        <BarraProgreso progreso={progresoLectura} colorBase={colorAcento} />
      </View>

      {/* Cabecera temática */}
      <View style={[styles.headerHero, { backgroundColor: `${colorAcento}15`, borderBottomColor: `${colorAcento}30` }]}>
        <View style={styles.navRow}>
          <Boton
            titulo="← Volver"
            variante="fantasma"
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          />
          <Boton
            titulo={estaHablando ? 'Detener lectura' : 'Escuchar (TTS)'}
            variante={estaHablando ? 'peligro' : 'secundario'}
            onPress={toggleVoz}
          />
        </View>

        <View style={styles.heroContent}>
          <View style={[styles.heroIcono, { backgroundColor: `${colorAcento}25` }]}>
            <IconoEnfermedad enfermedad={tipo} size={36} color={colorAcento} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', gap: tokens.espaciado.xs, alignItems: 'center', marginBottom: tokens.espaciado.xs, flexWrap: 'wrap' }}>
              <Insignia texto={enfermedad.codigoCIE10 ? `CIE-10: ${enfermedad.codigoCIE10}` : 'DNT'} variante="primario" />
              {evaluacion && <Insignia texto={`Pre: ${evaluacion.pre_puntaje}/5`} variante="neutro" />}
              {evaluacion?.post_puntaje !== null && evaluacion?.post_puntaje !== undefined && (
                <Insignia texto={`Post: ${evaluacion.post_puntaje}/5`} variante="exito" />
              )}
              {fichaLeida && <Insignia texto="Leído hoy ✓" variante="exito" />}
            </View>
            <Text style={[styles.heroNombre, { color: tema.texto }]}>{enfermedad.nombre}</Text>
            <Text style={[styles.heroCategoria, { color: tema.textoSecundario }]}>{enfermedad.categoria}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
      >
        {/* Banner de Impacto / Mejora */}
        {bannerMejora && (
          <Tarjeta style={[styles.bannerMejoraTarjeta, { borderColor: tema.exito }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.espaciado.sm }}>
              <Mascota estado="animando" size={44} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerMejoraTitulo, { color: tema.exito }]}>Progreso de Aprendizaje</Text>
                <Text style={[styles.bannerMejoraTexto, { color: tema.texto }]}>{bannerMejora}</Text>
              </View>
            </View>
          </Tarjeta>
        )}

        {/* Modal interactivo de Pre-test o Post-test */}
        {testActivo ? (
          <Tarjeta style={[styles.testBox, { borderColor: colorAcento }]}>
            <View style={styles.testHeader}>
              <Insignia 
                texto={testActivo === 'pre' ? 'Pre-test Inicial' : 'Post-test Evaluativo'} 
                variante={testActivo === 'pre' ? 'logro' : 'primario'} 
              />
              <Text style={[styles.testProgresoTxt, { color: tema.textoSecundario }]}>
                Pregunta {preguntaIndex + 1} de {preguntas.length}
              </Text>
            </View>

            <BarraProgreso progreso={(preguntaIndex + 1) / preguntas.length} colorBase={colorAcento} />

            <Text style={[styles.testPreguntaTxt, { color: tema.texto }]}>
              {preguntas[preguntaIndex].pregunta}
            </Text>

            <View style={styles.opcionesLista}>
              {preguntas[preguntaIndex].opciones.map((op, idx) => {
                const esCorrecta = idx === preguntas[preguntaIndex].respuestaCorrecta;
                const estaSeleccionada = opcionSeleccionada === idx;

                let bgOpcion = tema.superficie;
                let borderOpcion = tema.borde;
                let colorTexto = tema.texto;

                if (haRespondido) {
                  if (esCorrecta) {
                    bgOpcion = `${tema.exito}20`;
                    borderOpcion = tema.exito;
                    colorTexto = tema.exito;
                  } else if (estaSeleccionada) {
                    bgOpcion = `${tema.error}20`;
                    borderOpcion = tema.error;
                    colorTexto = tema.error;
                  }
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    disabled={haRespondido}
                    onPress={() => responderPregunta(idx)}
                    style={[styles.opcionBtn, { backgroundColor: bgOpcion, borderColor: borderOpcion }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Opción ${idx + 1}: ${op}`}
                  >
                    <Text style={[styles.opcionTxt, { color: colorTexto }]}>{op}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {haRespondido && (
              <View style={[styles.feedbackBox, { backgroundColor: `${colorAcento}15`, borderColor: `${colorAcento}30` }]}>
                <Text style={[styles.feedbackTxt, { color: tema.texto }]}>
                  {preguntas[preguntaIndex].explicacion}
                </Text>
                <Boton
                  titulo={preguntaIndex < preguntas.length - 1 ? 'Siguiente Pregunta →' : 'Completar Evaluación'}
                  variante="principal"
                  onPress={siguientePregunta}
                  style={{ marginTop: tokens.espaciado.md }}
                />
              </View>
            )}
          </Tarjeta>
        ) : null}

        {/* Tarjeta de Inicio de Pre-test si aún no lo ha completado */}
        {!testActivo && (!evaluacion || evaluacion.pre_puntaje === undefined) && (
          <Tarjeta style={[styles.preTestCard, { borderColor: `${tema.logro}60` }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.espaciado.md }}>
              <Mascota estado="pensando" size={54} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.preTestTitulo, { color: tema.texto }]}>¿Cuánto sabes antes de empezar?</Text>
                <Text style={[styles.preTestSub, { color: tema.textoSecundario }]}>
                  Responde 5 preguntas rápidas para medir tu punto de partida sobre {enfermedad.nombre}.
                </Text>
              </View>
            </View>
            <Boton
              titulo="Tomar Pre-test (5 preguntas)"
              variante="principal"
              onPress={() => iniciarTest('pre')}
              style={{ marginTop: tokens.espaciado.md }}
            />
          </Tarjeta>
        )}

        {/* Secciones Plegables de Contenido Educativo */}
        {renderSeccion(
          'queEs',
          '1. ¿Qué es?',
          <Text style={[styles.parrafo, { color: tema.textoSecundario }]}>{enfermedad.queEs}</Text>
        )}

        {renderSeccion(
          'causas',
          '2. Causas y Factores de Riesgo',
          <View style={styles.listaBullets}>
            {enfermedad.causas.map((c, i) => (
              <View key={i} style={styles.bulletFila}>
                <View style={[styles.bulletPunto, { backgroundColor: colorAcento }]} />
                <Text style={[styles.bulletTexto, { color: tema.textoSecundario }]}>{c}</Text>
              </View>
            ))}
          </View>
        )}

        {renderSeccion(
          'sintomas',
          '3. Síntomas Habituales',
          <View style={styles.listaBullets}>
            {enfermedad.sintomas.map((s, i) => (
              <View key={i} style={styles.bulletFila}>
                <View style={[styles.bulletPunto, { backgroundColor: tema.error }]} />
                <Text style={[styles.bulletTexto, { color: tema.textoSecundario }]}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {renderSeccion(
          'prevencion',
          '4. Prevención y Hábitos Saludables',
          <View style={styles.listaBullets}>
            {enfermedad.prevencion.map((p, i) => (
              <View key={i} style={styles.bulletFila}>
                <View style={[styles.bulletPunto, { backgroundColor: tema.exito }]} />
                <Text style={[styles.bulletTexto, { color: tema.textoSecundario }]}>{p}</Text>
              </View>
            ))}
          </View>
        )}

        {renderSeccion(
          'consulta',
          '5. ¿Cuándo Consultar al Médico?',
          <View>
            <Text style={[styles.parrafo, { color: tema.textoSecundario }]}>
              {enfermedad.cuandoConsultar || 'Si experimentas malestar continuo, dolor o señales de alerta, acude a la posta o centro de salud más cercano. Nunca te automediques.'}
            </Text>
            {enfermedad.sintomasAlarma && enfermedad.sintomasAlarma.length > 0 && (
              <View style={[styles.alertaBox, { backgroundColor: `${tema.error}12`, borderColor: `${tema.error}35` }]}>
                <Text style={[styles.alertaTitulo, { color: tema.error }]}>Signos de alarma inmediata:</Text>
                {enfermedad.sintomasAlarma.map((al, idx) => (
                  <Text key={idx} style={[styles.alertaItem, { color: tema.texto }]}>• {al}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Sección de Post-Test Evaluativo al Final */}
        {!testActivo && (
          <View style={styles.quizSection}>
            <Tarjeta style={styles.quizCard}>
              <Mascota estado={evaluacion?.post_puntaje !== null && evaluacion?.post_puntaje !== undefined ? 'feliz' : 'animando'} size={60} />
              
              <Text style={[styles.quizTitulo, { color: tema.texto, marginTop: tokens.espaciado.sm }]}>
                {evaluacion?.post_puntaje !== null && evaluacion?.post_puntaje !== undefined
                  ? '¡Módulo Completado!'
                  : 'Post-test Final Evaluativo'}
              </Text>
              
              <Text style={[styles.quizSub, { color: tema.textoSecundario }]}>
                {evaluacion?.post_puntaje !== null && evaluacion?.post_puntaje !== undefined
                  ? `Completaste este módulo con ${evaluacion.post_puntaje}/5 puntos. Puedes volver a rendirlo para afianzar tus aprendizajes.`
                  : 'Responde las 5 preguntas finales para comprobar cuánto aprendiste y calcular tu mejora.'}
              </Text>

              {/* Si ya rindió pre y post, mostrar la mejora */}
              {evaluacion && evaluacion.post_puntaje !== null && evaluacion.post_puntaje !== undefined && (
                <View style={[styles.mejoraResumenBox, { backgroundColor: `${tema.exito}15`, borderColor: `${tema.exito}40` }]}>
                  <Text style={[styles.mejoraResumenTitulo, { color: tema.exito }]}>
                    {evaluacion.mejora && evaluacion.mejora > 0
                      ? `¡Mejoraste +${evaluacion.mejora} puntos respecto a tu pre-test!`
                      : evaluacion.post_puntaje === 5
                      ? '¡Excelente! Mantuviste el puntaje perfecto de 5/5'
                      : '¡Buen trabajo! Sigue aprendiendo con los otros módulos'}
                  </Text>
                  <Text style={[styles.mejoraResumenDetalle, { color: tema.textoSecundario }]}>
                    Pre-test inicial: {evaluacion.pre_puntaje}/5 • Post-test final: {evaluacion.post_puntaje}/5
                  </Text>
                </View>
              )}

              <Boton
                titulo={
                  evaluacion?.post_puntaje !== null && evaluacion?.post_puntaje !== undefined
                    ? 'Repetir Post-test'
                    : 'Iniciar Post-test Evaluativo'
                }
                variante="principal"
                onPress={() => iniciarTest('post')}
                style={{ marginTop: tokens.espaciado.md, width: '100%' }}
              />
            </Tarjeta>
          </View>
        )}

        <View style={{ height: tokens.espaciado.xxl }} />
      </ScrollView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  barraLecturaContainer: {
    width: '100%',
    height: 4,
  },
  headerHero: {
    padding: tokens.espaciado.md,
    borderBottomWidth: 1,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.espaciado.sm,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.espaciado.md,
    paddingVertical: tokens.espaciado.xs,
  },
  heroIcono: {
    width: 60,
    height: 60,
    borderRadius: tokens.radios.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNombre: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: tokens.tipografia.tamanos.titulo,
    marginTop: tokens.espaciado.xs,
  },
  heroCategoria: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
  scrollContent: {
    padding: tokens.espaciado.lg,
    paddingBottom: 80,
  },
  bannerMejoraTarjeta: {
    padding: tokens.espaciado.md,
    marginBottom: tokens.espaciado.md,
    borderWidth: 1,
  },
  bannerMejoraTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    fontWeight: '700',
  },
  bannerMejoraTexto: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    marginTop: 2,
  },
  preTestCard: {
    padding: tokens.espaciado.md,
    marginBottom: tokens.espaciado.md,
    borderWidth: 1,
  },
  preTestTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    fontWeight: '700',
  },
  preTestSub: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    marginTop: 2,
  },
  testBox: {
    padding: tokens.espaciado.lg,
    marginBottom: tokens.espaciado.lg,
    borderWidth: 2,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.espaciado.sm,
  },
  testProgresoTxt: {
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
  testPreguntaTxt: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.subtitulo,
    marginVertical: tokens.espaciado.md,
    lineHeight: 24,
  },
  opcionesLista: {
    gap: tokens.espaciado.sm,
    marginBottom: tokens.espaciado.md,
  },
  opcionBtn: {
    padding: tokens.espaciado.md,
    borderRadius: tokens.radios.md,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  opcionTxt: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    lineHeight: 20,
  },
  feedbackBox: {
    padding: tokens.espaciado.md,
    borderRadius: tokens.radios.md,
    borderWidth: 1,
    marginTop: tokens.espaciado.xs,
  },
  feedbackTxt: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    lineHeight: 18,
  },
  seccionCard: {
    padding: tokens.espaciado.md,
    marginBottom: tokens.espaciado.md,
  },
  seccionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  seccionTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
  },
  seccionChevron: {
    fontSize: 14,
  },
  seccionContenido: {
    marginTop: tokens.espaciado.md,
    paddingTop: tokens.espaciado.md,
    borderTopWidth: 1,
  },
  parrafo: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    lineHeight: 22,
  },
  listaBullets: {
    gap: tokens.espaciado.sm,
  },
  bulletFila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.espaciado.sm,
  },
  bulletPunto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  bulletTexto: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    lineHeight: 22,
    flex: 1,
  },
  alertaBox: {
    marginTop: tokens.espaciado.md,
    padding: tokens.espaciado.md,
    borderRadius: tokens.radios.md,
    borderWidth: 1,
  },
  alertaTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    marginBottom: tokens.espaciado.xs,
  },
  alertaItem: {
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    lineHeight: 18,
  },
  quizSection: {
    marginTop: tokens.espaciado.lg,
  },
  quizCard: {
    padding: tokens.espaciado.xl,
    alignItems: 'center',
  },
  quizTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.subtitulo,
    textAlign: 'center',
    marginBottom: tokens.espaciado.xs,
  },
  quizSub: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    textAlign: 'center',
    lineHeight: 18,
  },
  mejoraResumenBox: {
    marginTop: tokens.espaciado.md,
    padding: tokens.espaciado.md,
    borderRadius: tokens.radios.md,
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
  },
  mejoraResumenTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    fontWeight: '700',
    textAlign: 'center',
  },
  mejoraResumenDetalle: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    marginTop: 2,
    textAlign: 'center',
  },
});
