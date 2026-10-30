// src/services/webSearch.ts
/**
 * Servicio de Búsqueda Web en Tiempo Real (Live Internet Search)
 * Compatible con Expo Web y React Native (Mobile) sin límites de cuota ni CORS.
 */

export interface WebSearchResult {
  title: string;
  snippet: string;
  sourceUrl: string;
}

/**
 * Realiza una búsqueda web en vivo y retorna los fragmentos más relevantes de la web
 */
export async function searchLiveWeb(query: string, maxResults: number = 3): Promise<WebSearchResult[]> {
  try {
    if (!query || !query.trim()) return [];

    // Limpieza de palabras de relleno para maximizar la coincidencia en el buscador
    const cleaned = query
      .replace(/[¿?¡!]/g, '')
      .replace(/^(dime|cuéntame|que es|quién es|quien es|donde esta|dónde está|como funciona|cómo funciona|cuál es|cual es)\s+/i, '')
      .trim();

    if (cleaned.length < 2) return [];

    // Búsqueda en vivo con origin=* para compatibilidad universal (Browser Web + React Native)
    const url = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      cleaned
    )}&format=json&utf8=1&origin=*`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 segundos de timeout máximo

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    const hits = data?.query?.search || [];

    return hits.slice(0, maxResults).map((item: any) => ({
      title: item.title,
      snippet: item.snippet
        .replace(/<[^>]+>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .trim(),
      sourceUrl: `https://es.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
    }));
  } catch (err: any) {
    console.warn('[searchLiveWeb warn]:', err?.message || err);
    return [];
  }
}
