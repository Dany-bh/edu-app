import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Linking,
  Alert,
  Animated 
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { getGeminiModel, sendMessageStreamWithRAG } from '../../services/gemini';
import { useAuth } from '../../context/AuthContext';
import { useTema } from '../../hooks/useTema';
import { tokens } from '../../constants/theme';
import { Pantalla } from '../../components/ui/Pantalla';
import { Insignia } from '../../components/ui/Insignia';
import { Boton } from '../../components/ui/Boton';
import FormattedBotMessage from '../../components/FormattedBotMessage';
import { registrarAlertaSeguridad } from '../../db/database';
import { limpiarTextoParaVoz } from '../../lib/audioUtils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  isStreaming?: boolean;
}

const SUGERENCIAS_RAPIDAS = [
  'Explícame la diabetes',
  'Hazme un quiz',
  '¿Esto es mito o verdad?',
  '¿Cómo prevenir la hipertensión?',
  '¿Cuánta sal se recomienda al día?',
];

/**
 * Indicador visual de carga ultraligero que responde en 0ms
 * mientras llega el primer token del streaming (TTFT).
 */
interface IndicadorPrimerTokenProps {
  colorPrimario: string;
  colorTextoSecundario: string;
}

function IndicadorPrimerToken({ colorPrimario, colorTextoSecundario }: IndicadorPrimerTokenProps) {
  const [anim1] = useState(() => new Animated.Value(0.25));
  const [anim2] = useState(() => new Animated.Value(0.25));
  const [anim3] = useState(() => new Animated.Value(0.25));

  useEffect(() => {
    const pulse = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.25,
            duration: 280,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const l1 = pulse(anim1, 0);
    const l2 = pulse(anim2, 140);
    const l3 = pulse(anim3, 280);

    l1.start();
    l2.start();
    l3.start();

    return () => {
      l1.stop();
      l2.stop();
      l3.stop();
    };
  }, [anim1, anim2, anim3]);

  return (
    <View style={styles.primerTokenWrap}>
      <View style={styles.dotsRow}>
        <Animated.View style={[styles.primerTokenDot, { backgroundColor: colorPrimario, opacity: anim1 }]} />
        <Animated.View style={[styles.primerTokenDot, { backgroundColor: colorPrimario, opacity: anim2 }]} />
        <Animated.View style={[styles.primerTokenDot, { backgroundColor: colorPrimario, opacity: anim3 }]} />
      </View>
      <Text style={[styles.primerTokenTexto, { color: colorTextoSecundario }]}>
        Consultando guías de salud...
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const { user, procesarAccion } = useAuth();
  const { tema } = useTema();
  const userName = user?.nombre_completo?.split(' ')[0] || user?.usuario || 'Estudiante';
  
  const greetingMessage = `Hola ${userName}, le doy una cordial bienvenida a EduSalud. Soy su tutor de salud preventiva y orientación pedagógica. ¿En qué tema de bienestar o prevención de Enfermedades No Transmisibles puedo asistirle hoy?`;

  const [messages, setMessages] = useState<Message[]>([
    { id: '0', text: greetingMessage, sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [estaHablando, setEstaHablando] = useState(false);
  const [vozActivada, setVozActivada] = useState(true);
  const [isListening, setIsListening] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const chatSessionRef = useRef<any>(null);
  const isScreenFocusedRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const saludoHabladoRef = useRef(false);

  const estaHablandoRef = useRef(false);

  const stopSpeaking = useCallback(() => {
    try {
      Speech.stop();
    } catch {}
    if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).speechSynthesis) {
      try {
        (window as any).speechSynthesis.cancel();
      } catch {}
    }
    estaHablandoRef.current = false;
    setEstaHablando(false);
  }, []);

  const speakText = useCallback((text: string) => {
    if (estaHablandoRef.current) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    const cleanText = limpiarTextoParaVoz(text);
    if (!cleanText) return;

    estaHablandoRef.current = true;
    setEstaHablando(true);

    if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).speechSynthesis) {
      try {
        const synth = (window as any).speechSynthesis;
        synth.cancel();
        
        if (synth.paused) {
          synth.resume();
        }

        const SpeechUtterance = (window as any).SpeechSynthesisUtterance;
        if (SpeechUtterance) {
          const utterance = new SpeechUtterance(cleanText);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;

          const assignVoiceAndSpeak = () => {
            const voices: any[] = synth.getVoices() || [];
            const spanishVoice = 
              voices.find((v: any) => v.lang?.toLowerCase() === 'es-pe') ||
              voices.find((v: any) => v.lang?.toLowerCase()?.startsWith('es-')) ||
              voices.find((v: any) => v.lang?.toLowerCase()?.startsWith('es')) ||
              voices.find((v: any) => v.name?.toLowerCase()?.includes('spanish') || v.name?.toLowerCase()?.includes('español'));

            if (spanishVoice) {
              utterance.voice = spanishVoice;
              utterance.lang = spanishVoice.lang;
            } else {
              utterance.lang = 'es-ES';
            }

            utterance.onend = () => {
              estaHablandoRef.current = false;
              setEstaHablando(false);
            };
            utterance.onerror = (e: any) => {
              console.warn('[Speech Utterance Error]:', e);
              estaHablandoRef.current = false;
              setEstaHablando(false);
            };

            synth.speak(utterance);
          };

          if (synth.getVoices().length === 0) {
            synth.onvoiceschanged = () => {
              assignVoiceAndSpeak();
            };
          } else {
            assignVoiceAndSpeak();
          }
          return;
        }
      } catch (err) {
        console.warn('[Web Speech Error]:', err);
      }
    }

    // Expo Speech fallback para móvil y otros entornos
    Speech.speak(cleanText, {
      language: 'es-ES',
      pitch: 1.0,
      rate: 1.0,
      onDone: () => {
        estaHablandoRef.current = false;
        setEstaHablando(false);
      },
      onError: (err) => {
        console.warn('[Expo Speech Error]:', err);
        estaHablandoRef.current = false;
        setEstaHablando(false);
      },
    });
  }, [stopSpeaking]);

  useFocusEffect(
    useCallback(() => {
      isScreenFocusedRef.current = true;

      // Reproducir saludo por voz una vez al enfocar la pantalla
      const timer = setTimeout(() => {
        if (isScreenFocusedRef.current) {
          speakText(greetingMessage);
        }
      }, 400);

      return () => {
        clearTimeout(timer);
        isScreenFocusedRef.current = false;
        stopSpeaking();
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch {}
        }
        setIsListening(false);
      };
    }, [stopSpeaking, greetingMessage, speakText])
  );

  useEffect(() => {
    try {
      const model = getGeminiModel(userName);
      chatSessionRef.current = model.startChat({
        history: [
          { role: 'user', parts: [{ text: 'Hola' }] },
          { role: 'model', parts: [{ text: greetingMessage }] }
        ]
      });
    } catch (e) {
      console.warn('[Error iniciando chat]:', e);
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).speechSynthesis) {
      try {
        (window as any).speechSynthesis.getVoices();
        const onVoicesChanged = () => {
          try { (window as any).speechSynthesis.getVoices(); } catch {}
        };
        (window as any).speechSynthesis.onvoiceschanged = onVoicesChanged;
      } catch {}
    }

    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [userName, greetingMessage, stopSpeaking]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [messages, loading]);

  const messageCounterRef = useRef(1);

  const handleSend = async (textoPersonalizado?: string) => {
    const textoAEnviar = (textoPersonalizado || input).trim();
    if (!textoAEnviar || loading) return;

    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    }

    setInput('');
    transcriptRef.current = '';
    const userMsgId = `msg-${messageCounterRef.current++}`;
    const botMsgId = `msg-${messageCounterRef.current++}`;

    // Respuesta visual instantánea (0ms percibido): insertamos el mensaje del usuario y la burbuja del bot
    setMessages(prev => [
      ...prev, 
      { id: userMsgId, text: textoAEnviar, sender: 'user' },
      { id: botMsgId, text: '', sender: 'bot', isStreaming: true }
    ]);
    setLoading(true);

    try {
      if (!chatSessionRef.current) {
        chatSessionRef.current = getGeminiModel(userName).startChat();
      }

      const response = await sendMessageStreamWithRAG(
        chatSessionRef.current,
        textoAEnviar,
        (_chunk, accumulated) => {
          setMessages(prev =>
            prev.map(m => m.id === botMsgId ? { ...m, text: accumulated, isStreaming: true } : m)
          );
        },
        () => {
          // Callback al recibir el primer token del stream
        },
        userName
      );

      // Consolidar estado final del mensaje con streaming completado
      setMessages(prev =>
        prev.map(m => m.id === botMsgId ? { ...m, text: response.text, isStreaming: false } : m)
      );

      if (response.text.includes('Línea 113') || response.text.includes('Línea 100')) {
        registrarAlertaSeguridad(user?.salon ?? null).catch(() => {});
      }
      if (user) {
        procesarAccion({ tipo: 'asistente' }).catch(() => {});
      }
      // Hablar automáticamente la respuesta en voz alta si la voz está activada
      if (vozActivada && isScreenFocusedRef.current) {
        speakText(response.text);
      }
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === botMsgId
            ? { 
                ...m, 
                text: 'Hubo una dificultad para responder en este momento. Intenta formular tu consulta de nuevo.', 
                isStreaming: false 
              }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleListening = () => {
    if (Platform.OS === 'web') {
      const SpeechRec = (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
      if (!SpeechRec) {
        Alert.alert(
          'Reconocimiento de voz',
          'Tu navegador no tiene soporte directo para dictado por voz. Puedes escribir tu consulta en el campo de texto.'
        );
        return;
      }

      if (isListening) {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch {}
        }
        setIsListening(false);
        const recorded = transcriptRef.current.trim() || input.trim();
        if (recorded) {
          handleSend(recorded);
        }
        return;
      }

      try {
        const rec = new SpeechRec();
        rec.lang = 'es-PE';
        rec.continuous = false;
        rec.interimResults = true;

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => (result as any)[0].transcript)
            .join('');
          setInput(transcript);
          transcriptRef.current = transcript;
        };

        rec.onerror = (event: any) => {
          console.warn('[Speech Recognition Error]:', event?.error || event);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
          const recorded = transcriptRef.current.trim();
          if (recorded) {
            handleSend(recorded);
          }
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.warn('[Speech Recognition Start Error]:', err);
        setIsListening(false);
      }
    } else {
      Alert.alert(
        'Dictado por voz',
        'En dispositivos móviles puedes presionar el ícono de micrófono de tu teclado para dictar tu consulta con total precisión.'
      );
    }
  };

  const renderBubble = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    const esCrisis = item.text.includes('Línea 113') || item.text.includes('Línea 100');
    const estaEsperandoPrimerToken = !isUser && item.isStreaming && !item.text;

    return (
      <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowBot]}>
        {!isUser && !item.isStreaming && !!item.text && (
          <TouchableOpacity 
            onPress={() => speakText(item.text)} 
            style={[styles.audioIconBtn, { backgroundColor: `${tema.primario}15` }]}
            accessibilityRole="button"
            accessibilityLabel="Escuchar mensaje en voz alta"
          >
            <Ionicons name="volume-medium-outline" size={18} color={tema.primario} />
          </TouchableOpacity>
        )}

        <View style={[
          styles.bubble,
          isUser ? { backgroundColor: tema.primario } : { backgroundColor: tema.superficie, borderColor: tema.borde, borderWidth: 1 }
        ]}>
          {isUser ? (
            <Text style={[styles.userText, { color: '#FFFFFF' }]}>{item.text}</Text>
          ) : estaEsperandoPrimerToken ? (
            <IndicadorPrimerToken 
              colorPrimario={tema.primario} 
              colorTextoSecundario={tema.textoSecundario} 
            />
          ) : (
            <>
              <FormattedBotMessage content={item.text} />
              
              {item.isStreaming && (
                <View style={styles.streamingLiveWrap}>
                  <View style={[styles.streamingDotLive, { backgroundColor: tema.primario }]} />
                  <Text style={[styles.streamingLiveTexto, { color: tema.textoSecundario }]}>
                    Escribiendo...
                  </Text>
                </View>
              )}

              {esCrisis && (
                <View style={styles.crisisButtons}>
                  <Boton
                    titulo="Llamar a Línea 113 (Salud Mental)"
                    variante="peligro"
                    onPress={() => Linking.openURL('tel:113')}
                    style={{ marginBottom: tokens.espaciado.xs }}
                  />
                  <Boton
                    titulo="Llamar a Línea 100 (Orientación y Ayuda)"
                    variante="secundario"
                    onPress={() => Linking.openURL('tel:100')}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <Pantalla style={{ backgroundColor: tema.fondo }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Cabecera */}
        <View style={[styles.header, { borderBottomColor: tema.borde }]}>
          <View style={{ flex: 1, paddingRight: tokens.espaciado.sm }}>
            <Text style={[styles.headerTitle, { color: tema.texto }]}>Tutor EduSalud</Text>
            <Text style={[styles.headerSub, { color: estaHablando ? tema.primario : tema.textoSecundario }]}>
              {estaHablando ? '🎙️ Hablando en voz alta...' : 'Orientación preventiva e información de salud para secundaria'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.espaciado.xs }}>
            {estaHablando && (
              <TouchableOpacity
                onPress={stopSpeaking}
                style={[styles.stopAudioBtn, { backgroundColor: tema.error }]}
                accessibilityRole="button"
                accessibilityLabel="Detener voz"
              >
                <Ionicons name="stop" size={13} color="#FFFFFF" />
                <Text style={styles.stopAudioText}>Detener</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                if (estaHablando) stopSpeaking();
                setVozActivada(!vozActivada);
              }}
              style={[
                styles.toggleVozBtn,
                { 
                  backgroundColor: vozActivada ? `${tema.primario}20` : tema.superficie, 
                  borderColor: vozActivada ? tema.primario : tema.borde 
                }
              ]}
              accessibilityRole="button"
              accessibilityLabel={vozActivada ? "Desactivar voz automática" : "Activar voz automática"}
            >
              <Ionicons 
                name={vozActivada ? "volume-high" : "volume-mute-outline"} 
                size={18} 
                color={vozActivada ? tema.primario : tema.textoSecundario} 
              />
            </TouchableOpacity>
            <Insignia texto="Educativo" variante="primario" />
          </View>
        </View>

        {/* Lista de Mensajes */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderBubble}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          ListFooterComponent={null}
        />

        {/* Sugerencias Rápidas */}
        {messages.length <= 3 && (
          <View style={styles.sugerenciasWrap}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.sugerenciasScroll}
            >
              {SUGERENCIAS_RAPIDAS.map((sug, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.sugerenciaChip, { backgroundColor: tema.superficie, borderColor: tema.borde }]}
                  onPress={() => handleSend(sug)}
                  accessibilityRole="button"
                  accessibilityLabel={`Enviar sugerencia: ${sug}`}
                >
                  <Text style={[styles.sugerenciaTexto, { color: tema.primario }]}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Indicador de escucha por voz */}
        {isListening && (
          <View style={[styles.listeningBadge, { backgroundColor: `${tema.primario}15`, borderColor: tema.primario }]}>
            <View style={[styles.recordingPulse, { backgroundColor: tema.error }]} />
            <Text style={[styles.listeningText, { color: tema.primario }]}>
              Escuchando tu voz... Habla con naturalidad
            </Text>
          </View>
        )}

        {/* Barra de Entrada de Texto */}
        <View style={[styles.inputBar, { backgroundColor: tema.superficie, borderTopColor: tema.borde }]}>
          <TextInput
            style={[
              styles.textInput, 
              { 
                backgroundColor: tema.fondo, 
                color: tema.texto, 
                borderColor: tema.borde 
              }
            ]}
            placeholder="Pregunta sobre diabetes, nutrición, hábitos..."
            placeholderTextColor={tema.textoSecundario}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
            editable={!loading}
            maxLength={1000}
            accessibilityLabel="Campo para escribir tu consulta"
          />

          {/* Botón de Dictado por Voz */}
          <TouchableOpacity
            style={[
              styles.micBtn, 
              { 
                backgroundColor: isListening ? tema.error : `${tema.primario}15`,
              }
            ]}
            onPress={toggleListening}
            accessibilityRole="button"
            accessibilityLabel={isListening ? "Detener dictado por voz" : "Dictar mensaje por voz"}
          >
            <Ionicons 
              name={isListening ? "mic" : "mic-outline"} 
              size={22} 
              color={isListening ? "#FFFFFF" : tema.primario} 
            />
          </TouchableOpacity>

          {/* Botón de Envío */}
          <TouchableOpacity
            style={[
              styles.enviarBtn, 
              { 
                backgroundColor: input.trim() && !loading ? tema.primario : tema.borde,
                opacity: input.trim() && !loading ? 1 : 0.6 
              }
            ]}
            onPress={() => handleSend()}
            disabled={!input.trim() || loading}
            accessibilityRole="button"
            accessibilityLabel="Enviar consulta"
          >
            <Ionicons 
              name="send" 
              size={18} 
              color={input.trim() && !loading ? '#FFFFFF' : tema.textoSecundario} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.espaciado.lg,
    paddingVertical: tokens.espaciado.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.subtitulo,
  },
  headerSub: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
  },
  chatList: {
    padding: tokens.espaciado.lg,
    paddingBottom: 20,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: tokens.espaciado.md,
    alignItems: 'flex-end',
    gap: tokens.espaciado.xs,
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleRowBot: {
    justifyContent: 'flex-start',
  },
  audioIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '82%',
    padding: tokens.espaciado.md,
    borderRadius: tokens.radios.lg,
  },
  userText: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    lineHeight: 22,
  },
  crisisButtons: {
    marginTop: tokens.espaciado.md,
  },
  primerTokenWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.espaciado.sm,
    paddingVertical: tokens.espaciado.xs,
    paddingHorizontal: tokens.espaciado.xs,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  primerTokenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  primerTokenTexto: {
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
  streamingLiveWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.espaciado.xs,
    marginTop: tokens.espaciado.xs + 2,
    alignSelf: 'flex-start',
  },
  streamingDotLive: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  streamingLiveTexto: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
    fontStyle: 'italic',
  },
  sugerenciasWrap: {
    paddingVertical: tokens.espaciado.xs,
  },
  sugerenciasScroll: {
    paddingHorizontal: tokens.espaciado.lg,
    gap: tokens.espaciado.xs,
  },
  sugerenciaChip: {
    paddingHorizontal: tokens.espaciado.md,
    paddingVertical: tokens.espaciado.xs + 2,
    borderRadius: tokens.radios.redondo,
    borderWidth: 1,
  },
  sugerenciaTexto: {
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.espaciado.md,
    borderTopWidth: 1,
    gap: tokens.espaciado.sm,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.espaciado.md,
    paddingVertical: tokens.espaciado.xs,
    marginHorizontal: tokens.espaciado.md,
    marginBottom: tokens.espaciado.xs,
    borderRadius: tokens.radios.redondo,
    borderWidth: 1,
  },
  recordingPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: tokens.espaciado.sm,
  },
  listeningText: {
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: tokens.radios.md,
    borderWidth: 1,
    paddingHorizontal: tokens.espaciado.md,
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
  },
  enviarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleVozBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stopAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.espaciado.sm,
    paddingVertical: tokens.espaciado.xs,
    borderRadius: tokens.radios.redondo,
    gap: 4,
  },
  stopAudioText: {
    color: '#FFFFFF',
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.mini,
  },
});
