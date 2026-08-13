import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

type HomeBrandLinkProps = {
  top: number;
};

export default function HomeBrandLink({ top }: HomeBrandLinkProps) {
  const { width } = useWindowDimensions();
  const showName = width >= 560;
  const right = width >= 1180 ? (width - 1180) / 2 + 40 : 20;

  return (
    <View style={[styles.position, { right, top }]}>
      <Link href="/" asChild>
        <Pressable
          accessibilityLabel="WaveLens home"
          accessibilityRole="link"
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}
        >
          <Image source={require("@/assets/images/wavelens-icon.png")} style={styles.logo} />
          {showName ? <Text style={styles.name}>WaveLens</Text> : null}
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  position: { position: "absolute", zIndex: 90 },
  link: {
    alignItems: "center",
    backgroundColor: "rgba(6,24,39,0.88)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    minHeight: 44,
    paddingHorizontal: 7,
  },
  logo: { borderRadius: 9, height: 32, width: 32 },
  name: { color: "#ffffff", fontSize: 17, fontWeight: "800", letterSpacing: -0.4, paddingRight: 5 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
