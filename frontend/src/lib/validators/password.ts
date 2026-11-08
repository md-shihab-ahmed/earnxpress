/**
 * EarnXpress Password Policy & Common Dictionary Blacklist Validator (Frontend)
 */

export const COMMON_PASSWORDS_BLACKLIST = new Set([
  'password',
  'password123',
  'password123!',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'admin123',
  'admin123!',
  'welcome1',
  'welcome123',
  'welcome123!',
  'letmein123',
  'iloveyou1',
  'pass1234',
  'changeme1',
  'secret123',
  'master123',
  'football1',
  'monkey123',
  'sunshine1',
  'princess1',
  'dragon123',
  'trustno1',
  'testing123',
  'testing123!',
  'root1234',
  'toor1234',
  'user1234',
  'earnxpress',
  'earnxpress123',
  'earnxpress123!',
]);

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 4
  strengthLabel: 'Weak' | 'Fair' | 'Good' | 'Strong';
  errors: string[];
}

export function validatePassword(password: string, email?: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      score: 0,
      strengthLabel: 'Weak',
      errors: ['Password is required.'],
    };
  }

  // Length checks
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (password.length > 64) {
    errors.push('Password cannot exceed 64 characters.');
  }

  // Character class checks
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain at least one uppercase letter (A-Z).');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Must contain at least one lowercase letter (a-z).');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Must contain at least one number (0-9).');
  }
  if (!/[@#$%^&*!_~<>()+=\-[\]{}|;:,.?/\\]/.test(password)) {
    errors.push('Must contain at least one special character (@ # $ ! % & *).');
  }

  // Common password blacklist check
  const normalized = password.toLowerCase().trim();
  if (COMMON_PASSWORDS_BLACKLIST.has(normalized)) {
    errors.push('This password is too common or easily guessed.');
  }

  // Email similarity check
  if (email && typeof email === 'string') {
    const localPart = email.split('@')[0].toLowerCase().trim();
    if (localPart.length >= 4 && normalized.includes(localPart)) {
      errors.push('Password cannot contain your email username.');
    }
  }

  // Strength score calculation (0 - 4)
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[@#$%^&*!_~<>()+=\-[\]{}|;:,.?/\\]/.test(password)) score++;
  if (errors.length > 0 && score > 2) score = 1;

  let strengthLabel: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
  if (score === 2) strengthLabel = 'Fair';
  else if (score === 3) strengthLabel = 'Good';
  else if (score >= 4) strengthLabel = 'Strong';

  return {
    isValid: errors.length === 0,
    score: errors.length === 0 ? score : Math.min(score, 1),
    strengthLabel,
    errors,
  };
}
