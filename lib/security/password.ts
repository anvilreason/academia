const ITERATIONS = 210_000;
const KEY_LENGTH = 32;

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const stableSalt = new Uint8Array(salt).buffer;
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: stableSalt,
      iterations: ITERATIONS,
    },
    material,
    KEY_LENGTH * 8,
  );
  return new Uint8Array(bits);
}

export function validatePassword(password: string) {
  if (password.length < 10) return "密码至少需要 10 位";
  if (password.length > 128) return "密码不能超过 128 位";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "密码需同时包含字母和数字";
  }
  return null;
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt);
  return {
    hash: bytesToBase64(hash),
    salt: bytesToBase64(salt),
  };
}

export async function verifyPassword(
  password: string,
  expectedHash: string,
  salt: string,
) {
  const actual = await derive(password, base64ToBytes(salt));
  const expected = base64ToBytes(expectedHash);
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual[index] ^ expected[index];
  }
  return difference === 0;
}
