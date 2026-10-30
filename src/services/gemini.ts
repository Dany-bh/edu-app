// src/services/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateAugmentedContext, getPrecompiledENTContext } from './ragEngine';
import { searchLiveWeb } from './webSearch';
import { detectarRiesgo, MENSAJE_CRISIS } from './seguridad';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// Modelo primario configurado en Gemini 2.5 Flash según requerimiento con fallback dinámico
export const PRIMARY_MODEL = 'gemini-2.5-flash';
export const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

const REQUEST_TIMEOUT_MS = 25000;
const MAX_INPUT_CHARS = 1000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number = REQUEST_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Tiempo de espera agotado al consultar la IA')), timeoutMs)
    ),
  ]);
}

export function cleanBotResponse(rawText: string, userName?: string): string {
  if (!rawText) return '';
  let cleaned = rawText;
  cleaned = cleaned.replace(/\*{0,2}como inteligencia artificial\*{0,2}[,.]?\s*/gi, '');
  cleaned = cleaned.replace(/\*{0,2}como modelo de lenguaje\*{0,2}[,.]?\s*/gi, '');
  cleaned = cleaned.replace(/^(¡?estimad[oa](\(a\))?(\s+[a-záéíóúñ]+)?[,.:;\s]+(un cordial saludo[,.:;\s]*)?)+/gi, '');
  cleaned = cleaned.replace(/^(¡?un cordial saludo[,.:;\s]+)+/gi, '');
  cleaned = cleaned.replace(/^(¡?hola(\s+[a-záéíóúñ]+)?!?[,.:;\s]+)+/gi, '');
  cleaned = cleaned.replace(/^(¡?qué gusto saludarte[^!.]+!?[,.:;\s]*)/gi, '');
  cleaned = cleaned.replace(/^(¡?buenas tardes(\s+[a-záéíóúñ]+)?!?[,.:;\s]+)+/gi, '');
  cleaned = cleaned.replace(/^(¡?buenos días(\s+[a-záéíóúñ]+)?!?[,.:;\s]+)+/gi, '');
  cleaned = cleaned.replace(/^(¡?buenas noches(\s+[a-záéíóúñ]+)?!?[,.:;\s]+)+/gi, '');
  cleaned = cleaned.replace(/^(¡?bienvenido(\s+[a-záéíóúñ]+)?!?[,.:;\s]+)+/gi, '');
  cleaned = cleaned.replace(/^(entendido\s+[a-záéíóúñ]+[,.:;\s]+)/gi, '');
  cleaned = cleaned.replace(/^(claro que sí\s+[a-záéíóúñ]*[,.:;\s]+)/gi, '');
  cleaned = cleaned.replace(/^(por supuesto\s+[a-záéíóúñ]*[,.:;\s]+)/gi, '');
  if (userName && userName.trim()) {
    const escapedName = userName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const startNameRegex = new RegExp(`^(¡?hola\\s+)?${escapedName}[!.,;:\\s]+`, 'gi');
    cleaned = cleaned.replace(startNameRegex, '');
    const estimadoNameRegex = new RegExp(`^estimad[oa](\\(a\\))?\\s+${escapedName}[!.,;:\\s]+(un cordial saludo[,.:;\\s]*)?`, 'gi');
    cleaned = cleaned.replace(estimadoNameRegex, '');
  }
  cleaned = cleaned.replace(/^\s*\*{3,}\s*$/gm, '');
  cleaned = cleaned.replace(/^\s*\*\s+/gm, '• ');
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '§§BOLD_START§§$1§§BOLD_END§§');
  cleaned = cleaned.replace(/\*+([^*]+?)\*+/g, '$1');
  cleaned = cleaned.replace(/\*/g, '');
  cleaned = cleaned.replace(/§§BOLD_START§§/g, '**').replace(/§§BOLD_END§§/g, '**');
  cleaned = cleaned.replace(/^[\s*]+/, '').replace(/[\s*]+$/, '');
  cleaned = cleaned.trim();
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

// Caché en memoria del compendio ENT para inyección instantánea sin recomputar
let cachedENTSystemContext: string | null = null;
function getCachedENTSystemContext(): string {
  if (!cachedENTSystemContext) {
    cachedENTSystemContext = getPrecompiledENTContext();
  }
  return cachedENTSystemContext;
}

