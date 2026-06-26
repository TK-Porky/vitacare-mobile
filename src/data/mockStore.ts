import { Category, Drug } from "../types";


export const CATEGORIES: Category[] = [
  {
    id: '1',
    label: 'Gelules',
    imageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Red_capsule.jpg/320px-Red_capsule.jpg',
  },
  {
    id: '2',
    label: 'Comprimés',
    imageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/White_Pill.jpg/320px-White_Pill.jpg',
  },
  {
    id: '3',
    label: 'Sirop',
    imageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Cough_syrup.jpg/320px-Cough_syrup.jpg',
  },
];

export const POPULAR_DRUGS: Drug[] = [
  {
    id: '1',
    dosageForm: 'Gélule',
    name: 'Doliprane 500mg',
    referencePrice: 2500,
    manufacturer: 'Sanofi',
    imageUrl: 'https://via.placeholder.com/150',
  },
  {
    id: '2',
    dosageForm: 'Gélule',
    name: 'Doliprane 1000mg',
    referencePrice: 3500,
    manufacturer: 'Sanofi',
    imageUrl: 'https://via.placeholder.com/150',
  },
  {
    id: '3',
    dosageForm: 'Comprimé',
    name: 'Paracétamol 500mg',
    referencePrice: 1800,
    manufacturer: 'Viatris',
    imageUrl: 'https://via.placeholder.com/150',
  },
  {
    id: '4',
    dosageForm: 'Sirop',
    name: 'Toplexil 150ml',
    referencePrice: 3200,
    manufacturer: 'Sanofi',
    imageUrl: 'https://via.placeholder.com/150',
  },
];