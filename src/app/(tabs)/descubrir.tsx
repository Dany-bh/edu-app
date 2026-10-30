import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Platform,
  useWindowDimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTema } from '../../hooks/useTema';
import { tokens, TipoEnfermedad } from '../../constants/theme';
import { INDICADORES_DNT_PERU } from '../../data/estadisticasENDES';
import { ENFERMEDADES_COMPLEMENTARIAS, ENFERMEDADES_PRINCIPALES } from '../../constants/enfermedades';
import { Pantalla } from '../../components/ui/Pantalla';
import { Tarjeta } from '../../components/ui/Tarjeta';
import { CampoTexto } from '../../components/ui/CampoTexto';
import { Insignia } from '../../components/ui/Insignia';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { IconoEnfermedad } from '../../components/IconoEnfermedad';
import { BarraProgreso } from '../../components/ui/BarraProgreso';

export default function DescubrirScreen() {
  const router = useRouter();
  const { tema } = useTema();
  const { width } = useWindowDimensions();
  const esWebGrande = Platform.OS === 'web' && width >= 768;

  const [busqueda, setBusqueda] = useState('');
  const [filtroSeleccionado, setFiltroSeleccionado] = useState<string>('todos');

  const todasLasEnfermedades = useMemo(() => {
    return [...ENFERMEDADES_PRINCIPALES, ...ENFERMEDADES_COMPLEMENTARIAS];
  }, []);

  const categorias = [
    { id: 'todos', label: 'Todas' },
    { id: 'cardiovascular', label: 'Cardiovascular' },
    { id: 'diabetes', label: 'Diabetes' },
    { id: 'respiratorias', label: 'Respiratorias' },
    { id: 'cancer', label: 'Cáncer' },
    { id: 'renal', label: 'Renal' },
    { id: 'salud_mental', label: 'Salud Mental' },
  ];

  const mapTipo = (id: string): TipoEnfermedad => {
    if (id.includes('cardio') || id.includes('hipertension')) return 'cardiovascular';
    if (id.includes('cancer')) return 'cancer';
    if (id.includes('respirator') || id.includes('asma') || id.includes('epoc')) return 'respiratorias';
    if (id.includes('diabet')) return 'diabetes';
    if (id.includes('obesidad')) return 'obesidad';
    if (id.includes('renal')) return 'renal';
    if (id.includes('mental') || id.includes('depresion') || id.includes('ansiedad')) return 'salud_mental';
    return 'cardiovascular';
  };

  const listaFiltrada = useMemo(() => {
    return todasLasEnfermedades.filter((item) => {
      const coincideBusqueda = 
        item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (item.subtitulo || item.queEs)?.toLowerCase().includes(busqueda.toLowerCase());
      
      const tipo = mapTipo(item.id);
      const coincideFiltro = filtroSeleccionado === 'todos' || tipo === filtroSeleccionado;

      return coincideBusqueda && coincideFiltro;
    });
  }, [todasLasEnfermedades, busqueda, filtroSeleccionado]);

  const indicadorActivo = INDICADORES_DNT_PERU[1] || INDICADORES_DNT_PERU[0];

  return (
    <Pantalla style={{ backgroundColor: tema.fondo }}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
      >
        {/* Cabecera */}
        <View style={styles.header}>
          <Insignia texto="Explora y Descubre" variante="primario" style={{ marginBottom: tokens.espaciado.xs }} />
          <Text style={[styles.titulo, { color: tema.texto }]}>Enfermedades No Transmisibles</Text>
          <Text style={[styles.subtitulo, { color: tema.textoSecundario }]}>
            Información médica verificada y datos epidemiológicos oficiales de ENDES/MINSA para escolares de secundaria.
          </Text>
        </View>

        {/* Buscador y Filtros */}
        <View style={styles.seccionBusqueda}>
          <CampoTexto
            placeholder="Buscar por nombre o síntoma..."
            value={busqueda}
            onChangeText={setBusqueda}
          />

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {categorias.map((cat) => {
              const activo = filtroSeleccionado === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: activo ? tema.primario : tema.superficie,
                      borderColor: activo ? tema.primario : tema.borde,
                    }
                  ]}
                  onPress={() => setFiltroSeleccionado(cat.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filtrar por categoría ${cat.label}`}
                >
                  <Text style={[styles.chipTexto, { color: activo ? '#FFFFFF' : tema.textoSecundario }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Lista de Enfermedades */}
        {listaFiltrada.length === 0 ? (
          <EstadoVacio
            titulo="No se encontraron enfermedades"
            descripcion="Intenta ajustar los filtros o el texto de tu búsqueda."
          />
        ) : (
          <View style={[styles.cardsGrid, esWebGrande && styles.cardsGridWeb]}>
            {listaFiltrada.map((item) => {
              const tipo = mapTipo(item.id);
              const colorAcento = tokens.colores.enfermedades[tipo] || tema.primario;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.cardItem, esWebGrande && styles.cardItemWeb]}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/enfermedad/${item.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver detalles de ${item.nombre}`}
                >
                  <Tarjeta style={[styles.tarjetaEnf, { borderColor: `${colorAcento}35` }]}>
                    <View style={styles.tarjetaHeader}>
                      <View style={[styles.iconoCaja, { backgroundColor: `${colorAcento}15` }]}>
                        <IconoEnfermedad enfermedad={tipo} size={30} color={colorAcento} />
                      </View>
                      <Insignia texto={item.codigoCIE10 || 'DNT'} variante="primario" />
                    </View>

                    <Text style={[styles.enfTitulo, { color: tema.texto }]}>{item.nombre}</Text>
                    <Text style={[styles.enfDesc, { color: tema.textoSecundario }]} numberOfLines={3}>
                      {item.subtitulo || item.queEs || 'Aprende las causas, factores de riesgo y cómo prevenirla desde la adolescencia.'}
                    </Text>

                    <View style={styles.cardFooter}>
                      <Text style={[styles.verMas, { color: tema.primario }]}>Explorar guía completa →</Text>
                    </View>
                  </Tarjeta>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Sección de Datos Epidemiológicos ENDES */}
        <View style={styles.seccionEstadisticas}>
          <Text style={[styles.seccionTitulo, { color: tema.texto }]}>
            Prevalencia Nacional por Región (ENDES)
          </Text>
          <Text style={[styles.seccionSub, { color: tema.textoSecundario }]}>
            Porcentaje aproximado de población afectada por condiciones crónicas.
          </Text>

          <Tarjeta style={styles.tarjetaEstadisticas}>
            {indicadorActivo.datosRegionales.map((reg) => {
              const maxVal = Math.max(...indicadorActivo.datosRegionales.map((r) => r.valor), 1);
              const proporcion = reg.valor / maxVal;

              return (
                <View key={reg.region} style={styles.filaRegion}>
                  <View style={styles.regionInfo}>
                    <Text style={[styles.regionNombre, { color: tema.texto }]}>{reg.region}</Text>
                    <Text style={[styles.regionValor, { color: tema.primario }]}>{reg.valor}%</Text>
                  </View>
                  <BarraProgreso progreso={proporcion} colorBase={tema.primario} />
                </View>
              );
            })}
          </Tarjeta>
        </View>

        <View style={{ height: tokens.espaciado.xxl }} />
      </ScrollView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: tokens.espaciado.lg,
    paddingBottom: 90,
  },
  header: {
    marginBottom: tokens.espaciado.lg,
  },
  titulo: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: tokens.tipografia.tamanos.titulo,
    marginBottom: tokens.espaciado.xs,
  },
  subtitulo: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    lineHeight: 20,
  },
  seccionBusqueda: {
    marginBottom: tokens.espaciado.lg,
  },
  chipsContainer: {
    gap: tokens.espaciado.sm,
    paddingVertical: tokens.espaciado.xs,
  },
  chip: {
    paddingHorizontal: tokens.espaciado.md,
    paddingVertical: tokens.espaciado.xs + 2,
    borderRadius: tokens.radios.redondo,
    borderWidth: 1,
  },
  chipTexto: {
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
  cardsGrid: {
    gap: tokens.espaciado.md,
  },
  cardsGridWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardItem: {
    width: '100%',
  },
  cardItemWeb: {
    width: '31.5%',
  },
  tarjetaEnf: {
    padding: tokens.espaciado.lg,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  tarjetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.espaciado.sm,
  },
  iconoCaja: {
    width: 48,
    height: 48,
    borderRadius: tokens.radios.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enfTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    marginBottom: tokens.espaciado.xs,
  },
  enfDesc: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
    lineHeight: 18,
    marginBottom: tokens.espaciado.md,
  },
  cardFooter: {
    marginTop: tokens.espaciado.xs,
  },
  verMas: {
    fontFamily: tokens.tipografia.familias.subtitulo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
  seccionEstadisticas: {
    marginTop: tokens.espaciado.xxl,
  },
  seccionTitulo: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.subtitulo,
    marginBottom: tokens.espaciado.xs,
  },
  seccionSub: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    marginBottom: tokens.espaciado.md,
  },
  tarjetaEstadisticas: {
    padding: tokens.espaciado.lg,
    gap: tokens.espaciado.md,
  },
  filaRegion: {
    gap: tokens.espaciado.xs,
  },
  regionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  regionNombre: {
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
  regionValor: {
    fontFamily: tokens.tipografia.familias.subtitulo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
  },
});
