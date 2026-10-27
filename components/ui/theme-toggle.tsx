import { StyleSheet, Text, View } from "react-native";

import FeedbackPressable from "@/components/feedback-pressable";
import { themes, useAppTheme, useThemedStyles, type AppTheme, type ThemeName } from "@/lib/app-theme";

const options: ThemeName[] = ["navy", "sport"];

// A two-option switch between the Navy and Sport looks.
export function ThemeToggle() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View accessibilityLabel="App look" accessibilityRole="radiogroup" style={styles.track}>
      {options.map((option) => {
        const selected = theme.name === option;
        return (
          <FeedbackPressable
            accessibilityLabel={`${themes[option].displayName} look`}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            haptic="selection"
            key={option}
            onPress={() => theme.setTheme(option)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{themes[option].displayName}</Text>
          </FeedbackPressable>
        );
      })}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    track: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderCurve: "continuous", borderRadius: theme.radius.md, borderWidth: 1, flexDirection: "row", padding: 3 },
    option: { alignItems: "center", borderCurve: "continuous", borderRadius: Math.max(theme.radius.md - 3, 2), justifyContent: "center", minHeight: 34, paddingHorizontal: 11 },
    optionSelected: { backgroundColor: theme.colors.inverse },
    optionText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: "700" },
    optionTextSelected: { color: theme.colors.onInverse },
  });
}
