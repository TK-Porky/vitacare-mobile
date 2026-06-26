import { Category, Drug } from "../types";

export const MARKETPLACE_CATEGORIES : Category[]= [
  {
    id: '1',
    label: 'Gélules',
    imageUri:
      'https://www.pharma-gdd.com/media/cache/resolve/product_show/6e61742d666f726d2d6c2d617267696e696e652d313030306d672d36302d67656c756c65732d666163651dae633e.jpg'
  },
  {
    id: '2',
    label: 'Comprimés',
    imageUri:
      'https://www.pharma-gdd.com/media/cache/resolve/product_show/couvercle-severo-face.jpg'
  },
  {
    id: '3',
    label: 'Sirop',
    imageUri:
      'https://www.pharma-gdd.com/media/cache/resolve/product_show/9424ec37c2618f61005444a311de44e8a1d5073896dba59280d3c2e2ac7dfca6cc1412f2.jpg'
  },
  {
    id: '4',
    label: 'Vitamines',
    imageUri:
      'https://www.pharma-gdd.com/media/cache/resolve/product_show/61626f63612d766974616d696e2d632d6e61747572636f6d706c65782d736163686574732d66616365224b6812.jpg'
  },
  {
    id: '5',
    label: 'Sexualité',
    imageUri:
      'https://www.pharma-gdd.com/media/cache/resolve/product_show/696d672d33323239bffb65af.jpg'
  },
];

export const MARKETPLACE_DRUGS : Drug[]= [
  {
    id: '1',
    dosageForm: 'Comprimé',
    name: 'Doliprane 500mg',
    referencePrice: 2500,
    manufacturer: 'Sanofi',
    imageUrl: 'https://via.placeholder.com/150',
  },
  {
    id: '2',
    dosageForm: 'Comprimé',
    name: 'Viatris Paracétamol 1g',
    referencePrice: 3800,
    manufacturer: 'Viatris',
    imageUrl: 'https://via.placeholder.com/150',
  },
  {
    id: '3',
    dosageForm: 'Comprimé',
    name: 'Citrate de Bétahistine USPA 2g',
    referencePrice: 1200,
    manufacturer: 'USPA',
    imageUrl: 'https://via.placeholder.com/150',
  },
  {
    id: '4',
    dosageForm: 'Sirop',
    name: 'Mucolimax 200ml',
    referencePrice: 3200,
    manufacturer: 'Sanofi',
    imageUrl: 'https://via.placeholder.com/150',
  },
  {
    id: '5',
    dosageForm: 'Comprimé',
    name: 'Aspirine UPSA 1000',
    referencePrice: 4500,
    manufacturer: 'UPSA',
    imageUrl: 'https://via.placeholder.com/150',
  },
  {
    id: '6',
    dosageForm: 'Comprimé',
    name: 'Vitamine C UPSA 1000',
    referencePrice: 2800,
    manufacturer: 'UPSA',
    imageUrl: 'https://via.placeholder.com/150',
  },
];

export const MOCK_REMINDERS = [
  {
    id: "1",
    drugName: "Doliprane",
    form: "Gelule",
    dosageValue: "500",
    dosageUnit: "mg",
    frequencyUnit: "Jour",
    frequencyCount: "1",
    intervalDays: "0",
    time: "08:30",
  },
  {
    id: "2",
    drugName: "Amoxicilline",
    form: "Comprimé",
    dosageValue: "500",
    dosageUnit: "mg",
    frequencyUnit: "Jour",
    frequencyCount: "2",
    intervalDays: "0",
    time: "20:00",
  },
];
