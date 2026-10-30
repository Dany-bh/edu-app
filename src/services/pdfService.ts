// src/services/pdfService.ts
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { MetricasSaludSalon } from '../types';

/**
 * Servicio de Procesamiento y Exportación de Documentos (EduSalud IA)
 * 
 * Separa las etapas:
 * Selección/Carga -> Validación de Límites -> Limpieza -> Segmentación (Chunking) -> Envío Controlado a Gemini
 */

export interface DocumentChunk {
  index: number;
  content: string;
  charCount: number;
}

export interface DocumentValidationResult {
  valid: boolean;
  error?: string;
  charCount: number;
  estimatedTokens: number;
}

export const PDF_LIMITS = {
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  MAX_TOTAL_CHARS: 150000,               // ~37k tokens aprox.
  CHUNK_SIZE_CHARS: 1500,                // Tamaño por fragmento educativo
  CHUNK_OVERLAP_CHARS: 200,              // Solapamiento entre fragmentos
};

/**
 * Valida si el texto extraído de un documento cumple con los límites seguros para móviles e IA.
 */
export function validateDocumentText(rawText: string): DocumentValidationResult {
  if (!rawText || !rawText.trim()) {
    return {
      valid: false,
      error: 'El documento no contiene texto legible o está vacío.',
      charCount: 0,
      estimatedTokens: 0,
    };
  }

  const charCount = rawText.length;
  const estimatedTokens = Math.ceil(charCount / 4);

  if (charCount > PDF_LIMITS.MAX_TOTAL_CHARS) {
    return {
      valid: false,
      error: `El documento excede el límite permitido de ${PDF_LIMITS.MAX_TOTAL_CHARS} caracteres. Por favor utiliza un resumen o un capítulo específico.`,
      charCount,
      estimatedTokens,
    };
  }

  return {
    valid: true,
    charCount,
    estimatedTokens,
  };
}

/**
 * Limpia y normaliza texto de documentos médicos/educativos
 */
export function cleanDocumentText(rawText: string): string {
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')           // Reducir espacios consecutivos
    .replace(/\n{3,}/g, '\n\n')         // Máximo dos saltos de línea consecutivos
    .trim();
}

/**
 * Divide el texto de un documento en fragmentos educativos coherentes con solapamiento (Sliding Window)
 */
export function chunkDocumentText(
  text: string,
  chunkSize: number = PDF_LIMITS.CHUNK_SIZE_CHARS,
  overlap: number = PDF_LIMITS.CHUNK_OVERLAP_CHARS
): DocumentChunk[] {
  const cleaned = cleanDocumentText(text);
  if (!cleaned) return [];

  const chunks: DocumentChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < cleaned.length) {
    let endIndex = startIndex + chunkSize;

    // Intentar cortar en un salto de línea o punto para no romper frases
    if (endIndex < cleaned.length) {
      const naturalBreak = cleaned.lastIndexOf('\n', endIndex);
      if (naturalBreak > startIndex + chunkSize * 0.7) {
        endIndex = naturalBreak;
      } else {
        const sentenceBreak = cleaned.lastIndexOf('. ', endIndex);
        if (sentenceBreak > startIndex + chunkSize * 0.7) {
          endIndex = sentenceBreak + 1;
        }
      }
    }

    const chunkContent = cleaned.slice(startIndex, endIndex).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        index: chunkIndex++,
        content: chunkContent,
        charCount: chunkContent.length,
      });
    }

    startIndex = Math.max(endIndex - overlap, startIndex + 1);
  }

  return chunks;
}

/**
 * Genera y exporta el informe de impacto pedagógico en PDF con diseño profesional "Salud Viva".
 * No expone datos personales sensibles, ni chats, ni peso/talla.
 */
