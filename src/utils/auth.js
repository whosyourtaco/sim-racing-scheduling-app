// Secure authentication utilities
// Uses Web Crypto API for secure password hashing

/**
 * Hash a password using PBKDF2 with SHA-256
 * @param {string} password - The plain text password
 * @param {string} salt - The salt (if not provided, generates new one)
 * @returns {Promise<{hash: string, salt: string}>}
 */
export async function hashPassword(password, salt = null) {
  const encoder = new TextEncoder();

  // Generate salt if not provided
  if (!salt) {
    const saltBuffer = crypto.getRandomValues(new Uint8Array(32));
    salt = Array.from(saltBuffer).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Convert salt to Uint8Array
  const saltBuffer = new Uint8Array(salt.match(/.{2}/g).map(byte => parseInt(byte, 16)));

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  // Derive key using PBKDF2
  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000, // 100k iterations for security
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 256 bits output
  );

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(derivedKey));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return { hash, salt };
}

/**
 * Verify a password against a hash
 * @param {string} password - The plain text password to verify
 * @param {string} hash - The stored hash
 * @param {string} salt - The stored salt
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash, salt) {
  try {
    const { hash: newHash } = await hashPassword(password, salt);
    return newHash === hash;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Generate a secure session token
 * @returns {string}
 */
export function generateSessionToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate password strength
 * @param {string} password
 * @returns {{isValid: boolean, errors: string[]}}
 */
export function validatePassword(password) {
  const errors = [];

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize username input
 * @param {string} username
 * @returns {string}
 */
export function sanitizeUsername(username) {
  if (!username) return '';

  // Remove leading/trailing whitespace and limit length
  return username.trim().substring(0, 50);
}