const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const ROOT = path.join(__dirname, '..');

// Lectura de API key desde .env
function getApiKey() {
  try {
    const envPath = path.join(ROOT, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(/EXPO_PUBLIC_GEMINI_API_KEY=(.+)/);
      if (match) return match[1].trim();
    }
  } catch (_) {}
  return process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
}

// Extracción de códigos clínicos relevantes (CIE-10, HIS, UPS)
function extractCodes(text) {
  const codes = new Set();
  // Códigos HIS / CPT (ej. Z003, 99384, C8002, 96150.01)
  const hisMatches = text.match(/\b([Zz]\d{3}|[Cc]\d{4}|\d{5}(?:\.\d{1,2})?|[Ee]\d{2,3}|[Ii]\d{2}|[Jj]\d{2}|[Dd]\d{2,3}|[Ff]\d{2}|[Ll]\d{2})\b/g);
  if (hisMatches) hisMatches.forEach(c => codes.add(c.toUpperCase()));
  // UPS
  if (text.includes('302304')) codes.add('UPS 302304');
  return Array.from(codes);
}

// Extracción de palabras clave médicas
function extractKeywords(text) {
  const stopWords = new Set([
    'para', 'como', 'este', 'esta', 'estos', 'estas', 'entre', 'desde', 'hacia',
    'sobre', 'segun', 'donde', 'cuando', 'quien', 'porque', 'todos', 'todas',
    'cada', 'cual', 'cuales', 'tiene', 'tienen', 'puede', 'pueden', 'debe',
    'deben', 'hacer', 'estar', 'salud', 'adolescente', 'adolescentes', 'minsa'
  ]);
  
  const words = text
    .toLowerCase()
    .replace(/[^\wáéíóúüñ\s]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));
    
  // Frecuencia
  const freq = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  
  return Object.keys(freq)
    .sort((a, b) => freq[b] - freq[a])
    .slice(0, 15);
}

// Fragmentación con solapamiento (Chunking con Overlap)
function chunkText(text, maxChars = 1200, overlap = 200) {
  if (text.length <= maxChars) return [text.trim()];
  
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + maxChars;
    if (end < text.length) {
      // Intentar cortar en punto o salto de línea
      const nextBreak = text.lastIndexOf('\n', end);
      const nextPeriod = text.lastIndexOf('. ', end);
      const breakPoint = Math.max(nextBreak, nextPeriod);
      if (breakPoint > start + maxChars * 0.5) {
        end = breakPoint + 1;
      }
    } else {
      end = text.length;
    }
    
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) {
      chunks.push(chunk);
    }
    
    start = end - overlap;
    if (start >= text.length - overlap) break;
  }
  
  return chunks;
}

async function processPdf(fileName, sourceLabel, defaultCategory) {
  const filePath = path.join(ROOT, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`Archivo no encontrado: ${filePath}`);
    return [];
  }

  console.log(`\n📄 Procesando: ${fileName}...`);
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse(new Uint8Array(buffer));
  await parser.load();
  const res = await parser.getText();
  
  const chunks = [];
  let chunkIdx = 0;

  for (let pageNum = 1; pageNum <= res.pages.length; pageNum++) {
    const pageObj = res.pages[pageNum - 1];
    if (!pageObj || !pageObj.text) continue;
    
    // Limpieza de encabezados repetitivos
    const rawText = pageObj.text
      .replace(/Manual de Registro y Codiﬁcación de la Atención en la Consulta Externa/g, '')
      .replace(/Sistema de Información HIS/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    if (rawText.length < 80) continue; // Saltar portadas o páginas vacías

    const pageChunks = chunkText(rawText, 1200, 200);
    
    for (let subIdx = 0; subIdx < pageChunks.length; subIdx++) {
      const textChunk = pageChunks[subIdx];
      chunkIdx++;
      
      chunks.push({
        id: `${fileName.replace('.pdf', '')}_p${pageNum}_c${subIdx + 1}`,
        source: sourceLabel,
        category: defaultCategory,
        page: pageNum,
        codes: extractCodes(textChunk),
        keywords: extractKeywords(textChunk),
        content: textChunk,
      });
    }
  }

  console.log(`   ✅ Extraídos ${chunks.length} fragmentos de ${res.pages.length} páginas.`);
  return chunks;
}

