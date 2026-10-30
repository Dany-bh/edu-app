import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { useTema } from '../../hooks/useTema';
import { tokens } from '../../constants/theme';

interface InsigniaProps extends ViewProps {
  texto: string;
  variante?: 'primario' | 'exito' | 'error' | 'energia' | 'logro' | 'neutro';
}

export function Insignia({ texto, variante = 'primario', style, ...props }: InsigniaProps) {
  const { tema } = useTema();

  const getColor = () => {
    switch (variante) {
      case 'exito': return tema.exito;
      case 'error': return tema.error;
      case 'energia': return tema.energia;
      case 'logro': return tema.logro;
      case 'neutro': return tema.textoSecundario;
      default: return tema.primario;
    }
  };

  const baseColor = getColor();

  return (
    <View style={[styles.contenedor, { backgroundColor: `${baseColor}15`, borderColor: `${baseColor}30` }, style]} {...props}>
      <Text style={[styles.texto, { color: baseColor }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    paddingHorizontal: tokens.espaciado.sm,
    paddingVertical: tokens.espaciado.xs,
    borderRadius: tokens.radios.redondo,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  texto: {
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.mini,
  }
});
