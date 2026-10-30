import React, { forwardRef } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTema } from '../../hooks/useTema';
import { tokens } from '../../constants/theme';

interface CampoTextoProps extends TextInputProps {
  etiqueta?: string;
  error?: string;
  onKeyDown?: (e: any) => void;
}

export const CampoTexto = forwardRef<TextInput, CampoTextoProps>(
  ({ etiqueta, error, style, ...props }, ref) => {
    const { tema } = useTema();

    return (
      <View style={styles.contenedor}>
        {etiqueta ? (
          <Text style={[styles.etiqueta, { color: tema.textoSecundario }]}>{etiqueta}</Text>
        ) : null}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              backgroundColor: tema.superficie,
              borderColor: error ? tema.error : tema.borde,
              color: tema.texto,
            },
            style
          ]}
          placeholderTextColor={tema.textoSecundario}
          {...props}
        />
        {error ? (
          <Text style={[styles.error, { color: tema.error }]}>{error}</Text>
        ) : null}
      </View>
    );
  }
);

CampoTexto.displayName = 'CampoTexto';

const styles = StyleSheet.create({
  contenedor: {
    width: '100%',
    marginBottom: tokens.espaciado.md,
  },
  etiqueta: {
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    marginBottom: tokens.espaciado.xs,
  },
  input: {
    height: 48,
    borderRadius: tokens.radios.md,
    borderWidth: 1,
    paddingHorizontal: tokens.espaciado.md,
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
  },
  error: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
    marginTop: tokens.espaciado.xs,
  }
});
