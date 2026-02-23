import { createCipheriv, createDecipheriv, randomBytes, createHmac } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Derive a per-user encryption key from the master key + userId salt.
 * Uses HMAC-SHA256 as a simple KDF (key derivation function).
 */
function deriveKey(userId: string): Buffer {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY;
  if (!masterKey) {
    throw new Error("ENCRYPTION_MASTER_KEY is not set");
  }
  return Buffer.from(
    createHmac("sha256", masterKey).update(userId).digest().subarray(0, KEY_LENGTH)
  );
}

/**
 * Encrypt plaintext using AES-256-GCM with a per-user derived key.
 * Returns a base64 string: iv (12 bytes) + tag (16 bytes) + ciphertext
 */
export function encrypt(plaintext: string, userId: string): string {
  const key = deriveKey(userId);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Pack: iv + tag + ciphertext → base64
  const packed = Buffer.concat([iv, tag, encrypted]);
  return packed.toString("base64");
}

/**
 * Decrypt an encrypted base64 string back to plaintext.
 * Expects format: iv (12 bytes) + tag (16 bytes) + ciphertext
 */
export function decrypt(encrypted: string, userId: string): string {
  const key = deriveKey(userId);
  const packed = Buffer.from(encrypted, "base64");

  const iv = packed.subarray(0, IV_LENGTH);
  const tag = packed.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Try to decrypt, returning the original string if decryption fails
 * (for backward compatibility with unencrypted data).
 */
export function tryDecrypt(value: string, userId: string): string {
  try {
    return decrypt(value, userId);
  } catch {
    // Not encrypted or wrong key — return as-is
    return value;
  }
}

/**
 * Check if ENCRYPTION_MASTER_KEY is configured.
 */
export function isEncryptionEnabled(): boolean {
  return !!process.env.ENCRYPTION_MASTER_KEY;
}
