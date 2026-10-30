import React from 'react';
import { View, StyleSheet, Platform, ViewProps, SafeAreaView } from 'react-native';
import { useTema } from '../../hooks/useTema';

interface PantallaProps extends ViewProps {
  children: React.ReactNode;
  centrarWeb?: boolean;
}

export function Pantalla({ children, style, centrarWeb = true, ...props }: PantallaProps) {
  const { tema } = useTema();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tema.fondo }]}>
      <View 
        style={[
          styles.container, 
          centrarWeb && Platform.OS === 'web' && styles.webCentered,
          style
        ]}
        {...props}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    width: '100%',
  },
  webCentered: {
    maxWidth: 1100,
    alignSelf: 'center',
    marginHorizontal: 'auto',
  }
});
