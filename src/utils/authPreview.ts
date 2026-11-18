/** Display only; never mutate the original address used by a future API. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 1) return '***';
  const local = email.slice(0, at);
  const visibleEnd = local.length > 2 ? local.slice(-1) : '';
  return `${local[0]}${'*'.repeat(
    Math.max(2, local.length - 2),
  )}${visibleEnd}${email.slice(at)}`;
}

export const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export function passwordRules(password: string) {
  return {
    length: password.length >= 8,
    digit: /\d/.test(password),
    nonDigit: /\D/.test(password),
  };
}
