// Re-exports for backward compatibility (components moved to domain folders)
export {
  FilterBottomSheet,
  type FilterBottomSheetRef,
  type FilterState,
} from "../search";
export {
  ResultsDrawer,
  type ResultsDrawerRef,
} from "../search";
export {
  AddReminderBottomSheet,
  type ReminderData,
  type AddReminderBottomSheetRef,
} from "../medications";
export {
  BookingBottomSheet,
  type BookingBottomSheetRef,
  type BookingData,
} from "../booking";
export {
  ProfessionalProviderBottomSheet,
  type ReservationStatus,
  type ProfessionalProviderBottomSheetRef,
} from "../providers";
export {
  AppointmentDetailBottomSheet,
  type AppointmentDetailBottomSheetRef,
} from "../appointments";
export {
  DrugDetailBottomSheet,
  type DrugDetailBottomSheetRef,
} from "../medications";

export { ConfirmSheet, type ConfirmSheetRef } from "./ConfirmSheet";
export { DatePickerSheet, type DatePickerSheetRef } from "./DatePickerSheet";
