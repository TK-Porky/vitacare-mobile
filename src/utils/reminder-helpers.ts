import i18next from "@/i18n";
import { ReminderData } from "@/components/modals";
import { CreateReminderRequest } from "@/types/api-requests";

export const validateReminderData = (data: ReminderData): string | null => {
  if (!data.drugName?.trim()) {
    return i18next.t("reminders.addForm.validation.nameRequired");
  }
  if (!data.form?.trim()) {
    return i18next.t("reminders.addForm.validation.formRequired");
  }
  const dosageValue = parseFloat(data.dosageValue);
  if (!data.dosageValue || isNaN(dosageValue) || dosageValue <= 0) {
    return i18next.t("reminders.addForm.validation.dosageInvalid");
  }
  if (!data.dosageUnit?.trim()) {
    return i18next.t("reminders.addForm.validation.unitRequired");
  }
  const frequencyCount = parseFloat(data.frequencyCount);
  if (!data.frequencyCount || isNaN(frequencyCount) || frequencyCount <= 0) {
    return i18next.t("reminders.addForm.validation.frequencyInvalid");
  }
  if (!data.frequencyUnit?.trim()) {
    return i18next.t("reminders.addForm.validation.frequencyUnitRequired");
  }
  if (!data.time?.trim()) {
    return i18next.t("reminders.addForm.validation.timeRequired");
  }
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(data.time)) {
    return i18next.t("reminders.addForm.validation.timeInvalid");
  }
  return null;
};

/**
 * Map ReminderData to CreateReminderRequest
 */
export const mapReminderDataToRequest = (
  data: ReminderData,
  patientId: string,
  medicationId?: string,
): CreateReminderRequest => {
  const formMap: Record<string, string> = {
    Gelule: "GELULE",
    Comprimé: "COMPRIME",
    Sirop: "SIROP",
    Injectable: "INJECTABLE",
    Pommade: "POMMADE",
    Sachet: "SACHET",
  };

  const frequencyMap: Record<string, string> = {
    Jour: "QUOTIDIEN",
    Semaine: "HEBDOMADAIRE",
    Mois: "MENSUEL",
  };

  const dosage = `${data.dosageValue}${data.dosageUnit}`;
  const times = [data.time];

  return {
    medicationId: Number(medicationId) || 0,
    medicationName: data.drugName,
    form: formMap[data.form] || data.form.toUpperCase(),
    dosage: dosage,
    frequency:
      frequencyMap[data.frequencyUnit] || data.frequencyUnit.toUpperCase(),
    times: times,
    patientId: Number(patientId),
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTime: data.time,
    notes: `Forme: ${data.form} | Dosage: ${dosage} | Fréquence: ${data.frequencyCount}x/${data.frequencyUnit.toLowerCase()}`,
  };
};
