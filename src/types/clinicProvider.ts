export interface ClinicProvider {
  id: string;
  avatarUri?: string;
  doctorName: string;
  specialty: string;
  price?: string;
  priceXCFA?: number;
  clinicName: string;
  description: string;
  hours?: string;
  days?: string;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  imageUri?: string;
  imageFallbackColor?: string;
  rating?: number;
  reviewCount?: number;
  availability?: {
    date: string;
    slots: string[];
  }[];
}
