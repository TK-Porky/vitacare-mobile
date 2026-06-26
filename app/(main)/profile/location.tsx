import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  NativeModules,
  Linking,
  AppState,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin, Crosshair, User } from "lucide-react-native";
import LegacyMapView, {
  UrlTile as LegacyUrlTile,
  Marker as LegacyMarker,
  PROVIDER_DEFAULT,
  Circle,
} from "react-native-maps";
import * as Location from "expo-location";
import { colors, fontFamily, fontSize } from "../../../src/themes";
import { TopBar, PrimaryButton, SearchInput } from "../../../src/components";
import { useProfile } from "../../../src/hooks";
import { useAuthStore } from "../../../src/store";

// ================================================================================== //
// Constants
// ================================================================================== //

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
    {
      id: "osm",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const INITIAL_REGION = {
  latitude: 3.848,
  longitude: 11.502,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// ================================================================================== //
// ZOOM_LEVELS — en niveaux numériques pour MapLibre
// ================================================================================== //

const ZOOM_LEVELS = {
  city: 12,
  street: 16,
  building: 18,
  default: 14,
  user: 15,
};

// ================================================================================== //
// MapLibre Setup - CORRIGÉ
// ================================================================================== //

let MapComponent: any = null;
let CameraComponent: any = null;
let PointAnnotationComponent: any = null;
let mapLibreLoaded = false;

try {
  const isMapLibreAvailable =
    Platform.OS !== "web" &&
    (!!NativeModules.MLRNModule || !!NativeModules.MLRNCameraModule);

  console.log(
    "[MapLibre] NativeModules disponibles:",
    Object.keys(NativeModules),
  );
  console.log("[MapLibre] MLRNModule:", !!NativeModules.MLRNModule);
  console.log("[MapLibre] MLRNCameraModule:", !!NativeModules.MLRNCameraModule);
  console.log("[MapLibre] isMapLibreAvailable:", isMapLibreAvailable);

  if (isMapLibreAvailable) {
    const MapLibre = require("@maplibre/maplibre-react-native");
    console.log("[MapLibre] Exports disponibles:", Object.keys(MapLibre));

    MapComponent = MapLibre.MapView || MapLibre.Map;
    CameraComponent = MapLibre.Camera;
    PointAnnotationComponent = MapLibre.PointAnnotation;
    mapLibreLoaded = !!MapComponent && !!CameraComponent;

    console.log("[MapLibre] MapComponent:", !!MapComponent);
    console.log("[MapLibre] CameraComponent:", !!CameraComponent);
    console.log("[MapLibre] mapLibreLoaded:", mapLibreLoaded);
  }
} catch (e) {
  console.warn("[MapLibre] Erreur:", e);
}

// ================================================================================== //
// Types
// ================================================================================== //

interface LocationState {
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  isGeocoding: boolean;
  error: string | null;
  accuracy?: number;
}

interface UserMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
  isUserLocation?: boolean;
}

// ================================================================================== //
// Main Component
// ================================================================================== //

export default function LocationScreen() {
  // ================================================================================== //
  // Store & Hooks
  // ================================================================================== //

  const user = useAuthStore((s) => s.user);
  const { updateProfile, isUpdatingProfile } = useProfile();

  // ================================================================================== //
  // State
  // ================================================================================== //

  const [locationState, setLocationState] = useState<LocationState>({
    address: "Recherche de votre position...",
    coordinates: {
      latitude: INITIAL_REGION.latitude,
      longitude: INITIAL_REGION.longitude,
    },
    isGeocoding: false,
    error: null,
  });

  const cameraRef = useRef<any>(null);
  const [cameraKey, setCameraKey] = useState(0);
  const [region, setRegion] = useState(INITIAL_REGION);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  // Ajoute un ref pour savoir si la carte est prête pour les commandes caméra
  const mapReadyForCamera = useRef(false);
  const pendingCamera = useRef<{
    coords: { latitude: number; longitude: number };
    zoomLevel: number;
  } | null>(null);

  // Nouveaux states pour les markers
  const [userMarker, setUserMarker] = useState<UserMarker | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<UserMarker | null>(null);
  const [mapMarkers, setMapMarkers] = useState<UserMarker[]>([]);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(true);
  const [locationAccuracy, setLocationAccuracy] = useState<number>(0);

  const [cameraSettings, setCameraSettings] = useState({
    centerCoordinate: [INITIAL_REGION.longitude, INITIAL_REGION.latitude] as [
      number,
      number,
    ],
    zoomLevel: ZOOM_LEVELS.city,
    animationDuration: 0,
    animationMode: "none" as
      | "none"
      | "flyTo"
      | "easeTo"
      | "linearTo"
      | "moveTo",
  });
  const mapRef = useRef<any>(null);
  const searchInputRef = useRef<any>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );

  // Animation pour le pulsating marker - CORRIGÉE
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  // ================================================================================== //
  // Computed
  // ================================================================================== //

  const hasLocationPermission = permissionStatus === "granted";
  const isUsingMapLibre = mapLibreLoaded && Platform.OS !== "ios";

  // ================================================================================== //
  // Effects - ANIMATION CORRIGÉE
  // ================================================================================== //

  // Pulsing animation for marker - utilisant seulement scale et opacity
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.3,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.6,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [scaleAnim, opacityAnim]);

  useEffect(() => {
    if (!mapLoaded) return;
    setTimeout(() => {
      if (cameraRef.current) {
        console.log(
          "[CameraRef] prototype méthodes:",
          Object.getOwnPropertyNames(Object.getPrototypeOf(cameraRef.current)),
        );
        console.log("[CameraRef] keys:", Object.keys(cameraRef.current));
        console.log("[CameraRef] _nativeRef:", cameraRef.current._nativeRef);
        console.log(
          "[CameraRef] nativeCommandName:",
          cameraRef.current.nativeCommandName,
        );
      }
    }, 500);
  }, [mapLoaded]);

  // ================================================================================== //
  // Permission Handlers
  // ================================================================================== //

  const checkPermissions = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== "granted") {
        setLocationState((prev) => ({
          ...prev,
          address: "Permission de localisation refusée",
          error:
            "Pour utiliser cette fonctionnalité, veuillez autoriser l'accès à votre position.",
        }));
      }
    } catch (error) {
      console.error("[Location] Permission check error:", error);
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status === "granted") {
        getCurrentLocation();
      } else {
        Alert.alert(
          "Permission refusée",
          "Pour utiliser la carte, vous devez autoriser l'accès à votre position.",
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Ouvrir les réglages",
              onPress: () => Linking.openSettings(),
            },
          ],
        );
      }
    } catch (error) {
      console.error("[Location] Permission request error:", error);
      Alert.alert(
        "Erreur",
        "Impossible de demander la permission de localisation.",
      );
    }
  }, []);

  // ================================================================================== //
  // Location Handlers
  // ================================================================================== //

  const reverseGeocode = useCallback(
    async (coords: { latitude: number; longitude: number }) => {
      setLocationState((prev) => ({ ...prev, isGeocoding: true }));

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

          const address = parts.join(", ") || "Position détectée";

          setLocationState((prev) => ({
            ...prev,
            address,
            coordinates: coords,
            isGeocoding: false,
            error: null,
          }));
        } else {
          setLocationState((prev) => ({
            ...prev,
            address: "Adresse non trouvée",
            coordinates: coords,
            isGeocoding: false,
          }));
        }
      } catch (error) {
        console.error("[Location] Reverse geocode error:", error);
        setLocationState((prev) => ({
          ...prev,
          address: "Adresse non disponible",
          isGeocoding: false,
          error: "Impossible d'obtenir l'adresse correspondante.",
        }));
      }
    },
    [],
  );

  const cameraSettingsRef = useRef(cameraSettings);

  // Dans updateMapLocation
  const updateMapLocation = useCallback(
    (
      coords: { latitude: number; longitude: number },
      zoomLevel: number = ZOOM_LEVELS.default,
    ) => {
      setRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      if (isUsingMapLibre) {
        const execute = () => {
          if (!cameraRef.current) return;

          console.log("[Camera] setStop appelé:", coords, "zoom:", zoomLevel);

          // setStop accepte centerCoordinate + zoom ensemble
          cameraRef.current.setStop({
            centerCoordinate: [coords.longitude, coords.latitude],
            zoomLevel,
            animationDuration: 800,
            animationMode: "flyTo",
          });
        };

        if (mapReadyForCamera.current) {
          execute();
        } else {
          pendingCamera.current = { coords, zoomLevel };
        }
      }
    },
    [isUsingMapLibre],
  );

  const getCurrentLocation = useCallback(async () => {
    if (isLocating) return;

    setIsLocating(true);
    setLocationState((prev) => ({
      ...prev,
      address: "Localisation en cours...",
      error: null,
    }));

    try {
      const currentLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      const coords = {
        latitude: currentLoc.coords.latitude,
        longitude: currentLoc.coords.longitude,
      };

      setLocationAccuracy(currentLoc.coords.accuracy || 0);

      const marker: UserMarker = {
        id: "user-location",
        coordinate: coords,
        title: "Ma position",
        isUserLocation: true,
      };
      setUserMarker(marker);

      updateMapLocation(coords, ZOOM_LEVELS.user); // ✅ maintenant dans les deps
      await reverseGeocode(coords);
    } catch (error) {
      console.error("[Location] Get location error:", error);
      let errorMessage = "Impossible d'obtenir votre position.";
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage =
            "La recherche de position a expiré. Vérifiez votre connexion GPS.";
        } else if (error.message.includes("provider")) {
          errorMessage = "Veuillez activer le GPS de votre appareil.";
        }
      }
      setLocationState((prev) => ({
        ...prev,
        address: "Position non disponible",
        error: errorMessage,
      }));
      Alert.alert("Erreur de localisation", errorMessage);
    } finally {
      setIsLocating(false);
    }
  }, [isLocating, updateMapLocation, reverseGeocode]);

  // ================================================================================== //
  // Map Handlers
  // ================================================================================== //

  const handleMapPress = useCallback(
    async (coords: { latitude: number; longitude: number }) => {
      setIsTrackingEnabled(false);
      setLocationState((prev) => ({ ...prev, coordinates: coords }));
      await reverseGeocode(coords);
    },
    [reverseGeocode],
  );

  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) {
      Alert.alert("Information", "Veuillez saisir une adresse à rechercher.");
      return;
    }

    setLocationState((prev) => ({ ...prev, isGeocoding: true, error: null }));

    try {
      const results = await Location.geocodeAsync(query);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        const coords = { latitude, longitude };

        setIsTrackingEnabled(false);
        updateMapLocation(coords, ZOOM_LEVELS.building);

        const searchMarker: UserMarker = {
          id: `search-${Date.now()}`,
          coordinate: coords,
          title: query,
          description: "Résultat de recherche",
          isUserLocation: false,
        };
        setMapMarkers((prev) => [...prev, searchMarker]);
        setSelectedMarker(searchMarker);

        await reverseGeocode(coords);
        setSearchQuery("");
        searchInputRef.current?.blur();
      } else {
        Alert.alert(
          "Adresse introuvable",
          `Aucun résultat trouvé pour "${query}".`,
        );
      }
    } catch (error) {
      console.error("[Location] Geocode error:", error);
      Alert.alert(
        "Erreur de recherche",
        "Impossible de géolocaliser cette adresse.",
      );
    } finally {
      setLocationState((prev) => ({ ...prev, isGeocoding: false }));
    }
  }, [searchQuery, reverseGeocode, updateMapLocation]);

  const handleCenterOnUser = useCallback(async () => {
    if (!hasLocationPermission) {
      await requestPermissions();
      return;
    }

    setIsTrackingEnabled(true);
    await getCurrentLocation();

    if (userMarker) {
      updateMapLocation(userMarker.coordinate, ZOOM_LEVELS.user);
    }
  }, [
    hasLocationPermission,
    requestPermissions,
    getCurrentLocation,
    userMarker,
  ]);

  const handleSave = useCallback(async () => {
    if (
      !locationState.address ||
      locationState.address === "Recherche de votre position..."
    ) {
      Alert.alert(
        "Position non définie",
        "Veuillez sélectionner une position sur la carte avant d'enregistrer.",
      );
      return;
    }

    try {
      await updateProfile({
        fullName: user?.fullName ?? "",
        email: user?.email ?? "",
        phoneNumber: user?.phoneNumber ?? "",
        address: locationState.address,
        latitude: locationState.coordinates.latitude,
        longitude: locationState.coordinates.longitude,
      });

      Alert.alert("Succès", "Votre localisation a été mise à jour.");
    } catch (error) {
      console.error("[Location] Save error:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder la localisation.");
    }
  }, [locationState, user, updateProfile]);

  // ================================================================================== //
  // Render Helpers - Markers CORRIGÉS
  // ================================================================================== //

  const renderUserMarker = () => {
    if (!userMarker) return null;

    if (isUsingMapLibre && PointAnnotationComponent) {
      console.log("[Render] Camera re-render:", JSON.stringify(cameraSettings));
      console.log("[Render] Camera props:", cameraSettings);
      return (
        <PointAnnotationComponent
          id={userMarker.id}
          coordinate={[
            userMarker.coordinate.longitude,
            userMarker.coordinate.latitude,
          ]}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={[styles.customMarker, styles.userMarker]}>
            <User size={20} color={colors.white} fill={colors.white} />
          </View>
        </PointAnnotationComponent>
      );
    }

    // react-native-maps - CORRIGÉ: utilisation de scale et opacity uniquement
    return (
      <>
        {/* Cercle de précision */}
        {locationAccuracy > 0 && locationAccuracy < 100 && (
          <Circle
            center={userMarker.coordinate}
            radius={locationAccuracy}
            strokeWidth={1}
            strokeColor={colors.primary + "40"}
            fillColor={colors.primary + "20"}
          />
        )}

        {/* Marqueur principal */}
        <LegacyMarker
          coordinate={userMarker.coordinate}
          title={userMarker.title}
          description={userMarker.description}
          tracksViewChanges={false}
        >
          <View style={[styles.customMarker, styles.userMarker]}>
            <User size={20} color={colors.white} fill={colors.white} />
          </View>
        </LegacyMarker>

        {/* Anneau pulsant - CORRIGÉ: seulement scale et opacity */}
        <LegacyMarker
          coordinate={userMarker.coordinate}
          tracksViewChanges={false}
        >
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          />
        </LegacyMarker>
      </>
    );
  };

  const renderSearchMarkers = () => {
    return mapMarkers.map((marker) => {
      if (marker.id === "user-location") return null;

      if (isUsingMapLibre && PointAnnotationComponent) {
        return (
          <PointAnnotationComponent
            key={marker.id}
            id={marker.id}
            coordinate={[
              marker.coordinate.longitude,
              marker.coordinate.latitude,
            ]}
            anchor={{ x: 0.5, y: 1.0 }}
            onSelected={() => setSelectedMarker(marker)}
          >
            <View
              style={[
                styles.customMarker,
                selectedMarker?.id === marker.id && styles.selectedMarker,
              ]}
            >
              <MapPin size={24} color={colors.primary} fill={colors.white} />
            </View>
          </PointAnnotationComponent>
        );
      }

      // react-native-maps
      return (
        <LegacyMarker
          key={marker.id}
          coordinate={marker.coordinate}
          title={marker.title}
          description={marker.description}
          onPress={() => setSelectedMarker(marker)}
          tracksViewChanges={false}
        >
          <View
            style={[
              styles.customMarker,
              selectedMarker?.id === marker.id && styles.selectedMarker,
            ]}
          >
            <MapPin size={24} color={colors.primary} fill={colors.white} />
          </View>
        </LegacyMarker>
      );
    });
  };

  // ================================================================================== //
  // Render Map
  // ================================================================================== //

  const renderMap = () => {
    console.log(
      "[Render] isUsingMapLibre:",
      isUsingMapLibre,
      "cameraSettings:",
      JSON.stringify(cameraSettings),
    );

    if (isUsingMapLibre && MapComponent && CameraComponent) {
      console.log("[Render] → branche MapLibre");
      return (
        <MapComponent
          ref={mapRef}
          style={styles.map}
          mapStyle={OSM_STYLE}
          onPress={(e: any) => {
            if (e?.geometry?.coordinates) {
              const [longitude, latitude] = e.geometry.coordinates;
              handleMapPress({ latitude, longitude });
            }
          }}
          onDidFinishLoadingMap={() => {
            console.log("[Map] onDidFinishLoadingMap ✅");
            setIsMapReady(true);
            setMapLoaded(true);
            mapReadyForCamera.current = true;

            // Exécute la commande caméra en attente si elle existe
            setTimeout(() => {
              if (pendingCamera.current && cameraRef.current?.setStop) {
                const { coords, zoomLevel } = pendingCamera.current;
                console.log("[Camera] setStop différé:", coords);
                cameraRef.current.setStop({
                  centerCoordinate: [coords.longitude, coords.latitude],
                  zoomLevel,
                  animationDuration: 800,
                  animationMode: "flyTo",
                });
                pendingCamera.current = null;
              }
            }, 300);
          }}
          logoEnabled={false}
          attributionEnabled={false}
          compassEnabled={true}
        >
          <CameraComponent
            ref={cameraRef}
            centerCoordinate={[
              INITIAL_REGION.longitude,
              INITIAL_REGION.latitude,
            ]}
            zoomLevel={ZOOM_LEVELS.city}
            animationDuration={0}
            animationMode="none"
          />

          {renderUserMarker()}
          {renderSearchMarkers()}
        </MapComponent>
      );
    } else {
      console.log("[Render] → branche fallback react-native-maps");
    }

    console.log("[Camera] cameraSettings au render:", cameraSettings);
    // Fallback: react-native-maps
    return (
      <LegacyMapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={region}
        onRegionChangeComplete={(newRegion) => {
          setRegion(newRegion);
          setIsTrackingEnabled(false);
        }}
        onPress={(e) => {
          if (e && e.nativeEvent && e.nativeEvent.coordinate) {
            handleMapPress(e.nativeEvent.coordinate);
          }
        }}
        onMapReady={() => setIsMapReady(true)}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        moveOnMarkerPress={false}
      >
        <LegacyUrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
          tileSize={256}
        />

        {renderUserMarker()}
        {renderSearchMarkers()}
      </LegacyMapView>
    );
  };

  // ================================================================================== //
  // Main Render
  // ================================================================================== //

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <TopBar title="Ma localisation" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <View style={styles.content}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <SearchInput
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              placeholder="Rechercher une adresse..."
              returnKeyType="search"
              autoCapitalize="none"
              isLoading={locationState.isGeocoding}
              showClearButton
              showSearchButton
              onClear={() => setSearchQuery("")}
              onSearch={handleSearch}
            />
          </View>

          {/* Map */}
          <View style={styles.mapContainer}>
            {renderMap()}

            {!isMapReady && (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loaderText}>Chargement de la carte...</Text>
              </View>
            )}

            {/* Center Button */}
            <TouchableOpacity
              style={[
                styles.centerButton,
                isTrackingEnabled && styles.centerButtonActive,
              ]}
              onPress={handleCenterOnUser}
              disabled={isLocating}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Crosshair
                  size={20}
                  color={isTrackingEnabled ? colors.primary : colors.ink}
                />
              )}
            </TouchableOpacity>

            {/* Permission Warning */}
            {!hasLocationPermission && (
              <TouchableOpacity
                style={styles.permissionWarning}
                onPress={requestPermissions}
              >
                <Text style={styles.permissionWarningText}>
                  Autoriser la localisation
                </Text>
              </TouchableOpacity>
            )}

            {/* Tracking Indicator */}
            {isTrackingEnabled && hasLocationPermission && (
              <View style={styles.trackingIndicator}>
                <View style={styles.trackingDot} />
                <Text style={styles.trackingText}>Suivi GPS actif</Text>
              </View>
            )}
          </View>

          {/* Location Info */}
          <TouchableOpacity
            style={[
              styles.locationRow,
              locationState.error && styles.locationRowError,
            ]}
            activeOpacity={0.7}
            onPress={handleCenterOnUser}
          >
            <MapPin
              size={16}
              color={locationState.error ? colors.error : colors.inkMuted}
            />
            <View style={styles.locationTextContainer}>
              <Text
                style={[
                  styles.locationText,
                  locationState.error && styles.locationTextError,
                ]}
                numberOfLines={2}
              >
                {locationState.isGeocoding
                  ? "Recherche d'adresse..."
                  : locationState.address}
              </Text>
              {locationState.error && (
                <Text style={styles.locationError}>{locationState.error}</Text>
              )}
            </View>
            {locationAccuracy > 0 && locationAccuracy < 100 && (
              <Text style={styles.accuracyText}>
                ±{Math.round(locationAccuracy)}m
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <PrimaryButton
            label="Enregistrer la localisation"
            fullWidth
            isLoading={isUpdatingProfile}
            onPress={handleSave}
            isDisabled={!hasLocationPermission || locationState.isGeocoding}
          />
          <Text style={styles.footerHint}>
            {!hasLocationPermission
              ? "Activez la localisation pour enregistrer votre position"
              : "Appuyez sur la carte pour définir une position précise"}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ================================================================================== //
// Styles
// ================================================================================== //

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },

  searchContainer: {
    flexDirection: "row",
    gap: 8,
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

  // Markers - CORRIGÉS
  customMarker: {
    width: 40,
    height: 40,
    backgroundColor: colors.white,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  userMarker: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  selectedMarker: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  pulseRing: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    opacity: 0.4,
  },

  // Tracking
  trackingButton: {
    padding: 8,
    borderRadius: 8,
  },
  trackingIndicator: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  trackingText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.ink,
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
  centerButtonActive: {
    borderWidth: 2,
    borderColor: colors.primary,
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

  // Location Info
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
  locationRowError: {
    borderColor: colors.error,
    borderWidth: 1.5,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  locationTextError: {
    color: colors.error,
  },
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

  // Footer
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
