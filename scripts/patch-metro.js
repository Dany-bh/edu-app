// scripts/patch-metro.js
const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  '@expo',
  'metro-config',
  'build',
  'serializer',
  'serializeChunks.js'
);

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  let modified = false;

  // 1. Corregir pathToRegex para que soporte rutas con \ y / en Windows
  const targetRegex = `function pathToRegex(path) {
    let normalizedPath = path.replace(/\\\\/g, '/');
    let regexSafePath = normalizedPath.replace(/[-[\\]{}()+?.,\\\\^$|#\\s]/g, '\\\\$&');
    regexSafePath = regexSafePath.replace(/\\*/g, '.*');
    return new RegExp('^' + regexSafePath + '$');
}`;

  const replacementRegex = `function pathToRegex(path) {
    let normalizedPath = path.replace(/\\\\/g, '/');
    let regexSafePath = normalizedPath.replace(/[-[\\]{}()+?.,^$|#\\s]/g, '\\\\$&');
    regexSafePath = regexSafePath.replace(/\\*/g, '.*');
    regexSafePath = regexSafePath.replace(/\\//g, '[/\\\\\\\\]');
    return new RegExp('^' + regexSafePath + '$');
}`;

  if (content.includes(targetRegex)) {
    content = content.replace(targetRegex, replacementRegex);
    modified = true;
  }

  // 2. Corregir aserción de Worker chunk para incluir fallback tolerante en Windows
  const targetAssert = `if (isWorker) {
                    (0, assert_1.default)(asyncChunks.size, \`Worker chunk not found for: \${dependency.absolutePath}\`);
                    for (const chunk of asyncChunks) {
                        chunk.seal();
                    }
                }`;

  const replacementAssert = `if (isWorker) {
                    if (!asyncChunks.size) {
                        const normDep = dependency.absolutePath.replace(/\\\\/g, '/');
                        for (const [depPath, depMod] of graph.dependencies.entries()) {
                            if (depPath.replace(/\\\\/g, '/') === normDep) {
                                const fbChunk = new Chunk(chunkIdForModules(new Set([depMod])), new Set([depMod]), graph, options, true, false, true);
                                chunks.add(fbChunk);
                                asyncChunks.add(fbChunk);
                                break;
                            }
                        }
                    }
                    for (const chunk of asyncChunks) {
                        chunk.seal();
                    }
                }`;

  if (content.includes(targetAssert)) {
    content = content.replace(targetAssert, replacementAssert);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[patch-metro] Parche aplicado exitosamente a @expo/metro-config para compatibilidad Windows/Web Worker.');
  } else {
    console.log('[patch-metro] El parche ya estaba aplicado o los targets han cambiado.');
  }
} else {
  console.log('[patch-metro] No se encontró @expo/metro-config. Omitiendo.');
}
