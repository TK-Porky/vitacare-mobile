import { isValidCMPhone } from "@/utils";

export type RegisterMode = "phone" | "email";
export type ValidationErrors = Record<string, string>;

export interface RegisterFormData {
  fullName: string;
  mode: RegisterMode;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const validateRegisterForm = (
  data: RegisterFormData,
): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!data.fullName.trim()) {
    errors.fullName = "Le nom complet est requis.";
  } else if (data.fullName.trim().split(" ").length < 2) {
    errors.fullName = "Veuillez entrer votre nom et prénom.";
  }

  if (data.mode === "phone") {
    if (!isValidCMPhone(data.phone)) {
      errors.contact = "Numéro de téléphone invalide.";
    }
  } else {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.contact = "Adresse email invalide.";
    }

    if (data.password.length < 8) {
      errors.password = "Minimum 8 caractères.";
    } else if (data.password.includes(" ")) {
      errors.password = "Le mot de passe ne doit pas contenir d'espaces.";
    }

    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas.";
    } else if (data.confirmPassword && data.confirmPassword.includes(" ")) {
      errors.confirmPassword =
        "Le mot de passe ne doit pas contenir d'espaces.";
    }
  }

  return errors;
};
