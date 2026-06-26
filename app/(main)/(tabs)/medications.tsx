import { useState } from 'react';
import MedecineScreen from '../medications';
import RemindersScreen from '../medications/reminders';

export default function MedecineTab() {
  const [currentView, setCurrentView] = useState<String>();

  if (currentView === "reminders") {
    return (
      <RemindersScreen onStore={() => setCurrentView("store")} />
    )
  }

  return (
    <MedecineScreen
      onReminders={() => setCurrentView("reminders")}
    />
  );
}