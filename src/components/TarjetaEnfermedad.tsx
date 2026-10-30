import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Enfermedad } from '../constants/enfermedades';

const { width } = Dimensions.get('window');

interface Props {
  enfermedad: Enfermedad;
  horizontal?: boolean;
}

export default function TarjetaEnfermedad({ enfermedad, horizontal = false }: Props) {
  const router = useRouter();
  const accentColor = enfermedad.colorAcento || '#00F5D4';

  const getRiskBadgeColor = (risk?: string) => {
    switch (risk) {
      case 'Alto':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.4)' };
      case 'Moderado':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.4)' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.4)' };
    }
  };

  const riskBadge = getRiskBadgeColor(enfermedad.nivelRiesgo);

  if (horizontal) {
    return (
      <TouchableOpacity 
        style={[styles.cardHorizontal, { borderColor: 'rgba(255,255,255,0.08)' }]}
        activeOpacity={0.85}
        onPress={() => router.push(`/enfermedad/${enfermedad.id}`)}
      >
        <Image source={{ uri: enfermedad.imagenUrl }} style={styles.bgImage} />
        <LinearGradient 
          colors={['rgba(7, 9, 19, 0.1)', 'rgba(7, 9, 19, 0.85)', 'rgba(7, 9, 19, 0.98)']} 
          style={styles.gradientOverlay} 
        />
        
        {/* Top Badges */}
        <View style={styles.topBadgesRow}>
          <View style={[styles.riskChip, { backgroundColor: riskBadge.bg, borderColor: riskBadge.border }]}>
            <Text style={[styles.riskChipText, { color: riskBadge.text }]}>
              {enfermedad.nivelRiesgo ? `Riesgo ${enfermedad.nivelRiesgo}` : 'Prevención'}
            </Text>
          </View>
          <View style={styles.emojiBadge}>
            <Text style={styles.emojiText}>{enfermedad.emoji}</Text>
          </View>
        </View>

        {/* Bottom Content */}
        <View style={styles.cardContentHorizontal}>
          {enfermedad.codigoCIE10 && (
            <Text style={[styles.cieText, { color: accentColor }]}>CIE-10: {enfermedad.codigoCIE10}</Text>
          )}
          <Text style={styles.cardTitleHorizontal} numberOfLines={1}>{enfermedad.nombre}</Text>
          <Text style={styles.cardPreviewHorizontal} numberOfLines={2}>{enfermedad.queEs}</Text>
          
          {enfermedad.indicadorPeru && (
            <View style={styles.peruChip}>
              <Ionicons name="stats-chart" size={12} color="#00F5D4" />
              <Text style={styles.peruChipText} numberOfLines={1}>
                {enfermedad.indicadorPeru}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/enfermedad/${enfermedad.id}`)}
    >
      <View style={[styles.cardImageContainer, { borderColor: `${accentColor}40` }]}>
        <Image source={{ uri: enfermedad.imagenUrl }} style={styles.cardImage} />
        <View style={[styles.emojiOverlay, { borderColor: `${accentColor}60` }]}>
          <Text style={{ fontSize: 14 }}>{enfermedad.emoji}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{enfermedad.nombre}</Text>
          {enfermedad.codigoCIE10 && (
            <View style={[styles.cieBadge, { backgroundColor: `${accentColor}18` }]}>
              <Text style={[styles.cieBadgeText, { color: accentColor }]}>{enfermedad.codigoCIE10}</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardPreview} numberOfLines={2}>{enfermedad.queEs}</Text>
        
        <View style={styles.cardMetaRow}>
          <View style={[styles.riskChipSmall, { backgroundColor: riskBadge.bg, borderColor: riskBadge.border }]}>
            <View style={[styles.riskDot, { backgroundColor: riskBadge.text }]} />
            <Text style={[styles.riskChipSmallText, { color: riskBadge.text }]}>
              {enfermedad.nivelRiesgo || 'Salud'}
            </Text>
          </View>

          {enfermedad.indicadorPeru && (
            <Text style={styles.metaStat} numberOfLines={1}>
              🇵🇪 {enfermedad.indicadorPeru}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.chevronContainer, { backgroundColor: `${accentColor}15` }]}>
        <Ionicons name="arrow-forward" size={18} color={accentColor} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
  },
  cardImageContainer: {
    width: 66,
    height: 66,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 14,
    position: 'relative',
    backgroundColor: 'rgba(0, 245, 212, 0.05)',
    borderWidth: 1,
  },
  cardImage: { 
    width: '100%', 
    height: '100%' 
  },
  emojiOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#070913',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
  },
  cardContent: { 
    flex: 1, 
    paddingRight: 10 
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#F8FAFC', 
    flex: 1,
    marginRight: 8,
  },
  cieBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cieBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardPreview: { 
    fontSize: 13, 
    color: '#94A3B8', 
    lineHeight: 18,
    marginBottom: 8,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskChipSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riskChipSmallText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaStat: {
    fontSize: 11,
    color: '#CBD5E1',
    flex: 1,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Horizontal Card
  cardHorizontal: {
    width: width * 0.78,
    height: 210,
    borderRadius: 24,
    marginRight: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    backgroundColor: '#0F172A',
  },
  bgImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
  },
  topBadgesRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  riskChipText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emojiBadge: {
    backgroundColor: 'rgba(7, 9, 19, 0.7)',
    borderRadius: 14,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  emojiText: {
    fontSize: 18,
  },
  cardContentHorizontal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  cieText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardTitleHorizontal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardPreviewHorizontal: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 17,
    marginBottom: 8,
  },
  peruChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  peruChipText: {
    fontSize: 11,
    color: '#00F5D4',
    fontWeight: '600',
  },
});
