import { useRef, useState, useEffect, useCallback } from "react";
import { 
  View, 
  FlatList,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  Text,
  ScrollView,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { AppHeader, ClinicCard, ClinicCardSkeleton } from "../../../src/components";
import { colors, fontFamily, fontSize } from "../../../src/themes";
import {
  ProfessionalProviderBottomSheet,
  ProfessionalProviderBottomSheetRef,
} from "../../../src/components/providers/ProfessionalProviderBottomSheet";
import { useMapStore } from "../../../src/store";
import { ClinicProviderResponse, DoctorDetailResponse } from "../../../src/types/api-responses";
import { apiClient } from '../../../src/lib/api.client';
import { API_ENDPOINTS } from '../../../src/types/api-endpoints';

// ================================================================================== //
// Main
// ================================================================================== //
export default function ExploreScreen() {
  // ================================================================================== //
  // Hooks
  // ================================================================================== //
  const router = useRouter();
  const { 
    clinics, 
    isLoading, 
    fetchClinics, 
    fetchMoreClinics, 
    hasMore,
    selectedClinic,
    setSelectedClinic
  } = useMapStore();

  // ================================================================================== //
  // Refs
  // ================================================================================== //
  const profileSheetRef = useRef<ProfessionalProviderBottomSheetRef>(null);

  // ================================================================================== //
  // States
  // ================================================================================== //
  const [search, setSearch] = useState("");
  const [doctorDetail, setDoctorDetail] = useState<DoctorDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ================================================================================== //
  // Effects
  // ================================================================================== //
  useEffect(() => {
    fetchClinics({ search: search });
  }, []);

  // Fetch real doctor detail when selectedClinic changes
  useEffect(() => {
    if (!selectedClinic) { setDoctorDetail(null); return; }
    let cancelled = false;
    setDetailLoading(true);
    const doctorId = Number(selectedClinic.id);
    if (!doctorId) { setDetailLoading(false); return; }

    apiClient.get<any>(API_ENDPOINTS.CLINICS.DETAIL(doctorId))
      .then(res => {
        if (cancelled) return;
        if (!res.success) { setDoctorDetail(null); return; }
        const body = res.data;
        const detail: DoctorDetailResponse = body?.data ?? body;
        setDoctorDetail(detail);
      })
      .catch(() => { if (!cancelled) setDoctorDetail(null); })
      .finally(() => { if (!cancelled) setDetailLoading(false); });

    return () => { cancelled = true; };
  }, [selectedClinic]);

  // ================================================================================== //
  // Functions
  // ================================================================================== //
  
  /**
   * Handle search query change
   */
  const handleSearch = (query: string) => {
    setSearch(query);
    fetchClinics({ search: query });
  };

  /**
   * Handle more info press
   */
  const handleMore = (clinic: ClinicProviderResponse) => {
    setSelectedClinic(clinic);
    profileSheetRef.current?.open();
  };

  /**
   * Handle reservation start
   */
  const handleReservation = (clinic?: ClinicProviderResponse) => {
    const target = clinic ?? selectedClinic;
    if (target) setSelectedClinic(target);
    profileSheetRef.current?.close();
    router.push({
      pathname: '/booking',
      params: target ? {
        providerId: target.id,
        providerName: target.doctorName,
        specialty: target.specialty,
        avatarUri: target.avatarUri ?? '',
        priceXCFA: String(target.priceXCFA ?? 5000),
        location: `${target.clinicName}, ${target.location}`,
      } : {},
    } as never);
  };

  /**
   * Handle infinite scroll trigger
   */
  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchMoreClinics({ search: search });
    }
  };

  // ================================================================================== //
  // Renders
  // ================================================================================== //

  const renderItem = useCallback(({ item }: { item: ClinicProviderResponse }) => (
    <ClinicCard
      key={item.id}
      data={item}
      onReserve={() => handleReservation(item)}
      onMore={() => handleMore(item)}
      onProfile={() => handleMore(item)}
    />
  ), []);

  const renderFooter = () => {
    if (!isLoading) return <View style={{ height: 20 }} />;
    return (
      <View style={styles.loaderFooter}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucun professionnel trouvé</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.primary} />
      <AppHeader
        onSearch={() => handleSearch(search)}
        searchBar={true}
        searchValue={search}
        onSearchFocus={() => router.push('/(main)/explore/search' as never)}
      />

      {isLoading && clinics.length === 0 ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ClinicCardSkeleton />
          <ClinicCardSkeleton />
          <ClinicCardSkeleton />
        </ScrollView>
      ) : (
        <FlatList
          data={clinics}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          onRefresh={() => fetchClinics({ search: search })}
          refreshing={false}
        />
      )}

      {/* Profile sheet */}
      {selectedClinic && (
        <ProfessionalProviderBottomSheet
          ref={profileSheetRef}
          provider={doctorDetail ? {
            clinicName: doctorDetail.doctor.cabinet ?? selectedClinic.clinicName,
            avatarUri: doctorDetail.doctor.avatarUrl ?? selectedClinic.avatarUri ?? '',
            specialty: doctorDetail.doctor.specialization ?? selectedClinic.specialty,
            experience: doctorDetail.doctor.experienceYears
              ? `+${doctorDetail.doctor.experienceYears} Ans`
              : '+5 Ans',
            language: 'FR-EN',
            doctorName: doctorDetail.doctor.fullName ?? selectedClinic.doctorName,
            description: doctorDetail.doctor.bio ?? selectedClinic.description ?? 'Spécialiste de santé qualifié.',
            hoursRange: doctorDetail.doctor.hours ?? selectedClinic.hours,
            hoursdays: doctorDetail.doctor.days ?? selectedClinic.days,
            location: doctorDetail.doctor.address ?? doctorDetail.doctor.city ?? selectedClinic.location,
            coverUri: doctorDetail.doctor.serviceLocationImageUrl ?? selectedClinic.imageUri,
          } : {
            clinicName: selectedClinic.clinicName,
            avatarUri: selectedClinic.avatarUri || '',
            specialty: selectedClinic.specialty,
            experience: '+5 Ans',
            language: 'FR-EN',
            doctorName: selectedClinic.doctorName,
            description: selectedClinic.description || 'Spécialiste de santé qualifié.',
            hoursRange: selectedClinic.hours,
            hoursdays: selectedClinic.days,
            location: selectedClinic.location,
            coverUri: selectedClinic.imageUri,
          }}
          onReservation={() => handleReservation()}
          onShowOnMap={() => {
            profileSheetRef.current?.close();
            router.push(`/home/map?clinicId=${selectedClinic.id}` as never);
          }}
          onShare={() => {}}
        />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 20, // Increased gap for better card separation
  },
  loaderFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.inkLight,
  },
});