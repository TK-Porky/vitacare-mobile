export interface DashboardData {
  currentUser: string;
  currentDate: string;
  stats: {
    total: number;
    completed: number;
    pending: number;
    observance: number;
  };
  streak: number;
  activeMedications: number;
  monthlyProgress: number;
  medications: {
    name: string;
    time: string;
    dosage: string;
    status: 'taken' | 'missed' | 'pending';
  }[];
  appointments: {
    doctorName: string;
    clinic: string;
    date: string;
    time: string;
    status: 'confirmed' | 'pending' | 'cancelled';
  }[];
  observances: {
    title: string;
    description: string;
  }[];
  appointmentsToday: {
    doctorName: string;
    clinic: string;
    date: string;
    time: string;
  }[];
}
