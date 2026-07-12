import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { notificationService } from "../services/notifications.service";

/**
 * Initialise le service de notifications au démarrage de l'app :
 * permissions, canaux Android, push token, listeners foreground/response.
 *
 * À utiliser UNE SEULE FOIS dans le layout racine.
 */
export function useNotificationBootstrapper() {
  const router = useRouter();
  const foregroundSub = useRef<{ remove: () => void } | null>(null);
  const responseSub = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    notificationService.register();
    notificationService.loadSavedToken();

    foregroundSub.current = notificationService.addForegroundListener();
    responseSub.current = notificationService.addResponseListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (!data) return;

        notificationService.markAsRead(
          response.notification.request.identifier,
        );

        switch (data.category) {
          case "appointment_reminder":
          case "appointment_confirmed":
          case "appointment_cancelled":
            router.push("/(tabs)/appointments");
            break;
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
      foregroundSub.current?.remove();
      responseSub.current?.remove();
    };
  }, []);
}
