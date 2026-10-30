// src/components/ui/AnilloProgreso.tsx
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTema } from '../../hooks/useTema';
import { tokens } from '../../constants/theme';

interface AnilloProgresoProps {
  progreso: number; // 0 a 1
  size?: number;
  strokeWidth?: number;
  colorBase?: string;
  colorFondo?: string;
  children?: React.ReactNode;
  mostrarTextoCentro?: boolean;
  textoCentro?: string;
  subtextoCentro?: string;
}

export const AnilloProgreso: React.FC<AnilloProgresoProps> = ({
  progreso,
  size = 84,
  strokeWidth = 8,
  colorBase,
  colorFondo,
  children,
  mostrarTextoCentro = false,
  textoCentro,
  subtextoCentro,
}) => {
  const { tema } = useTema();

  const progClamp = Math.min(1, Math.max(0, Number.isFinite(progreso) ? progreso : 0));
  const radio = (size - strokeWidth) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const strokeDashoffset = circunferencia - circunferencia * progClamp;

  const colorActivo = colorBase || tema.primario;
  const colorInactivo = colorFondo || `${tema.borde}60`;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        {/* Círculo de fondo */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          stroke={colorInactivo}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Círculo de progreso */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          stroke={colorActivo}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circunferencia} ${circunferencia}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      <View style={styles.centerContent} pointerEvents="none">
        {children ? (
          children
        ) : mostrarTextoCentro ? (
          <View style={styles.textWrap}>
            <Text style={[styles.textoPrincipal, { color: tema.texto }]}>
              {textoCentro ?? `${Math.round(progClamp * 100)}%`}
            </Text>
            {subtextoCentro ? (
              <Text style={[styles.subtexto, { color: tema.textoSecundario }]}>
                {subtextoCentro}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoPrincipal: {
    fontSize: tokens.tipografia.tamanos.cuerpo,
    fontFamily: tokens.tipografia.familias.titulo,
    fontWeight: '700',
  },
  subtexto: {
    fontSize: tokens.tipografia.tamanos.etiqueta - 2,
    fontFamily: tokens.tipografia.familias.cuerpo,
  },
});
