// src/services/seguridad.ts

/**
 * Normaliza el texto removiendo tildes, signos de puntuación comunes y pasando a minúsculas
 * para facilitar la detección de frases clave.
 */
const normalizar = (texto: string): string => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,;!?¿¡]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Detecta si el texto indica un riesgo inminente (autolesión, suicidio, violencia, TCA grave).
 * Ignora falsos positivos comunes.
 */
export const detectarRiesgo = (texto: string): boolean => {
  const norm = normalizar(texto);

  // 1. Descartar falsos positivos primero (frases hechas)
  const falsosPositivos = [
    'me muero de risa', 'mato el tiempo', 'me muero de hambre', 'me muero de sueño',
    'me muero de frio', 'me muero de calor', 'estoy muerta de cansancio',
    'matar el rato', 'matando el tiempo', 'morir de amor', 'morir de aburrimiento',
    'matar de risa', 'morir de risa'
  ];
  for (const fp of falsosPositivos) {
    if (norm.includes(fp)) {
      // Reemplazamos el falso positivo para que no active las reglas verdaderas
      texto = texto.replace(new RegExp(fp, 'gi'), '');
    }
  }
  const normFinal = normalizar(texto); // renormalizar sin el falso positivo

  // 2. Patrones de riesgo grave
  const patrones = [
    // Ideación suicida / Autolesión
    /quiero (morir|matarme|desaparecer|dormir para siempre)/,
    /no quiero vivir/,
    /me voy a matar/,
    /como .*?(suicidar|matarme|cortarme)/,
    /(ya )?no aguanto mas (mi|esta) vida/,
    /mejor estaria muert[oa]/,
    /cortar.*?(las venas)/,
    /hacerme dano/,
    
    // Violencia / Abuso
    /(me|mi) (pegan?|golpean?|maltratan?|tocan? sin mi permiso|violaron?|violan?|acosan?)/,
    /tengo miedo de (ir a mi casa|mi papa|mi mama|mi padrastro|mi tio)/,
    /me estan pegando/,
    
    // TCA grave
    /quiero dejar de comer/,
    /vomitar lo que comi/,
    /como .*?vomitar/,
    /pastillas para (no comer|vomitar|bajar de peso)/,
    /me odio (por comer|mi cuerpo)/,
    /dietas extremas para/
  ];

  return patrones.some(regex => regex.test(normFinal));
};

export const MENSAJE_CRISIS = `Es muy valiente que te animes a contar esto. No estás solo/a y hay personas capacitadas que pueden escucharte y ayudarte ahora mismo. 

Te invito a que converses hoy mismo con un adulto de tu confianza o con tu tutor/a. Además, puedes comunicarte de forma gratuita y confidencial a estos números oficiales:

• **Línea 113, opción 5** (MINSA): Apoyo en salud mental y orientación psicológica.
• **Línea 100** (MIMP): Ayuda ante violencia familiar o abuso.

Hablarlo es el primer paso para sentirte mejor.`;
