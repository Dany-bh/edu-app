import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BarData {
  label: string;
  value: number;
  color: string[];
}

interface Props {
  titulo: string;
  subtitulo?: string;
  datos: BarData[];
  tipo?: 'barras' | 'circular';
}

// Barra individual animada
function BarraAnimada({ item, index, maxValue }: { item: BarData; index: number; maxValue: number }) {
  const barH = useSharedValue(0);
  const opacity = useSharedValue(0);
  const targetH = (item.value / maxValue) * 120;

  useEffect(() => {
    opacity.value = withDelay(index * 120, withTiming(1, { duration: 400 }));
    barH.value = withDelay(index * 120 + 200, withSpring(targetH, { damping: 12, stiffness: 80 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    height: barH.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.barWrapper, animStyle]}>
      <LinearGradient
        colors={item.color as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
      />
    </Animated.View>
  );
}

export default function GraficoEstadistico({ titulo, subtitulo, datos, tipo = 'barras' }: Props) {
  const maxValue = Math.max(...datos.map(d => d.value));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>{titulo}</Text>
        {subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}
      </View>

      {tipo === 'barras' && (
        <View style={styles.chartArea}>
          {/* Líneas de referencia */}
          <View style={styles.gridLines}>
            {[100, 75, 50, 25].map(val => (
              <View key={val} style={styles.gridRow}>
                <Text style={styles.gridLabel}>{val}%</Text>
                <View style={styles.gridLine} />
              </View>
            ))}
          </View>

          {/* Barras */}
          <View style={styles.barsContainer}>
            {datos.map((item, index) => (
              <View key={item.label} style={styles.barColumn}>
                <View style={styles.barBase}>
                  <BarraAnimada item={item} index={index} maxValue={maxValue} />
                </View>
                <Text style={styles.barLabel} numberOfLines={2}>
                  {item.label}
                </Text>
                <Text style={styles.barValue}>{item.value}%</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    marginBottom: 16,
  },
  titulo: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitulo: {
    color: '#A0A0B0',
    fontSize: 12,
    marginTop: 4,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 160,
  },
  gridLines: {
    position: 'absolute',
    left: 36,
    right: 0,
    top: 0,
    bottom: 30,
    justifyContent: 'space-between',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    width: 24,
    textAlign: 'right',
    marginRight: 6,
  },
  gridLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 36,
    paddingBottom: 30,
    gap: 6,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barBase: {
    width: '80%',
    height: 120,
    justifyContent: 'flex-end',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  barWrapper: {
    width: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 12,
  },
  barValue: {
    color: '#00FFD1',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
});
