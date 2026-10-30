import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../hooks/useTema';
import { tokens } from '../constants/theme';
import { Tarjeta } from './ui/Tarjeta';
import { Boton } from './ui/Boton';
import { BarraProgreso } from './ui/BarraProgreso';
import { Insignia } from './ui/Insignia';
import { Mascota } from './Mascota';

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
  explicacion?: string;
}

interface QuizProps {
  title: string;
  questions: Question[];
  onComplete?: () => void;
  pointsToAward?: number;
}

export default function Quiz({ title, questions, onComplete, pointsToAward = 100 }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const scoreRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user, procesarAccion } = useAuth();
  const { tema } = useTema();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const advanceQuestion = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedOption(null);
      setHasAnswered(false);
    } else {
      finishQuiz(scoreRef.current);
    }
  };

  const handleAnswer = (index: number) => {
    if (hasAnswered) return;

    setSelectedOption(index);
    setHasAnswered(true);

    const isCorrect = index === questions[currentQuestion].correctAnswerIndex;
    const nextScore = isCorrect ? scoreRef.current + 1 : scoreRef.current;
    scoreRef.current = nextScore;
    if (isCorrect) {
      setScore(nextScore);
    }

    // Háptica
    if (Platform.OS !== 'web') {
      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    }

    // Auto-avance con pausa de 2.5s que el alumno puede saltar
    timerRef.current = setTimeout(() => {
      advanceQuestion();
    }, 2500);
  };

  const finishQuiz = async (finalScore: number) => {
    setShowResults(true);
    if (user && finalScore >= Math.ceil(questions.length / 2)) {
      const esPerfecto = finalScore === questions.length;
      await procesarAccion({
        tipo: 'quiz',
        enfermedadId: title.toLowerCase().replace(/\s+/g, '_'),
        esPerfecto,
        score: finalScore,
        total: questions.length,
      });
    }
  };

  if (showResults) {
    const passed = score >= Math.ceil(questions.length / 2);

    return (
      <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.container}>
        <Tarjeta style={styles.resultsCard}>
          {/* Confeti visual simple */}
          <View style={styles.confetiContainer}>
            <View style={[styles.confetiPiece, { backgroundColor: tema.logro, top: 10, left: 30 }]} />
            <View style={[styles.confetiPiece, { backgroundColor: tema.primario, top: 25, right: 40 }]} />
            <View style={[styles.confetiPiece, { backgroundColor: tema.energia, top: 5, right: 90 }]} />
            <View style={[styles.confetiPiece, { backgroundColor: tema.exito, top: 35, left: 80 }]} />
          </View>

          <Mascota estado={passed ? 'animando' : 'pensando'} size={96} />
          
          <Text style={[styles.resultsTitle, { color: tema.texto }]}>
            {passed ? '¡Excelente trabajo!' : '¡Buen intento!'}
          </Text>
          <Text style={[styles.resultsSubtitle, { color: tema.textoSecundario }]}>
            Obtuviste {score} de {questions.length} respuestas correctas.
          </Text>

          {passed && (
            <Insignia texto={`+${pointsToAward} XP Sumados`} variante="logro" style={{ marginVertical: tokens.espaciado.md }} />
          )}

          <Boton
            titulo="Continuar"
            onPress={() => onComplete && onComplete()}
            style={{ width: '100%', marginTop: tokens.espaciado.md }}
          />
        </Tarjeta>
      </Animated.View>
    );
  }

  const question = questions[currentQuestion];
  const isCorrect = selectedOption === question.correctAnswerIndex;
  const progreso = (currentQuestion + 1) / questions.length;
  const explicacion = question.explicacion || question.explanation;

  return (
    <View style={styles.container}>
      <Tarjeta style={styles.quizCard}>
        {/* Cabecera y Barra de Progreso */}
        <View style={styles.header}>
          <Text style={[styles.quizTitle, { color: tema.primario }]}>{title}</Text>
          <Text style={[styles.progressText, { color: tema.textoSecundario }]}>
            {currentQuestion + 1} de {questions.length}
          </Text>
        </View>

        <BarraProgreso progreso={progreso} colorBase={tema.primario} style={{ marginBottom: tokens.espaciado.lg }} />

        {/* Enunciado de la Pregunta */}
        <Text style={[styles.questionText, { color: tema.texto }]}>
          {question.question}
        </Text>

        {/* Opciones */}
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const optionIsCorrect = index === question.correctAnswerIndex;

            let bgColor = tema.superficie;
            let borderColor = tema.borde;

            if (hasAnswered) {
              if (optionIsCorrect) {
                bgColor = `${tema.exito}15`;
                borderColor = tema.exito;
              } else if (isSelected && !optionIsCorrect) {
                bgColor = `${tema.error}15`;
                borderColor = tema.error;
              }
            } else if (isSelected) {
              bgColor = `${tema.primario}10`;
              borderColor = tema.primario;
            }

            return (
              <TouchableOpacity
                key={index}
                style={[styles.optionBtn, { backgroundColor: bgColor, borderColor }]}
                onPress={() => handleAnswer(index)}
                disabled={hasAnswered}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={option}
              >
                <Text style={[styles.optionText, { color: tema.texto }]}>
                  {option}
                </Text>
                {hasAnswered && optionIsCorrect && (
                  <Text style={{ color: tema.exito, fontWeight: 'bold' }}>✓</Text>
                )}
                {hasAnswered && isSelected && !optionIsCorrect && (
                  <Text style={{ color: tema.error, fontWeight: 'bold' }}>✕</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback y Explicación */}
        {hasAnswered && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.feedbackContainer}>
            <View style={[
              styles.feedbackBanner, 
              { backgroundColor: isCorrect ? `${tema.exito}15` : `${tema.error}15`, borderColor: isCorrect ? tema.exito : tema.error }
            ]}>
              <Text style={[styles.feedbackTitle, { color: isCorrect ? tema.exito : tema.error }]}>
                {isCorrect ? '¡Correcto!' : 'Respuesta Incorrecta'}
              </Text>
              {explicacion && (
                <Text style={[styles.feedbackExpl, { color: tema.textoSecundario }]}>
                  {explicacion}
                </Text>
              )}
            </View>

            <Boton
              titulo={currentQuestion < questions.length - 1 ? 'Siguiente Pregunta' : 'Ver Resultados'}
              variante="secundario"
              onPress={advanceQuestion}
              style={{ marginTop: tokens.espaciado.sm }}
            />
          </Animated.View>
        )}
      </Tarjeta>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  quizCard: {
    padding: tokens.espaciado.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.espaciado.xs,
  },
  quizTitle: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
  progressText: {
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.mini,
  },
  questionText: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    lineHeight: 24,
    marginBottom: tokens.espaciado.lg,
  },
  optionsContainer: {
    gap: tokens.espaciado.sm,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.espaciado.md,
    borderRadius: tokens.radios.md,
    borderWidth: 1,
    minHeight: 48,
  },
  optionText: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    flex: 1,
    paddingRight: tokens.espaciado.sm,
  },
  feedbackContainer: {
    marginTop: tokens.espaciado.md,
  },
  feedbackBanner: {
    padding: tokens.espaciado.md,
    borderRadius: tokens.radios.md,
    borderWidth: 1,
    marginBottom: tokens.espaciado.sm,
  },
  feedbackTitle: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    marginBottom: tokens.espaciado.xs,
  },
  feedbackExpl: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    lineHeight: 18,
  },
  resultsCard: {
    alignItems: 'center',
    padding: tokens.espaciado.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  confetiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  confetiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  resultsTitle: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: tokens.tipografia.tamanos.titulo,
    marginTop: tokens.espaciado.md,
    textAlign: 'center',
  },
  resultsSubtitle: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    marginTop: tokens.espaciado.xs,
    textAlign: 'center',
  },
});
