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
import { CategoryListItem } from "@/components/medications/CategoryListItem";
import { DrugCardSkeleton } from "@/components/medications/DrugCardSkeleton";
import { useMedicationStore } from "@/store/medication.store";

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { medications, isLoading, fetchMedications } = useMedicationStore();

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    medications.forEach((m) => {
      if (m.dosageForm) map.set(m.dosageForm, (map.get(m.dosageForm) || 0) + 1);
    });
    return Array.from(map.entries()).map(([label, count], i) => ({
      id: String(i + 1),
      label,
      count,
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
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {t("medications.categories")}
          </Text>
          <Text style={styles.headerCount}>
            {categories.length} catégorie{categories.length !== 1 ? "s" : ""}
          </Text>
        </View>
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
          <View style={styles.list}>
            {Array.from({ length: 6 }).map((_, i) => (
              <DrugCardSkeleton key={i} />
            ))}
          </View>
        ) : (
          <View style={styles.list}>
            {categories.map((cat) => (
              <CategoryListItem
                key={cat.id}
                item={cat}
                count={cat.count}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
  },
  headerCount: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
  },
  list: {
    gap: 12,
  },
});
