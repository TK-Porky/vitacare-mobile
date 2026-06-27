import { AppointmentResponse } from "@/types/api-responses";
import { Appointment } from "@/types";

export function normalizeStatus(s: string): Appointment["status"] {
  const low = s.toLowerCase();
  if (low === "confirmed") return "CONFIRMED";
  if (low === "pending") return "PENDING";
  if (low === "paid") return "PAID";
  if (low === "cancelled") return "CANCELLED";
  if (low === "no_show") return "NO_SHOW";
  if (low === "in_progress") return "IN_PROGRESS";
  if (low === "rescheduled") return "RESCHEDULED";
  if (low === "completed") return "COMPLETED";
  return "PENDING";
}

export function isUpcoming(dateTime: string): boolean {
  const now = new Date();
  const appointmentDate = new Date(dateTime);
  return appointmentDate.getTime() > now.getTime();
}

export function toAppointment(r: AppointmentResponse): Appointment {
  const defaultPayment =
    r.total && r.total > 0 ? "Payer à la consultation" : "Gratuit";

  return {
    id: String(r.id),
    title: `Visite`,
    doctorName: r.doctorName,
    doctorAvatarUri: r.doctorAvatarUrl ?? "",
    avatarUri: r.doctorAvatarUrl ?? "",
    specialty: r.specialty,
    reason: r.reason ?? "",
    clinic: r.clinicName,
    address: r.clinicAddress,
    date: r.date,
    time: r.time,
    dateTime: r.dateTime,
    status: normalizeStatus(r.status),
    paymentMethod: defaultPayment,
    total: r.total ?? undefined,
  };
}

export function toSheetData(item: Appointment) {
  const defaultPayment =
    item.total && item.total > 0 ? "Payer à la consultation" : "Gratuit";

  return {
    id: item.id,
    title: `Visite`,
    doctorName: item.doctorName,
    doctorAvatarUri: item.doctorAvatarUri || item.avatarUri || "",
    specialty: item.specialty,
    status: item.status,
    reason: item.reason,
    date: item.date,
    time: item.time,
    dateTime: item.dateTime,
    clinic: item.clinic,
    address: item.address,
    locationSuffix: item.address,
    paymentMethod: item.paymentMethod ?? defaultPayment,
    invoiceLines: item.invoiceLines ?? [],
    total: item.total ?? undefined,
    currency: item.currency ?? "XAF",
  };
}
