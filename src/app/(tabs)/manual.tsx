import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { useTema } from '../../hooks/useTema';
import { tokens } from '../../constants/theme';
import { MANUAL_NO_TRANSMISIBLES, TemaManual } from '../../constants/manualMinsa';
import { Pantalla } from '../../components/ui/Pantalla';
import { Tarjeta } from '../../components/ui/Tarjeta';
import { CampoTexto } from '../../components/ui/CampoTexto';
import { Insignia } from '../../components/ui/Insignia';
import { EstadoVacio } from '../../components/ui/EstadoVacio';

export default function ManualScreen() {
  const { tema } = useTema();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const toggleExpand = (id: string) => {
    setExpanded(prev => (prev === id ? null : id));
  };

  const dataSource = MANUAL_NO_TRANSMISIBLES;

  const filteredData = useMemo(() => {
    if (!busqueda.trim()) return dataSource;
    const query = busqueda.toLowerCase();

    return dataSource.filter((item) => {
      const matchTitle = item.titulo.toLowerCase().includes(query);
      const matchContent = item.contenido.toLowerCase().includes(query);
      const matchHIS = item.codigoHIS?.toLowerCase().includes(query);
      const matchSub = item.subtemas?.some(
        s => s.titulo.toLowerCase().includes(query) || 
             s.contenido.toLowerCase().includes(query) ||
             s.codigoHIS?.toLowerCase().includes(query)
      );
      return matchTitle || matchContent || matchHIS || matchSub;
    });
  }, [dataSource, busqueda]);

  const quickCodes = [
    { label: 'HTA: I10', code: 'I10' },
    { label: 'Diabetes: E11', code: 'E11' },
    { label: 'Lípidos: 84478', code: '84478' },
    { label: 'Cardiovascular: 99199.23', code: '99199.23' },
    { label: 'ERC: N18', code: 'N18' },
    { label: 'Glucemia: 82947', code: '82947' },
  ];

  const renderSubItem = (sub: TemaManual) => (
    <View key={sub.id} style={[styles.subItem, { borderLeftColor: tema.primario, backgroundColor: `${tema.primario}08` }]}>
      <View style={{ flex: 1 }}>
        <View style={styles.subHeaderRow}>
          <Text style={[styles.subTitle, { color: tema.texto }]}>{sub.titulo}</Text>
          {sub.codigoHIS && (
            <Insignia texto={sub.codigoHIS} variante="primario" />
          )}
        </View>
        <Text style={[styles.subContent, { color: tema.textoSecundario }]}>{sub.contenido}</Text>
      </View>
    </View>
  );

  return (
    <Pantalla style={{ backgroundColor: tema.fondo }}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
      >
        {/* Cabecera */}
        <View style={styles.header}>
          <Insignia texto="Normas Técnicas y Protocolos" variante="logro" style={{ marginBottom: tokens.espaciado.xs }} />
          <Text style={[styles.headerTitle, { color: tema.texto }]}>Manual y Guías MINSA</Text>
          <Text style={[styles.headerSubtitle, { color: tema.textoSecundario }]}>
            Información de referencia sobre criterios diagnósticos, tamizajes y codificación oficial para educación en salud.
          </Text>
        </View>

        {/* Buscador */}
        <CampoTexto
          placeholder="Buscar protocolo o código clínico..."
          value={busqueda}
          onChangeText={setBusqueda}
        />

        {/* Chips de Códigos Rápidos */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickCodesRow}
        >
          {quickCodes.map((qc) => {
            const activo = busqueda === qc.code;
            return (
              <TouchableOpacity
                key={qc.code}
                style={[
                  styles.quickChip,
                  {
                    backgroundColor: activo ? tema.primario : tema.superficie,
                    borderColor: activo ? tema.primario : tema.borde,
                  }
                ]}
                onPress={() => setBusqueda(busqueda === qc.code ? '' : qc.code)}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar por código ${qc.label}`}
              >
                <Text style={[styles.quickChipText, { color: activo ? '#FFFFFF' : tema.textoSecundario }]}>
                  {qc.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Lista de Secciones del Manual */}
        {filteredData.length === 0 ? (
          <EstadoVacio
            titulo="No hay coincidencias"
            descripcion="No encontramos protocolos o temas para tu búsqueda."
          />
        ) : (
          <View style={styles.list}>
            {filteredData.map((item) => {
              const isExpanded = expanded === item.id;

              return (
                <Tarjeta 
                  key={item.id} 
                  style={[
                    styles.card,
                    isExpanded && { borderColor: tema.primario }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => toggleExpand(item.id)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Desplegar tema ${item.titulo}`}
                  >
                    <View style={{ flex: 1, paddingRight: tokens.espaciado.sm }}>
                      <Text style={[styles.cardTitle, { color: isExpanded ? tema.primario : tema.texto }]}>
                        {item.titulo}
                      </Text>
                      {item.codigoHIS && (
                        <View style={{ marginTop: tokens.espaciado.xs, alignSelf: 'flex-start' }}>
                          <Insignia texto={`Código: ${item.codigoHIS}`} variante="primario" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.chevron, { color: isExpanded ? tema.primario : tema.textoSecundario }]}>
                      {isExpanded ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={[styles.expandedContent, { borderTopColor: tema.borde }]}>
                      <Text style={[styles.contenido, { color: tema.textoSecundario }]}>
                        {item.contenido}
                      </Text>
                      {item.subtemas && item.subtemas.length > 0 && (
                        <View style={styles.subtemasContainer}>
                          {item.subtemas.map(renderSubItem)}
                        </View>
                      )}
                    </View>
                  )}
                </Tarjeta>
              );
            })}
          </View>
        )}

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
  headerTitle: {
    fontFamily: tokens.tipografia.familias.display,
    fontSize: tokens.tipografia.tamanos.titulo,
    marginBottom: tokens.espaciado.xs,
  },
  headerSubtitle: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    lineHeight: 20,
  },
  quickCodesRow: {
    gap: tokens.espaciado.sm,
    paddingVertical: tokens.espaciado.xs,
    marginBottom: tokens.espaciado.md,
  },
  quickChip: {
    paddingHorizontal: tokens.espaciado.md,
    paddingVertical: tokens.espaciado.xs + 2,
    borderRadius: tokens.radios.redondo,
    borderWidth: 1,
  },
  quickChipText: {
    fontFamily: tokens.tipografia.familias.cuerpoMedio,
    fontSize: tokens.tipografia.tamanos.mini,
  },
  list: {
    gap: tokens.espaciado.md,
  },
  card: {
    padding: tokens.espaciado.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  cardTitle: {
    fontFamily: tokens.tipografia.familias.titulo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    lineHeight: 20,
  },
  chevron: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  expandedContent: {
    marginTop: tokens.espaciado.md,
    paddingTop: tokens.espaciado.md,
    borderTopWidth: 1,
  },
  contenido: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.cuerpo,
    lineHeight: 22,
    marginBottom: tokens.espaciado.sm,
  },
  subtemasContainer: {
    gap: tokens.espaciado.sm,
    marginTop: tokens.espaciado.sm,
  },
  subItem: {
    padding: tokens.espaciado.sm,
    borderRadius: tokens.radios.sm,
    borderLeftWidth: 3,
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.espaciado.xs,
  },
  subTitle: {
    fontFamily: tokens.tipografia.familias.subtitulo,
    fontSize: tokens.tipografia.tamanos.etiqueta,
    flex: 1,
    paddingRight: tokens.espaciado.sm,
  },
  subContent: {
    fontFamily: tokens.tipografia.familias.cuerpo,
    fontSize: tokens.tipografia.tamanos.mini,
    lineHeight: 16,
  },
});
