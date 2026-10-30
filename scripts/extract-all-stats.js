// scripts/extract-all-stats.js
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function run() {
  const filePath = path.join(__dirname, '..', 'DNT', '6813669-principales-indicadores-peru-enfermedades-no-transmisibles-y-transmisibles-2024.pdf');
  const dataBuffer = new Uint8Array(fs.readFileSync(filePath));
  const parser = new PDFParse(dataBuffer);
  const textObj = await parser.getText();
  const text = textObj.text || String(textObj);
  
  // Buscar tablas, porcentajes y cifras clave
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  console.log(`Total lineas: ${lines.length}`);
  
  // Guardar texto completo extraído para procesamiento en la base de conocimiento
  fs.writeFileSync(path.join(__dirname, '..', 'DNT', 'indicadores_2024_texto.txt'), text, 'utf8');
  console.log('Guardado en DNT/indicadores_2024_texto.txt');

  // Imprimir líneas con porcentajes y temas clave
  const matches = lines.filter(l => (l.includes('%') || l.includes('por ciento') || l.includes('prevalencia')) && l.length < 150);
  console.log('Muestra de estadísticas encontradas:');
  console.log(matches.slice(0, 30).join('\n'));
}

run();
