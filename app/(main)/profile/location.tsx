import { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin, Crosshair } from "lucide-react-native";
import LegacyMapView, { UrlTile as LegacyUrlTile, Marker as LegacyMarker, Circle } from "react-native-maps";
import * as Location from "expo-location";
import { colors, fontFamily, fontSize } from "../../../src/themes";
import { TopBar, PrimaryButton, SearchInput } from "../../../src/components";
import { useProfile } from "../../../src/hooks";
import { useAuthStore } from "../../../src/store";

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

const INITIAL_REGION = {
  latitude: 3.848,
  longitude: 11.502,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const ZOOM_LEVELS = { city: 12, street: 16, building: 18, default: 14, user: 15 };

const isUsingMapLibre = mapLibreLoaded && Platform.OS !== "ios";

export default function LocationScreen() {
  const user = useAuthStore((s) => s.user);
  const { updateProfile, isUpdatingProfile } = useProfile();

  const [address, setAddress] = useState("Recherche de votre position...");
  const [coordinates, setCoordinates] = useState({
    latitude: INITIAL_REGION.latitude,
    longitude: INITIAL_REGION.longitude,
  });
  const [region, setRegion] = useState(INITIAL_REGION);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [userMarker, setUserMarker] = useState<{
    coordinate: { latitude: number; longitude: number };
    title?: string;
  } | null>(null);
  const [searchMarkers, setSearchMarkers] = useState<{
    id: string;
    coordinate: { latitude: number; longitude: number };
  }[]>([]);
  const [locationAccuracy, setLocationAccuracy] = useState(0);
  const [locationSet, setLocationSet] = useState(false);

  const mapRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const legacyMapRef = useRef<LegacyMapView>(null);
  const searchInputRef = useRef<any>(null);
  const mapReadyForCamera = useRef(false);
  const pendingCamera = useRef<{
    coords: { latitude: number; longitude: number };
    zoomLevel: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      const granted = status === "granted";
      setHasPermission(granted);
      if (granted) getCurrentLocation();
    })();
  }, []);

  const reverseGeocode = useCallback(
    async (coords: { latitude: number; longitude: number }) => {
      setIsGeocoding(true);
      try {
        const results = await Location.reverseGeocodeAsync(coords);
        if (results.length > 0) {
          const item = results[0];
          const parts = [
            item.street, item.streetNumber, item.district,
            item.city, item.region, item.country,
          ].filter(Boolean);
          setAddress(parts.join(", ") || "Position détectée");
          setCoordinates(coords);
          setError(null);
        } else {
          setAddress("Adresse non trouvée");
          setCoordinates(coords);
        }
      } catch {
        setAddress("Adresse non disponible");
        setError("Impossible d'obtenir l'adresse.");
      } finally {
        setIsGeocoding(false);
      }
    },
    [],
  );

  const animateToCoords = useCallback(
    (coords: { latitude: number; longitude: number }, zoomLevel = ZOOM_LEVELS.default) => {
      const newRegion = { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 };
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
    },
    [],
  );

  const getCurrentLocation = useCallback(async () => {
    if (isLocating) return;
    setIsLocating(true);
    setAddress("Localisation...");
    setError(null);

    try {
      const currentLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coords = {
        latitude: currentLoc.coords.latitude,
        longitude: currentLoc.coords.longitude,
      };

      setLocationAccuracy(currentLoc.coords.accuracy || 0);
      setUserMarker({ coordinate: coords, title: "Ma position" });
      setLocationSet(true);
      animateToCoords(coords, ZOOM_LEVELS.user);
      await reverseGeocode(coords);
    } catch (err) {
      const msg =
        err instanceof Error && err.message.includes("timeout")
          ? "La recherche a expiré. Vérifiez votre GPS."
          : "Impossible d'obtenir votre position.";
      setAddress("Position non disponible");
      setError(msg);
      Alert.alert("Erreur", msg);
    } finally {
      setIsLocating(false);
    }
  }, [isLocating, animateToCoords, reverseGeocode]);

  const requestPermissionAndLocate = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      setHasPermission(true);
      getCurrentLocation();
    } else {
      setHasPermission(false);
      Alert.alert("Permission refusée", "Activez la localisation dans les réglages.", [
        { text: "Annuler", style: "cancel" },
        { text: "Réglages", onPress: () => Linking.openSettings() },
      ]);
    }
  }, [getCurrentLocation]);

  const handleMapPress = useCallback(
    async (coords: { latitude: number; longitude: number }) => {
      setCoordinates(coords);
      setLocationSet(true);
      await reverseGeocode(coords);
    },
    [reverseGeocode],
  );

  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setIsGeocoding(true);
    setError(null);

    try {
      const results = await Location.geocodeAsync(query);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        const coords = { latitude, longitude };

        animateToCoords(coords, ZOOM_LEVELS.building);
        setSearchMarkers((prev) => [
          ...prev,
          { id: `search-${Date.now()}`, coordinate: coords },
        ]);
        await reverseGeocode(coords);
        setSearchQuery("");
        searchInputRef.current?.blur();
      } else {
        Alert.alert("Introuvable", `Aucun résultat pour "${query}".`);
      }
    } catch {
      Alert.alert("Erreur", "Impossible de géolocaliser cette adresse.");
    } finally {
      setIsGeocoding(false);
    }
  }, [searchQuery, reverseGeocode, animateToCoords]);

  const handleCenterOnUser = useCallback(async () => {
    if (!hasPermission) {
      await requestPermissionAndLocate();
      return;
    }
    if (userMarker) {
      animateToCoords(userMarker.coordinate, ZOOM_LEVELS.user);
    } else {
      await getCurrentLocation();
    }
  }, [hasPermission, requestPermissionAndLocate, userMarker, animateToCoords, getCurrentLocation]);

  const handleSave = useCallback(async () => {
    if (!locationSet) {
      Alert.alert("Position non définie", "Sélectionnez une position sur la carte.");
      return;
    }
    try {
      await updateProfile({
        fullName: user?.fullName ?? "",
        email: user?.email ?? "",
        phoneNumber: user?.phoneNumber ?? "",
        address,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });
      Alert.alert("Succès", "Localisation mise à jour.");
    } catch {
      Alert.alert("Erreur", "Impossible de sauvegarder.");
    }
  }, [address, coordinates, user, updateProfile]);

  const onMapReady = useCallback(() => {
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
  }, []);

  const handleLegacyMapPress = useCallback(
    (e: any) => {
      if (e?.nativeEvent?.coordinate) {
        handleMapPress(e.nativeEvent.coordinate);
      }
    },
    [handleMapPress],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopBar title="Ma localisation" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <View style={styles.content}>
          <SearchInput
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholder="Rechercher une adresse..."
            returnKeyType="search"
            autoCapitalize="none"
            isLoading={isGeocoding}
            showClearButton
            showSearchButton
            onClear={() => setSearchQuery("")}
            onSearch={handleSearch}
          />

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
                    zoom: ZOOM_LEVELS.city,
                  }}
                />

                {userMarker && MapLibreMarker && (
                  <MapLibreMarker
                    id="user"
                    lngLat={[userMarker.coordinate.longitude, userMarker.coordinate.latitude]}
                  >
                    <View style={styles.userPin}>
                      <View style={styles.userPinDot} />
                    </View>
                  </MapLibreMarker>
                )}

                {searchMarkers.map((marker) => (
                  <MapLibreMarker
                    key={marker.id}
                    id={marker.id}
                    lngLat={[marker.coordinate.longitude, marker.coordinate.latitude]}
                  >
                    <View style={styles.searchPin}>
                      <MapPin size={18} color={colors.primary} fill={colors.primary} />
                    </View>
                  </MapLibreMarker>
                ))}
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
                showsCompass
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

                {userMarker && locationAccuracy > 0 && locationAccuracy < 100 && (
                  <Circle
                    center={userMarker.coordinate}
                    radius={locationAccuracy}
                    strokeWidth={1}
                    strokeColor={colors.primary + "40"}
                    fillColor={colors.primary + "20"}
                  />
                )}

                {userMarker && (
                  <LegacyMarker
                    coordinate={userMarker.coordinate}
                    title={userMarker.title}
                    tracksViewChanges={false}
                  >
                    <View style={styles.userPin}>
                      <View style={styles.userPinDot} />
                    </View>
                  </LegacyMarker>
                )}

                {searchMarkers.map((marker) => (
                  <LegacyMarker
                    key={marker.id}
                    coordinate={marker.coordinate}
                    tracksViewChanges={false}
                  >
                    <View style={styles.searchPin}>
                      <MapPin size={18} color={colors.primary} fill={colors.primary} />
                    </View>
                  </LegacyMarker>
                ))}
              </LegacyMapView>
            )}

            {!isMapReady && (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loaderText}>Chargement de la carte...</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.centerButton}
              onPress={handleCenterOnUser}
              disabled={isLocating}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Crosshair size={20} color={colors.ink} />
              )}
            </TouchableOpacity>

            {hasPermission === false && (
              <TouchableOpacity
                style={styles.permissionWarning}
                onPress={requestPermissionAndLocate}
              >
                <Text style={styles.permissionWarningText}>
                  Autoriser la localisation
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.locationRow, error && styles.locationRowError]}
            activeOpacity={0.7}
            onPress={handleCenterOnUser}
          >
            <MapPin
              size={16}
              color={error ? colors.error : colors.inkMuted}
            />
            <View style={styles.locationTextContainer}>
              <Text
                style={[styles.locationText, error && styles.locationTextError]}
                numberOfLines={2}
              >
                {isGeocoding ? "Recherche d'adresse..." : address}
              </Text>
              {error && <Text style={styles.locationError}>{error}</Text>}
            </View>
            {locationAccuracy > 0 && locationAccuracy < 100 && (
              <Text style={styles.accuracyText}>±{Math.round(locationAccuracy)}m</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label="Enregistrer la localisation"
            fullWidth
            isLoading={isUpdatingProfile}
            onPress={handleSave}
            isDisabled={!hasPermission || isGeocoding || !locationSet}
          />
          <Text style={styles.footerHint}>
            {!hasPermission
              ? "Activez la localisation pour enregistrer votre position"
              : !locationSet
                ? "Localisez-vous ou appuyez sur la carte"
                : "Appuyez sur la carte pour ajuster la position"}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  mapContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.surface,
    position: "relative",
  },
  map: { ...StyleSheet.absoluteFill },
  loaderOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loaderText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  userPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  userPinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.white,
  },
  searchPin: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  permissionWarning: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255, 152, 0, 0.95)",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  permissionWarningText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.white,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationRowError: { borderColor: colors.error, borderWidth: 1.5 },
  locationTextContainer: { flex: 1 },
  locationText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  locationTextError: { color: colors.error },
  locationError: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: 2,
  },
  accuracyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkLight,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
    gap: 8,
  },
  footerHint: {
    textAlign: "center",
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkLight,
  },
});
