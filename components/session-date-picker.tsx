import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type SessionDatePickerProps = {
  onChange: (date: string) => void;
  value: string;
};

const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
}

export function SessionDatePicker({ onChange, value }: SessionDatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = parseDateValue(value);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(selectedDate?.getFullYear() ?? today.getFullYear(), selectedDate?.getMonth() ?? today.getMonth(), 1));

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarCells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric", year: "numeric" })
    : "Choose a date";

  function changeMonth(offset: number) {
    setVisibleMonth(new Date(year, month + offset, 1));
  }

  function chooseDay(day: number) {
    const nextDate = new Date(year, month, day);
    if (nextDate < today) return;
    onChange(formatDateValue(nextDate));
    setIsOpen(false);
  }

  return (
    <View>
      <Pressable
        accessibilityHint="Opens a calendar"
        accessibilityLabel={`Session date: ${displayValue}`}
        accessibilityRole="button"
        onPress={() => setIsOpen((open) => !open)}
        style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}
      >
        <View>
          <Text style={[styles.dateValue, !selectedDate && styles.placeholder]}>{displayValue}</Text>
          {selectedDate ? <Text style={styles.storedDate}>{value}</Text> : null}
        </View>
        <Text style={styles.calendarIcon}>CAL</Text>
      </Pressable>

      {isOpen ? (
        <View style={styles.calendar}>
          <View style={styles.monthHeader}>
            <Pressable accessibilityLabel="Previous month" accessibilityRole="button" disabled={isCurrentMonth} onPress={() => changeMonth(-1)} style={[styles.monthButton, isCurrentMonth && styles.monthButtonDisabled]}>
              <Text style={styles.monthButtonText}>&lt;</Text>
            </Pressable>
            <Text accessibilityRole="header" style={styles.monthTitle}>{visibleMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</Text>
            <Pressable accessibilityLabel="Next month" accessibilityRole="button" onPress={() => changeMonth(1)} style={styles.monthButton}>
              <Text style={styles.monthButtonText}>&gt;</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {weekdayLabels.map((label, index) => <Text key={`${label}-${index}`} style={styles.weekday}>{label}</Text>)}
          </View>
          <View style={styles.daysGrid}>
            {calendarCells.map((day, index) => {
              if (day === null) return <View key={`empty-${index}`} style={styles.dayCell} />;
              const date = new Date(year, month, day);
              const dateValue = formatDateValue(date);
              const isPast = date < today;
              const isSelected = dateValue === value;
              return (
                <Pressable
                  accessibilityLabel={date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                  accessibilityRole="button"
                  disabled={isPast}
                  key={dateValue}
                  onPress={() => chooseDay(day)}
                  style={[styles.dayCell, isSelected && styles.daySelected]}
                >
                  <Text style={[styles.dayText, isPast && styles.dayPast, isSelected && styles.daySelectedText]}>{day}</Text>
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
  dateButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.14)", borderCurve: "continuous", borderRadius: 16, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 58, paddingHorizontal: 16, paddingVertical: 11 },
  pressed: { opacity: 0.8 },
  dateValue: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  placeholder: { color: "#91a8b8", fontWeight: "500" },
  storedDate: { color: "#698596", fontSize: 11, marginTop: 3 },
  calendarIcon: { color: "#56d6c9", fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  calendar: { backgroundColor: "#102a39", borderColor: "rgba(255,255,255,0.14)", borderCurve: "continuous", borderRadius: 18, borderWidth: 1, marginTop: 10, padding: 14 },
  monthHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  monthButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, height: 38, justifyContent: "center", width: 38 },
  monthButtonDisabled: { opacity: 0.3 },
  monthButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "800" },
  monthTitle: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  weekRow: { flexDirection: "row" },
  weekday: { color: "#698596", fontSize: 11, fontWeight: "900", paddingBottom: 8, textAlign: "center", width: "14.2857%" },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { alignItems: "center", aspectRatio: 1, borderRadius: 999, justifyContent: "center", width: "14.2857%" },
  daySelected: { backgroundColor: "#56d6c9" },
  dayText: { color: "#d9e5ec", fontSize: 14, fontVariant: ["tabular-nums"], fontWeight: "700" },
  dayPast: { color: "#486373" },
  daySelectedText: { color: "#061827", fontWeight: "900" },
});
