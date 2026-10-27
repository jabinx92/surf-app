import { creatorTitle, hourlyRate, type Creator } from "@/data/creators";
import FeedbackPressable from "@/components/feedback-pressable";
import ProfileAvatar from "@/components/profile-avatar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PhotoPlaceholder } from "@/components/ui/photo-placeholder";
import { useAppTheme, useThemedStyles, type AppTheme } from "@/lib/app-theme";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

type CreatorCardProps = {
  creator: Creator;
  spot?: string;
};

const weekdayNames = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CreatorCard({ creator, spot }: CreatorCardProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const matchingAvailability = creator.availability?.filter((slot) => !spot || !slot.surf_spot || slot.surf_spot === spot) ?? [];
  const availableDays = [...new Set(matchingAvailability.map(slot => weekdayNames[slot.weekday]))].join(", ");

  return (
    <FeedbackPressable
      accessibilityHint={`Opens ${creator.display_name}'s profile`}
      accessibilityLabel={`${creator.display_name}, ${creatorTitle(creator.services)}, ${hourlyRate(creator)}`}
      accessibilityRole="button"
      haptic="selection"
      onPress={() => router.push({ pathname: "/creators/[id]", params: { id: creator.id, ...(spot ? { spot } : {}) } })}
      style={({ hovered }) => [styles.card, hovered && styles.cardHover]}
    >
      <PhotoPlaceholder style={styles.photo}>
        <View style={styles.price}><Text style={styles.priceText}>{hourlyRate(creator)}</Text></View>
      </PhotoPlaceholder>
      <View style={styles.avatar}>
        <ProfileAvatar color={creator.avatar_color} imageUrl={creator.avatar_url} name={creator.display_name} size={56} />
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} selectable style={styles.name}>{creator.display_name}</Text>
          {creator.is_verified ? <IconSymbol color={theme.colors.accentText} name="checkmark.seal.fill" size={18} /> : null}
        </View>
        <Text style={styles.meta}>{creatorTitle(creator.services)} · {creator.city}</Text>
        <Text style={styles.services}>{creator.services.join(" · ")} · travels {creator.travel_miles} mi</Text>
        <Text style={matchingAvailability.length ? styles.available : styles.unavailable}>
          {matchingAvailability.length ? `Usually free ${availableDays}` : "Ask about availability"}
        </Text>
      </View>
    </FeedbackPressable>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radius } = theme;
  return StyleSheet.create({
    card: { backgroundColor: colors.surface, borderColor: colors.border, borderCurve: "continuous", borderRadius: radius.lg, borderWidth: 1, overflow: "hidden" },
    cardHover: { borderColor: colors.borderStrong },
    photo: { aspectRatio: 16 / 9, borderRadius: 0, width: "100%" },
    price: { backgroundColor: colors.background, borderCurve: "continuous", borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6, position: "absolute", right: 12, top: 12 },
    priceText: { color: colors.text, fontSize: 14, fontVariant: ["tabular-nums"], fontWeight: "800" },
    avatar: { borderColor: colors.surface, borderRadius: 32, borderWidth: 4, left: 14, marginTop: -32, position: "relative", width: 64 },
    info: { paddingBottom: 18, paddingHorizontal: 18, paddingTop: 8 },
    nameRow: { alignItems: "center", flexDirection: "row", gap: 6 },
    name: { ...theme.heading, color: colors.text, flexShrink: 1, fontSize: 20 },
    meta: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 4 },
    services: { color: colors.textFaint, fontSize: 13, lineHeight: 19, marginTop: 2 },
    available: { color: colors.accentText, fontSize: 13, fontWeight: "700", marginTop: 12 },
    unavailable: { color: colors.textFaint, fontSize: 13, marginTop: 12 },
  });
}
