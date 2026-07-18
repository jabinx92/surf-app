import { creatorTitle, hourlyRate, type Creator } from "@/data/creators";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type CreatorCardProps = {
  creator: Creator;
  spot?: string;
};

export default function CreatorCard({ creator, spot }: CreatorCardProps) {
  const hasAvatar = Boolean(creator.avatar_url);

  return (
    <Pressable
      accessibilityHint={`Opens ${creator.display_name}'s profile`}
      accessibilityLabel={`${creator.display_name}, ${creatorTitle(creator.services)}, ${hourlyRate(creator)}`}
      accessibilityRole="button"
      onPress={() => router.push({ pathname: "/creators/[id]", params: { id: creator.id, ...(spot ? { spot } : {}) } })}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.media}>
        {hasAvatar ? (
          <Image accessibilityLabel={`${creator.display_name}'s profile`} contentFit="cover" source={creator.avatar_url!} style={styles.image} transition={180} />
        ) : (
          <View style={styles.fallbackAvatar}><Text style={styles.avatarInitial}>{creator.display_name.charAt(0).toUpperCase()}</Text></View>
        )}
        <View style={styles.mediaOverlay} />
        <View style={styles.availablePill}><View style={styles.availableDot} /><Text style={styles.availableText}>LOCAL CREATOR</Text></View>
        <View style={styles.pricePill}><Text style={styles.pricePillText}>{hourlyRate(creator)}</Text></View>
      </View>

      <View style={styles.info}>
        <Text selectable style={styles.name}>{creator.display_name}</Text>
        <Text selectable style={styles.title}>{creatorTitle(creator.services)}</Text>
        <View style={styles.metaRow}><Text selectable style={styles.location}>{creator.city}</Text><View style={styles.metaDot} /><Text selectable style={styles.travel}>{creator.travel_miles} mi travel</Text></View>
        <View style={styles.badges}>
          {creator.services.map((service) => <View key={service} style={styles.badge}><Text style={styles.badgeText}>{service}</Text></View>)}
        </View>
        <View style={styles.footer}><Text style={styles.viewText}>View profile</Text><View style={styles.arrowCircle}><Text style={styles.arrow}>-&gt;</Text></View></View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#102a39", borderColor: "rgba(255,255,255,0.12)", borderCurve: "continuous", borderRadius: 24, borderWidth: 1, overflow: "hidden" },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  media: { backgroundColor: "#1b4b61", height: 210, overflow: "hidden", position: "relative", width: "100%" },
  image: { height: "100%", width: "100%" },
  fallbackAvatar: { alignItems: "center", backgroundColor: "#1c5367", flex: 1, justifyContent: "center" },
  avatarInitial: { color: "#7ce0d6", fontSize: 76, fontWeight: "900" },
  mediaOverlay: { backgroundColor: "rgba(1,16,27,0.18)", bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  availablePill: { alignItems: "center", backgroundColor: "rgba(5,26,37,0.78)", borderColor: "rgba(255,255,255,0.16)", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 6, left: 14, paddingHorizontal: 10, paddingVertical: 6, position: "absolute", top: 14 },
  availableDot: { backgroundColor: "#56d6c9", borderRadius: 4, height: 7, width: 7 },
  availableText: { color: "#ffffff", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  pricePill: { backgroundColor: "#ffffff", borderRadius: 12, bottom: 14, paddingHorizontal: 11, paddingVertical: 7, position: "absolute", right: 14 },
  pricePillText: { color: "#061827", fontSize: 13, fontWeight: "900" },
  info: { padding: 18 },
  name: { color: "#ffffff", fontSize: 24, fontWeight: "800", letterSpacing: -0.7 },
  title: { color: "#98b9c9", fontSize: 14, lineHeight: 20, marginTop: 5 },
  metaRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  location: { color: "#d9e5ec", fontSize: 13, fontWeight: "700" },
  metaDot: { backgroundColor: "#698596", borderRadius: 2, height: 4, width: 4 },
  travel: { color: "#91a8b8", fontSize: 13 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 14 },
  badge: { backgroundColor: "rgba(86,214,201,0.1)", borderColor: "rgba(86,214,201,0.18)", borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { color: "#8aede2", fontSize: 11, fontWeight: "800" },
  footer: { alignItems: "center", borderTopColor: "rgba(255,255,255,0.1)", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 18, paddingTop: 15 },
  viewText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  arrowCircle: { alignItems: "center", backgroundColor: "#56d6c9", borderRadius: 15, height: 30, justifyContent: "center", width: 30 },
  arrow: { color: "#061827", fontSize: 12, fontWeight: "900" },
});
