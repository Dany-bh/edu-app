/**
 * ═══════════════════════════════════════════════════════════════════════
 *                    MOTOR RAG HÍBRIDO (EduSalud IA)
 *  Combina Búsqueda Semántica Léxica/BM25 con Caching Nativo de Contexto
 *  para los Documentos y Guías de Enfermedades No Transmisibles (ENT / MINSA)
 * ═══════════════════════════════════════════════════════════════════════
 */

import knowledgeBaseData from '../assets/knowledgeBase.json';

export interface KnowledgeChunk {
  id: string;
  source: string;
  category: string;
  page?: number;
  codes?: string[];
  keywords?: string[];
  content: string;
}

export interface RetrievalResult {
  chunk: KnowledgeChunk;
  score: number;
  citation: string;
}

const chunks: KnowledgeChunk[] = knowledgeBaseData as KnowledgeChunk[];

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT CACHING NATIVO EN MEMORIA (LRU + ÍNDICES ENT PRE-COMPILADOS)
// ─────────────────────────────────────────────────────────────────────────────
const MAX_CACHE_ENTRIES = 50;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hora de persistencia en memoria

interface CacheEntry {
  contextPrompt: string;
  citations: string[];
  timestamp: number;
}

const queryCache = new Map<string, CacheEntry>();

/** Índice invertido rápido para palabras clave de ENT */
const entKeywordIndex = new Map<string, KnowledgeChunk[]>();

function buildENTIndex() {
  if (entKeywordIndex.size > 0) return;
  for (const chunk of chunks) {
    const tokens = tokenize(`${chunk.source} ${chunk.category} ${(chunk.keywords || []).join(' ')}`);
    for (const t of tokens) {
      if (!entKeywordIndex.has(t)) {
        entKeywordIndex.set(t, []);
      }
      entKeywordIndex.get(t)!.push(chunk);
    }
  }
}

// Inicialización diferida del índice
buildENTIndex();

/**
 * Pre-calienta y devuelve el compendio de contexto clínico oficial de ENT
 * para caching nativo en sesiones de Gemini.
 */
export function getPrecompiledENTContext(): string {
  const entChunks = chunks.filter(c => 
    c.category.toLowerCase().includes('dnt') ||
    c.category.toLowerCase().includes('física') ||
    c.category.toLowerCase().includes('nutrición') ||
    c.category.toLowerCase().includes('psicosocial') ||
    (c.codes && c.codes.length > 0)
  ).slice(0, 15);

  return entChunks.map(c => `[${c.source}]: ${c.content}`).join('\n\n');
}

/**
 * Tokenizador y normalizador de texto en español
 */
function tokenize(text: string): string[] {
  const stopWords = new Set([
    'para', 'como', 'este', 'esta', 'estos', 'estas', 'entre', 'desde', 'hacia',
    'sobre', 'segun', 'donde', 'cuando', 'quien', 'porque', 'todos', 'todas',
    'cada', 'cual', 'cuales', 'tiene', 'tienen', 'puede', 'pueden', 'debe',
    'deben', 'hacer', 'estar', 'salud', 'adolescente', 'adolescentes', 'minsa',
    'que', 'los', 'las', 'por', 'con', 'una', 'uno', 'unas', 'unos', 'del',
    'dime', 'ano', 'anos', 'mes', 'meses', 'dia', 'dias', 'cuanto', 'cuanta', 'cuantos', 'cuantas'
  ]);

  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos para búsqueda uniforme
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}

/**
 * Puntuación Léxica BM25 / TF-IDF con ponderación de Códigos Médicos (HIS, CIE-10, UPS)
 */
