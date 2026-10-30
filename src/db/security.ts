// src/db/security.ts
import * as Crypto from 'expo-crypto';

const KDF_PREFIX = 'kdf_v1';
const KDF_ITERATIONS = 10000;

/**
 * Genera un hash criptográfico robusto utilizando KDF iterado con SHA-512 y salting aleatorio.
 * Proporciona resistencia a ataques de fuerza bruta por GPU.
 */
export async function hashPassword(password: string, customSalt?: string): Promise<{ hash: string; salt: string }> {
  const salt = customSalt || Crypto.randomUUID();
  let currentHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA512,
    `${salt}:${password}`
  );

  // Iteraciones criptográficas para incrementar el factor de trabajo (Work Factor)
  for (let i = 0; i < KDF_ITERATIONS; i++) {
    currentHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA512,
      `${currentHash}:${salt}:${i}`
    );
  }

  const finalHash = `${KDF_PREFIX}$${KDF_ITERATIONS}$${salt}$${currentHash}`;
  return { hash: finalHash, salt };
}

/**
 * Valida una contraseña contra un hash almacenado.
 * Admite:
 * 1. Formato moderno KDF v1 (SHA-512 iterado con salt)
 * 2. Formato de transición (SHA-256 con salt)
 * 3. Formato heredado (SHA-256 sin salt)
 * 
 * Retorna si es válida y si requiere migración al nuevo algoritmo.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string = ''
): Promise<{ isValid: boolean; needsUpgrade: boolean }> {
  if (!storedHash) return { isValid: false, needsUpgrade: false };

  // 1. Formato KDF Moderno
  if (storedHash.startsWith(`${KDF_PREFIX}$`)) {
    const parts = storedHash.split('$');
    if (parts.length === 4) {
      const iterations = parseInt(parts[1], 10);
      const salt = parts[2];
      const targetHash = parts[3];

      let currentHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA512,
        `${salt}:${password}`
      );

      for (let i = 0; i < iterations; i++) {
        currentHash = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA512,
          `${currentHash}:${salt}:${i}`
        );
      }

      const isValid = currentHash === targetHash;
      return { isValid, needsUpgrade: false };
    }
  }

  // 2. Formato intermedio: SHA-256 con salt
  if (storedSalt && storedSalt.trim().length > 0) {
    const computedHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      storedSalt + password
    );
    if (computedHash === storedHash) {
      return { isValid: true, needsUpgrade: true };
    }
  }

  // 3. Formato heredado: SHA-256 directo sin salt
  const legacyHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  if (legacyHash === storedHash) {
    return { isValid: true, needsUpgrade: true };
  }

  return { isValid: false, needsUpgrade: false };
}
