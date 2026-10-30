const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permite resolver los archivos WebAssembly (.wasm) para expo-sqlite en web
config.resolver.assetExts.push('wasm');

// Encabezados Cross-Origin requeridos para Web Workers y SharedArrayBuffer (expo-sqlite) en Web
const previousEnhanceMiddleware = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const nextMiddleware = previousEnhanceMiddleware
      ? previousEnhanceMiddleware(middleware, server)
      : middleware;
    return (req, res, next) => {
      res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      return nextMiddleware(req, res, next);
    };
  },
};

module.exports = config;
