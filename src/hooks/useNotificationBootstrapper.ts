import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import * as ExpoNotifications from "expo-notifications";
import { notificationService, inAppNotificationService } from "@/services/notifications";

// Mapping des types backend (data.type) vers les catégories de routage
const TYPE_TO_CATEGORY: Record<string, string> = {
  RDV_ACCEPTE_PAIEMENT: "appointment_confirmed",
  RDV_RAPPEL: "appointment_reminder",
  RDV_RAPPEL_MEDECIN: "appointment_reminder",
  RDV_RAPPEL_PAIEMENT: "appointment_confirmed",
};

export function useNotificationBootstrapper() {
  const router = useRouter();
  const responseSub = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    responseSub.current = notificationService.addResponseListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (!data) return;

        // Traiter les actions de rappel (take/snooze/skip)
        if (response.actionIdentifier !== ExpoNotifications.DEFAULT_ACTION_IDENTIFIER) {
          notificationService.handleNotificationAction(response);
          return;
        }

        inAppNotificationService.markAsRead(
          response.notification.request.identifier,
        );

        // Déduire la catégorie depuis le type backend si non fournie
        const type = data.type as string | undefined;
        const category = (data.category as string | undefined) ?? (type ? TYPE_TO_CATEGORY[type] : undefined);

        switch (category) {
          case "appointment_reminder":
          case "appointment_cancelled":
            router.push("/(tabs)/appointments");
            break;
          case "appointment_confirmed": {
            const appointmentId = (data.appointmentId as string | undefined) ?? (data.rdvId as string | undefined);
            if (appointmentId) {
              router.push({
                pathname: "/(tabs)/appointments",
                params: { payAppointmentId: appointmentId },
              } as never);
            } else {
              router.push("/(tabs)/appointments");
            }
            break;
          }
          case "treatment_reminder":
          case "treatment_refill":
            router.push("/(main)/(tabs)/medications");
            break;
          default:
            router.push("/(modals)/notifications");
        }
      },
    );

    return () => {
      responseSub.current?.remove();
    };
  }, []);
}
