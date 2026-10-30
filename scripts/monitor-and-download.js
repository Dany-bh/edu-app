const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BUILD_ID = process.argv[2] || "b98c6bcd-425d-43dc-8976-1b80f1abc3a6";
const OUTPUT_PATH = path.resolve(__dirname, '..', 'EduSalud.apk');

function getBuildInfo() {
  try {
    const raw = execSync(`npx eas-cli build:view ${BUILD_ID} --json`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 45000
    });
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(raw.substring(firstBrace, lastBrace + 1));
    }
  } catch (err) {
    console.error("Error consultando eas-cli:", err.message);
  }
  return null;
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const getReq = (curUrl) => {
      https.get(curUrl, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return getReq(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Error descargando APK: código HTTP ${res.statusCode}`));
        }
        let downloadedBytes = 0;
        const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
        res.on('data', chunk => {
          downloadedBytes += chunk.length;
          if (totalBytes > 0 && downloadedBytes % (5 * 1024 * 1024) < chunk.length) {
            console.log(`[Descarga] ${(downloadedBytes / (1024 * 1024)).toFixed(1)} MB / ${(totalBytes / (1024 * 1024)).toFixed(1)} MB...`);
          }
        });
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            console.log(`[Completado] Guardado exitosamente en: ${destPath} (${(downloadedBytes / (1024 * 1024)).toFixed(1)} MB)`);
            resolve(destPath);
          });
        });
      }).on('error', err => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    };
    getReq(url);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`Iniciando monitor para build ID: ${BUILD_ID}`);
  console.log(`Destino final del APK: ${OUTPUT_PATH}`);

  let attempts = 0;
  while (true) {
    attempts++;
    const info = getBuildInfo();
    if (!info) {
      console.log(`[Intento ${attempts}] No se pudo obtener información del build. Reintentando en 30s...`);
      await sleep(30000);
      continue;
    }

    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Estado: ${info.status}`);

    if (info.status === 'FINISHED') {
      const apkUrl = info.artifacts?.buildUrl || info.artifacts?.applicationArchiveUrl;
      if (apkUrl) {
        console.log(`Build terminado con éxito!`);
        console.log(`Descargando APK desde: ${apkUrl}`);
        await downloadFile(apkUrl, OUTPUT_PATH);
        console.log(`¡APK guardado exitosamente como EduSalud.apk!`);
        process.exit(0);
      } else {
        console.error("El build finalizó pero no se encontró la URL del archivo APK.");
        process.exit(1);
      }
    } else if (info.status === 'ERRORED' || info.status === 'CANCELED') {
      console.error(`El build terminó con estado de error: ${info.status}`);
      console.error(`Consulta detalles en: https://expo.dev/accounts/danybh/projects/edu-app/builds/${info.id}`);
      process.exit(1);
    }

    // Esperar 30 segundos antes de volver a consultar
    await sleep(30000);
  }
}

main();
