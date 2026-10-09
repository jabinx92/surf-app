import { surfSpots } from "@/data/surf-spots";
import { getDistanceInMiles } from "@/utils/distance";
import { findNearbySurfMapSpots, searchSurfMapSpots } from "@/utils/surf-map";
import * as Location from "expo-location";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type NearbySurfSpot = {
  id: number | string;
  name: string;
  latitude: number;
  longitude: number;
  distance?: number;
  detail?: string;
};

export default function LocationScreen() {
  const [status, setStatus] = useState("Ready");
  const [nearbySurfSpots, setNearbySurfSpots] = useState<NearbySurfSpot[]>([]);
  const [isChoosingSpot, setIsChoosingSpot] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NearbySurfSpot[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [usesSurfMap, setUsesSurfMap] = useState(false);
  const hasRequestedLocation = useRef(false);
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  function openCreators(spot: string) {
    router.push({ pathname: "/creators", params: { spot } });
  }

  useEffect(() => {
    const query = searchQuery.trim();
    if (!isChoosingSpot || query.length < 2) {
      const resetTimer = setTimeout(() => {
        setSearchResults([]);
        setIsSearching(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const result = await searchSurfMapSpots(query);
        if (cancelled) return;
        setSearchResults(result.spots.map((spot) => ({
          id: `surfmap:${spot.id}`,
          name: spot.name,
          latitude: spot.lat,
          longitude: spot.lng,
          detail: [spot.region, spot.country].filter(Boolean).join(", "),
        })));
        setUsesSurfMap(true);
      } catch {
        if (cancelled) return;
        const lowered = query.toLocaleLowerCase();
        setSearchResults(surfSpots.filter((spot) => spot.name.toLocaleLowerCase().includes(lowered)));
        setUsesSurfMap(false);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isChoosingSpot, searchQuery]);

  const getCurrentLocation = useCallback(async () => {
    try {
      setStatus("Requesting permission...");
      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();

      if (permissionStatus !== "granted") {
        setStatus("Location is unavailable in this browser. Choose a surf spot instead.");
        setIsChoosingSpot(true);
        return;
      }

      setStatus("Getting your location...");
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;

      let sortedSurfSpots: NearbySurfSpot[];
      try {
        const result = await findNearbySurfMapSpots(latitude, longitude);
        sortedSurfSpots = result.spots.map((spot) => ({
          id: `surfmap:${spot.id}`,
          name: spot.name,
          latitude: spot.lat,
          longitude: spot.lng,
          distance: typeof spot.distanceKm === "number" ? spot.distanceKm * 0.621371 : undefined,
          detail: [spot.region, spot.country].filter(Boolean).join(", "),
        }));
        setUsesSurfMap(true);
      } catch {
        sortedSurfSpots = surfSpots
          .map((surfSpot) => ({
            ...surfSpot,
            distance: getDistanceInMiles(latitude, longitude, surfSpot.latitude, surfSpot.longitude),
          }))
          .sort((firstSpot, secondSpot) => (firstSpot.distance ?? 0) - (secondSpot.distance ?? 0));
        setUsesSurfMap(false);
      }

      setNearbySurfSpots(sortedSurfSpots);
      setStatus("Nearby surf spots found");
    } catch (error) {
      console.error(error);
      setStatus("We could not get your location. Choose a surf spot instead.");
      setIsChoosingSpot(true);
    }
  }, []);

  useEffect(() => {
    if (hasRequestedLocation.current) return;
    hasRequestedLocation.current = true;
    const locationTimer = setTimeout(() => void getCurrentLocation(), 0);
    return () => clearTimeout(locationTimer);
  }, [getCurrentLocation]);

  const renderSpotCard = (surfSpot: NearbySurfSpot) => (
    <Pressable
      key={surfSpot.id}
      accessibilityRole="button"
      onPress={() => openCreators(surfSpot.name)}
      style={({ pressed }) => [styles.surfSpotCard, isWide && styles.surfSpotCardWide, pressed && styles.buttonPressed]}
    >
      <View>
        <Text style={styles.surfSpotName}>{surfSpot.name}</Text>
        {typeof surfSpot.distance === "number" ? <Text style={styles.surfSpotDistance}>{surfSpot.distance.toFixed(1)} miles away{surfSpot.detail ? ` · ${surfSpot.detail}` : ""}</Text> : <Text style={styles.surfSpotDistance}>{surfSpot.detail || "Browse local creators"}</Text>}
      </View>
      <View style={styles.cardArrowCircle}><Text style={styles.cardArrow}>-&gt;</Text></View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />

      <View style={[styles.shell, isWide && styles.shellWide]}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>&lt;- Back</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push("/")} style={styles.brandLockup}>
            <Image source={require("@/assets/images/wavelens-icon.png")} style={styles.brandMark} />
            <Text style={styles.brandName}>WaveLens</Text>
          </Pressable>
        </View>

        {isChoosingSpot ? (
          <View style={styles.resultsScreen}>
            <View style={styles.resultsHeader}>
              <Text style={styles.eyebrow}>CHOOSE A BREAK</Text>
              <Text style={[styles.resultsPageTitle, isWide && styles.resultsPageTitleWide]}>Where are you surfing?</Text>
              <Text style={styles.resultsSubtitle}>Pick a surf spot to see photographers and videographers nearby.</Text>
              <View style={styles.searchBox}>
                <TextInput accessibilityLabel="Search surf spots" autoCapitalize="words" autoCorrect={false} onChangeText={setSearchQuery} placeholder="Try Lower Trestles or Steamer Lane" placeholderTextColor="#698596" returnKeyType="search" style={styles.searchInput} value={searchQuery} />
                {isSearching ? <ActivityIndicator color="#56d6c9" size="small" /> : null}
              </View>
              {status !== "Ready" ? <Text selectable style={styles.locationNotice}>{status}</Text> : null}
            </View>
            <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.results} contentContainerStyle={[styles.resultsContent, isWide && styles.resultsContentWide]} showsVerticalScrollIndicator={false}>
              {(searchQuery.trim().length >= 2 ? searchResults : surfSpots).map(renderSpotCard)}
              {searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 ? <Text style={styles.emptySearch}>No matching surf spots found. Try a nearby city or another spelling.</Text> : null}
            </ScrollView>
            {usesSurfMap ? <Pressable accessibilityRole="link" onPress={() => void Linking.openURL("https://surf-map.com/")}><Text style={styles.attribution}>Surf data by SurfMap</Text></Pressable> : null}
            <Pressable accessibilityRole="button" onPress={() => setIsChoosingSpot(false)} style={({ pressed }) => [styles.refreshButton, isWide && styles.refreshButtonWide, pressed && styles.buttonPressed]}>
              <Text style={styles.refreshButtonText}>Use my location instead</Text>
            </Pressable>
          </View>
        ) : nearbySurfSpots.length === 0 ? (
          <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} style={styles.landingScroll} contentContainerStyle={[styles.landing, isWide && styles.landingWide]}>
            <View style={[styles.content, isWide && styles.contentWide]}>
              <View style={styles.locationIcon}><Text style={styles.locationIconText}>+</Text></View>
              <Text style={styles.eyebrow}>FIND YOUR BREAK</Text>
              <Text style={[styles.title, isWide && styles.titleWide]}>Where are you surfing?</Text>
              <Text style={styles.description}>Share your location to find nearby surf spots and photographers available in your area.</Text>
            </View>

            <View style={[styles.actions, isWide && styles.actionsWide]}>
              <Text style={styles.actionKicker}>START HERE</Text>
              <Text style={styles.actionTitle}>Find your nearest lineup.</Text>
              <Text style={styles.actionDescription}>Choose location access for the fastest route, or search for a break yourself.</Text>
              <Pressable accessibilityRole="button" onPress={getCurrentLocation} style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
                <Text style={styles.primaryButtonText}>Use My Location</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setIsChoosingSpot(true)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
                <Text style={styles.secondaryButtonText}>Search a Surf Spot</Text>
              </Pressable>
              <View style={styles.statusRow}><View style={styles.statusDot} /><Text selectable style={styles.statusText}>{status}</Text></View>
              <Text style={styles.privacyText}>Your location is used only to show nearby surf spots.</Text>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.resultsScreen}>
            <View style={styles.resultsHeader}>
              <Text style={styles.eyebrow}>NEARBY BREAKS</Text>
              <Text style={[styles.resultsPageTitle, isWide && styles.resultsPageTitleWide]}>Surf spots near you</Text>
              <Text style={styles.resultsSubtitle}>Sorted by distance from your current location.</Text>
            </View>
            <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.results} contentContainerStyle={[styles.resultsContent, isWide && styles.resultsContentWide]} showsVerticalScrollIndicator={false}>
              {nearbySurfSpots.map(renderSpotCard)}
            </ScrollView>
            {usesSurfMap ? <Pressable accessibilityRole="link" onPress={() => void Linking.openURL("https://surf-map.com/")}><Text style={styles.attribution}>Surf data by SurfMap</Text></Pressable> : null}
            <Pressable accessibilityRole="button" onPress={getCurrentLocation} style={({ pressed }) => [styles.refreshButton, isWide && styles.refreshButtonWide, pressed && styles.buttonPressed]}>
              <Text style={styles.refreshButtonText}>Refresh Location</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#061827", flex: 1 },
  topGlow: { backgroundColor: "rgba(86,214,201,0.1)", borderRadius: 300, height: 600, pointerEvents: "none", position: "absolute", right: -300, top: -300, width: 600 },
  bottomGlow: { backgroundColor: "rgba(31,106,153,0.15)", borderRadius: 260, bottom: -280, height: 520, left: -250, pointerEvents: "none", position: "absolute", width: 520 },
  shell: { alignSelf: "center", flex: 1, maxWidth: 640, paddingHorizontal: 20, width: "100%" },
  shellWide: { maxWidth: 1160, paddingHorizontal: 40 },
  topBar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 72 },
  backButton: { justifyContent: "center", minHeight: 44, paddingRight: 24 },
  backButtonText: { color: "#d9e5ec", fontSize: 14, fontWeight: "700" },
  brandLockup: { alignItems: "center", flexDirection: "row", gap: 9, minHeight: 44 },
  brandMark: { borderRadius: 11, height: 32, width: 32 },
  brandName: { color: "#ffffff", fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  landingScroll: { flex: 1 },
  landing: { flexGrow: 1, gap: 32, justifyContent: "center", paddingBottom: 32, paddingTop: 24 },
  landingWide: { alignItems: "center", flexDirection: "row", gap: 96, paddingBottom: 64, paddingTop: 54 },
  content: { justifyContent: "center" },
  contentWide: { flex: 1, minWidth: 0 },
  locationIcon: { alignItems: "center", backgroundColor: "rgba(86,214,201,0.12)", borderColor: "rgba(86,214,201,0.3)", borderRadius: 29, borderWidth: 1, height: 58, justifyContent: "center", marginBottom: 26, width: 58 },
  locationIconText: { color: "#56d6c9", fontSize: 27, fontWeight: "500" },
  eyebrow: { color: "#7ce0d6", fontSize: 12, fontWeight: "800", letterSpacing: 1.5, marginBottom: 16 },
  title: { color: "#ffffff", fontSize: 44, fontWeight: "800", letterSpacing: -1.6, lineHeight: 49, maxWidth: 350 },
  titleWide: { fontSize: 60, letterSpacing: -2.7, lineHeight: 64, maxWidth: 560 },
  description: { color: "#b9c9d6", fontSize: 17, lineHeight: 26, marginTop: 20, maxWidth: 470 },
  actions: { backgroundColor: "rgba(16,42,57,0.92)", borderColor: "rgba(255,255,255,0.12)", borderCurve: "continuous", borderRadius: 26, borderWidth: 1, boxShadow: "0 18px 36px rgba(0,0,0,0.18)", gap: 12, padding: 22 },
  actionsWide: { flexBasis: 420, flexShrink: 0, maxWidth: 420, padding: 26 },
  actionKicker: { color: "#7ce0d6", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  actionTitle: { color: "#ffffff", fontSize: 25, fontWeight: "800", letterSpacing: -0.8 },
  actionDescription: { color: "#91a8b8", fontSize: 14, lineHeight: 20, marginBottom: 8 },
  primaryButton: { alignItems: "center", backgroundColor: "#56d6c9", borderCurve: "continuous", borderRadius: 17, justifyContent: "center", minHeight: 56 },
  primaryButtonText: { color: "#061827", fontSize: 15, fontWeight: "900" },
  secondaryButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.2)", borderCurve: "continuous", borderRadius: 17, borderWidth: 1, justifyContent: "center", minHeight: 56 },
  secondaryButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  buttonPressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
  statusRow: { alignItems: "center", borderTopColor: "rgba(255,255,255,0.1)", borderTopWidth: 1, flexDirection: "row", gap: 8, marginTop: 8, paddingTop: 17 },
  statusDot: { backgroundColor: "#56d6c9", borderRadius: 4, height: 7, width: 7 },
  statusText: { color: "#d9e5ec", fontSize: 13 },
  privacyText: { color: "#698596", fontSize: 12, lineHeight: 18 },
  resultsScreen: { flex: 1 },
  resultsHeader: { maxWidth: 680, paddingBottom: 28, paddingTop: 42 },
  resultsPageTitle: { color: "#ffffff", fontSize: 38, fontWeight: "800", letterSpacing: -1.3, lineHeight: 43 },
  resultsPageTitleWide: { fontSize: 50, letterSpacing: -2.1, lineHeight: 55 },
  resultsSubtitle: { color: "#b9c9d6", fontSize: 15, lineHeight: 22, marginTop: 10 },
  locationNotice: { backgroundColor: "rgba(86,214,201,0.1)", borderColor: "rgba(86,214,201,0.24)", borderRadius: 12, borderWidth: 1, color: "#d9e5ec", fontSize: 13, lineHeight: 19, marginTop: 16, paddingHorizontal: 14, paddingVertical: 11 },
  searchBox: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.16)", borderRadius: 16, borderWidth: 1, flexDirection: "row", marginTop: 20, minHeight: 54, paddingHorizontal: 16 },
  searchInput: { color: "#ffffff", flex: 1, fontSize: 16, minHeight: 52 },
  emptySearch: { color: "#91a8b8", fontSize: 14, lineHeight: 21, paddingVertical: 24, textAlign: "center", width: "100%" },
  attribution: { color: "#7ce0d6", fontSize: 12, marginBottom: 4, textAlign: "center", textDecorationLine: "underline" },
  results: { flex: 1 },
  resultsContent: { gap: 12, paddingBottom: 20 },
  resultsContentWide: { flexDirection: "row", flexWrap: "wrap" },
  surfSpotCard: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)", borderCurve: "continuous", borderRadius: 18, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 84, paddingHorizontal: 18, paddingVertical: 16 },
  surfSpotCardWide: { flexBasis: "48%", flexGrow: 1, minHeight: 96 },
  refreshButton: { alignItems: "center", borderColor: "rgba(255,255,255,0.16)", borderCurve: "continuous", borderRadius: 16, borderWidth: 1, justifyContent: "center", marginBottom: 16, marginTop: 12, minHeight: 52 },
  refreshButtonWide: { alignSelf: "flex-start", minWidth: 220, paddingHorizontal: 20 },
  refreshButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  surfSpotName: { color: "#ffffff", fontSize: 17, fontWeight: "700" },
  surfSpotDistance: { color: "#91a8b8", fontSize: 13, marginTop: 4 },
  cardArrowCircle: { alignItems: "center", backgroundColor: "rgba(86,214,201,0.12)", borderRadius: 16, height: 32, justifyContent: "center", width: 32 },
  cardArrow: { color: "#56d6c9", fontSize: 12, fontWeight: "900" },
});
