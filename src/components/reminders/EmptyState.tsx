import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Bell, Plus } from "lucide-react-native";
import { PrimaryButton } from "@/components/buttons";
import { colors, fontFamily, fontSize } from "@/themes";

type EmptyStateProps = { onAdd: () => void };

export const EmptyState = ({ onAdd }: EmptyStateProps) => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}>
      <Bell size={40} color={colors.inkLight} />
    </View>
    <Text style={styles.emptyText}>Aucun rappel actif</Text>
    <Text style={styles.emptySubtext}>
      Ajoutez vos médicaments pour ne plus jamais oublier une prise.
    </Text>
    <PrimaryButton
      label="Ajouter un rappel"
      onPress={onAdd}
      style={{ marginTop: 16 }}
      icon={<Plus size={18} color={colors.white} />}
    />
  </View>
);

const styles = StyleSheet.create({
  empty: {
    marginTop: "30%",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
  },
  emptySubtext: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    textAlign: "center",
    paddingHorizontal: 40,
    marginTop: 8,
    lineHeight: 20,
  },
});