export async function generarInformeDocentePDF(
  metricas: MetricasSaludSalon,
  salonNombre?: string | null
): Promise<{ uri?: string; success: boolean; error?: string }> {
  try {
    const salonEtiqueta = salonNombre?.trim();
    const fecha = new Date().toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const filasComparativa = (metricas.comparativaEnfermedades || [])
      .map(
        (c) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #E3ECEA; font-weight: 500;">${c.nombre}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E3ECEA; text-align: center;">${c.promedioPre}/5</td>
          <td style="padding: 10px; border-bottom: 1px solid #E3ECEA; text-align: center;">${c.promedioPost}/5</td>
          <td style="padding: 10px; border-bottom: 1px solid #E3ECEA; text-align: center; color: #16A34A; font-weight: bold;">
            +${c.mejora} pts
          </td>
        </tr>
      `
      )
      .join('');

    const filasInactivos = metricas.alumnosInactivos.length > 0
      ? metricas.alumnosInactivos
          .map(
            (al) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #E3ECEA; font-family: monospace;">${al.alias}</td>
            <td style="padding: 8px; border-bottom: 1px solid #E3ECEA; text-align: center; color: #DC2626; font-weight: 500;">
              ${al.diasInactivo === null ? 'Sin actividad registrada' : `${al.diasInactivo} días sin actividad`}
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #E3ECEA; text-align: center;">
              ${al.ultimoAcceso ? new Date(al.ultimoAcceso).toLocaleDateString('es-PE') : 'Nunca ingresó'}
            </td>
          </tr>
        `
          )
          .join('')
      : `<tr><td colspan="3" style="padding: 12px; text-align: center; color: #4B5B59;">Todos los estudiantes registran actividad reciente esta semana.</td></tr>`;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Informe Pedagógico${salonEtiqueta ? ` - ${salonEtiqueta}` : ''}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0F1A19;
            background: #FFFFFF;
            margin: 0;
            padding: 32px;
            font-size: 13px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0F766E;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .title {
            color: #0F766E;
            font-size: 22px;
            font-weight: 800;
            margin: 0 0 4px 0;
          }
          .subtitle {
            color: #4B5B59;
            font-size: 13px;
            margin: 0;
          }
          .meta-box {
            text-align: right;
            font-size: 12px;
            color: #4B5B59;
          }
          .grid-kpi {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .kpi-card {
            background: #F7FAF9;
            border: 1px solid #E3ECEA;
            border-radius: 12px;
            padding: 14px;
          }
          .kpi-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #4B5B59;
            margin-bottom: 4px;
          }
          .kpi-val {
            font-size: 22px;
            font-weight: 700;
            color: #0F1A19;
          }
          .kpi-val.destacado {
            color: #16A34A;
          }
          .kpi-val.alerta {
            color: #DC2626;
          }
          .section-title {
            font-size: 15px;
            font-weight: 700;
            color: #0F766E;
            margin: 20px 0 10px 0;
            border-bottom: 1px solid #E3ECEA;
            padding-bottom: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background: #F7FAF9;
            color: #0F1A19;
            text-align: left;
            padding: 10px;
            font-size: 12px;
            border-bottom: 2px solid #E3ECEA;
          }
          .alerta-box {
            background: #FFFBEB;
            border: 1px solid #FDE68A;
            border-radius: 10px;
            padding: 12px;
            margin-top: 20px;
            font-size: 12px;
            color: #92400E;
          }
          .footer {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #E3ECEA;
            text-align: center;
            font-size: 11px;
            color: #4B5B59;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">Reporte de Impacto Pedagógico en Salud</h1>
            <p class="subtitle">EduSalud • Prevención de Enfermedades No Transmisibles (DNT)</p>
          </div>
          <div class="meta-box">
            ${salonEtiqueta ? `<strong>Salón / Grupo:</strong> ${salonEtiqueta}<br>` : ''}
            <strong>Fecha de emisión:</strong> ${fecha}<br>
            <strong>Programa:</strong> Educación preventiva para adolescentes
          </div>
        </div>

        <div class="grid-kpi">
          <div class="kpi-card">
            <div class="kpi-label">Total Alumnos</div>
            <div class="kpi-val">${metricas.totalAlumnos}</div>
            <span style="font-size: 11px; color: #4B5B59;">${metricas.alumnosActivosSemana} activos esta semana</span>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Mejora Pre/Post Test</div>
            <div class="kpi-val destacado">+${metricas.mejoraPromedio} pts</div>
            <span style="font-size: 11px; color: #4B5B59;">Pre: ${metricas.promedioPreTest}/5 → Post: ${metricas.promedioPostTest}/5</span>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Racha Media de Hábitos</div>
            <div class="kpi-val">${metricas.rachaMedia} días</div>
            <span style="font-size: 11px; color: #4B5B59;">Compromiso diario constante</span>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Puntaje Promedio (XP)</div>
            <div class="kpi-val">${metricas.promedioPuntos} pts</div>
            <span style="font-size: 11px; color: #4B5B59;">Por estudiante registrado</span>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Tema Prioritario a Reforzar</div>
            <div class="kpi-val" style="font-size: 15px; margin-top: 4px;">
              ${metricas.enfermedadMasErrores ? metricas.enfermedadMasErrores.nombre : 'Sin errores críticos'}
            </div>
            <span style="font-size: 11px; color: #DC2626;">Mayor tasa de fallos en quiz</span>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Alertas Preventivas Asistente</div>
            <div class="kpi-val alerta">${metricas.alertasSeguridadConteo}</div>
            <span style="font-size: 11px; color: #4B5B59;">Conteo preventivo anónimo</span>
          </div>
        </div>

        <div class="section-title">Evolución de Aprendizaje por Módulo de Salud (Pre-test vs Post-test)</div>
        <table>
          <thead>
            <tr>
              <th>Enfermedad / Módulo</th>
              <th style="text-align: center;">Promedio Pre-Test</th>
              <th style="text-align: center;">Promedio Post-Test</th>
              <th style="text-align: center;">Impacto Pedagógico</th>
            </tr>
          </thead>
          <tbody>
            ${filasComparativa}
          </tbody>
        </table>

        <div class="section-title">Estudiantes sin actividad reciente (Seguimiento Tutoría)</div>
        <table>
          <thead>
            <tr>
              <th>Identificador / Alias</th>
              <th style="text-align: center;">Estado de actividad</th>
              <th style="text-align: center;">Último Registro</th>
            </tr>
          </thead>
          <tbody>
            ${filasInactivos}
          </tbody>
        </table>

        <div class="alerta-box">
          <strong>Aviso de Privacidad Escolar:</strong> Este reporte contiene únicamente métricas pedagógicas consolidadas y agregadas con el fin de guiar las sesiones de tutoría y educación para la salud. De conformidad con las políticas de privacidad, en ningún caso se almacenan ni visualizan conversaciones privadas con el tutor de IA, ni medidas antropométricas individuales.
        </div>

        <div class="footer">
          EduSalud • Basado en lineamientos del Ministerio de Salud del Perú (MINSA) y la OMS • Generado el ${fecha}
        </div>
      </body>
      </html>
    `;

    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return { success: true };
    }

    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Informe Pedagógico${salonEtiqueta ? ` - ${salonEtiqueta}` : ''}`,
      });
    }

    return { uri, success: true };
  } catch (err: any) {
    console.error('[PDF Export Error]', err);
    return { success: false, error: err?.message || 'Error al generar PDF' };
  }
}

