import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTema } from '../../hooks/useTema';
import { tokens } from '../../constants/theme';

interface TarjetaProps extends ViewProps {
  children: React.ReactNode;
}

export function Tarjeta({ children, style, ...props }: TarjetaProps) {
  const { tema, esOscuro } = useTema();

  return (
    <View
      style={[
        styles.tarjeta,
        {
          backgroundColor: tema.superficie,
          borderColor: tema.borde,
          ...(!esOscuro
            ? tokens.sombras.suave
            : {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.28,
                shadowRadius: 20,
                elevation: 6,
              }),
        },
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    borderRadius: tokens.radios.lg,
    padding: tokens.espaciado.lg,
    borderWidth: 1,
  }
});
