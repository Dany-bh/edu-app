import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTema } from '../../hooks/useTema';
import { tokens } from '../../constants/theme';

interface BotonProps extends TouchableOpacityProps {
  titulo: string;
  variante?: 'principal' | 'secundario' | 'fantasma' | 'peligro';
  cargando?: boolean;
}

export function Boton({ titulo, variante = 'principal', cargando = false, style, onPress, disabled, ...props }: BotonProps) {
  const { tema } = useTema();

  const handlePress = (e: any) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (onPress) onPress(e);
  };

  const getBackgroundColor = () => {
    if (variante === 'principal') return tema.primario;
    if (variante === 'secundario') return tema.fondo;
    if (variante === 'peligro') return tema.error;
    return 'transparent'; // fantasma
  };

  const getTextColor = () => {
    if (variante === 'principal' || variante === 'peligro') return '#FFFFFF';
    return tema.primario;
  };

  const getBorderColor = () => {
    if (variante === 'secundario') return tema.primario;
    return 'transparent';
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: disabled || cargando }}
      activeOpacity={0.7}
      disabled={disabled || cargando}
      onPress={handlePress}
      style={[
        styles.boton,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variante === 'secundario' ? 1 : 0,
          opacity: disabled ? 0.6 : 1,
        },
        style
      ]}
      {...props}
    >
      {cargando ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.texto, { color: getTextColor() }]}>{titulo}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  boton: {
    minHeight: 48,
    minWidth: 48,
    borderRadius: tokens.radios.md,
    paddingVertical: tokens.espaciado.md,
    paddingHorizontal: tokens.espaciado.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  texto: {
    fontFamily: tokens.tipografia.familias.subtitulo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
  }
});
