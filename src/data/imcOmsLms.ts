export type Sexo = 'masculino' | 'femenino';

export interface LmsValue {
  l: number; // Lambda (asimetría)
  m: number; // Mu (mediana)
  s: number; // Sigma (coeficiente de variación)
}

/**
 * Tabla de referencia de la OMS 2007 (IMC para la edad, 5 a 19 años).
 * TODO: Completar la tabla con los valores oficiales descargados de la OMS para todas las edades (meses).
 * Actualmente contiene datos referenciales / de prueba para algunas edades (ej. 16 y 17 años).
 */
export const imcOmsLms: Record<Sexo, Record<number, LmsValue>> = {
  masculino: {
    // Valores de ejemplo basados en la referencia de la OMS para pruebas
    192: { l: -1.5977, m: 19.9231, s: 0.14449 }, // 16 años (16 * 12)
    204: { l: -1.6111, m: 20.4079, s: 0.14652 }, // 17 años
  },
  femenino: {
    // Valores de ejemplo basados en la referencia de la OMS para pruebas
    192: { l: -1.1643, m: 20.5898, s: 0.14246 }, // 16 años
    204: { l: -1.1555, m: 20.8932, s: 0.14515 }, // 17 años
  }
};
