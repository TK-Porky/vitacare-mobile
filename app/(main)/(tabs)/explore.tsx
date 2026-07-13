import { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppHeader, ClinicCard, ClinicCardSkeleton } from "@/components";
import { colors, fontFamily, fontSize } from "@/themes";
import {
  ProfessionalProviderBottomSheet,
  ProfessionalProviderBottomSheetRef,
  ShareContactBottomSheet,
  ShareContactBottomSheetRef,
} from "@/components/providers";
import { useMapStore } from "@/store";
import {
  ClinicProviderResponse,
  DoctorDetailResponse,
} from "@/types/api-responses";
import { apiClient } from "@/lib/api.client";
import { API_ENDPOINTS } from "@/types/api-endpoints";
import { useDebounce } from "@/hooks/useDebounce";
import { useNotificationStore } from "@/store/notification.store";
import i18next from "@/i18n";

// ================================================================================== //
// Helper Functions
// ================================================================================== //

/**
 * Map clinic and doctor detail to provider data for the bottom sheet
 */
const mapProviderData = (
  clinic: ClinicProviderResponse | null,
  detail: DoctorDetailResponse | null,
) => {
  // ✅ Vérifier que clinic existe
  if (!clinic) {
    return {
      clinicName: i18next.t('provider.clinicNameDefault'),
      avatarUri: "",
      specialty: i18next.t('provider.specialtyDefault'),
      experience: i18next.t('provider.experienceDefault', { years: 5 }),
      language: "FR-EN",
      doctorName: i18next.t('provider.doctorNameDefault'),
      description: i18next.t('provider.descriptionDefault'),
      hoursRange: i18next.t('provider.hoursDefault'),
      hoursdays: i18next.t('provider.daysDefault'),
      location: i18next.t('provider.locationDefault'),
      coverUri: undefined,
      phone: undefined,
      email: undefined,
    };
  }

  if (detail) {
    return {
      clinicName:
        detail.doctor.cabinet ?? clinic.clinicName ?? i18next.t('provider.clinicNameDefault'),
      avatarUri: detail.doctor.avatarUrl ?? clinic.avatarUri ?? "",
      specialty:
        detail.doctor.specialization ?? clinic.specialty ?? i18next.t('provider.specialtyDefault'),
      experience: detail.doctor.experienceYears
        ? i18next.t('provider.experienceDefault', { years: detail.doctor.experienceYears })
        : i18next.t('provider.experienceDefault', { years: 5 }),
      language: "FR-EN",
      doctorName: detail.doctor.fullName ?? clinic.doctorName ?? i18next.t('provider.doctorNameDefault'),
      description:
        detail.doctor.bio ??
        clinic.description ??
        i18next.t('provider.descriptionDefaultQualified'),
      hoursRange:
        detail.doctor.hours ?? clinic.hours ?? i18next.t('provider.hoursDefault'),
      hoursdays: detail.doctor.days ?? clinic.days ?? i18next.t('provider.daysDefault'),
      location:
        detail.doctor.address ??
        detail.doctor.city ??
        clinic.location ??
        i18next.t('provider.locationDefault'),
      coverUri: detail.doctor.serviceLocationImageUrl ?? clinic.imageUri,
      phone: detail.doctor.phone ?? clinic.phone,
      email: detail.doctor.email ?? clinic.email,
    };
  }

  return {
    clinicName: clinic.clinicName ?? i18next.t('provider.clinicNameDefault'),
    avatarUri: clinic.avatarUri || "",
    specialty: clinic.specialty ?? i18next.t('provider.specialtyDefault'),
    experience: i18next.t('provider.experienceDefault', { years: 5 }),
    language: "FR-EN",
    doctorName: clinic.doctorName ?? i18next.t('provider.doctorNameDefault'),
    description: clinic.description || i18next.t('provider.descriptionDefaultQualified'),
    hoursRange: clinic.hours ?? i18next.t('provider.hoursDefault'),
    hoursdays: clinic.days ?? i18next.t('provider.daysDefault'),
    location: clinic.location ?? i18next.t('provider.locationDefault'),
    coverUri: clinic.imageUri,
    phone: clinic.phone,
    email: clinic.email,
  };
};

// ================================================================================== //
// Main
// ================================================================================== //

