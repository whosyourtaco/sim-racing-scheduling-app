// Simple encryption utility for localStorage
// Using a basic XOR cipher with a static key for simplicity
// This is NOT secure for sensitive data, but good enough for username storage

const ENCRYPTION_KEY = import.meta.env.VITE_ENC_KEY;

function xorEncrypt(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
}

function xorDecrypt(encryptedText, key) {
  // XOR encryption is symmetric, so we use the same function
  return xorEncrypt(encryptedText, key);
}

// Convert to/from base64 for safe localStorage storage
export function encryptData(data) {
  if (!data) return null;

  const jsonString = JSON.stringify(data);
  const encrypted = xorEncrypt(jsonString, ENCRYPTION_KEY);
  return btoa(encrypted); // Base64 encode
}

export function decryptData(encryptedData) {
  if (!encryptedData) return null;

  try {
    const encrypted = atob(encryptedData); // Base64 decode
    const decrypted = xorDecrypt(encrypted, ENCRYPTION_KEY);
    return JSON.parse(decrypted);
  } catch (error) {
    console.warn('Failed to decrypt data:', error);
    return null;
  }
}

// Utility functions for specific data types
export function saveEncryptedUser(userData) {
  const encrypted = encryptData(userData);
  if (encrypted) {
    localStorage.setItem('userSession', encrypted);
  }
}

export function loadEncryptedUser() {
  const encrypted = localStorage.getItem('userSession');
  return decryptData(encrypted);
}

export function clearEncryptedUser() {
  localStorage.removeItem('userSession');
}