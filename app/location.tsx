import { surfSpots } from "@/data/surf-spots";
import { getDistanceInMiles } from "@/utils/distance";
import { findNearbySurfMapSpots, searchSurfMapSpots } from "@/utils/surf-map";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FeedbackPressable from "@/components/feedback-pressable";
import { AppButton } from "@/components/ui/app-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { HeroVideo } from "@/components/ui/hero-video";
import { spotPickerMedia } from "@/constants/media";
import { TopBar } from "@/components/ui/top-bar";
import { useAppTheme, useThemedStyles, type AppTheme } from "@/lib/app-theme";

type NearbySurfSpot = {
  id: number | string;
  name: string;
  latitude: number;
  longitude: number;
  distance?: number;
  detail?: string;
};

export default function LocationScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
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

  const renderSpotRow = (surfSpot: NearbySurfSpot) => (
    <FeedbackPressable
      key={surfSpot.id}
      accessibilityRole="button"
      haptic="selection"
      onPress={() => openCreators(surfSpot.name)}
      style={({ hovered, pressed }) => [styles.spotRow, (hovered || pressed) && styles.spotRowActive]}
      wrapperStyle={isWide ? styles.spotRowWide : undefined}
    >
      <View style={styles.spotIcon}><IconSymbol color={theme.colors.accentText} name="mappin" size={18} /></View>
      <View style={styles.spotCopy}>
        <Text numberOfLines={1} style={styles.spotName}>{surfSpot.name}</Text>
        <Text numberOfLines={1} style={styles.spotDetail}>
          {typeof surfSpot.distance === "number" ? `${surfSpot.distance.toFixed(1)} mi away${surfSpot.detail ? ` · ${surfSpot.detail}` : ""}` : surfSpot.detail || "See local creators"}
        </Text>
      </View>
      <IconSymbol color={theme.colors.textFaint} name="chevron.right" size={20} />
    </FeedbackPressable>
  );

  const attribution = usesSurfMap ? (
    <Pressable accessibilityRole="link" onPress={() => void Linking.openURL("https://surf-map.com/")}>
      <Text style={styles.attribution}>Surf data by SurfMap</Text>
    </Pressable>
  ) : null;

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <View style={[styles.shell, isWide && styles.shellWide]}>
        <TopBar back />

        {isChoosingSpot ? (
          <View style={styles.flex}>
            <View style={styles.header}>
              <Text style={[styles.title, isWide && styles.titleWide]}>Where are you surfing?</Text>
              <Text style={styles.subtitle}>Search for a break to see photographers who shoot there.</Text>
              <View style={styles.searchBox}>
                <IconSymbol color={theme.colors.textFaint} name="magnifyingglass" size={20} />
                <TextInput accessibilityLabel="Search surf spots" autoCapitalize="words" autoCorrect={false} onChangeText={setSearchQuery} placeholder="Lower Trestles, Steamer Lane…" placeholderTextColor={theme.colors.textFaint} returnKeyType="search" style={styles.searchInput} value={searchQuery} />
                {isSearching ? <ActivityIndicator color={theme.colors.accent} size="small" /> : null}
              </View>
              {status !== "Ready" ? <Text selectable style={styles.notice}>{status}</Text> : null}
            </View>
            <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.flex} contentContainerStyle={[styles.list, isWide && styles.listWide]} showsVerticalScrollIndicator={false}>
              {(searchQuery.trim().length >= 2 ? searchResults : surfSpots).map(renderSpotRow)}
              {searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 ? <Text style={styles.empty}>No matching surf spots. Try a nearby town or another spelling.</Text> : null}
            </ScrollView>
            <View style={styles.bottomBar}>
              {attribution}
              <AppButton onPress={() => setIsChoosingSpot(false)} variant="secondary">Use my location instead</AppButton>
            </View>
          </View>
        ) : nearbySurfSpots.length === 0 ? (
          <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} style={styles.flex} contentContainerStyle={[styles.intro, isWide && styles.introWide]}>
            <HeroVideo accessibilityLabel="A surfer holding a board at sunset" media={spotPickerMedia} style={[styles.introPhoto, isWide && styles.introPhotoWide]} />
            <View style={[styles.introMain, isWide && styles.introMainWide]}>
            <View style={styles.introCopy}>
              <Text style={[styles.title, isWide && styles.titleWide]}>Where are you surfing?</Text>
              <Text style={styles.subtitle}>We&apos;ll show the closest breaks and the photographers who shoot them.</Text>
            </View>
            <View style={styles.introActions}>
              <AppButton onPress={() => void getCurrentLocation()} size="lg">Use my location</AppButton>
              <AppButton onPress={() => setIsChoosingSpot(true)} size="lg" variant="secondary">Search for a spot</AppButton>
              {status !== "Ready" ? (
                <View style={styles.statusRow}>
                  {status.endsWith("...") ? <ActivityIndicator color={theme.colors.accent} size="small" /> : null}
                  <Text selectable style={styles.statusText}>{status}</Text>
                </View>
              ) : null}
              <Text style={styles.privacy}>We only use your location to find nearby breaks.</Text>
            </View>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.flex}>
            <View style={styles.header}>
              <Text style={[styles.title, isWide && styles.titleWide]}>Breaks near you</Text>
              <Text style={styles.subtitle}>Closest first. Tap one to see who shoots there.</Text>
            </View>
            <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.flex} contentContainerStyle={[styles.list, isWide && styles.listWide]} showsVerticalScrollIndicator={false}>
              {nearbySurfSpots.map(renderSpotRow)}
            </ScrollView>
            <View style={styles.bottomBar}>
              {attribution}
              <AppButton onPress={() => setIsChoosingSpot(true)} variant="secondary">Search for a different spot</AppButton>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radius } = theme;
  return StyleSheet.create({
    screen: { backgroundColor: colors.background, flex: 1 },
    flex: { flex: 1 },
    shell: { alignSelf: "center", flex: 1, maxWidth: 640, paddingHorizontal: 20, width: "100%" },
    shellWide: { maxWidth: 1000, paddingHorizontal: 40 },
    header: { paddingBottom: 20, paddingTop: 16 },
    title: { ...theme.display, color: colors.text, fontSize: 36, lineHeight: 40 },
    titleWide: { fontSize: 48, lineHeight: 52 },
    subtitle: { color: colors.textMuted, fontSize: 16, lineHeight: 23, marginTop: 10, maxWidth: 480 },
    searchBox: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderCurve: "continuous", borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: 10, marginTop: 20, minHeight: 52, paddingHorizontal: 14 },
    searchInput: { color: colors.text, flex: 1, fontSize: 16, minHeight: 50 },
    notice: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 12 },
    list: { paddingBottom: 16 },
    listWide: { columnGap: 24, flexDirection: "row", flexWrap: "wrap" },
    spotRow: { alignItems: "center", borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: "row", gap: 14, minHeight: 68, paddingVertical: 12 },
    spotRowActive: { opacity: 0.7 },
    spotRowWide: { flexBasis: "45%", flexGrow: 1 },
    spotIcon: { alignItems: "center", backgroundColor: colors.accentSoft, borderRadius: radius.sm, height: 36, justifyContent: "center", width: 36 },
    spotCopy: { flex: 1, minWidth: 0 },
    spotName: { color: colors.text, fontSize: 16, fontWeight: "700" },
    spotDetail: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
    empty: { color: colors.textMuted, fontSize: 15, lineHeight: 22, paddingVertical: 24, textAlign: "center", width: "100%" },
    bottomBar: { borderTopColor: colors.border, borderTopWidth: 1, gap: 10, paddingBottom: 16, paddingTop: 12 },
    attribution: { color: colors.textFaint, fontSize: 12, textAlign: "center", textDecorationLine: "underline" },
    intro: { flexGrow: 1, gap: 28, paddingBottom: 48, paddingTop: 8 },
    introWide: { alignItems: "center", flexDirection: "row", gap: 56, justifyContent: "center" },
    introPhoto: { aspectRatio: 16 / 10, width: "100%" },
    introPhotoWide: { aspectRatio: 3 / 4, flexBasis: 380, flexShrink: 0, width: "auto" },
    introMain: { gap: 28 },
    introMainWide: { flex: 1, minWidth: 0 },
    introCopy: { flexShrink: 1, maxWidth: 520 },
    introActions: { gap: 12, maxWidth: 420, width: "100%" },
    statusRow: { alignItems: "center", flexDirection: "row", gap: 10, marginTop: 4 },
    statusText: { color: colors.textMuted, fontSize: 14 },
    privacy: { color: colors.textFaint, fontSize: 13, lineHeight: 19 },
  });
}
