// constants/animations.ts
import welcome from "@assets/lottiefiles/welcome.json";
import health from "@assets/lottiefiles/health.json";
import care from "@assets/lottiefiles/care.json";
import doctor from "@assets/lottiefiles/doctor.json";
import medicine from "@assets/lottiefiles/medicine.json";

export const ANIMATIONS = {
  welcome,
  health,
  care,
  doctor,
  medicine,
} as const;

export type AnimationKey = keyof typeof ANIMATIONS;
