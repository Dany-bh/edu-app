import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Rate limiting state (in memory, for demo/simple purposes)
// En producción se debe usar Redis o Upstash
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 30;
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context, userId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (message.length > 500) {
      return res.status(400).json({ error: 'Message too long' });
    }

    // Rate limiting by userId or IP
    const identifier = userId || req.headers['x-forwarded-for'] || 'anonymous';
    const now = Date.now();
    let limitData = rateLimitMap.get(identifier as string);
    if (!limitData || limitData.resetTime < now) {
      limitData = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    } else {
      limitData.count++;
    }
    rateLimitMap.set(identifier as string, limitData);

    if (limitData.count > MAX_REQUESTS) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured on server' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Prevenir el envío de datos personales
    const anonymizedMessage = message.replace(/(mi nombre es|soy) [a-zA-Z\s]+/gi, '$1 estudiante');

    const prompt = `
Contexto de la app:
${context || 'App educativa sobre enfermedades no transmisibles.'}

Rol: Eres un tutor de salud preventiva y estudio para adolescentes (16-17 años).
Reglas:
- Tono: cercano, claro y respetuoso (no infantil).
- Extensión: respuestas cortas por defecto (máximo 6-8 líneas salvo que pidan más).
- Restricciones: NUNCA diagnosticas, no recetas, no das dosis de medicamentos, no indicas dietas restrictivas, ni das cifras de calorías o pérdida de peso.
- Síntomas: ante síntomas reales descritos por el usuario, orienta a acudir siempre a su centro de salud más cercano.
- Fuera de tema (salud y estudio): ayuda brevemente si es inofensivo/inocuo o redirige con amabilidad al tema principal.
- Formato Markdown: usa encabezados (###), viñetas con **negrita** para conceptos clave, y tablas (| col1 | col2 |) si te piden comparar. NO uses asteriscos sueltos (*texto*) ni líneas separadoras (***).

Pregunta del estudiante (anónima):
${anonymizedMessage}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return res.status(200).json({ reply: responseText });
  } catch (error: any) {
    console.error('[Gemini API Error]', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
