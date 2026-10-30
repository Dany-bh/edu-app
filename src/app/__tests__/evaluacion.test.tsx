import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EvaluacionScreen from '../evaluacion';
import * as imcModule from '../../lib/imc';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light' },
}));

// Mocks para navegación y contexto
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: () => true,
  }),
}));

const mockProcesarAccion = jest.fn().mockResolvedValue(null);

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', nombre: 'Estudiante Prueba' },
    procesarAccion: mockProcesarAccion,
  }),
}));

describe('Prueba de integración: EvaluacionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ante "Sin datos", muestra el mensaje correctivo y no guarda en el historial ni llama a procesarAccion', async () => {
    // Espiamos obtenerCategoriaOms para simular que el cálculo retorna "Sin datos"
    const spyCategoria = jest.spyOn(imcModule, 'obtenerCategoriaOms').mockReturnValue('Sin datos');
    const spySetItem = jest.spyOn(AsyncStorage, 'setItem');

    await render(<EvaluacionScreen />);

    // Llenamos campos válidos en el formulario para pasar la validación sintáctica
    const pesoInput = screen.getByPlaceholderText('Ej. 65.5');
    const tallaInput = screen.getByPlaceholderText('Ej. 170');
    await act(async () => {
      fireEvent.changeText(pesoInput, '60');
      fireEvent.changeText(tallaInput, '165');
    });

    // Habilitamos el switch de guardado local
    const switchGuardar = screen.getByLabelText('Guardar evaluación en este dispositivo');
    await act(async () => {
      fireEvent(switchGuardar, 'valueChange', true);
    });

    // Presionamos el botón "Evaluar mi estado"
    const botonEvaluar = screen.getByRole('button', { name: 'Evaluar mi estado' });
    await act(async () => {
      fireEvent.press(botonEvaluar);
    });

    // 1. Debe mostrarse la insignia "Sin datos"
    await waitFor(() => {
      expect(screen.getByText('Sin datos')).toBeTruthy();
    });

    // 2. Debe mostrarse la orientación que pide revisar los datos y no de normalidad
    expect(
      screen.getByText('No fue posible calcular tu resultado con los datos proporcionados. Por favor revisa que el peso, la talla y la edad ingresados sean correctos.')
    ).toBeTruthy();

    // 3. Verificamos que AsyncStorage.setItem NO fue invocado para 'historial_evaluaciones'
    const llamadasHistorial = spySetItem.mock.calls.filter(call => call[0] === 'historial_evaluaciones');
    expect(llamadasHistorial.length).toBe(0);

    // 4. Verificamos que procesarAccion NO fue llamado
    expect(mockProcesarAccion).not.toHaveBeenCalled();

    spyCategoria.mockRestore();
    spySetItem.mockRestore();
  });
});
