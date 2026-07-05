import { ReminderData } from "@/components/modals";
import { CreateReminderRequest } from "@/types/api-requests";

/**
 * Validate reminder data
 */
export const validateReminderData = (data: ReminderData): string | null => {
  if (!data.drugName?.trim()) {
    return "Le nom du médicament est requis";
  }
  if (!data.form?.trim()) {
    return "La forme du médicament est requise";
  }
  const dosageValue = parseFloat(data.dosageValue);
  if (!data.dosageValue || isNaN(dosageValue) || dosageValue <= 0) {
    return "Le dosage doit être un nombre supérieur à 0";
  }
  if (!data.dosageUnit?.trim()) {
    return "L'unité de dosage est requise";
  }
  const frequencyCount = parseFloat(data.frequencyCount);
  if (!data.frequencyCount || isNaN(frequencyCount) || frequencyCount <= 0) {
    return "La fréquence doit être un nombre supérieur à 0";
  }
  if (!data.frequencyUnit?.trim()) {
    return "L'unité de fréquence est requise";
  }
  if (!data.time?.trim()) {
    return "L'heure est requise";
  }
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(data.time)) {
    return "L'heure doit être au format HH:MM (ex: 14:30)";
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
