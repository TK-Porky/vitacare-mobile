export interface Drug {
  id: string;
  name: string;
  commonName?: string;
  activeIngredients?: string;
  dosage?: string;
  dosageForm?: string;
  manufacturer?: string;
  requiresPrescription?: boolean;
  isGeneric?: boolean;
  referencePrice?: number;
  stockStatus?: string;
  isActive?: boolean;
  imageUrl?: string;
}
