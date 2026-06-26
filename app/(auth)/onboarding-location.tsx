import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import MapView, { UrlTile, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { StepHeader, SearchInput, PrimaryButton } from '../../src/components';
import { colors, fontFamily, fontSize } from '../../src/themes';
import { useProfile } from '../../src/hooks';

// ================================================================================== //
// Types
// ================================================================================== //
const INITIAL_REGION = {
  latitude: 3.848,
  longitude: 11.502,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// ================================================================================== //
// Main
// ================================================================================== //
export default function OnboardingLocationScreen() {
  const { updateProfile, isUpdatingProfile } = useProfile();
  // ================================================================================== //
  // States
  // ================================================================================== //
  const [location, setLocation] = useState('Recherche de votre position...'); // Location status
  const [region, setRegion] = useState(INITIAL_REGION); // Map region
  const [markerCoords, setMarkerCoords] = useState({
    latitude: INITIAL_REGION.latitude,
    longitude: INITIAL_REGION.longitude,
  }); // Marker coordinates
  const [searchQuery, setSearchQuery] = useState(''); // Search query
  const [isMapReady, setIsMapReady] = useState(false); // Map ready state

  // ================================================================================== //
  // Effects
  // ================================================================================== //
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation('Permission de localisation refusée');
        return;
      }

      let currentLoc = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: currentLoc.coords.latitude,
        longitude: currentLoc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      setMarkerCoords({
        latitude: currentLoc.coords.latitude,
        longitude: currentLoc.coords.longitude,
      });

      // Reverse geocoding to get address
      let reverse = await Location.reverseGeocodeAsync({
        latitude: currentLoc.coords.latitude,
        longitude: currentLoc.coords.longitude,
      });
      if (reverse.length > 0) {
        const item = reverse[0];
        setLocation(`${item.street || ''} ${item.name || ''}, ${item.city || ''}`);
      }
    })();
  }, []);

  /**
   * Handle continue button press
   * @returns {Promise<void>}
   */
  const handleContinue = async () => {
    try {
      // Save location to profile via API
      await updateProfile({
        address: location,
      } as any); 
      
      router.push('/(auth)/onboarding-search');
    } catch (e) {
      Alert.alert("Erreur", "Impossible de sauvegarder votre position.");
    }
  };

  /**
   * Handle search query change
   * @param query - The search query
   */
  const handleChangeSearchQuery = (query: string) => {
    setSearchQuery(query);
  };

  // ================================================================================== //
  // Returns
  // ================================================================================== //
  return (
    <View style={styles.root}>
      <StepHeader
        current={1}
        total={2}
        onSkip={() => router.push('/(auth)/onboarding-search')}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Indiquer votre position</Text>
          <Text style={styles.subtitle}>
            Les recherches s'effectueront dans un périmètre de 15km, ajustable plus tard
          </Text>
        </View>

        <SearchInput
          value={searchQuery}
          onChangeText={handleChangeSearchQuery}
          placeholder="Rechercher votre position..."
        />

        {/* Map Container */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={(e) => setMarkerCoords(e.nativeEvent.coordinate)}
            onMapReady={() => setIsMapReady(true)}
          >
            <UrlTile
              urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
              tileSize={256}
            />
            <Marker coordinate={markerCoords}>
              <View style={styles.customMarker}>
                <MapPin size={24} color={colors.primary} fill={colors.white} />
              </View>
            </Marker>
          </MapView>
          {!isMapReady && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.locationRow} activeOpacity={0.7}>
          <MapPin size={16} color={colors.inkMuted} />
          <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="Continuer"
          fullWidth
          isLoading={isUpdatingProfile}
          onPress={handleContinue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 20,
  },
  header: {
    gap: 8,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkMuted,
    lineHeight: 20,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customMarker: {
    width: 40,
    height: 40,
    backgroundColor: colors.white,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  locationText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 12,
  },
});
