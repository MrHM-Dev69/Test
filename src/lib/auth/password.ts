import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Minimum bar: 8+ chars, at least one letter and one digit. Real strength
// scoring (zxcvbn) can be layered in later without changing this contract.
export function isPasswordStrongEnough(plain: string): boolean {
  return plain.length >= 8 && /[A-Za-z]/.test(plain) && /\d/.test(plain);
}
