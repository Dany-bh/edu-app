const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const basePath = path.join(__dirname, '../../');
const files = [
  '2020-Manual-EV-Adolescente.pdf',
  'Manual Componentes_Prevencion_No_transmisibles_2025.pdf'
];

async function extract() {
  const extractedData = [];
  
  for (const file of files) {
    const pdfPath = path.join(basePath, file);
    if (fs.existsSync(pdfPath)) {
      console.log(`Extracting text from ${file}...`);
      const dataBuffer = fs.readFileSync(pdfPath);
      try {
        const data = await pdf(dataBuffer);
        extractedData.push({
          filename: file,
          text: data.text
        });
        console.log(`Successfully extracted ${file}`);
      } catch (e) {
        console.error(`Error reading ${file}:`, e);
      }
    } else {
      console.error(`File not found: ${pdfPath}`);
    }
  }

  const output = path.join(__dirname, '../src/assets/pdfData.json');
  fs.writeFileSync(output, JSON.stringify(extractedData, null, 2));
  console.log(`Extraction complete. Saved to ${output}`);
}

extract();