export default function ExploreScreen() {
  // ================================================================================== //
  // Hooks
  // ================================================================================== //
  const { t } = useTranslation();
  const router = useRouter();
  const {
    clinics,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    fetchClinics,
    fetchMoreClinics,
    selectedClinic,
    setSelectedClinic,
  } = useMapStore();

  const unreadCount = useNotificationStore((state) => state.unreadCount);

  // ================================================================================== //
  // Refs
  // ================================================================================== //
  const profileSheetRef = useRef<ProfessionalProviderBottomSheetRef>(null);
  const shareSheetRef = useRef<ShareContactBottomSheetRef>(null);

  // ================================================================================== //
  // States
  // ================================================================================== //
  const [search, setSearch] = useState("");
  const [doctorDetail, setDoctorDetail] = useState<DoctorDetailResponse | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<any>(null);

  const debouncedSearch = useDebounce(search, 500);

  // ================================================================================== //
  // Effects
  // ================================================================================== //

  useEffect(() => {
    fetchClinics({ search: debouncedSearch });
  }, [debouncedSearch, fetchClinics]);

  useEffect(() => {
    if (!selectedClinic) {
      setDoctorDetail(null);
      setDetailError(null);
      setCurrentProvider(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);

    const doctorId = Number(selectedClinic.id);
    if (!doctorId) {
      setDetailLoading(false);
      return;
    }

    apiClient
      .get<any>(API_ENDPOINTS.CLINICS.DETAIL(doctorId))
      .then((res) => {
        if (cancelled) return;
        if (!res.success) {
          setDetailError(res.message || t('common.error'));
          setDoctorDetail(null);
          return;
        }
        const body = res.data;
        const detail: DoctorDetailResponse = body?.data ?? body;
        setDoctorDetail(detail);
        setDetailError(null);

        // ✅ Mettre à jour le provider courant
        if (selectedClinic) {
          setCurrentProvider(mapProviderData(selectedClinic, detail));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setDetailError(err.message || t('common.error'));
          setDoctorDetail(null);
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedClinic]);

  // ================================================================================== //
  // Functions
  // ================================================================================== //

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
  }, []);

  const handleMore = useCallback(
    (clinic: ClinicProviderResponse) => {
      setSelectedClinic(clinic);
      profileSheetRef.current?.open();
    },
    [setSelectedClinic],
  );

  const handleReservation = useCallback(
    (clinic?: ClinicProviderResponse) => {
      const target = clinic ?? selectedClinic;
      if (!target) {
        Alert.alert(t('common.error'), t('explore.noProfessionalSelected'));
        return;
      }

      setSelectedClinic(target);
      profileSheetRef.current?.close();

      router.push({
        pathname: "/booking",
        params: {
          providerId: target.id,
          providerName: target.doctorName,
          specialty: target.specialty,
          avatarUri: target.avatarUri ?? "",
          priceXCFA: String(target.priceXCFA ?? 5000),
          location: `${target.clinicName}, ${target.location}`,
        },
      } as never);
    },
    [selectedClinic, setSelectedClinic, router],
  );

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading) {
      fetchMoreClinics({ search: debouncedSearch });
    }
  }, [hasMore, isLoadingMore, isLoading, fetchMoreClinics, debouncedSearch]);

  const handleRefresh = useCallback(() => {
    fetchClinics({ search: debouncedSearch });
  }, [fetchClinics, debouncedSearch]);

  const handleNotification = useCallback(() => {
    router.push("/(modals)/notifications" as never);
  }, [router]);

  // ✅ Gestion du partage - ouvre le bottom sheet de partage
  const handleShare = useCallback(() => {
    if (currentProvider) {
      shareSheetRef.current?.open();
    } else {
      Alert.alert(t('common.info'), t('explore.noContactToShare'));
    }
  }, [currentProvider]);

  // ================================================================================== //
  // Renders
  // ================================================================================== //

  const renderItem = useCallback(
    ({ item }: { item: ClinicProviderResponse }) => (
      <ClinicCard
        key={item.id}
        data={item}
        onReserve={() => handleReservation(item)}
        onMore={() => handleMore(item)}
        onProfile={() => handleMore(item)}
      />
    ),
    [handleReservation, handleMore],
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return <View style={{ height: 20 }} />;
    return (
      <View style={styles.loaderFooter}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loaderText}>{t('common.loading')}</Text>
      </View>
    );
  }, [isLoadingMore]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {search
            ? t('explore.noProfessionalFound')
            : t('explore.noProfessionalAvailable')}
        </Text>
        {search && (
          <Text style={styles.emptySubtext}>
            {t('explore.tryModifySearch')}
          </Text>
        )}
      </View>
    );
  }, [isLoading, search]);

  const renderSkeletons = useCallback(
    () => (
      <>
        <ClinicCardSkeleton />
        <ClinicCardSkeleton />
        <ClinicCardSkeleton />
      </>
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: ClinicProviderResponse) => item.id,
    [],
  );

  // ================================================================================== //
  // Render
  // ================================================================================== //

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.primary} />

      <AppHeader
        showLogo={false}
        searchBar={true}
        searchValue={search}
        onSearchFocus={() => router.push("/(main)/explore/search" as never)}
      />

      {isLoading && clinics.length === 0 ? (
        <FlatList
          data={[1, 2, 3]}
          renderItem={renderSkeletons}
          keyExtractor={(item) => `skeleton-${item}`}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <FlatList
          data={clinics}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={true}
        />
      )}

      {/* Profile sheet */}
      {selectedClinic && currentProvider && (
        <ProfessionalProviderBottomSheet
          ref={profileSheetRef}
          provider={currentProvider}
          onReservation={() => handleReservation()}
          onShowOnMap={() => {
            profileSheetRef.current?.close();
            router.push(`/home/map?clinicId=${selectedClinic.id}` as never);
          }}
          onShare={handleShare}
        />
      )}

      {/* Share Contact Bottom Sheet */}
      <ShareContactBottomSheet
        ref={shareSheetRef}
        provider={
          currentProvider || mapProviderData(selectedClinic!, doctorDetail)
        }
      />
    </SafeAreaView>
  );
}

// ================================================================================== //
// Styles
// ================================================================================== //

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    gap: 20,
    flexGrow: 1,
  },
  loaderFooter: {
    paddingVertical: 20,
    alignItems: "center",
    gap: 8,
  },
  loaderText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkLight,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.inkLight,
  },
  emptySubtext: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    marginTop: 8,
  },
});
