import { StyleSheet, Text, View } from "react-native";

import { passwordRequirements } from "@/utils/password";

type PasswordRequirementsProps = {
  heading?: string;
  password: string;
};

export default function PasswordRequirements({
  heading = "Your password needs:",
  password,
}: PasswordRequirementsProps) {
  return (
    <View accessibilityRole="list" style={styles.container}>
      <Text style={styles.heading}>{heading}</Text>
      {passwordRequirements.map((requirement) => {
        const isMet = requirement.test(password);

        return (
          <Text key={requirement.label} style={isMet ? styles.met : styles.unmet}>
            {isMet ? "✓" : "○"} {requirement.label}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  heading: { color: "#344054", fontSize: 14, fontWeight: "600", marginBottom: 2 },
  met: { color: "#067647", fontSize: 14 },
  unmet: { color: "#667085", fontSize: 14 },
});
