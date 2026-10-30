import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Platform } from 'react-native';

interface FormattedBotMessageProps {
  content: string;
}

/**
 * Parser y renderizador de Markdown con soporte completo para:
 * - Tablas comparativas tipo Claude / ChatGPT (| col1 | col2 |)
 * - Encabezados (###, ##, #)
 * - Negritas (**texto**)
 * - Listas con viñetas (- , * , ✔️)
 * - Citas y bloques de alerta (> ...)
 * - Imágenes de ejemplos (![alt](url))
 */
export default function FormattedBotMessage({ content }: FormattedBotMessageProps) {
  if (!content) return null;

  const blocks = parseContentToBlocks(content);

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'table':
            return <TableBlock key={index} headers={block.headers} rows={block.rows} />;
          case 'header':
            return (
              <Text key={index} style={[styles.header, block.level === 1 ? styles.h1 : block.level === 2 ? styles.h2 : styles.h3]}>
                {block.text}
              </Text>
            );
          case 'quote':
            return (
              <View key={index} style={styles.quoteBox}>
                <Text style={styles.quoteText}>{renderInlineText(block.text)}</Text>
              </View>
            );
          case 'image':
            return (
              <View key={index} style={styles.imageCard}>
                <Image source={{ uri: block.url }} style={styles.image} resizeMode="cover" />
                {block.alt ? <Text style={styles.imageCaption}>{block.alt}</Text> : null}
              </View>
            );
          case 'bullet':
            return (
              <View key={index} style={styles.bulletRow}>
                <Text style={styles.bulletSymbol}>{block.symbol || '•'}</Text>
                <Text style={styles.bulletText}>{renderInlineText(block.text)}</Text>
              </View>
            );
          case 'paragraph':
          default:
            return (
              <Text key={index} style={styles.paragraph}>
                {renderInlineText(block.text)}
              </Text>
            );
        }
      })}
    </View>
  );
}

// ----------------------------------------------------
// Componente de Tabla Comparativa
// ----------------------------------------------------
function TableBlock({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (!headers.length && !rows.length) return null;

  return (
    <View style={styles.tableWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={Platform.OS === 'web'}>
        <View style={styles.table}>
          {headers.length > 0 && (
            <View style={styles.tableHeaderRow}>
              {headers.map((h, i) => (
                <View key={i} style={[styles.tableHeaderCell, i === 0 && { minWidth: 120 }]}>
                  <Text style={styles.tableHeaderText}>{h.trim()}</Text>
                </View>
              ))}
            </View>
          )}

          {rows.map((row, rowIndex) => (
            <View 
              key={rowIndex} 
              style={[
                styles.tableRow, 
                rowIndex % 2 === 1 && styles.tableRowAlt
              ]}
            >
              {row.map((cell, cellIndex) => (
                <View key={cellIndex} style={[styles.tableCell, cellIndex === 0 && { minWidth: 120 }]}>
                  <Text style={styles.tableCellText}>{renderInlineText(cell.trim())}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ----------------------------------------------------
// Formateo en línea (Negritas **texto**)
// ----------------------------------------------------
function renderInlineText(text: string) {
  if (!text) return null;
  // Divide por **negrita**
  const parts = text.split(/(\*\*[^*]+?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2).replace(/\*/g, '');
      return (
        <Text key={index} style={styles.boldText}>
          {boldText}
        </Text>
      );
    }
    // Eliminar cualquier asterisco residual en texto normal
    const cleanPart = part.replace(/\*/g, '');
    return cleanPart;
  });
}

// ----------------------------------------------------
// Parser de bloques de texto (Tablas, encabezados, etc.)
// ----------------------------------------------------
function parseContentToBlocks(raw: string) {
  const lines = raw.split(/\r?\n/);
  const blocks: any[] = [];
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableHeaders.length > 0 || tableRows.length > 0) {
      blocks.push({
        type: 'table',
        headers: tableHeaders,
        rows: tableRows,
      });
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detección de líneas de tabla Markdown (| col1 | col2 |)
    if (line.startsWith('|') && line.endsWith('|')) {
      // Línea divisora (|---|---|)
      if (/^\|[\s\-:|]+\|$/.test(line)) {
        inTable = true;
        continue;
      }

      const cells = line
        .slice(1, -1)
        .split('|')
        .map(c => c.trim());

      if (!inTable && tableHeaders.length === 0) {
        tableHeaders = cells;
      } else {
        inTable = true;
        tableRows.push(cells);
      }
      continue;
    } else {
      if (inTable || tableHeaders.length > 0) {
        flushTable();
      }
    }

    if (!line) continue;

    // Líneas separadoras (*** o ---)
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(line)) {
      continue;
    }

    // Encabezados Markdown
    if (line.startsWith('### ')) {
      blocks.push({ type: 'header', level: 3, text: line.replace(/^###\s+/, '') });
    } else if (line.startsWith('## ')) {
      blocks.push({ type: 'header', level: 2, text: line.replace(/^##\s+/, '') });
    } else if (line.startsWith('# ')) {
      blocks.push({ type: 'header', level: 1, text: line.replace(/^#\s+/, '') });
    }
    // Citas / Callouts
    else if (line.startsWith('> ')) {
      blocks.push({ type: 'quote', text: line.replace(/^>\s*/, '') });
    }
    // Imágenes Markdown ![alt](url)
    else if (/^!\[(.*?)\]\((.*?)\)$/.test(line)) {
      const match = line.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (match) {
        blocks.push({ type: 'image', alt: match[1], url: match[2] });
      }
    }
    // Listas con viñetas
    else if (/^(\*|\-|•|✔️)\s+/.test(line)) {
      const match = line.match(/^(\*|\-|•|✔️)\s+(.*)$/);
      blocks.push({
        type: 'bullet',
        symbol: match?.[1] === '✔️' ? '✔️' : '•',
        text: match?.[2] || line,
      });
    }
    // Párrafo normal
    else {
      blocks.push({ type: 'paragraph', text: line });
    }
  }

  flushTable();
  return blocks;
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  paragraph: {
    color: '#F1F5F9',
    fontSize: 15,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '800',
    color: '#00F5D4',
  },
  header: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 2,
  },
  h1: { fontSize: 18, color: '#00F5D4' },
  h2: { fontSize: 17, color: '#38BDF8' },
  h3: { fontSize: 15, color: '#FACC15' },
  quoteBox: {
    backgroundColor: 'rgba(0, 245, 212, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#00F5D4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  quoteText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 2,
  },
  bulletSymbol: {
    color: '#00F5D4',
    fontSize: 14,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 14.5,
    lineHeight: 21,
  },
  tableWrapper: {
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  table: {
    minWidth: 320,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 245, 212, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 245, 212, 0.3)',
  },
  tableHeaderCell: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 100,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
  },
  tableHeaderText: {
    color: '#00F5D4',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableRowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  tableCell: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: 100,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableCellText: {
    color: '#CBD5E1',
    fontSize: 12.5,
    lineHeight: 18,
  },
  imageCard: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  image: {
    width: '100%',
    height: 180,
  },
  imageCaption: {
    padding: 8,
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
});