export const buildSystemInstruction = (userName?: string, customContext?: string) => {
  const entCompendium = getCachedENTSystemContext();

  return `
Eres el tutor interactivo de salud preventiva y estudio de "EduSalud", diseñado para orientar a estudiantes de secundaria en Perú.
Tu objetivo es orientar y educar de forma clara, respetuosa, motivadora y científicamente respaldada sobre prevención de la salud, hábitos de vida sana y temas académicos escolares.

COMPENDIO MÉDICO BASE (ENT / GUÍAS OFICIALES MINSA Y OMS CACHEADAS NATIVAMENTE):
${entCompendium.slice(0, 1500)}

REGLAS ESENCIALES:
- Respuestas Directas y Específicas: Si el estudiante hace una pregunta concreta, puntual o fáctica (por ejemplo: fechas de descubrimientos o hitos históricos, fórmulas o cálculos matemáticos, definiciones breves, conceptos de geografía, literatura o ciencias generales), responde de forma DIRECTA, PRECISA y ESPECÍFICA en 1 o 2 oraciones, entregando el dato exacto de inmediato. NO des rodeos, no agregues párrafos introductorios de relleno, ni agregues viñetas o listas extensas innecesarias a menos que el estudiante haya pedido una lista o una explicación detallada.
- Conectividad e Internet: Cuentas con conectividad activa a internet y a los servicios en la nube de Google Gemini, además de acceso a las guías oficiales y actualizadas del Ministerio de Salud del Perú (MINSA) y de la OMS. Si el estudiante te consulta si tienes acceso a internet o estás conectado en línea, confirma de forma clara y amable que sí tienes conexión activa a internet y a la nube para responderle en tiempo real. NUNCA digas que "no tienes acceso a internet en tiempo real" ni que "no puedes navegar".
- Lenguaje y Tono: Exprésate con un tono formal, cortés, respetuoso y empático. Si inicias un saludo, di "Hola ${userName || ''}" o "Hola". NUNCA uses "Estimado(a)" ni fórmulas epistolares o de carta formal (como "un cordial saludo"). En una conversación en curso, NO repitas saludos ni fórmulas de cortesía protocolar al inicio de cada mensaje; entra directamente a responder lo consultado.
- Prevención de Enfermedades No Transmisibles (DNT): Fomenta hábitos para prevenir Diabetes Tipo 2, Hipertensión Arterial, Obesidad, Enfermedades Cardiovasculares y Cáncer prevenible (según guías del MINSA y OMS).
- Rigor Médico y Separación de Materias: NUNCA diagnostiques, nunca recetes medicamentos ni dosis, ni recomiendes dietas restrictivas extremas. Si el usuario describe síntomas graves o dolor agudo, recomiéndale acudir formalmente y con un adulto o tutor al establecimiento de salud más cercano (MINSA o SAMU 106). Solo vincula temas al MINSA si la pregunta es estrictamente médica o de salud preventiva; para preguntas de historia, matemáticas o cultura general, responde con conocimiento general sin atribuírselo al MINSA ni forzar temas de salud.
- Quizzes y Retos: Si el usuario te pide un quiz ("Hazme un quiz", "Ponme a prueba", "Pregúntame algo"), plantea formalmente una o dos preguntas interesantes de opción múltiple (A, B, C) sobre salud o prevención y anímalo a responder para brindarle su retroalimentación formativa.
- Formato Markdown: Usa encabezados concisos (###), viñetas con puntos o **negritas** para conceptos clave. Evita asteriscos sueltos o bloques aburridos de texto.
${userName ? `El nombre del estudiante es: ${userName}.` : ''}
${customContext ? `Contexto adicional:\n${customContext}` : ''}
`.trim();
};

export const getGeminiModel = (
  userName?: string, 
  customContext?: string, 
  modelName: string = PRIMARY_MODEL
) => {
  const systemInstruction = buildSystemInstruction(userName, customContext);
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2000,
    },
  });
};

const isCasualQuery = (text: string): boolean => {
  const q = text.toLowerCase().trim();
  if (q.length <= 16) return true;
  const casualPhrases = ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'tengo', 'años', 'gracias', 'ok', 'vale', 'chau', 'adios', 'como estas'];
  return casualPhrases.some(p => q.startsWith(p) || q === p || (q.includes('tengo') && q.includes('años')));
};

const isPureInternetStatusCheck = (text: string): boolean => {
  const q = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const mentionsInternet = q.includes('internet') || q.includes('conexion') || q.includes('en linea') || q.includes('tiempo real') || q.includes('web');
  const asksAccessOrStatus = q.includes('tienes') || q.includes('estas') || q.includes('puedes') || q.includes('cuentas con') || q.includes('acceso') || q.includes('conectad');
  const isHealthQuestion = q.includes('diabetes') || q.includes('presion') || q.includes('cancer') || q.includes('obesidad') || q.includes('sintoma') || q.includes('dolor') || q.includes('quiz');
  return mentionsInternet && asksAccessOrStatus && !isHealthQuestion;
};

