import { useMemo } from "react";
import type { TextStyle } from "react-native";

export type AppTheme = {
  statusBar: "light" | "dark";
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textMuted: string;
    textFaint: string;
    border: string;
    borderStrong: string;
    accent: string;
    accentPressed: string;
    onAccent: string;
    accentSoft: string;
    accentText: string;
    inverse: string;
    onInverse: string;
    warning: string;
    warningSoft: string;
    star: string;
    // Bands used by the photo placeholder: sky, sea, deep water.
    photo: [string, string, string];
  };
  radius: { sm: number; md: number; lg: number; pill: number };
  // Big headlines.
  display: TextStyle;
  heading: TextStyle;
  // Small section labels.
  label: TextStyle;
};

// WaveLens's one look: deep navy with a teal accent. Every redesigned screen takes its colors from here.
export const theme: AppTheme = {
  statusBar: "light",
  colors: {
    background: "#071a2b",
    surface: "#0d2436",
    surfaceAlt: "#132f45",
    text: "#f2f6f8",
    textMuted: "#a9bac7",
    textFaint: "#718a9c",
    border: "rgba(255,255,255,0.09)",
    borderStrong: "rgba(255,255,255,0.2)",
    accent: "#56d6c9",
    accentPressed: "#43c3b6",
    onAccent: "#04131f",
    accentSoft: "rgba(86,214,201,0.12)",
    accentText: "#7fe3d8",
    inverse: "#f2f6f8",
    onInverse: "#071a2b",
    warning: "#ffb15c",
    warningSoft: "rgba(255,177,92,0.1)",
    star: "#f5b841",
    photo: ["#3a7896", "#235a77", "#164259"],
  },
  radius: { sm: 10, md: 14, lg: 20, pill: 999 },
  display: { fontWeight: "700", letterSpacing: -1.2 },
  heading: { fontWeight: "700", letterSpacing: -0.4 },
  label: { fontSize: 13, fontWeight: "600" },
};

export function useAppTheme() {
  return theme;
}

// Builds a screen's styles from the theme once.
export function useThemedStyles<T>(factory: (theme: AppTheme) => T): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(theme), []);
}
