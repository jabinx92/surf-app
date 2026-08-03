import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
        <Text style={styles.timeIcon}>TIME</Text>
      </Pressable>

      {isOpen ? (
        <View style={styles.panel}>
          <Text style={styles.help}>Choose when you want the session to begin.</Text>
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

const styles = StyleSheet.create({
  timeButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.14)", borderCurve: "continuous", borderRadius: 16, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 58, paddingHorizontal: 16 },
  pressed: { opacity: 0.8 },
  timeValue: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  placeholder: { color: "#91a8b8", fontWeight: "500" },
  timeIcon: { color: "#56d6c9", fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  panel: { backgroundColor: "#102a39", borderColor: "rgba(255,255,255,0.14)", borderCurve: "continuous", borderRadius: 18, borderWidth: 1, marginTop: 10, padding: 14 },
  help: { color: "#9bb2c1", fontSize: 13, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  option: { alignItems: "center", borderColor: "rgba(255,255,255,0.13)", borderRadius: 10, borderWidth: 1, minWidth: 84, paddingHorizontal: 9, paddingVertical: 10 },
  optionSelected: { backgroundColor: "#56d6c9", borderColor: "#56d6c9" },
  optionText: { color: "#d9e5ec", fontSize: 13, fontVariant: ["tabular-nums"], fontWeight: "700" },
  optionTextSelected: { color: "#061827", fontWeight: "900" },
});