/**
 * Genera y exporta el informe de impacto pedagógico en formato CSV descargable.
 */
export async function generarInformeDocenteCSV(
  metricas: MetricasSaludSalon,
  salonNombre?: string | null
): Promise<{ uri?: string; contenido: string; success: boolean; error?: string }> {
  try {
    const fechaStr = new Date().toISOString().slice(0, 10);
    const salonEtiqueta = salonNombre?.trim();
    const nombreArchivoSalon = salonEtiqueta ? salonEtiqueta.replace(/[^a-zA-Z0-9]/g, '_') : 'todos';

    let csv = `REPORTE DE IMPACTO PEDAGOGICO EN SALUD - EDUSALUD\n`;
    if (salonEtiqueta) csv += `Salon / Seccion;${salonEtiqueta}\n`;
    csv += `Fecha;${fechaStr}\n`;
    csv += `Total Estudiantes;${metricas.totalAlumnos}\n`;
    csv += `Alumnos Activos Semana;${metricas.alumnosActivosSemana}\n`;
    csv += `Promedio Pre-test;${metricas.promedioPreTest}\n`;
    csv += `Promedio Post-test;${metricas.promedioPostTest}\n`;
    csv += `Mejora Neta Promedio;+${metricas.mejoraPromedio} pts\n`;
    csv += `Racha Media (dias);${metricas.rachaMedia}\n`;
    csv += `Puntaje Promedio (XP);${metricas.promedioPuntos}\n`;
    csv += `Modulo Con Mas Errores;${metricas.enfermedadMasErrores?.nombre || 'Ninguno'}\n`;
    csv += `Conteo Alertas Preventivas;${metricas.alertasSeguridadConteo}\n\n`;

    csv += `COMPARATIVA PRE-TEST VS POST-TEST POR MODULO\n`;
    csv += `Modulo;Promedio Pre;Promedio Post;Mejora\n`;
    for (const c of metricas.comparativaEnfermedades || []) {
      csv += `"${c.nombre}";${c.promedioPre};${c.promedioPost};+${c.mejora}\n`;
    }

    csv += `\nESTUDIANTES SIN ACTIVIDAD RECIENTE\n`;
    csv += `Alias;Estado de actividad;Ultimo Acceso;Racha Previa;Puntos XP\n`;
    for (const inact of metricas.alumnosInactivos) {
      const estadoActividad = inact.diasInactivo === null
        ? 'Sin actividad registrada'
        : `${inact.diasInactivo} días sin actividad`;
      csv += `"${inact.alias}";"${estadoActividad}";"${inact.ultimoAcceso || 'Nunca'}";${inact.racha};${inact.puntos}\n`;
    }

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `informe_salud_${nombreArchivoSalon}_${fechaStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      return { contenido: csv, success: true };
    }

    const filePath = `${FileSystem.cacheDirectory}informe_salud_${nombreArchivoSalon}_${fechaStr}.csv`;
    await FileSystem.writeAsStringAsync(filePath, csv, { encoding: 'utf8' });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: `Exportar CSV${salonEtiqueta ? ` - ${salonEtiqueta}` : ''}`,
      });
    }

    return { uri: filePath, contenido: csv, success: true };
  } catch (err: any) {
    console.error('[CSV Export Error]', err);
    return { contenido: '', success: false, error: err?.message || 'Error al exportar CSV' };
  }
}
