import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { useTema } from '../../hooks/useTema';
import { tokens } from '../../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

interface EstadoVacioProps extends ViewProps {
  titulo: string;
  descripcion?: string;
  icono?: keyof typeof Ionicons.glyphMap;
  accion?: React.ReactNode;
}

export function EstadoVacio({ titulo, descripcion, icono = 'folder-open-outline', accion, style, ...props }: EstadoVacioProps) {
  const { tema } = useTema();

  return (
    <View style={[styles.contenedor, style]} {...props}>
      <View style={[styles.iconoCaja, { backgroundColor: tema.borde }]}>
        <Ionicons name={icono} size={32} color={tema.textoSecundario} />
      </View>
      <Text style={[styles.titulo, { color: tema.texto }]}>{titulo}</Text>
      {descripcion ? (
        <Text style={[styles.descripcion, { color: tema.textoSecundario }]}>{descripcion}</Text>
      ) : null}
      {accion ? <View style={styles.accionCaja}>{accion}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    padding: tokens.espaciado.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoCaja: {
    width: 64,
    height: 64,
    borderRadius: tokens.radios.redondo,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.espaciado.md,
  },
  titulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.subtitulo,
    marginBottom: tokens.espaciado.xs,
    textAlign: 'center',
  },
  descripcion: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    textAlign: 'center',
    marginBottom: tokens.espaciado.lg,
  },
  accionCaja: {
    marginTop: tokens.espaciado.sm,
  }
});