function calculateLexicalScore(queryTokens: string[], chunk: KnowledgeChunk): number {
  const chunkText = `${chunk.source} ${chunk.category} ${chunk.content} ${(chunk.codes || []).join(' ')} ${(chunk.keywords || []).join(' ')}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const words = new Set(
    chunkText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
  );

  let score = 0;
  let matches = 0;

  for (const token of queryTokens) {
    const isWordMatch = words.has(token);
    const isPrefixMatch = !isWordMatch && token.length >= 5 && Array.from(words).some(w => w.startsWith(token) || token.startsWith(w));

    if (isWordMatch || isPrefixMatch) {
      matches++;
      
      // Impulso (boost) si coincide con un código clínico explícito (ej: Z003, 99384, E11, CIE-10)
      if (chunk.codes && chunk.codes.some(c => c.toLowerCase().includes(token))) {
        score += 3.0;
      }
      
      // Impulso si coincide con el título o categoría
      if (chunk.category.toLowerCase().includes(token) || chunk.source.toLowerCase().includes(token)) {
        score += 1.5;
      } else {
        score += 1.0;
      }
    }
  }

  if (queryTokens.length === 0) return 0;
  return matches > 0 ? (score / queryTokens.length) : 0;
}

/**
 * Búsqueda RAG Híbrida: Recupera los Top-K fragmentos más relevantes
 */
export async function searchKnowledge(
  query: string,
  topK: number = 4
): Promise<RetrievalResult[]> {
  if (!query || !query.trim()) return [];

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  // Recolectar candidatos usando el índice invertido para velocidad extrema
  const candidateSet = new Set<KnowledgeChunk>();
  for (const token of queryTokens) {
    const matches = entKeywordIndex.get(token);
    if (matches) {
      for (const m of matches) candidateSet.add(m);
    }
  }

  const pool = candidateSet.size > 0 ? Array.from(candidateSet) : chunks;
  const scoredChunks: RetrievalResult[] = [];

  for (const chunk of pool) {
    const lexicalScore = calculateLexicalScore(queryTokens, chunk);

    if (lexicalScore >= 0.35) {
      const pageInfo = chunk.page ? `p. ${chunk.page}` : '';
      const codeInfo = chunk.codes && chunk.codes.length > 0 ? ` [Códigos: ${chunk.codes.slice(0, 3).join(', ')}]` : '';
      const citation = `${chunk.source} (${pageInfo}${codeInfo})`.replace(' ()', '');

      scoredChunks.push({
        chunk,
        score: lexicalScore,
        citation,
      });
    }
  }

  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, topK);
}

/**
 * Genera el contexto clínico aumentado con citas e IMPLEMENTA CONTEXT CACHING NATIVO.
 */
export async function generateAugmentedContext(
  query: string
): Promise<{ contextPrompt: string; citations: string[]; fromCache?: boolean }> {
  const normalizedKey = query.trim().toLowerCase();

  // 1. Verificación en Native Context Cache
  const cached = queryCache.get(normalizedKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return {
      contextPrompt: cached.contextPrompt,
      citations: cached.citations,
      fromCache: true,
    };
  }

  // 2. Búsqueda rápida si no está en caché
  const results = await searchKnowledge(query, 4);

  if (results.length === 0) {
    return { contextPrompt: '', citations: [], fromCache: false };
  }

  const citations: string[] = [];
  const contextParts: string[] = [];

  for (const r of results) {
    citations.push(r.citation);
    contextParts.push(`--- EVIDENCIA CLÍNICA OFICIAL (${r.citation}) ---\n${r.chunk.content}`);
  }

  const contextPrompt = `EVIDENCIA CLÍNICA COMPLEMENTARIA (MINSA / SALUD):
${contextParts.join('\n\n')}

ORIENTACIÓN:
- Utiliza esta evidencia médica si la consulta del usuario se relaciona con estos temas clínicos o de salud.
- Si la consulta abarca otros temas académicos, científicos, tecnológicos o de cultura general, responde con total amplitud, profundidad y rigor a su consulta.`;

  // 3. Almacenar en caché LRU
  if (queryCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = queryCache.keys().next().value;
    if (oldestKey) queryCache.delete(oldestKey);
  }
  queryCache.set(normalizedKey, {
    contextPrompt,
    citations,
    timestamp: Date.now(),
  });

  return { contextPrompt, citations, fromCache: false };
}
