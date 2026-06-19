import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

export const API_KEY_PREFIX = "losono_sk_";

export function generateApiKey(): { rawKey: string; displayPrefix: string } {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const secret = Buffer.from(bytes).toString("base64url");
  const rawKey = `${API_KEY_PREFIX}${secret}`;
  const displayPrefix = `${rawKey.slice(0, 16)}…`;

  return { rawKey, displayPrefix };
}

export async function hashApiKey(rawKey: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(rawKey, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

export async function verifyApiKey(
  rawKey: string,
  hash: string,
): Promise<boolean> {
  const [algo, salt, keyHex] = hash.split(":");
  if (algo !== "scrypt" || !salt || !keyHex) {
    return false;
  }

  const derived = (await scryptAsync(rawKey, salt, 64)) as Buffer;
  const stored = Buffer.from(keyHex, "hex");

  if (derived.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(derived, stored);
}

export function extractBearerApiKey(
  authorization: string | null,
): string | null {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  return token;
}
