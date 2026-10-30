import React, { useEffect } from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTema } from '../../hooks/useTema';
import { tokens } from '../../constants/theme';

interface BarraProgresoProps extends ViewProps {
  progreso: number; // 0 to 1
  colorBase?: string;
}

export function BarraProgreso({ progreso, colorBase, style, ...props }: BarraProgresoProps) {
  const { tema } = useTema();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.max(0, Math.min(1, progreso)) * 100, { duration: 500 });
  }, [progreso, width]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${width.value}%`,
    };
  });

  return (
    <View style={[styles.contenedor, { backgroundColor: tema.borde }, style]} {...props}>
      <Animated.View 
        style={[
          styles.barra, 
          { backgroundColor: colorBase || tema.primario },
          animatedStyle
        ]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    height: 8,
    width: '100%',
    borderRadius: tokens.radios.redondo,
    overflow: 'hidden',
  },
  barra: {
    height: '100%',
    borderRadius: tokens.radios.redondo,
  }
});
