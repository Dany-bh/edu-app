// scripts/inspect-stats.js
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function inspectPdf(filePath) {
  try {
    const dataBuffer = new Uint8Array(fs.readFileSync(filePath));
    const parser = new PDFParse(dataBuffer);
    const info = await parser.getInfo();
    const text = await parser.getText();
    console.log(`=== PDF: ${path.basename(filePath)} (Páginas: ${info.pages?.length || '?'}) ===`);
    console.log(text.text ? text.text.slice(0, 3000) : String(text).slice(0, 3000));
  } catch (err) {
    console.error(`Error leyendo ${filePath}:`, err.message);
  }
}

async function run() {
  const p1 = path.join(__dirname, '..', 'DNT', '6813669-principales-indicadores-peru-enfermedades-no-transmisibles-y-transmisibles-2024.pdf');
  if (fs.existsSync(p1)) {
    await inspectPdf(p1);
  }
}

run();