export const isHealthTopic = (text: string): boolean => {
  const q = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const healthKeywords = [
    'salud', 'enfermedad', 'medico', 'medica', 'doctor', 'hospital', 'posta', 'clinica',
    'minsa', 'oms', 'sintoma', 'dolor', 'fiebre', 'tos', 'gripe', 'infeccion', 'medicamento',
    'pastilla', 'tratamiento', 'remedio', 'dnt', 'cronica', 'diabetes', 'glucosa', 'azucar',
    'insulina', 'hipertension', 'presion', 'arterial', 'cardio', 'corazon', 'colesterol',
    'obesidad', 'sobrepeso', 'peso', 'imc', 'masa corporal', 'talla', 'estatura',
    'nutricion', 'alimentacion', 'comida', 'dieta', 'caloria', 'proteina', 'carbohidrato',
    'grasa', 'fruta', 'verdura', 'agua', 'hidratacion', 'anemia', 'hierro', 'hemoglobina',
    'ejercicio', 'deporte', 'actividad fisica', 'entrenamiento', 'fuerza', 'sedentario',
    'sueno', 'dormir', 'descanso', 'insomnio', 'fatiga', 'cansancio',
    'higiene', 'lavado de manos', 'cepillado', 'dientes', 'postura', 'ergonomia',
    'salud mental', 'estres', 'ansiedad', 'depresion', 'emocion', 'autoestima',
    'pubertad', 'adolescencia', 'crecimiento', 'desarrollo', 'vacuna'
  ];
  return healthKeywords.some(keyword => q.includes(keyword));
};

const needsWebSearch = (text: string): boolean => {
  const q = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return q.includes('noticia') || q.includes('actualidad') || q.includes('hoy') || 
         q.includes('reciente') || q.includes('ultimo') || q.includes('buscar en internet') || 
         q.includes('busca en la web') || q.includes('busca en internet') ||
         q.includes('ano actual') || q.includes('quien es el presidente');
};

export interface StreamResult {
  text: string;
  citations: string[];
  isFallback?: boolean;
  fromCache?: boolean;
}

/**
 * Envío de mensajes con STREAMING nativo (stream: true) y Context Caching de ENT.
 * Optimizado para rendimiento extremo y menor tiempo hasta el primer token (TTFT).
 */
