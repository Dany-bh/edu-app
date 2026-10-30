import React, { useEffect } from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, useReducedMotion } from 'react-native-reanimated';
import { useTema } from '../../hooks/useTema';
import { tokens } from '../../constants/theme';

interface EsqueletoProps extends ViewProps {
  width?: number | string;
  height?: number | string;
  radio?: 'sm' | 'md' | 'lg' | 'redondo';
}

export function Esqueleto({ width = '100%', height = 20, radio = 'sm', style, ...props }: EsqueletoProps) {
  const { tema } = useTema();
  const opacity = useSharedValue(0.3);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!reduceMotion) {
      opacity.value = withRepeat(
        withTiming(0.7, { duration: 800 }),
        -1,
        true
      );
    }
  }, [reduceMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          backgroundColor: tema.borde,
          borderRadius: tokens.radios[radio],
        },
        animatedStyle,
        style
      ]}
      {...props}
    />
  );
}
