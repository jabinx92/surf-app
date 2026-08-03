import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { defaultAvatarColor } from "@/utils/avatar";

export { avatarColors, defaultAvatarColor } from "@/utils/avatar";

type ProfileAvatarProps = {
  color?: string | null;
  imageUrl?: string | null;
  name?: string | null;
  size?: number;
};

export default function ProfileAvatar({
  color = defaultAvatarColor,
  imageUrl,
  name,
  size = 96,
}: ProfileAvatarProps) {
  const initials = getInitials(name);
  const radius = size / 2;

  if (imageUrl) {
    return (
      <Image
        accessibilityLabel={`${name || "WaveLens user"} profile picture`}
        contentFit="cover"
        source={imageUrl}
        style={{ borderRadius: radius, height: size, width: size }}
        transition={180}
      />
    );
  }

  return (
    <View
      accessibilityLabel={`${name || "WaveLens user"} initials avatar`}
      style={[
        styles.fallback,
        { backgroundColor: color || defaultAvatarColor, borderRadius: radius, height: size, width: size },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

function getInitials(name?: string | null) {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (!words.length) return "W";
  return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join("");
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.28)",
    borderWidth: 2,
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: {
    color: "#ffffff",
    fontWeight: "900",
    letterSpacing: -1,
  },
});
