import { calcularIMC, clasificarIMC } from '../health';

describe('Cálculo y clasificación de IMC (funciones puras)', () => {
  it('calcula correctamente el IMC para valores válidos', () => {
    // 70 kg y 1.75 m -> 70 / (1.75 * 1.75) = 22.857... -> 22.9
    expect(calcularIMC(70, 1.75)).toBe(22.9);
  });

  it('clasifica correctamente las categorías de IMC según OMS', () => {
    expect(clasificarIMC(18.0)).toBe('Bajo peso');
    expect(clasificarIMC(22.0)).toBe('Peso normal');
    expect(clasificarIMC(27.5)).toBe('Sobrepeso');
    expect(clasificarIMC(32.0)).toBe('Obesidad');
  });

  it('lanza un error si el peso o la talla son menores o iguales a cero', () => {
    expect(() => calcularIMC(0, 1.70)).toThrow('El peso y la talla deben ser valores positivos mayores a cero.');
    expect(() => calcularIMC(60, -1)).toThrow('El peso y la talla deben ser valores positivos mayores a cero.');
  });
});
