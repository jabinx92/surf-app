import { forwardRef } from "react";
import { StyleSheet, TextInput, type TextInputProps } from "react-native";

export const Input = forwardRef<TextInput, TextInputProps>(function Input({ style, ...props }, ref) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor="#a1a1aa"
      selectionColor="#0f766e"
      style={[styles.input, style]}
      {...props}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#d4d4d8",
    borderCurve: "continuous",
    borderRadius: 10,
    borderWidth: 1,
    color: "#18181b",
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
