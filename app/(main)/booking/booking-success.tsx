// app/(main)/booking/booking-success.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PrimaryButton } from "../../../src/components/buttons";
import { colors, fontFamily, fontSize } from "../../../src/themes";

// ================================================================================== //
// Main
// ================================================================================== //
export default function BookingSuccessScreen() {
  const router = useRouter();

  // ── Récupération des paramètres ─────────────────────────────────────────────
  const {
    doctorName = "Dr. Igriss Kakmo",
    specialty = "Gynécologue",
    avatarUri = "https://randomuser.me/api/portraits/men/75.jpg",
    date = "Jeudi, 26 Mars 2026",
    time = "12h00",
    paymentMode = "sur place", // "en ligne" ou "sur place"
    location = "Clinique Wellstar\nBastos, Yaoundé",
  } = useLocalSearchParams<{
    doctorName?: string;
    specialty?: string;
    avatarUri?: string;
    date?: string;
    time?: string;
    paymentMode?: string;
    location?: string;
  }>();

  const isOnlinePayment = paymentMode === "en ligne";

  // ── Message d'information selon le mode de paiement ──────────────────────
  const getNextStepMessage = () => {
    if (isOnlinePayment) {
      return {
        title: "Paiement en ligne",
        description:
          "Le praticien doit d'abord valider votre demande. Une notification vous sera envoyée pour procéder au paiement en ligne.",
        icon: "card-outline" as const,
      };
    }
    return {
      title: "Paiement sur place",
      description:
        "Le praticien doit d'abord valider votre demande. Vous recevrez une confirmation par notification. Le paiement se fera au cabinet.",
      icon: "cash-outline" as const,
    };
  };

  const nextStep = getNextStepMessage();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={[styles.content]}>
        {/* ── Illustration / icon ── */}
        <View style={styles.iconWrapper}>
          <Ionicons name="checkmark-circle" size={72} color={colors.primary} />
        </View>

        {/* ── Title ── */}
        <Text style={styles.title}>Demande envoyée !</Text>
        <Text style={styles.subtitle}>
          Votre demande de rendez-vous a bien été transmise au praticien.
        </Text>

        {/* ── Summary card ── */}
        <View style={styles.card}>
          {/* Doctor row */}
          <View style={styles.doctorRow}>
            <Image
              source={{ uri: avatarUri as string }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.doctorName}>{doctorName}</Text>
              <Text style={styles.doctorSpecialty}>{specialty}</Text>
            </View>
          </View>

          {/* Date & Time */}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.ink} />
            <Text
              style={[styles.infoText, { fontFamily: fontFamily.semiBold }]}
            >
              {date} à {time}
            </Text>
          </View>

          {/* Payment mode */}
          <View style={styles.infoRow}>
            <Ionicons
              name={isOnlinePayment ? "card-outline" : "cash-outline"}
              size={20}
              color={colors.ink}
            />
            <Text style={styles.infoText}>
              {isOnlinePayment ? "Paiement en ligne" : "Paiement sur place"}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={colors.ink} />
            <Text style={styles.infoText}>
              {(location as string).replace("\\n", "\n")}
            </Text>
          </View>
        </View>

        {/* ── Next step info box ── */}
        <View style={styles.nextStepBox}>
          <View style={styles.nextStepHeader}>
            <Ionicons name={nextStep.icon} size={20} color={colors.primary} />
            <Text style={styles.nextStepTitle}>Prochaine étape</Text>
          </View>
          <Text style={styles.nextStepDescription}>{nextStep.description}</Text>
          <Text style={styles.nextStepStatus}>
            Statut :{" "}
            <Text style={styles.statusPending}>En attente de validation</Text>
          </Text>
        </View>
      </View>

      {/* ── CTA ── */}
      <View style={styles.footer}>
        <PrimaryButton
          label="Voir mes réservations"
          variant="solid"
          size="md"
          onPress={() => router.replace("/(main)/(tabs)/appointments" as never)}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  iconWrapper: {
    marginBottom: 16,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.ink,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.inkLight,
    textAlign: "center",
    marginBottom: 32,
    marginTop: 4,
    lineHeight: 22,
  },

  // Card
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  doctorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
  },
  doctorName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  doctorSpecialty: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
    lineHeight: 20,
  },

  // Next step box
  nextStepBox: {
    width: "100%",
    marginTop: 16,
    backgroundColor: colors.primary + "08",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  nextStepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  nextStepTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  nextStepDescription: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    lineHeight: 18,
    marginBottom: 6,
  },
  nextStepStatus: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  statusPending: {
    fontFamily: fontFamily.semiBold,
    color: colors.warning || "#F59E0B",
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
  },
});
