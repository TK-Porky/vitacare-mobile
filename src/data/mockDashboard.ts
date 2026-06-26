import { DashboardData } from "../types";

export const DASHBOARD_DATA: DashboardData = {
  currentUser: "Bille",
  currentDate: "10 Avril 2026",
  stats: {
    total: 10,
    completed: 7,
    pending: 3,
    observance: 70,
  },
  streak: 5,
  activeMedications: 3,
  monthlyProgress: 75,
  medications: [
    {
      name: "Amoxicilline",
      time: "08:00",
      dosage: "2 Comprimés",
      status: "taken",
    },
    {
      name: "Paracétamol",
      time: "12:00",
      dosage: "1 Comprimé",
      status: "pending",
    },
    {
      name: "Ibuprofène",
      time: "16:00",
      dosage: "1 Comprimé",
      status: "pending",
    },
  ],
  appointments: [
    {
      doctorName: "Dr. Idriss Kakmo",
      clinic: "Clinique Centrale",
      date: "26 Mars 2026",
      time: "14:00",
      status: "confirmed",
    },
    {
      doctorName: "Dr. Marie Dupont",
      clinic: "Clinique Nord",
      date: "27 Mars 2026",
      time: "10:00",
      status: "pending",
    },
  ],
  observances: [
    {
      title: "Hydratation",
      description: "Boire 2L d'eau par jour",
    },
    {
      title: "Activité",
      description: "30 minutes de marche quotidienne",
    },
    {
      title: "Sommeil",
      description: "8 heures de sommeil par nuit",
    },
  ],
  appointmentsToday: [
    {
      doctorName: "Dr. Idriss Kakmo",
      clinic: "Clinique Centrale",
      date: "25 Mars 2026",
      time: "09:00",
    },
  ],
};