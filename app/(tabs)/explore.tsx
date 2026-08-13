import { surfSpots } from "@/data/surf-spots";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExploreScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 820;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.shell, isWide && styles.shellWide]}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={() => router.push("/")} style={styles.brandLockup}>
              <Image source={require("@/assets/images/wavelens-icon.png")} style={styles.brandMark} />
              <Text style={styles.brand}>WaveLens</Text>
            </Pressable>
            {isWide ? <Pressable accessibilityRole="link" onPress={() => router.push("/creators")} style={styles.creatorsLink}><Text style={styles.creatorsLinkText}>Find creators</Text></Pressable> : null}
            <Pressable accessibilityRole="button" onPress={() => router.push("/account")} style={styles.account}><Text style={styles.accountText}>Account</Text></Pressable>
          </View>

          <View style={[styles.intro, isWide && styles.introWide]}>
            <View style={styles.introCopy}>
              <Text style={styles.eyebrow}>DISCOVER THE COAST</Text>
              <Text style={[styles.title, isWide && styles.titleWide]}>Find a creator near your next break.</Text>
              <Text style={styles.subtitle}>Choose a Bay Area surf spot to browse local photo and video coverage.</Text>
            </View>
            <View style={[styles.locationPanel, isWide && styles.locationPanelWide]}>
              <Text style={styles.locationKicker}>NEAR YOU</Text>
              <Text style={styles.locationTitle}>Start with the closest break.</Text>
              <Text style={styles.locationDescription}>Use your location to jump straight to nearby surf coverage.</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push("/location")} style={({ pressed }) => [styles.locationButton, pressed && styles.pressed]}><Text style={styles.locationButtonText}>Use my current location</Text><Text style={styles.locationArrow}>-&gt;</Text></Pressable>
            </View>
          </View>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Popular breaks</Text><Text style={styles.sectionLabel}>BAY AREA</Text></View>
          <View style={[styles.spotGrid, isWide && styles.spotGridWide]}>
            {surfSpots.map((spot, index) => (
              <Pressable key={spot.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/creators", params: { spot: spot.name } })} style={({ pressed }) => [styles.spotCard, isWide && styles.spotCardWide, pressed && styles.pressed]}>
                <Text style={styles.spotIndex}>0{index + 1}</Text>
                <Text style={styles.spotName}>{spot.name}</Text>
                <View style={styles.spotFooter}><Text style={styles.spotAction}>Browse creators</Text><View style={styles.arrowCircle}><Text style={styles.arrowText}>-&gt;</Text></View></View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#061827", flex: 1 },
  scrollContent: { paddingBottom: 36 },
  shell: { alignSelf: "center", maxWidth: 640, paddingHorizontal: 20, width: "100%" },
  shellWide: { maxWidth: 1160, paddingHorizontal: 40 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 72 },
  brandLockup: { alignItems: "center", flexDirection: "row", gap: 10, minHeight: 44 },
  brandMark: { borderRadius: 12, height: 34, width: 34 },
  brand: { color: "#ffffff", fontSize: 20, fontWeight: "900", letterSpacing: -0.6 },
  creatorsLink: { left: "50%", minHeight: 42, justifyContent: "center", position: "absolute", transform: [{ translateX: -44 }] },
  creatorsLinkText: { color: "#9fb5c4", fontSize: 13, fontWeight: "700" },
  account: { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.12)", borderRadius: 14, borderWidth: 1, minHeight: 40, justifyContent: "center", paddingHorizontal: 14 },
  accountText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  intro: { gap: 28, paddingTop: 42 },
  introWide: { alignItems: "stretch", flexDirection: "row", gap: 72, paddingBottom: 24, paddingTop: 70 },
  introCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: "#7ce0d6", fontSize: 11, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: "#ffffff", fontSize: 41, fontWeight: "800", letterSpacing: -1.7, lineHeight: 46, marginTop: 12, maxWidth: 600 },
  titleWide: { fontSize: 55, letterSpacing: -2.5, lineHeight: 59 },
  subtitle: { color: "#b9c9d6", fontSize: 16, lineHeight: 24, marginTop: 15, maxWidth: 530 },
  locationPanel: { backgroundColor: "rgba(16,42,57,0.9)", borderColor: "rgba(255,255,255,0.12)", borderCurve: "continuous", borderRadius: 24, borderWidth: 1, boxShadow: "0 18px 36px rgba(0, 0, 0, 0.16)", padding: 22 },
  locationPanelWide: { flexBasis: 390, flexShrink: 0, justifyContent: "center", maxWidth: 390 },
  locationKicker: { color: "#7ce0d6", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  locationTitle: { color: "#ffffff", fontSize: 23, fontWeight: "800", letterSpacing: -0.7, marginTop: 10 },
  locationDescription: { color: "#91a8b8", fontSize: 14, lineHeight: 20, marginTop: 8 },
  locationButton: { alignItems: "center", backgroundColor: "#56d6c9", borderCurve: "continuous", borderRadius: 15, flexDirection: "row", justifyContent: "space-between", marginTop: 22, minHeight: 52, paddingHorizontal: 17 },
  locationButtonText: { color: "#061827", fontSize: 14, fontWeight: "900" },
  locationArrow: { color: "#061827", fontSize: 16, fontWeight: "900" },
  sectionHeader: { alignItems: "center", borderTopColor: "rgba(255,255,255,0.12)", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", marginBottom: 16, marginTop: 42, paddingTop: 30 },
  sectionTitle: { color: "#ffffff", fontSize: 24, fontWeight: "800", letterSpacing: -0.7 },
  sectionLabel: { color: "#718b9b", fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  spotGrid: { gap: 12 },
  spotGridWide: { flexDirection: "row", flexWrap: "wrap" },
  spotCard: { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)", borderCurve: "continuous", borderRadius: 22, borderWidth: 1, minHeight: 158, padding: 19 },
  spotCardWide: { flexBasis: "31%", flexGrow: 1 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  spotIndex: { color: "#56d6c9", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  spotName: { color: "#ffffff", fontSize: 22, fontWeight: "800", letterSpacing: -0.6, marginTop: 18 },
  spotFooter: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: "auto", paddingTop: 18 },
  spotAction: { color: "#9bb2c1", fontSize: 13, fontWeight: "700" },
  arrowCircle: { alignItems: "center", backgroundColor: "rgba(86,214,201,0.12)", borderRadius: 15, height: 30, justifyContent: "center", width: 30 },
  arrowText: { color: "#7ce0d6", fontSize: 12, fontWeight: "900" },
});
