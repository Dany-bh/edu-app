// src/lib/audioUtils.ts

/**
 * Limpia el texto para síntesis de voz (TTS / Text-to-Speech).
 * Elimina emojis (ej. 🥤, 🏃‍♂️), símbolos de formato (#, *, ", _, etc.)
 * y conserva únicamente letras, números y puntuación natural
 * para que el sintetizador de voz hable de forma fluida y natural.
 */
export function limpiarTextoParaVoz(texto: string): string {
  if (!texto) return '';

  return texto
    // 1. Eliminar URLs y enlaces Markdown [texto](url) -> texto
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    // 2. Eliminar emojis y pictogramas extendidos
    .replace(/\p{Extended_Pictographic}/gu, '')
    // 3. Eliminar modificadores de emoji, tonos de piel, selectores de variación y zero-width joiners
    .replace(/[\u{1F3FB}-\u{1F3FF}\u{FE00}-\u{FE0F}\u{200D}\u{200B}]/gu, '')
    // 4. Reemplazar líneas de ayuda para que se pronuncien claramente
    .replace(/Línea 113/gi, 'línea telefónica ciento trece')
    .replace(/Línea 100/gi, 'línea telefónica cien')
    // 5. Eliminar símbolos especiales, comillas, asteriscos, numerales y formato Markdown
    .replace(/["“”«»#*~`^=_+{}|\\/<>@]/g, ' ')
    // 6. Eliminar viñetas especiales y caracteres gráficos
    .replace(/[•●▪■◆★☆✓✔✕✖]/g, ' ')
    // 7. Limpiar espacios múltiples y saltos innecesarios
    .replace(/\s+/g, ' ')
    .trim();
}
