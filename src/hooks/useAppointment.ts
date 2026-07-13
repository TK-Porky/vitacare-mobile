// hooks/useAppointments.ts
import { useCallback, useEffect, useState, useRef } from "react";
import { Alert } from "react-native";
import { Appointment } from "@/types";
import { appointmentService } from "@/services";
import { toAppointment } from "@/utils";

// Session cache – survives component remounts within the same app session
let sessionCache: Appointment[] | null = null;

export const useAppointments = () => {
  const [allAppointments, setAllAppointments] = useState<Appointment[]>(
    () => sessionCache ?? [],
  );
  const [isLoading, setIsLoading] = useState(sessionCache === null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFetching = useRef(false);

  const fetchAll = useCallback(async (refresh = false) => {
    if (sessionCache && !refresh) return;
    if (isFetching.current) return;
    isFetching.current = true;

    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const items = await appointmentService.getAll();
      const mapped = items.map(toAppointment);
      sessionCache = mapped;
      setAllAppointments(mapped);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des rendez-vous";
      if (!sessionCache) {
        setError(errorMessage);
        console.warn("Failed to fetch appointments", err);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      isFetching.current = false;
    }
  }, []);

  const refresh = useCallback(() => {
    sessionCache = null;
    return fetchAll(true);
  }, [fetchAll]);

  const cancelAppointment = useCallback(
    async (id: string): Promise<boolean> => {
      return new Promise((resolve) => {
        Alert.alert(
          "Confirmer l'annulation",
          "Voulez-vous vraiment annuler ce rendez-vous ?",
          [
            { text: "Non", style: "cancel", onPress: () => resolve(false) },
            {
              text: "Oui, annuler",
              style: "destructive",
              onPress: async () => {
                setIsCancelling(true);
                try {
                  await appointmentService.cancel(id);
                  await fetchAll();
                  Alert.alert("Succès", "Rendez-vous annulé avec succès");
                  resolve(true);
                } catch (err: any) {
                  Alert.alert(
                    "Erreur",
                    err?.message || "Impossible d'annuler le rendez-vous.",
                  );
                  resolve(false);
                } finally {
                  setIsCancelling(false);
                }
              },
            },
          ],
        );
      });
    },
    [fetchAll],
  );

  const markAppointmentAsPaid = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await appointmentService.markAsPaid(Number(id));
        await fetchAll();
        return true;
      } catch (error) {
        console.error("Erreur lors du marquage du paiement :", error);
        Alert.alert(
          "Erreur",
          "Impossible de marquer le paiement comme effectué.",
        );
        return false;
      }
    },
    [fetchAll],
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!mounted) return;
      await fetchAll();
    };
    load();
    return () => {
      mounted = false;
    };
  }, [fetchAll]);

  return {
    appointments: allAppointments,
    isLoading,
    isRefreshing,
    error,
    refresh,
    fetchAll,
    isCancelling,
    cancelAppointment,
    markAppointmentAsPaid, // ✅ Exposée
  };
};
