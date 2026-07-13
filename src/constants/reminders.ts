import { TFunction } from "i18next";
import { ReminderResponse } from "@/types/api-responses";

export type Reminder = ReminderResponse;
export type FilterStatus = "ALL" | "PENDING" | "TAKEN" | "MISSED" | "SNOOZED";

export const FREE_LIMIT = 5;

export const getStatusLabels = (t: TFunction): Record<FilterStatus, string> => ({
  ALL: t("reminders.filters.ALL"),
  PENDING: t("reminders.filters.PENDING"),
  TAKEN: t("reminders.filters.TAKEN"),
  MISSED: t("reminders.filters.MISSED"),
  SNOOZED: t("reminders.filters.SNOOZED"),
});
