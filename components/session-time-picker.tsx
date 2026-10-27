import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme, useThemedStyles, type AppTheme } from "@/lib/app-theme";
import { formatSessionTime } from "@/utils/session-time";

type SessionTimePickerProps = {
  onChange: (time: string) => void;
  value: string;
};

const timeOptions = Array.from({ length: 31 }, (_, index) => {
  const totalMinutes = 5 * 60 + index * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

export function SessionTimePicker({ onChange, value }: SessionTimePickerProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View>
      <Pressable
        accessibilityHint="Opens available session start times"
        accessibilityLabel={`Session start time: ${formatSessionTime(value)}`}
        accessibilityRole="button"
        onPress={() => setIsOpen((open) => !open)}
        style={({ pressed }) => [styles.timeButton, pressed && styles.pressed]}
      >
        <Text style={[styles.timeValue, !value && styles.placeholder]}>{value ? formatSessionTime(value) : "Choose a start time"}</Text>
        <IconSymbol color={theme.colors.textMuted} name="clock" size={20} />
      </Pressable>

      {isOpen ? (
        <View style={styles.panel}>
          <View style={styles.grid}>
            {timeOptions.map((time) => {
              const isSelected = time === value;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={time}
                  onPress={() => {
                    onChange(time);
                    setIsOpen(false);
                  }}
                  style={[styles.option, isSelected && styles.optionSelected]}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{formatSessionTime(time)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radius } = theme;
  return StyleSheet.create({
    timeButton: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderCurve: "continuous", borderRadius: radius.md, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 54, paddingHorizontal: 16 },
    pressed: { opacity: 0.8 },
    timeValue: { color: colors.text, fontSize: 16, fontWeight: "600" },
    placeholder: { color: colors.textFaint, fontWeight: "500" },
    panel: { backgroundColor: colors.surface, borderColor: colors.border, borderCurve: "continuous", borderRadius: radius.lg, borderWidth: 1, marginTop: 8, padding: 14 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    option: { alignItems: "center", backgroundColor: colors.background, borderColor: colors.border, borderCurve: "continuous", borderRadius: radius.sm, borderWidth: 1, minWidth: 84, paddingHorizontal: 9, paddingVertical: 10 },
    optionSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
    optionText: { color: colors.text, fontSize: 14, fontVariant: ["tabular-nums"], fontWeight: "600" },
    optionTextSelected: { color: colors.onAccent, fontWeight: "800" },
  });
}