// Ingesta de constantes de enfermedades
function processEnfermedades() {
  console.log('\n🩺 Procesando catálogo de enfermedades estructurado...');
  const filePath = path.join(ROOT, 'src/constants/enfermedades.ts');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  // Extraer información clave con Regex seguro
  const chunks = [];
  const diseaseRegex = /id:\s*'([^']+)',\s*nombre:\s*'([^']+)',\s*categoria:\s*'([^']+)',[\s\S]*?queEs:\s*'([^']+)',[\s\S]*?causas:\s*\[([\s\S]*?)\],[\s\S]*?sintomas:\s*\[([\s\S]*?)\],[\s\S]*?prevencion:\s*\[([\s\S]*?)\],[\s\S]*?cuandoConsultar:\s*'([^']+)'/g;
  
  let match;
  while ((match = diseaseRegex.exec(fileContent)) !== null) {
    const [_, id, nombre, categoria, queEs, causasRaw, sintomasRaw, prevencionRaw, cuandoConsultar] = match;
    const causas = causasRaw.replace(/'/g, '').split(',').map(s => s.trim()).filter(Boolean);
    const sintomas = sintomasRaw.replace(/'/g, '').split(',').map(s => s.trim()).filter(Boolean);
    const prevencion = prevencionRaw.replace(/'/g, '').split(',').map(s => s.trim()).filter(Boolean);

    const fullContent = [
      `Enfermedad: ${nombre} (${categoria})`,
      `Definición clínica: ${queEs}`,
      `Causas principales: ${causas.join('; ')}`,
      `Síntomas de alarma: ${sintomas.join('; ')}`,
      `Prevención y autocuidado: ${prevencion.join('; ')}`,
      `Cuándo acudir al médico (MINSA): ${cuandoConsultar}`
    ].join('\n');

    chunks.push({
      id: `enf_${id}`,
      source: 'Guía Clínica de Enfermedades - MINSA',
      category: categoria,
      page: 1,
      codes: extractCodes(fullContent),
      keywords: [nombre.toLowerCase(), categoria.toLowerCase(), ...extractKeywords(fullContent)],
      content: fullContent
    });
  }

  console.log(`   ✅ Extraídas ${chunks.length} fichas clínicas estructuradas.`);
  return chunks;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('       🧠 PIPELINE RAG: CONSTRUCTOR DE BASE VECTORIAL      ');
  console.log('═══════════════════════════════════════════════════════════');

  const chunks1 = await processPdf(
    '2020-Manual-EV-Adolescente.pdf',
    'Manual de Atención Integral Adolescente (MINSA 2020)',
    'Atención Integral Adolescente'
  );

  const chunks2 = await processPdf(
    'Manual Componentes_Prevencion_No_transmisibles_2025.pdf',
    'Componente Prevención y Control Daños No Transmisibles (MINSA 2025)',
    'Enfermedades No Transmisibles'
  );

  const chunksEnf = processEnfermedades();

  const allChunks = [...chunksEnf, ...chunks1, ...chunks2];
  console.log(`\n📦 Total de fragmentos indexados: ${allChunks.length}`);

  // Guardar Base de Conocimiento estructurada
  const assetsDir = path.join(ROOT, 'src/assets');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  const kbOutput = path.join(assetsDir, 'knowledgeBase.json');
  fs.writeFileSync(kbOutput, JSON.stringify(allChunks, null, 2), 'utf-8');
  console.log(`💾 Base de conocimiento guardada en: src/assets/knowledgeBase.json (${(fs.statSync(kbOutput).size / 1024).toFixed(1)} KB)`);

  // Opcional: Generar embeddings usando Gemini Embeddings API
  const apiKey = getApiKey();
  if (apiKey) {
    console.log('\n🧬 ¿Deseas generar embeddings vectoriales con Gemini?');
    console.log('   Detectada API Key. Generando embeddings semánticos para el Vector Store...');
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

      const vectorStore = [];
      const batchSize = 10;
      
      console.log(`   Procesando ${allChunks.length} fragmentos en lotes de ${batchSize}...`);
      
      for (let i = 0; i < allChunks.length; i += batchSize) {
        const batch = allChunks.slice(i, i + batchSize);
        await Promise.all(batch.map(async (chunk) => {
          try {
            // Embeddeamos título + contenido resumido
            const textToEmbed = `${chunk.source} - ${chunk.category}\n${chunk.content}`.slice(0, 1500);
            const res = await embedModel.embedContent(textToEmbed);
            if (res && res.embedding && res.embedding.values) {
              vectorStore.push({
                id: chunk.id,
                source: chunk.source,
                category: chunk.category,
                page: chunk.page,
                codes: chunk.codes,
                values: res.embedding.values, // vector float de 3072
              });
            }
          } catch (e) {
            // Falla de cuota o rate limit
          }
        }));
        
        process.stdout.write(`\r   Progreso: ${Math.min(i + batchSize, allChunks.length)} / ${allChunks.length} fragmentos procesados`);
        // Pausa breve para respetar rate limit de API
        await new Promise(r => setTimeout(r, 600));
      }

      if (vectorStore.length > 0) {
        const vsOutput = path.join(assetsDir, 'vectorStore.json');
        fs.writeFileSync(vsOutput, JSON.stringify(vectorStore), 'utf-8');
        console.log(`\n🎉 Vector Store generado exitosamente: src/assets/vectorStore.json (${(fs.statSync(vsOutput).size / 1024 / 1024).toFixed(2)} MB)`);
      }
    } catch (err) {
      console.warn('\n⚠️ Error generando embeddings con API, la app utilizará el motor de búsqueda híbrida BM25:', err.message);
    }
  }

  console.log('\n✨ Pipeline RAG finalizado con éxito.\n');
}

main().catch(console.error);
