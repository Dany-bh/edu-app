import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../hooks/useTema';
import { tokens } from '../constants/theme';
import { ENFERMEDADES } from '../constants/enfermedades';
import { 
  fisherYatesShuffle, 
  generarOpcionesConDistractores 
} from '../lib/gamificacion';
import { Pantalla } from '../components/ui/Pantalla';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Boton } from '../components/ui/Boton';
import { BarraProgreso } from '../components/ui/BarraProgreso';
import { Insignia } from '../components/ui/Insignia';
import { Mascota } from '../components/Mascota';

const MAX_QUESTIONS = 5;

interface PreguntaReto {
  id: string;
  diseaseName: string;
  correctAnswer: string;
  category: string;
  options: string[];
}

export default function RetosScreen() {
  const router = useRouter();
  const { user, procesarAccion } = useAuth();
  const { tema } = useTema();
  
  const [partidaPreguntas, setPartidaPreguntas] = useState<PreguntaReto[]>([]);
  const [preguntaIndex, setPreguntaIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [mensajeFeedback, setMensajeFeedback] = useState<string>('');

  useEffect(() => {
    iniciarNuevaPartida();
  }, []);

  const iniciarNuevaPartida = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    setMensajeFeedback('');
    setPointsEarned(0);
    setCorrectAnswersCount(0);
    setIsFinished(false);
    setPreguntaIndex(0);

    const enfermedadesPartida = fisherYatesShuffle(ENFERMEDADES).slice(0, MAX_QUESTIONS);

    const preguntasGeneradas: PreguntaReto[] = enfermedadesPartida.map((enfermedad) => {
      const correctPrevention = enfermedad.prevencion[0] || 'Consultar oportunamente al centro de salud';
      
      const enfermedadesMismaCategoria = ENFERMEDADES.filter(
        (e) => e.categoria === enfermedad.categoria && e.id !== enfermedad.id
      );
      
      const candidatosDistractores = enfermedadesMismaCategoria
        .flatMap((e) => e.prevencion)
        .filter((prev) => prev !== correctPrevention);

      const options = generarOpcionesConDistractores(
        correctPrevention,
        candidatosDistractores,
        4
      );

      return {
        id: enfermedad.id,
        diseaseName: enfermedad.nombre,
        correctAnswer: correctPrevention,
        category: enfermedad.categoria,
        options,
      };
    });

    setPartidaPreguntas(preguntasGeneradas);
  };

  const currentQuestion = partidaPreguntas[preguntaIndex] || null;

  const handleSelect = async (answer: string) => {
    if (selectedAnswer || !currentQuestion) return;
    
    setSelectedAnswer(answer);
    
    if (answer === currentQuestion.correctAnswer) {
      setIsCorrect(true);
      setCorrectAnswersCount((prev) => prev + 1);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }

      if (user) {
        const res = await procesarAccion({
          tipo: 'reto',
          preguntaId: currentQuestion.id,
          esCorrecta: true,
        });

        if (res && res.puntosGanados > 0) {
          setPointsEarned((prev) => prev + res.puntosGanados);
          if (res.metaDiariaRecienCompletada) {
            setMensajeFeedback(`¡Acierto! +${res.puntosGanados} XP (¡Meta Diaria de hoy cumplida! 🎉)`);
          } else if (res.logrosDesbloqueados.length > 0) {
            setMensajeFeedback(`¡Acierto! +${res.puntosGanados} XP (¡Logro: ${res.logrosDesbloqueados[0].titulo}! 🏆)`);
          } else {
            setMensajeFeedback(`¡Excelente! Has ganado +${res.puntosGanados} XP`);
          }
        } else {
          setMensajeFeedback('¡Respuesta correcta! (Pregunta ya premiada hoy)');
        }
      }
    } else {
      setIsCorrect(false);
      setMensajeFeedback('Respuesta incorrecta');

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }

      if (user) {
        await procesarAccion({
          tipo: 'reto',
          preguntaId: currentQuestion.id,
          esCorrecta: false,
        });
      }
    }
  };

  const handleNext = () => {
    if (preguntaIndex + 1 >= partidaPreguntas.length) {
      setIsFinished(true);
    } else {
      setSelectedAnswer(null);
      setIsCorrect(null);
      setMensajeFeedback('');
      setPreguntaIndex((prev) => prev + 1);
    }
  };

  // Pantalla de Resultados
  if (isFinished) {
    const porcentaje = Math.round((correctAnswersCount / (partidaPreguntas.length || 1)) * 100);

    return (
      <Pantalla style={{ backgroundColor: tema.fondo, justifyContent: 'center', alignItems: 'center', padding: tokens.espaciado.lg }}>
        <Tarjeta style={styles.summaryCard}>
          {/* Confeti estático minimalista */}
          <View style={styles.confetiWrap}>
            <View style={[styles.confetiDot, { backgroundColor: tema.logro, top: 10, left: 40 }]} />
            <View style={[styles.confetiDot, { backgroundColor: tema.primario, top: 20, right: 30 }]} />
            <View style={[styles.confetiDot, { backgroundColor: tema.energia, top: 35, right: 80 }]} />
            <View style={[styles.confetiDot, { backgroundColor: tema.exito, top: 15, left: 100 }]} />
          </View>

          <Mascota estado="animando" size={110} />
          
          <Text style={[styles.summaryTitle, { color: tema.texto }]}>¡Reto Completado!</Text>
          <Text style={[styles.summarySub, { color: tema.textoSecundario }]}>
            Demostraste tus conocimientos en prevención de Enfermedades No Transmisibles.
          </Text>

          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: `${tema.primario}10`, borderColor: `${tema.primario}30` }]}>
              <Text style={[styles.statNum, { color: tema.primario }]}>{correctAnswersCount}/{partidaPreguntas.length}</Text>
              <Text style={[styles.statLabel, { color: tema.textoSecundario }]}>Aciertos ({porcentaje}%)</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: `${tema.logro}10`, borderColor: `${tema.logro}30` }]}>
              <Text style={[styles.statNum, { color: tema.logro }]}>+{pointsEarned}</Text>
              <Text style={[styles.statLabel, { color: tema.textoSecundario }]}>XP Ganados</Text>
            </View>
          </View>

          <Boton
            titulo="Volver al Inicio"
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            style={{ width: '100%', marginTop: tokens.espaciado.md }}
          />

          <Boton
            titulo="Jugar Otra Ronda"
            variante="secundario"
            onPress={iniciarNuevaPartida}
            style={{ width: '100%', marginTop: tokens.espaciado.sm }}
          />
        </Tarjeta>
      </Pantalla>
    );
  }

  const progreso = (preguntaIndex + 1) / (partidaPreguntas.length || MAX_QUESTIONS);

  return (
    <Pantalla style={{ backgroundColor: tema.fondo }}>
      {/* Barra de progreso superior */}
      <BarraProgreso progreso={progreso} colorBase={tema.primario} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabecera de Navegación */}
        <View style={styles.navRow}>
          <Boton
            titulo="← Salir"
            variante="fantasma"
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          />
          <Insignia texto={`Pregunta ${preguntaIndex + 1} de ${partidaPreguntas.length}`} variante="primario" />
          <Insignia texto={`${user?.puntos || 0} XP`} variante="logro" />
        </View>

        {currentQuestion && (
          <Animated.View key={preguntaIndex} entering={FadeInDown.duration(400)}>
            {/* Tarjeta de Pregunta */}
            <Tarjeta style={styles.preguntaCard}>
              <Insignia texto={currentQuestion.category} variante="energia" style={{ marginBottom: tokens.espaciado.xs }} />
              <Text style={[styles.preguntaPrompt, { color: tema.textoSecundario }]}>
                ¿Cuál es la medida preventiva clave recomendada para:
              </Text>
              <Text style={[styles.preguntaEnfermedad, { color: tema.texto }]}>
                {currentQuestion.diseaseName}?
              </Text>
            </Tarjeta>

            {/* Opciones */}
            <View style={styles.optionsWrap}>
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isActuallyCorrect = option === currentQuestion.correctAnswer;

                let bgColor = tema.superficie;
                let borderColor = tema.borde;

                if (selectedAnswer) {
                  if (isActuallyCorrect) {
                    bgColor = `${tema.exito}15`;
                    borderColor = tema.exito;
                  } else if (isSelected && !isActuallyCorrect) {
                    bgColor = `${tema.error}15`;
                    borderColor = tema.error;
                  }
                }

                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    disabled={selectedAnswer !== null}
                    onPress={() => handleSelect(option)}
                    accessibilityRole="button"
                    accessibilityLabel={option}
                    style={[
                      styles.opcionBtn,
                      {
                        backgroundColor: bgColor,
                        borderColor: borderColor,
                      }
                    ]}
                  >
                    <Text style={[styles.opcionTexto, { color: tema.texto }]}>
                      {option}
                    </Text>
                    {selectedAnswer && isActuallyCorrect && (
                      <Text style={{ color: tema.exito, fontWeight: 'bold' }}>✓</Text>
                    )}
                    {selectedAnswer && isSelected && !isActuallyCorrect && (
                      <Text style={{ color: tema.error, fontWeight: 'bold' }}>✕</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Feedback y Avance */}
            {selectedAnswer && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.feedbackWrap}>
                <View style={[
                  styles.feedbackBanner,
                  {
                    backgroundColor: isCorrect ? `${tema.exito}15` : `${tema.error}15`,
                    borderColor: isCorrect ? tema.exito : tema.error
                  }
                ]}>
                  <Text style={[styles.feedbackTitulo, { color: isCorrect ? tema.exito : tema.error }]}>
                    {isCorrect ? '¡Respuesta Correcta!' : 'Recomendación MINSA:'}
                  </Text>
                  <Text style={[styles.feedbackDesc, { color: tema.textoSecundario }]}>
                    {isCorrect ? mensajeFeedback : currentQuestion.correctAnswer}
                  </Text>
                </View>

                <Boton
                  titulo={preguntaIndex + 1 >= partidaPreguntas.length ? 'Finalizar Reto' : 'Siguiente Pregunta'}
                  onPress={handleNext}
                  style={{ width: '100%', marginTop: tokens.espaciado.sm }}
                />
              </Animated.View>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: tokens.espaciado.lg,
    paddingBottom: 80,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.espaciado.md,
  },
  preguntaCard: {
    padding: tokens.espaciado.xl,
    marginBottom: tokens.espaciado.lg,
  },
  preguntaPrompt: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    marginTop: tokens.espaciado.xs,
  },
  preguntaEnfermedad: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.titulo,
    marginTop: tokens.espaciado.xs,
  },
  optionsWrap: {
    gap: tokens.espaciado.sm,
    marginBottom: tokens.espaciado.md,
  },
  opcionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.espaciado.md,
    borderRadius: tokens.radios.md,
    borderWidth: 1,
    minHeight: 52,
  },
  opcionTexto: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    flex: 1,
    paddingRight: tokens.espaciado.sm,
  },
  feedbackWrap: {
    marginTop: tokens.espaciado.sm,
  },
  feedbackBanner: {
    padding: tokens.espaciado.md,
    borderRadius: tokens.radios.md,
    borderWidth: 1,
    marginBottom: tokens.espaciado.sm,
  },
  feedbackTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    marginBottom: tokens.espaciado.xs,
  },
  feedbackDesc: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    lineHeight: 18,
  },
  summaryCard: {
    alignItems: 'center',
    padding: tokens.espaciado.xl,
    width: '100%',
    maxWidth: 440,
    position: 'relative',
    overflow: 'hidden',
  },
  confetiWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  confetiDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryTitle: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: tokens.tipografia.tamanos.titulo,
    marginTop: tokens.espaciado.md,
    textAlign: 'center',
  },
  summarySub: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: tokens.espaciado.xs,
    marginBottom: tokens.espaciado.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: tokens.espaciado.md,
    width: '100%',
    marginBottom: tokens.espaciado.md,
  },
  statBox: {
    flex: 1,
    padding: tokens.espaciado.md,
    borderRadius: tokens.radios.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNum: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: tokens.tipografia.tamanos.titulo,
  },
  statLabel: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
    marginTop: tokens.espaciado.xs,
  },
});
