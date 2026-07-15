import { useMemo } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontFamily, fontSize } from "@/themes";
import { CategoryCard } from "@/components/medications/CategoryCard";
import { DrugCardSkeleton } from "@/components/medications/DrugCardSkeleton";
import { useMedicationStore } from "@/store/medication.store";

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { medications, isLoading, fetchMedications } = useMedicationStore();

  const categories = useMemo(() => {
    const forms = new Set<string>();
    medications.forEach((m) => {
      if (m.dosageForm) forms.add(m.dosageForm);
    });
    return Array.from(forms).map((form, i) => ({
      id: String(i + 1),
      label: form,
      imageUri: "https://via.placeholder.com/150",
    }));
  }, [medications]);

  const handleRefresh = () => {
    fetchMedications();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("medications.categories")}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading && medications.length === 0 ? (
          <View style={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <DrugCardSkeleton key={i} />
            ))}
          </View>
        ) : (
          <View style={styles.grid}>
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                item={cat}
                onPress={() =>
                  router.push(
                    `/(main)/medications/categories/${encodeURIComponent(cat.label)}` as never,
                  )
                }
              />
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
});
