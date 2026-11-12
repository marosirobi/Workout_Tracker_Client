export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type PasswordProblem =
  | "tooShort"
  | "tooLong"
  | "noLetter"
  | "noDigit"
  | "noSpecial";

function isLetter(char: string) {
  return char.toLowerCase() !== char.toUpperCase();
}

function isDigit(char: string) {
  return char >= "0" && char <= "9";
}

function isSpace(char: string) {
  return /\s/.test(char);
}

export function isValidEmail(email: string) {
  return EMAIL_PATTERN.test(email);
}

export function checkPassword(password: string): PasswordProblem | null {
  if (password.length < PASSWORD_MIN_LENGTH) return "tooShort";
  if (password.length > PASSWORD_MAX_LENGTH) return "tooLong";

  const chars = Array.from(password);
  if (!chars.some(isLetter)) return "noLetter";
  if (!chars.some(isDigit)) return "noDigit";
  if (!chars.some((c) => !isLetter(c) && !isDigit(c) && !isSpace(c))) {
    return "noSpecial";
  }
  return null;
}
