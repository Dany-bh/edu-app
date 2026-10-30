// src/app/logros.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Animated,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../hooks/useTema';
import { tokens } from '../constants/theme';
import { Pantalla } from '../components/ui/Pantalla';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Boton } from '../components/ui/Boton';
import { Insignia } from '../components/ui/Insignia';
import { Mascota } from '../components/Mascota';
import { Esqueleto } from '../components/ui/Esqueleto';
import { obtenerLogrosUsuario, LogroConEstado } from '../db/database';

export default function LogrosScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { tema } = useTema();
  const { width } = useWindowDimensions();
  const esWebGrande = Platform.OS === 'web' && width >= 768;

  const [logros, setLogros] = useState<LogroConEstado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [logroSeleccionado, setLogroSeleccionado] = useState<LogroConEstado | null>(null);
  const [compartiendo, setCompartiendo] = useState(false);
  const [mensajeCompartir, setMensajeCompartir] = useState<string | null>(null);

  // Animación para el detalle del logro
  const [animScale] = useState(() => new Animated.Value(0.85));
  const [animOpacity] = useState(() => new Animated.Value(0));
  const shareCardRef = useRef<View>(null);

  useEffect(() => {
    const cargar = async () => {
      if (!user?.id) return;
      setCargando(true);
      try {
        const data = await obtenerLogrosUsuario(user.id);
        setLogros(data);
      } catch (e) {
        console.warn('Error cargando logros:', e);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [user?.id]);

  const cargarLogros = async () => {
    if (!user?.id) return;
    setCargando(true);
    try {
      const data = await obtenerLogrosUsuario(user.id);
      setLogros(data);
    } catch (e) {
      console.warn('Error cargando logros:', e);
    } finally {
      setCargando(false);
    }
  };

  const abrirDetalle = (logro: LogroConEstado) => {
    setLogroSeleccionado(logro);
    setMensajeCompartir(null);
    animScale.setValue(0.85);
    animOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(animScale, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(animOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const cerrarDetalle = () => {
    Animated.timing(animOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setLogroSeleccionado(null);
    });
  };

  const compartirLogro = async () => {
    if (!shareCardRef.current) return;
    setCompartiendo(true);
    setMensajeCompartir(null);

    try {
      const uri = await captureRef(shareCardRef, {
        format: 'png',
        quality: 0.95,
      });

      if (Platform.OS === 'web') {
        // En web se genera la descarga de la imagen del logro
        const link = document.createElement('a');
        link.download = `logro-${logroSeleccionado?.id || 'salud'}.png`;
        link.href = uri;
        link.click();
        setMensajeCompartir('¡Imagen del logro descargada con éxito!');
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: `Compartir logro: ${logroSeleccionado?.titulo}`,
          });
        } else {
          setMensajeCompartir('La función de compartir no está disponible en este dispositivo.');
        }
      }
    } catch (err) {
      console.warn('Error al compartir logro:', err);
      setMensajeCompartir('No se pudo generar la imagen para compartir.');
    } finally {
      setCompartiendo(false);
    }
  };

  const totalDesbloqueados = logros.filter((l) => l.desbloqueado).length;
  const porcentaje = logros.length > 0 ? Math.round((totalDesbloqueados / logros.length) * 100) : 0;

  const categorias = [
    { id: 'todas', etiqueta: 'Todas' },
    { id: 'aprendizaje', etiqueta: 'Aprendizaje' },
    { id: 'constancia', etiqueta: 'Constancia' },
    { id: 'exploracion', etiqueta: 'Exploración' },
    { id: 'maestria', etiqueta: 'Maestría' },
  ];

  const logrosFiltrados = logros.filter((l) => {
    if (filtroCategoria === 'todas') return true;
    return l.categoria === filtroCategoria;
  });

  const getEmojiIcono = (icono: string) => {
    switch (icono) {
      case 'quiz': return '📝';
      case 'star': return '⭐';
      case 'book': return '📚';
      case 'target': return '🎯';
      case 'lightning': return '⚡';
      case 'flame': return '🔥';
      case 'shield': return '🛡️';
      case 'trophy': return '🏆';
      case 'chat': return '💬';
      case 'heart': return '❤️';
      case 'check-circle': return '✅';
      case 'award': return '🎖️';
      case 'snowflake': return '❄️';
      case 'medal': return '🥇';
      case 'crown': return '👑';
      default: return '🏅';
    }
  };

  return (
    <Pantalla style={{ backgroundColor: tema.fondo }}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
      >
        {/* Encabezado */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { borderColor: tema.borde, backgroundColor: tema.superficie }]}
            accessibilityRole="button"
            accessibilityLabel="Volver a la pantalla anterior"
          >
            <Text style={[styles.backText, { color: tema.texto }]}>← Volver</Text>
          </TouchableOpacity>
        </View>

        {/* Resumen de Logros con Mascota */}
        <Tarjeta style={styles.tarjetaResumen}>
          <View style={styles.resumenRow}>
            <View style={{ flex: 1, paddingRight: tokens.espaciado.md }}>
              <Insignia texto="MEDALLERO ESCOLAR" variante="logro" style={{ marginBottom: tokens.espaciado.xs }} />
              <Text style={[styles.tituloResumen, { color: tema.texto }]}>
                {totalDesbloqueados} de {logros.length} Logros
              </Text>
              <Text style={[styles.descResumen, { color: tema.textoSecundario }]}>
                Completa retos diarios, quizzes y evaluaciones para desbloquear insignias y ganar XP adicional.
              </Text>
              <View style={styles.progresoPill}>
                <Text style={[styles.progresoPillText, { color: tema.primario }]}>
                  {porcentaje}% Desbloqueado
                </Text>
              </View>
            </View>
            <Mascota estado={porcentaje >= 50 ? 'feliz' : 'animando'} size={88} />
          </View>
        </Tarjeta>

        {/* Filtros por Categoría */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtrosScroll}
        >
          {categorias.map((cat) => {
            const activo = filtroCategoria === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setFiltroCategoria(cat.id)}
                style={[
                  styles.filtroBtn,
                  {
                    backgroundColor: activo ? tema.primario : tema.superficie,
                    borderColor: activo ? tema.primario : tema.borde,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar por ${cat.etiqueta}`}
              >
                <Text
                  style={[
                    styles.filtroTexto,
                    { color: activo ? '#FFFFFF' : tema.textoSecundario },
                  ]}
                >
                  {cat.etiqueta}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Grilla de Logros */}
        {cargando ? (
          <View style={[styles.grid, esWebGrande && styles.gridTresCol]}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Esqueleto key={i} height={120} style={{ borderRadius: tokens.radios.md }} />
            ))}
          </View>
        ) : (
          <View style={[styles.grid, esWebGrande && styles.gridTresCol]}>
            {logrosFiltrados.map((item) => {
              const estaDesbloqueado = item.desbloqueado;
              const emoji = getEmojiIcono(item.icono);

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  style={[styles.cardWrapper, esWebGrande && styles.cardWrapperWeb]}
                  onPress={() => abrirDetalle(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Logro ${item.titulo}: ${estaDesbloqueado ? 'Desbloqueado' : 'Bloqueado'}`}
                >
                  <Tarjeta
                    style={[
                      styles.logroCard,
                      {
                        backgroundColor: estaDesbloqueado ? tema.superficie : `${tema.superficie}80`,
                        borderColor: estaDesbloqueado ? `${tema.logro}60` : tema.borde,
                        opacity: estaDesbloqueado ? 1 : 0.72,
                      },
                    ]}
                  >
                    <View style={styles.logroCardHeader}>
                      <View
                        style={[
                          styles.iconoBadge,
                          {
                            backgroundColor: estaDesbloqueado ? `${tema.logro}18` : `${tema.borde}50`,
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 26 }}>
                          {estaDesbloqueado ? emoji : '🔒'}
                        </Text>
                      </View>
                      <Insignia
                        texto={`+${item.xpRecompensa} XP`}
                        variante={estaDesbloqueado ? 'logro' : 'neutro'}
                      />
                    </View>

                    <Text
                      style={[
                        styles.logroTitulo,
                        { color: estaDesbloqueado ? tema.texto : tema.textoSecundario },
                      ]}
                      numberOfLines={1}
                    >
                      {item.titulo}
                    </Text>

                    <Text
                      style={[styles.logroDesc, { color: tema.textoSecundario }]}
                      numberOfLines={2}
                    >
                      {item.descripcion}
                    </Text>

                    <View style={styles.logroFooter}>
                      <Text
                        style={[
                          styles.estadoTexto,
                          { color: estaDesbloqueado ? tema.exito : tema.textoSecundario },
                        ]}
                      >
                        {estaDesbloqueado ? '✓ Desbloqueado' : '• Por desbloquear'}
                      </Text>
                    </View>
                  </Tarjeta>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Modal de Detalle y Compartir */}
        <Modal
          visible={Boolean(logroSeleccionado)}
          transparent
          animationType="none"
          onRequestClose={cerrarDetalle}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  backgroundColor: tema.superficie,
                  borderColor: tema.borde,
                  opacity: animOpacity,
                  transform: [{ scale: animScale }],
                },
              ]}
            >
              {logroSeleccionado && (
                <>
                  {/* Tarjeta capturable para compartir */}
                  <View
                    ref={shareCardRef}
                    collapsable={false}
                    style={[
                      styles.shareableCard,
                      {
                        backgroundColor: tema.superficie,
                        borderColor: logroSeleccionado.desbloqueado ? tema.logro : tema.borde,
                      },
                    ]}
                  >
                    <View style={styles.shareBadgeHeader}>
                      <Text style={{ fontSize: 44 }}>
                        {logroSeleccionado.desbloqueado
                          ? getEmojiIcono(logroSeleccionado.icono)
                          : '🔒'}
                      </Text>
                      <Insignia
                        texto={`+${logroSeleccionado.xpRecompensa} XP`}
                        variante={logroSeleccionado.desbloqueado ? 'logro' : 'neutro'}
                        style={{ marginTop: tokens.espaciado.xs }}
                      />
                    </View>

                    <Text style={[styles.modalTitulo, { color: tema.texto }]}>
                      {logroSeleccionado.titulo}
                    </Text>

                    <Text style={[styles.modalCategoria, { color: tema.primario }]}>
                      Categoría: {logroSeleccionado.categoria.toUpperCase()}
                    </Text>

                    <Text style={[styles.modalDesc, { color: tema.textoSecundario }]}>
                      {logroSeleccionado.descripcion}
                    </Text>

                    <View style={styles.watermark}>
                      <Text style={[styles.watermarkText, { color: tema.textoSecundario }]}>
                        Salud Viva · Prevención Escolar DNT
                      </Text>
                    </View>
                  </View>

                  {mensajeCompartir ? (
                    <Text style={[styles.mensajeFeedback, { color: tema.primario }]}>
                      {mensajeCompartir}
                    </Text>
                  ) : null}

                  {/* Acciones */}
                  <View style={styles.modalAcciones}>
                    {logroSeleccionado.desbloqueado ? (
                      <Boton
                        titulo="Compartir logro"
                        variante="principal"
                        cargando={compartiendo}
                        onPress={compartirLogro}
                        style={{ marginBottom: tokens.espaciado.xs }}
                      />
                    ) : (
                      <Text style={[styles.bloqueadoAviso, { color: tema.textoSecundario }]}>
                        Cumple el objetivo en la app para desbloquear esta insignia y compartirla.
                      </Text>
                    )}
                    <Boton
                      titulo="Cerrar"
                      variante="secundario"
                      onPress={cerrarDetalle}
                    />
                  </View>
                </>
              )}
            </Animated.View>
          </View>
        </Modal>
      </ScrollView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: tokens.espaciado.md,
    paddingBottom: tokens.espaciado.xl * 2,
  },
  header: {
    marginBottom: tokens.espaciado.sm,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: tokens.espaciado.xs,
    paddingHorizontal: tokens.espaciado.md,
    borderRadius: tokens.radios.sm,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  backText: {
    fontSize: tokens.tipografia.tamanos.cuerpo,
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontWeight: '600',
  },
  tarjetaResumen: {
    marginBottom: tokens.espaciado.md,
  },
  resumenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tituloResumen: {
    fontSize: tokens.tipografia.tamanos.titulo,
    fontFamily: tokens.tipografia.familias.titulo,
    fontWeight: '800',
    marginBottom: 4,
  },
  descResumen: {
    fontSize: tokens.tipografia.tamanos.etiqueta,
    fontFamily: tokens.tipografia.familias.cuerpo,
    lineHeight: 18,
    marginBottom: tokens.espaciado.xs,
  },
  progresoPill: {
    alignSelf: 'flex-start',
    backgroundColor: `${tokens.colores.claro.primario}18`,
    paddingVertical: 3,
    paddingHorizontal: tokens.espaciado.sm,
    borderRadius: tokens.radios.sm,
  },
  progresoPillText: {
    fontSize: tokens.tipografia.tamanos.etiqueta,
    fontFamily: tokens.tipografia.familias.titulo,
    fontWeight: '700',
  },
  filtrosScroll: {
    gap: tokens.espaciado.xs,
    marginBottom: tokens.espaciado.md,
  },
  filtroBtn: {
    paddingVertical: tokens.espaciado.xs,
    paddingHorizontal: tokens.espaciado.md,
    borderRadius: tokens.radios.sm,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  filtroTexto: {
    fontSize: tokens.tipografia.tamanos.etiqueta,
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontWeight: '600',
  },
  grid: {
    gap: tokens.espaciado.sm,
  },
  gridTresCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '100%',
  },
  cardWrapperWeb: {
    width: '31.5%',
  },
  logroCard: {
    padding: tokens.espaciado.md,
  },
  logroCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.espaciado.xs,
  },
  iconoBadge: {
    width: 48,
    height: 48,
    borderRadius: tokens.radios.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logroTitulo: {
    fontSize: tokens.tipografia.tamanos.cuerpo,
    fontFamily: tokens.tipografia.familias.titulo,
    fontWeight: '700',
    marginBottom: 4,
  },
  logroDesc: {
    fontSize: tokens.tipografia.tamanos.etiqueta,
    fontFamily: tokens.tipografia.familias.cuerpo,
    lineHeight: 18,
    marginBottom: tokens.espaciado.xs,
  },
  logroFooter: {
    marginTop: tokens.espaciado.xs,
    borderTopWidth: 1,
    borderTopColor: `${tokens.colores.claro.borde}40`,
    paddingTop: tokens.espaciado.xs,
  },
  estadoTexto: {
    fontSize: tokens.tipografia.tamanos.etiqueta - 1,
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.espaciado.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: tokens.radios.lg,
    borderWidth: 1,
    padding: tokens.espaciado.lg,
    alignItems: 'center',
  },
  shareableCard: {
    width: '100%',
    padding: tokens.espaciado.lg,
    borderRadius: tokens.radios.md,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: tokens.espaciado.md,
  },
  shareBadgeHeader: {
    alignItems: 'center',
    marginBottom: tokens.espaciado.sm,
  },
  modalTitulo: {
    fontSize: tokens.tipografia.tamanos.subtitulo,
    fontFamily: tokens.tipografia.familias.titulo,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalCategoria: {
    fontSize: tokens.tipografia.tamanos.etiqueta - 1,
    fontFamily: tokens.tipografia.familias.titulo,
    fontWeight: '700',
    marginBottom: tokens.espaciado.xs,
  },
  modalDesc: {
    fontSize: tokens.tipografia.tamanos.cuerpo,
    fontFamily: tokens.tipografia.familias.cuerpo,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: tokens.espaciado.md,
  },
  watermark: {
    paddingTop: tokens.espaciado.xs,
    borderTopWidth: 1,
    borderTopColor: `${tokens.colores.claro.borde}40`,
    width: '100%',
    alignItems: 'center',
  },
  watermarkText: {
    fontSize: tokens.tipografia.tamanos.etiqueta - 2,
    fontFamily: tokens.tipografia.familias.cuerpo,
  },
  mensajeFeedback: {
    fontSize: tokens.tipografia.tamanos.etiqueta,
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: tokens.espaciado.sm,
  },
  modalAcciones: {
    width: '100%',
  },
  bloqueadoAviso: {
    fontSize: tokens.tipografia.tamanos.etiqueta,
    fontFamily: tokens.tipografia.familias.cuerpo,
    textAlign: 'center',
    marginBottom: tokens.espaciado.md,
  },
});
