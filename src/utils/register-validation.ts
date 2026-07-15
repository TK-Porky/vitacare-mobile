import i18next from "@/i18n";
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
    errors.fullName = i18next.t("validation.fullNameRequired");
  } else if (data.fullName.trim().split(" ").length < 2) {
    errors.fullName = i18next.t("validation.fullNameRequired");
  }

  if (data.mode === "phone") {
    if (!isValidCMPhone(data.phone)) {
      errors.contact = i18next.t("validation.phoneInvalid");
    }
  } else {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.contact = i18next.t("validation.emailInvalid");
    }

    if (data.password.length < 8) {
      errors.password = i18next.t("validation.passwordMin");
    } else if (data.password.includes(" ")) {
      errors.password = i18next.t("validation.passwordSpace");
    }

    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = i18next.t("validation.passwordMismatch");
    } else if (data.confirmPassword && data.confirmPassword.includes(" ")) {
      errors.confirmPassword = i18next.t("validation.passwordSpace");
    }
  }

  return errors;
};
