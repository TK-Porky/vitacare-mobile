import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { MapPin } from "lucide-react-native";
import LegacyMapView, {
  UrlTile as LegacyUrlTile,
  Marker as LegacyMarker,
} from "react-native-maps";
import * as Location from "expo-location";
import { useTranslation } from "react-i18next";
import { StepHeader, SearchInput, PrimaryButton } from "@/components";
import { colors, fontFamily, fontSize } from "@/themes";
import { useProfile } from "@/hooks";

let MapComponent: any = null;
let CameraComponent: any = null;
let MapLibreMarker: any = null;
let mapLibreLoaded = false;

try {
  const MapLibre = require("@maplibre/maplibre-react-native");
  MapComponent = MapLibre.Map;
  CameraComponent = MapLibre.Camera;
  MapLibreMarker = MapLibre.Marker;
  mapLibreLoaded = true;
} catch (e) {}

const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    { id: "osm", type: "raster", source: "osm", minzoom: 0, maxzoom: 19 },
  ],
};

const isUsingMapLibre = mapLibreLoaded && Platform.OS !== "ios";

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
  const { t } = useTranslation();
  const { updateProfile, isUpdatingProfile } = useProfile();

  // ================================================================================== //
  // Refs
  // ================================================================================== //
  const mapRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const legacyMapRef = useRef<LegacyMapView>(null);
  const mapReadyForCamera = useRef(false);
  const pendingCamera = useRef<{
    coords: { latitude: number; longitude: number };
    zoomLevel: number;
  } | null>(null);

  // ================================================================================== //
  // States
  // ================================================================================== //
  const [location, setLocation] = useState(t("onboarding.location.searching")); // Location status
  const [region, setRegion] = useState(INITIAL_REGION); // Map region
  const [markerCoords, setMarkerCoords] = useState({
    latitude: INITIAL_REGION.latitude,
    longitude: INITIAL_REGION.longitude,
  }); // Marker coordinates
  const [searchQuery, setSearchQuery] = useState(""); // Search query
  const [isMapReady, setIsMapReady] = useState(false); // Map ready state

  const animateToCoords = (
    coords: { latitude: number; longitude: number },
    zoomLevel = 15,
  ) => {
    const newRegion = {
      ...coords,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setRegion(newRegion);

    if (isUsingMapLibre) {
      const execute = () => {
        if (!cameraRef.current) return;
        cameraRef.current.flyTo({
          center: [coords.longitude, coords.latitude],
          zoom: zoomLevel,
          duration: 800,
        });
      };
      if (mapReadyForCamera.current) execute();
      else pendingCamera.current = { coords, zoomLevel };
    } else if (legacyMapRef.current) {
      legacyMapRef.current.animateToRegion(newRegion, 500);
    }
  };

  const reverseGeocode = async (coords: { latitude: number; longitude: number }) => {
    try {
      const reverse = await Location.reverseGeocodeAsync(coords);
      if (reverse.length > 0) {
        const item = reverse[0];
        const parts = [
          item.street,
          item.streetNumber,
          item.district,
          item.city,
          item.region,
          item.country,
        ].filter(Boolean);
        setLocation(parts.join(", ") || t("profile.locationScreen.addressFound"));
      } else {
        setLocation(t("profile.locationScreen.addressNotFound"));
      }
    } catch {
      setLocation(t("profile.locationScreen.addressUnavailable"));
    }
  };

  const handleMapPress = async (coords: { latitude: number; longitude: number }) => {
    setMarkerCoords(coords);
    await reverseGeocode(coords);
  };

  const onMapReady = () => {
    setIsMapReady(true);
    mapReadyForCamera.current = true;
    if (pendingCamera.current && cameraRef.current?.flyTo) {
      const { coords, zoomLevel } = pendingCamera.current;
      cameraRef.current.flyTo({
        center: [coords.longitude, coords.latitude],
        zoom: zoomLevel,
        duration: 800,
      });
      pendingCamera.current = null;
    }
  };

  const handleLegacyMapPress = (e: any) => {
    if (e?.nativeEvent?.coordinate) {
      handleMapPress(e.nativeEvent.coordinate);
    }
  };

  // ================================================================================== //
  // Effects
  // ================================================================================== //
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocation(t("onboarding.location.permissionDenied"));
        return;
      }

      const currentLoc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: currentLoc.coords.latitude,
        longitude: currentLoc.coords.longitude,
      };
      setMarkerCoords(coords);
      animateToCoords(coords, 15);
      await reverseGeocode(coords);
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

      router.push("/(auth)/onboarding/search");
    } catch (e) {
      Alert.alert(t("errors.generic"), t("errors.somethingWrong"));
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
        onSkip={() => router.push("/(auth)/onboarding/search")}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("onboarding.location.title")}</Text>
          <Text style={styles.subtitle}>
            {t("onboarding.location.subtitle")}
          </Text>
        </View>

        <SearchInput
          value={searchQuery}
          onChangeText={handleChangeSearchQuery}
          placeholder={t("common.search") + "..."}
        />

        {/* Map Container */}
        <View style={styles.mapContainer}>
          {isUsingMapLibre && MapComponent && CameraComponent ? (
            <MapComponent
              ref={mapRef}
              style={styles.map}
              mapStyle={OSM_STYLE as any}
              logo={false}
              attribution={false}
              onPress={(e: any) => {
                if (e?.geometry?.coordinates) {
                  const [longitude, latitude] = e.geometry.coordinates;
                  handleMapPress({ latitude, longitude });
                }
              }}
              onDidFinishLoadingMap={onMapReady}
            >
              <CameraComponent
                ref={cameraRef}
                initialViewState={{
                  center: [INITIAL_REGION.longitude, INITIAL_REGION.latitude],
                  zoom: 12,
                }}
              />

              {markerCoords && MapLibreMarker && (
                <MapLibreMarker
                  id="onboarding-marker"
                  lngLat={[
                    markerCoords.longitude,
                    markerCoords.latitude,
                  ]}
                >
                  <View style={styles.customMarker}>
                    <MapPin size={24} color={colors.primary} fill={colors.white} />
                  </View>
                </MapLibreMarker>
              )}
            </MapComponent>
          ) : (
            <LegacyMapView
              ref={legacyMapRef}
              style={styles.map}
              region={region}
              onRegionChangeComplete={setRegion}
              onPress={handleLegacyMapPress}
              onMapReady={() => setIsMapReady(true)}
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={false}
              rotateEnabled
              scrollEnabled
              zoomEnabled
              moveOnMarkerPress={false}
            >
              <LegacyUrlTile
                urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maximumZ={19}
                flipY={false}
                tileSize={256}
              />
              <LegacyMarker coordinate={markerCoords}>
                <View style={styles.customMarker}>
                  <MapPin size={24} color={colors.primary} fill={colors.white} />
                </View>
              </LegacyMarker>
            </LegacyMapView>
          )}
          {!isMapReady && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.locationRow} activeOpacity={0.7}>
          <MapPin size={16} color={colors.inkMuted} />
          <Text style={styles.locationText} numberOfLines={1}>
            {location}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label={t("common.continue")}
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
    fontSize: fontSize["2xl"],
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
    overflow: "hidden",
    backgroundColor: colors.surface,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  customMarker: {
    width: 40,
    height: 40,
    backgroundColor: colors.white,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
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
