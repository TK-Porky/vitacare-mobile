import { AppointmentStatus } from './api-responses';

export interface Appointment {
  id: string;
  doctorName: string;
  doctorAvatarUri: string;
  avatarUri?: string;
  specialty: string;
  motif: string;
  clinic: string;
  address: string;
  date: string;
  time: string;
  dateTime?: string;
  status: AppointmentStatus;
  badge?: string | null;
  total?: number;
  currency?: string;
  invoiceLines?: {
    label: string;
    amount: number;
    isDiscount?: boolean;
  }[];
}
