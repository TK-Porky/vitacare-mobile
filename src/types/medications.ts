export type MedicationCategory = {
  id: string;
  label: string;
  imageUri: string;
};

export type MedicationScreenProps = {
  onReminders?: () => void;
};
