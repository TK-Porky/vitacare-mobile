import { AppointmentStatus } from "./api-responses";

export interface Appointment {
  id: number | string;
  title: string;
  doctorName: string;
  doctorAvatarUri: string;
  avatarUri?: string;
  specialty: string;
  reason: string;
  clinic: string;
  address: string;
  date: string;
  time: string;
  dateTime?: string;
  status: AppointmentStatus;
  paymentMethod: string;
  paymentProvider: string;
  paymentStatus?: string;
  isCancelled?: boolean;
  badge?: string | null;
  total?: number;
  currency?: string;
  invoiceLines?: {
    label: string;
    amount: number;
    isDiscount?: boolean;
  }[];
}
