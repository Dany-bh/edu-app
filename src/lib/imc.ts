import { LmsValue } from '../data/imcOmsLms';

export type CategoriaImc = 'Delgadez severa' | 'Delgadez' | 'Normal' | 'Sobrepeso' | 'Obesidad' | 'Sin datos';

/**
 * Calcula el Índice de Masa Corporal (IMC)
 * @param pesoKg Peso en kilogramos
 * @param tallaCm Talla en centímetros
 */
export const calcularImcValue = (pesoKg: number, tallaCm: number): number => {
  if (pesoKg <= 0 || tallaCm <= 0) return 0;
  const tallaM = tallaCm / 100;
  return pesoKg / (tallaM * tallaM);
};

/**
 * Calcula el Puntaje Z del IMC utilizando los parámetros LMS (OMS).
 * Fórmula de Cole y Green.
 */
export const calcularZScore = (imc: number, lms: LmsValue): number => {
  const { l, m, s } = lms;
  if (l === 0) {
    return Math.log(imc / m) / s;
  }
  return (Math.pow(imc / m, l) - 1) / (l * s);
};

/**
 * Obtiene la categoría de IMC según los cortes de la OMS (5 a 19 años).
 */
export const obtenerCategoriaOms = (zScore: number): CategoriaImc => {
  if (typeof zScore !== 'number' || !Number.isFinite(zScore)) return 'Sin datos';
  if (zScore < -3) return 'Delgadez severa';
  if (zScore < -2) return 'Delgadez';
  if (zScore <= 1) return 'Normal';
  if (zScore <= 2) return 'Sobrepeso';
  return 'Obesidad';
};

/**
 * Retorna el mensaje de orientación educativa según la categoría de IMC.
 * Para 'Sin datos' o valores no concluyentes, solicita revisar los datos ingresados
 * y nunca entrega una recomendación de normalidad.
 */
export const obtenerOrientacionImc = (cat: CategoriaImc): string => {
  if (cat === 'Sin datos') {
    return 'No fue posible calcular tu resultado con los datos proporcionados. Por favor revisa que el peso, la talla y la edad ingresados sean correctos.';
  }
  if (cat === 'Delgadez severa' || cat === 'Obesidad') {
    return 'Tu resultado sugiere que podría ser una excelente idea visitar el centro de salud más cercano para una evaluación completa. Recuerda: esta herramienta es solo orientativa y no diagnóstica, apóyate en tu tutor o personal de salud.';
  }
  if (cat === 'Sobrepeso' || cat === 'Delgadez') {
    return 'Mantener hábitos activos y balanceados es clave. Como esta herramienta es solo referencial, te sugerimos conversarlo con tu tutor o en tu próxima visita al centro de salud para estar al 100%.';
  }
  return '¡Tu IMC está dentro de lo esperado para tu edad! Sigue manteniendo hábitos activos. Recuerda que esta herramienta es orientativa y no reemplaza el consejo de un profesional de salud.';
};

/**
 * Comprueba técnicamente si los resultados del cálculo son aptos para persistencia
 * y gamificación: descarta la categoría 'Sin datos', exige un IMC finito estrictamente
 * positivo (> 0) y un Puntaje Z numérico finito.
 */
export const esEvaluacionValida = (cat: CategoriaImc, imc: number, zScore: number): boolean => {
  if (cat === 'Sin datos') return false;
  if (!Number.isFinite(imc) || imc <= 0) return false;
  if (!Number.isFinite(zScore)) return false;
  return true;
};
