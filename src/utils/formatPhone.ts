// Formatage numéro de téléphone camerounais
export function formatCMPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length <= 1) return cleaned;
  const firstDigit = cleaned.substring(0, 1);
  const remainingDigits = cleaned.substring(1);
  const match = remainingDigits.match(/.{1,2}/g);
  return match ? `${firstDigit} ${match.join(" ")}` : firstDigit;
}

// Validation numéro de téléphone camerounais
export function isValidCMPhone(phone: string): boolean {
  return /^(\+237|237)?[62][0-9]{8}$/.test(phone.replace(/\s/g, ""));
}
