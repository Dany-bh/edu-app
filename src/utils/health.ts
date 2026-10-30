/**
 * Funciones puras para cálculo y evaluación de salud (IMC).
 * Referencia OMS: peso (kg) / talla (m)^2
 */

export function calcularIMC(pesoKg: number, tallaM: number): number {
  if (pesoKg <= 0 || tallaM <= 0) {
    throw new Error('El peso y la talla deben ser valores positivos mayores a cero.');
  }
  const imc = pesoKg / (tallaM * tallaM);
  return Math.round(imc * 10) / 10;
}

export function clasificarIMC(imc: number): string {
  if (imc < 18.5) return 'Bajo peso';
  if (imc < 25.0) return 'Peso normal';
  if (imc < 30.0) return 'Sobrepeso';
  return 'Obesidad';
}
