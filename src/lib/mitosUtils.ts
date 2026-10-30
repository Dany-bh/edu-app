// src/lib/mitosUtils.ts

export interface ResultadoEvaluacionMito {
  acierto: boolean;
  puntos: number;
  mensajeFeedback: string;
}

export interface ResumenFinalMitos {
  porcentaje: number;
  aciertos: number;
  total: number;
  puntosTotales: number;
  rango: string;
  mensajeFinal: string;
}

/**
 * Evalúa la respuesta de un estudiante sobre si una afirmación es Mito o Realidad.
 * @param seleccionEstudiante true si el estudiante marcó 'Realidad', false si marcó 'Mito'
 * @param esRealidad true si la afirmación es científicamente real, false si es un mito
 */
export function evaluarRespuestaMito(
  seleccionEstudiante: boolean,
  esRealidad: boolean
): ResultadoEvaluacionMito {
  const acierto = seleccionEstudiante === esRealidad;
  const puntos = acierto ? 20 : 5; // Puntos de estímulo por participar

  let mensajeFeedback = '';
  if (acierto) {
    mensajeFeedback = esRealidad
      ? '¡Correcto! Es una realidad comprobada por la ciencia médica.'
      : '¡Excelente! Acertaste: es un mito muy común pero científicamente falso.';
  } else {
    mensajeFeedback = esRealidad
      ? '¡Ojo! En verdad es una REALIDAD respaldada por guías médicas.'
      : '¡Cuidado! En realidad es un MITO; la evidencia médica demuestra lo contrario.';
  }

  return {
    acierto,
    puntos,
    mensajeFeedback
  };
}

/**
 * Calcula el resumen de rendimiento y el rango honorífico obtenido por el estudiante.
 */
export function calcularResumenMitos(aciertos: number, total: number): ResumenFinalMitos {
  const totalValido = Math.max(1, total);
  const porcentaje = Math.round((Math.max(0, aciertos) / totalValido) * 100);
  const puntosTotales = (aciertos * 20) + ((total - aciertos) * 5);

  let rango = 'Explorador Curioso';
  let mensajeFinal = '¡Buen inicio! Sigue repasando las guías para fortalecer tus conocimientos.';

  if (porcentaje >= 90) {
    rango = 'Maestro Desmitificador de ENT';
    mensajeFinal = '¡Sobresaliente! Tienes una base científica sólida para cuidar tu salud y la de tu familia.';
  } else if (porcentaje >= 75) {
    rango = 'Defensor de la Salud Preventiva';
    mensajeFinal = '¡Muy buen trabajo! Tienes muy claro cómo prevenir las enfermedades no transmisibles.';
  } else if (porcentaje >= 50) {
    rango = 'Promotor en Formación';
    mensajeFinal = '¡Vas por buen camino! Algunos mitos comunes todavía confunden, pero ya vas aprendiendo.';
  }

  return {
    porcentaje,
    aciertos,
    total: totalValido,
    puntosTotales,
    rango,
    mensajeFinal
  };
}
