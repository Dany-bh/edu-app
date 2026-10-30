// scripts/extract-docs.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function readDocx(filePath) {
  try {
    const xml = execSync(`tar -xf "${filePath}" -O word/document.xml`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    return xml.replace(/<[^>]+>/g, '\n').split('\n').map(s => s.trim()).filter(Boolean);
  } catch (err) {
    return [];
  }
}

const lines1 = readDocx(path.join(__dirname, '..', 'DNT', 'ENFERMEDADES NO TRANSMISIBLES.docx'));
console.log('=== SECCIONES ENFERMEDADES NO TRANSMISIBLES.docx ===');
lines1.forEach(l => {
  if (l.includes('¿') || l.includes('Criterios') || l.includes('Riesgos') || l.includes('Prevención') || l.includes('Síntomas') || (l === l.toUpperCase() && l.length > 3)) {
    console.log(' - ' + l);
  }
});

const lines2 = readDocx(path.join(__dirname, '..', 'DNT', 'ALIMENTACION SALUDABLE PARA PREVENIR LAS ENFERMEDADES NO TRANSMISIBLES.docx'));
console.log('\n=== SECCIONES ALIMENTACION SALUDABLE.docx ===');
lines2.forEach(l => {
  if (l.includes('¿') || l.includes('Consejos') || l.includes('Recomendaciones') || (l === l.toUpperCase() && l.length > 3)) {
    console.log(' - ' + l);
  }
});
