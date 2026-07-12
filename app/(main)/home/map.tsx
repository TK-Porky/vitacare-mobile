import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Platform,
  StatusBar,
  ActivityIndicator,
  NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type {
  MapRef,
  CameraRef,
  ViewStateChangeEvent,
} from "@maplibre/maplibre-react-native";
import LegacyMapView, {
  UrlTile as LegacyUrlTile,
  Polyline,
} from "react-native-maps";
import * as Location from "expo-location";
import { useRouter } from "expo-router";

let MapComponent: any = null;
let CameraComponent: any = null;
let UserLocationComponent: any = null;
let GeoJSONSourceComponent: any = null;
let LayerComponent: any = null;
let mapLibreLoaded = false;

try {
  const MapLibre = require("@maplibre/maplibre-react-native");
  MapComponent = MapLibre.Map;
  CameraComponent = MapLibre.Camera;
  UserLocationComponent = MapLibre.UserLocation;
  GeoJSONSourceComponent = MapLibre.GeoJSONSource;
  LayerComponent = MapLibre.Layer;
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
    {
      id: "osm",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

import { BackButton } from "../../../src/components";
import {
  FilterBottomSheet,
  FilterBottomSheetRef,
  FilterState,
} from "../../../src/components/modals";
import { SearchBar } from "../../../src/components";
import { MapMarker } from "../../../src/components";
import { MapProviderCard } from "../../../src/components";
import { colors } from "../../../src/themes";
import { useMapStore } from "../../../src/store";

const INITIAL_REGION = {
  latitude: 3.853,
  longitude: 11.502,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function decodeOSRMCoords(
  coords: number[][],
): { latitude: number; longitude: number }[] {
  return coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
}

export default function MapScreen() {
  const router = useRouter();
  const {
    clinics,
    searchResults,
    isLoading,
    fetchClinics,
    searchClinics,
    selectedClinic,
    setSelectedClinic,
  } = useMapStore();

  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const legacyMapRef = useRef<LegacyMapView>(null);
  const filterSheetRef = useRef<FilterBottomSheetRef>(null);

  const [search, setSearch] = useState("");
  const [region, setRegion] = useState(INITIAL_REGION);
  const [userLocation, setUserLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    perimeterKm: 15,
    services: [],
    languages: [],
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[] | null
  >(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setIsLoadingLocation(false);
          return;
        }

        let currentLoc = await Location.getCurrentPositionAsync({});
        setUserLocation(currentLoc.coords);
        const newRegion = {
          latitude: currentLoc.coords.latitude,
          longitude: currentLoc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(newRegion);

        if (mapLibreLoaded && cameraRef.current) {
          cameraRef.current.flyTo({
            center: [currentLoc.coords.longitude, currentLoc.coords.latitude],
            zoom: 12,
            duration: 1000,
          });
        } else if (legacyMapRef.current) {
          legacyMapRef.current.animateToRegion(newRegion, 1000);
        }
      } catch (error) {
        console.error("Error getting location:", error);
      } finally {
        setIsLoadingLocation(false);
      }
    })();
  }, []);

  const providers = useMemo(() => {
    const list = searchResults.length > 0 ? searchResults : clinics;
    const q = search.trim().toLowerCase();
    return list.filter((p) => {
      if (!q) return true;
      return (
        p.doctorName.toLowerCase().includes(q) ||
        p.clinicName.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      );
    });
  }, [search, clinics, searchResults]);

  const fetchRoute = useCallback(
    async (
      from: { latitude: number; longitude: number },
      to: { latitude: number; longitude: number },
    ) => {
      setIsRouteLoading(true);

      // Fallback: straight line between origin and destination (renders immediately)
      const straightLine = [
        { latitude: from.latitude, longitude: from.longitude },
        { latitude: to.latitude, longitude: to.longitude },
      ];
      setRouteCoords(straightLine);

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?geometries=geojson&overview=full`;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        const data = await res.json();
        if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates) {
          const coords = data.routes[0].geometry.coordinates;
          console.log(
            `Route fetched: ${coords.length} points, ${(data.routes[0].distance / 1000).toFixed(1)}km`,
          );
          setRouteCoords(decodeOSRMCoords(coords));
        } else {
          console.warn("OSRM route failed, using straight line:", data.code);
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          console.warn("Route fetch timed out, using straight line");
        } else {
          console.error("Route fetch error, using straight line:", err);
        }
      } finally {
        setIsRouteLoading(false);
      }
    },
    [],
  );

  const handleRegionDidChange = (
    event: NativeSyntheticEvent<ViewStateChangeEvent>,
  ) => {
    if (event && event.nativeEvent && event.nativeEvent.center) {
      const [longitude, latitude] = event.nativeEvent.center;
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const handleMarkerPress = useCallback(
    (id: string) => {
      const provider = providers.find((c) => c.id === id);
      if (provider) {
        setSelectedClinic(provider);
        setRouteCoords(null);

        if (provider.coordinates) {
          if (mapLibreLoaded && cameraRef.current) {
            cameraRef.current.flyTo({
              center: [
                provider.coordinates.longitude,
                provider.coordinates.latitude,
              ],
              zoom: 14,
              duration: 500,
            });
          } else if (legacyMapRef.current) {
            legacyMapRef.current.animateToRegion(
              {
                ...provider.coordinates,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              },
              500,
            );
          }
        }

        const origin = userLocation
          ? {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }
          : { latitude: region.latitude, longitude: region.longitude };

        if (provider.coordinates) {
          fetchRoute(origin, provider.coordinates);
        }
      }
    },
    [providers, setSelectedClinic, userLocation, region, fetchRoute],
  );

  const handleFilterPress = () => {
    filterSheetRef.current?.open();
  };

  const handleApplyFilters = async (next: FilterState) => {
    setFilters(next);
    searchClinics({
      query: search,
      filters: { specialty: next.services },
      coordinates: {
        latitude: region.latitude,
        longitude: region.longitude,
        radius: next.perimeterKm,
      },
    });
  };

  const handleReserve = () => {
    if (!selectedClinic) return;
    router.push({
      pathname: "/booking",
      params: {
        providerName: selectedClinic.doctorName,
        specialty: selectedClinic.specialty,
        avatarUri: selectedClinic.avatarUri ?? "",
        priceXCFA: String(selectedClinic.priceXCFA ?? 0),
        location: `${selectedClinic.clinicName}, ${selectedClinic.location}`,
      },
    } as never);
  };

  const routeGeoJSON = useMemo(() => {
    if (!routeCoords || routeCoords.length < 2) return null;
    return {
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: routeCoords.map((c) => [c.longitude, c.latitude]),
      },
      properties: {},
    };
  }, [routeCoords]);

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* ── Map ── */}
      {mapLibreLoaded &&
      MapComponent &&
      CameraComponent &&
      UserLocationComponent ? (
        <MapComponent
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          mapStyle={OSM_STYLE as any}
          logo={false}
          attribution={false}
          onRegionDidChange={handleRegionDidChange}
        >
          <CameraComponent
            ref={cameraRef}
            initialViewState={{
              center: [INITIAL_REGION.longitude, INITIAL_REGION.latitude],
              zoom: 12,
            }}
          />
          <UserLocationComponent heading />

          {routeGeoJSON && GeoJSONSourceComponent && LayerComponent && (
            <GeoJSONSourceComponent id="route-source" data={routeGeoJSON}>
              <LayerComponent
                id="route-line"
                type="line"
                style={{
                  lineColor: colors.blue,
                  lineWidth: 4,
                  lineOpacity: 0.8,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            </GeoJSONSourceComponent>
          )}

          {providers.map((provider) => (
            <MapMarker
              key={provider.id}
              id={provider.id}
              coordinate={provider.coordinates || INITIAL_REGION}
              avatarUri={provider.avatarUri}
              isSelected={provider.id === selectedClinic?.id}
              onPress={() => handleMarkerPress(provider.id)}
            />
          ))}
        </MapComponent>
      ) : (
        <LegacyMapView
          ref={legacyMapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={INITIAL_REGION}
          onRegionChangeComplete={setRegion}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
        >
          <LegacyUrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
            tileSize={256}
          />

          {routeCoords && routeCoords.length >= 2 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#0D9488"
              strokeWidth={4}
            />
          )}

          {providers.map((provider) => (
            <MapMarker
              key={provider.id}
              id={provider.id}
              coordinate={provider.coordinates || INITIAL_REGION}
              avatarUri={provider.avatarUri}
              isSelected={provider.id === selectedClinic?.id}
              onPress={() => handleMarkerPress(provider.id)}
            />
          ))}
        </LegacyMapView>
      )}

      {/* ── Overlay layer ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {(isLoadingLocation || isLoading || isRouteLoading) && (
          <View
            style={[
              styles.loaderContainer,
              isRouteLoading && styles.routeLoaderContainer,
            ]}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* ── Top bar ── */}
        <SafeAreaView style={styles.safeTop}>
          <View style={styles.topBar} pointerEvents="auto">
            <BackButton onPress={() => router.back()} />
            <SearchBar
              value={search}
              onChangeText={setSearch}
              onFilterPress={handleFilterPress}
              style={styles.searchBar}
            />
          </View>
        </SafeAreaView>

        {/* ── Bottom provider card ── */}
        {selectedClinic && (
          <SafeAreaView style={styles.safeBottom}>
            <View style={styles.cardWrapper} pointerEvents="auto">
              <MapProviderCard
                provider={{
                  id: selectedClinic.id,
                  name: selectedClinic.doctorName,
                  avatarUri: selectedClinic.avatarUri,
                  coverUri: selectedClinic.imageUri,
                  distanceKm:
                    userLocation && selectedClinic.coordinates
                      ? Number(
                          getDistance(
                            userLocation.latitude,
                            userLocation.longitude,
                            selectedClinic.coordinates.latitude,
                            selectedClinic.coordinates.longitude,
                          ).toFixed(1),
                        )
                      : 0,
                  priceXCFA: selectedClinic.priceXCFA || 0,
                  address: selectedClinic.location,
                }}
                onReserve={handleReserve}
              />
            </View>
          </SafeAreaView>
        )}
      </View>

      {/* ── Filter BottomSheet ── */}
      <FilterBottomSheet
        ref={filterSheetRef}
        initialFilters={filters}
        onApply={handleApplyFilters}
      />
    </View>
  );
}

const TOP_BAR_PADDING =
  Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 8 : 8;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  safeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: TOP_BAR_PADDING,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flex: 1,
  },
  safeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  cardWrapper: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99,
  },
  routeLoaderContainer: {
    top: undefined,
    bottom: 24,
    justifyContent: "flex-end",
  },
});
