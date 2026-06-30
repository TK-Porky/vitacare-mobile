export type ReminderData = {
  drugName: string;
  form: string;
  dosageValue: string;
  dosageUnit: string;
  frequencyUnit: string;
  frequencyCount: string;
  intervalDays: string;
  medicationId?: string;
  time: string;
  notes?: string;
};

export type AddReminderBottomSheetRef = {
  open: () => void;
  close: () => void;
};

export type Props = {
  onAdd?: (data: ReminderData) => void;
  onClose?: () => void;
  isSubmitting?: boolean;
};

export const FORMS = [
  "Gelule",
  "Comprimé",
  "Sirop",
  "Injectable",
  "Pommade",
  "Sachet",
];
export const DOSAGE_UNITS = ["mg", "ml", "g", "µg", "UI"];
export const FREQUENCY_UNITS = ["Semaine", "Jour", "Mois"];
export const HOURS_24 = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0"),
);
export const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);

export const createDefaultReminder = (): ReminderData => ({
  drugName: "",
  form: "Gelule",
  dosageValue: "",
  dosageUnit: "mg",
  frequencyUnit: "Semaine",
  frequencyCount: "",
  intervalDays: "",
  time: "12:30",
});