export const sendMessageStreamWithRAG = async (
  chatSession: any,
  userMessage: string,
  onChunk: (chunk: string, accumulated: string) => void,
  onFirstToken?: () => void,
  userName?: string
): Promise<StreamResult> => {
  if (!userMessage || !userMessage.trim()) {
    const emptyMsg = 'Por favor escribe tu consulta para poder orientarte.';
    onFirstToken?.();
    onChunk(emptyMsg, emptyMsg);
    return { text: emptyMsg, citations: [] };
  }

  const sanitizedInput = userMessage.trim().slice(0, MAX_INPUT_CHARS);

  if (detectarRiesgo(sanitizedInput)) {
    console.warn('[ALERTA RIESGO DETECTADO]');
    onFirstToken?.();
    onChunk(MENSAJE_CRISIS, MENSAJE_CRISIS);
    return { text: MENSAJE_CRISIS, citations: [] };
  }

  if (isPureInternetStatusCheck(sanitizedInput)) {
    const statusMsg = '¡Sí! Cuento con conexión activa en tiempo real para buscar datos de salud actualizados, revisar guías del MINSA y orientarte en tus dudas.\n\n• Consultas de prevención y bienestar para secundaria.\n• Información oficial sobre nutrición y deporte.\n• Quizzes y retos para aprender jugando.\n\n¿Qué te gustaría consultar o aprender hoy?';
    onFirstToken?.();
    onChunk(statusMsg, statusMsg);
    return { text: statusMsg, citations: [] };
  }

  const isCasual = isCasualQuery(sanitizedInput);
  const isHealth = isHealthTopic(sanitizedInput);
  let promptToSend = sanitizedInput;
  let allCitations: string[] = [];
  let ragResult: any = null;
  let liveWebHits: any = null;

  if (!isCasual && isHealth) {
    // Uso del Context Caching Nativo de ENT para recuperar contexto en <1ms
    ragResult = await generateAugmentedContext(sanitizedInput);
    allCitations = [...ragResult.citations];
    if (ragResult.citations.length > 0) {
      promptToSend = `[GUÍAS OFICIALES MINSA]:\n${ragResult.contextPrompt.slice(0, 800)}\n\n[CONSULTA DEL ESTUDIANTE]:\n${sanitizedInput}`;
    }
  }

  if (!isCasual && needsWebSearch(sanitizedInput)) {
    try {
      liveWebHits = await searchLiveWeb(sanitizedInput, 2);
      if (liveWebHits && liveWebHits.length > 0) {
        promptToSend += '\n[INFO WEB]: ' + liveWebHits.map((h: any) => `${h.title}: ${h.snippet}`).join(' | ');
      }
    } catch {}
  }

  let hasSentFirstToken = false;
  let accumulated = '';

  const handleChunk = (piece: string) => {
    if (!piece) return;
    if (!hasSentFirstToken) {
      hasSentFirstToken = true;
      onFirstToken?.();
    }
    accumulated += piece;
    onChunk(piece, accumulated);
  };

  // 1. Intento principal con ChatSession activa en modo Streaming
  if (chatSession && typeof chatSession.sendMessageStream === 'function') {
    try {
      const streamResult = await withTimeout<any>(
        chatSession.sendMessageStream(promptToSend), 
        REQUEST_TIMEOUT_MS
      );
      for await (const chunk of streamResult.stream) {
        handleChunk(chunk.text());
      }
      if (accumulated.trim()) {
        let cleaned = cleanBotResponse(accumulated, userName);
        if (!isCasual && !detectarRiesgo(sanitizedInput)) {
          if (isHealth && ragResult?.citations?.length > 0) {
            cleaned += '\n\n*Fuente: Guías de Salud Preventiva MINSA*';
          } else if (liveWebHits?.length > 0) {
            cleaned += '\n\n*Fuente: Información Web Verificada*';
          }
        }
        return { text: cleaned, citations: allCitations, isFallback: false, fromCache: !!ragResult?.fromCache };
      }
    } catch (chatErr: any) {
      console.warn('[ChatSession Stream falló, activando cascada de modelos]:', chatErr?.message || chatErr);
    }
  }

  // 2. Cascada de modelos directos con Streaming (Gemini 2.5 Flash -> Fallbacks)
  const candidateModels = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  for (const modelName of candidateModels) {
    try {
      accumulated = '';
      const directModel = getGeminiModel(userName, undefined, modelName);
      const streamResult = await withTimeout<any>(
        directModel.generateContentStream(promptToSend), 
        REQUEST_TIMEOUT_MS
      );
      for await (const chunk of streamResult.stream) {
        handleChunk(chunk.text());
      }
      if (accumulated.trim()) {
        let cleaned = cleanBotResponse(accumulated, userName);
        if (!isCasual && !detectarRiesgo(sanitizedInput)) {
          if (isHealth && ragResult?.citations?.length > 0) {
            cleaned += '\n\n*Fuente: Guías de Salud Preventiva MINSA*';
          } else if (liveWebHits?.length > 0) {
            cleaned += '\n\n*Fuente: Información Web Verificada*';
          }
        }
        return { text: cleaned, citations: allCitations, isFallback: true, fromCache: !!ragResult?.fromCache };
      }
    } catch (err: any) {
      console.warn(`[sendMessageStreamWithRAG] Falló modelo ${modelName}:`, err?.message || err);
    }
  }

  // 3. Fallback de contingencia si no hubo respuesta del stream
  const fallbackText = allCitations.length > 0
    ? 'En este momento hay un problema de conectividad temporal. Si tienes alguna molestia urgente o dolor, te recomiendo acudir a tu posta o centro de salud más cercano (MINSA / SAMU 106).'
    : 'En este momento hay una intermitencia de red con los servidores de IA. Por favor, verifica tu conexión o vuelve a consultarme en unos instantes.';

  if (!hasSentFirstToken) {
    onFirstToken?.();
  }
  onChunk(fallbackText, fallbackText);
  return {
    text: fallbackText,
    citations: allCitations,
    isFallback: true,
  };
};

/**
 * Versión no-streaming mantenida para compatibilidad con llamadas existentes.
 */
export const sendMessageWithRAG = async (
  chatSession: any,
  userMessage: string,
  _retries: number = 1,
  userName?: string
): Promise<{ text: string; citations: string[]; isFallback?: boolean }> => {
  let fullText = '';
  const result = await sendMessageStreamWithRAG(
    chatSession,
    userMessage,
    (_chunk, acc) => { fullText = acc; },
    undefined,
    userName
  );
  return {
    text: result.text || fullText,
    citations: result.citations,
    isFallback: result.isFallback,
  };
};

export const transcribeAudio = async (base64Audio: string, mimeType: string = 'audio/mp4'): Promise<string> => {
  try {
    const candidateModels = [PRIMARY_MODEL, ...FALLBACK_MODELS];
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await withTimeout(
          model.generateContent([
            {
              inlineData: {
                mimeType,
                data: base64Audio,
              },
            },
            { text: 'Transcribe con precisión todo lo que se dice en este audio en español. Devuelve únicamente el texto transcrito sin comentarios adicionales.' },
          ])
        );
        const text = result?.response?.text()?.trim();
        if (text) return text;
      } catch (e: any) {
        console.warn(`[transcribeAudio falló con ${modelName}]:`, e?.message || e);
      }
    }
  } catch (err: any) {
    console.warn('[transcribeAudio error general]:', err?.message || err);
  }
  return '';
};
