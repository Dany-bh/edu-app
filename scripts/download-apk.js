const https = require('https');
const fs = require('fs');
const path = require('path');

const BUILD_ID = process.argv[2] || "4f8628c3-7674-4cb0-b17a-ed872985beb5";
const OUTPUT_PATH = path.resolve(__dirname, '..', 'EduSalud.apk');

function queryBuild(buildId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      query: `
        query getBuild($id: ID!) {
          appBuild(id: $id) {
            id
            status
            error {
              message
            }
            artifacts {
              buildUrl
            }
          }
        }
      `,
      variables: { id: buildId }
    });

    const options = {
      hostname: 'api.expo.dev',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json.data?.appBuild);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
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
          return reject(new Error(`Failed to download APK: status ${res.statusCode}`));
        }
        let downloadedBytes = 0;
        const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
        res.on('data', chunk => {
          downloadedBytes += chunk.length;
          if (totalBytes > 0 && downloadedBytes % (5 * 1024 * 1024) < chunk.length) {
            console.log(`Descargando: ${(downloadedBytes / (1024 * 1024)).toFixed(1)} MB / ${(totalBytes / (1024 * 1024)).toFixed(1)} MB...`);
          }
        });
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            console.log(`Descarga completa: ${(downloadedBytes / (1024 * 1024)).toFixed(1)} MB guardados en ${destPath}`);
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

async function checkStatus() {
  try {
    const build = await queryBuild(BUILD_ID);
    if (!build) {
      console.log("No se pudo obtener información del build.");
      return;
    }
    console.log(`Estado actual del build [${build.id}]: ${build.status}`);
    if (build.error) {
      console.error(`Error en el build: ${build.error.message}`);
    }
    if (build.status === 'FINISHED' && build.artifacts?.buildUrl) {
      console.log(`Build terminado con éxito! URL del artefacto: ${build.artifacts.buildUrl}`);
      console.log(`Iniciando descarga a: ${OUTPUT_PATH}...`);
      await downloadFile(build.artifacts.buildUrl, OUTPUT_PATH);
      console.log("APK lista para instalar en el móvil!");
    } else if (build.status === 'IN_PROGRESS' || build.status === 'NEW' || build.status === 'PENDING') {
      console.log("El build sigue en progreso en los servidores de EAS...");
    }
  } catch (err) {
    console.error("Error consultando estado:", err.message);
  }
}

checkStatus();
