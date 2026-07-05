import { ReminderResponse } from "@/types/api-responses";

export type Reminder = ReminderResponse;
export type FilterStatus = "ALL" | "PENDING" | "TAKEN" | "MISSED" | "SNOOZED";

export const FREE_LIMIT = 5;

export const STATUS_LABELS: Record<FilterStatus, string> = {
  ALL: "Tous",
  PENDING: "En attente",
  TAKEN: "Pris",
  MISSED: "Manqué",
  SNOOZED: "Reporté",
};
