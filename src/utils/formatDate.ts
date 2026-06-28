const MONTHS_FR = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sept",
  "Oct",
  "Nov",
  "Déc",
];

/**
 * "2026-06-30" → { day: "30", month: "JUIN" }
 */
export function parseAppointmentDate(isoDate: string) {
  const [year, m, d] = isoDate.split("-");
  const day = String(parseInt(d, 10)); // "30"  (pas de zéro en tête)
  const month = MONTHS_FR[parseInt(m, 10) - 1]; // "Juin"
  return { day, month, year }; // { day: "30", month: "JUIN", year: "2026" }
}

/**
 * "2026-06-30" → "30 Juin"  (pour l'affichage inline)
 */
export function formatDateShort(isoDate: string) {
  const { day, month } = parseAppointmentDate(isoDate);
  return `${day} ${month}`; // "30 JUIN"
}

/**
 * "08:30:00" → "08 h 30"
 */
export function formatTimeFr(isoTime: string) {
  const [h, m] = isoTime.split(":");
  return `${h} h ${m}`;
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  return `Il y a ${Math.floor(hours / 24)} j`;
}
