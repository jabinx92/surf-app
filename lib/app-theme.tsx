import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform, type TextStyle } from "react-native";

export type ThemeName = "navy" | "sport";

export type AppTheme = {
  name: ThemeName;
  displayName: string;
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
  // Big headlines. Sport mode shouts; navy mode stays calm.
  display: TextStyle;
  heading: TextStyle;
  // Small section labels.
  label: TextStyle;
};

export const themes: Record<ThemeName, AppTheme> = {
  navy: {
    name: "navy",
    displayName: "Navy",
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
  },
  sport: {
    name: "sport",
    displayName: "Sport",
    statusBar: "dark",
    colors: {
      background: "#ffffff",
      surface: "#f4f4f1",
      surfaceAlt: "#e9e9e4",
      text: "#0b0b0b",
      textMuted: "#4a4a47",
      textFaint: "#7a7a75",
      border: "#e3e3de",
      borderStrong: "#0b0b0b",
      accent: "#d9440c",
      accentPressed: "#bb3a09",
      onAccent: "#ffffff",
      accentSoft: "#fdebe3",
      accentText: "#c23d0a",
      inverse: "#0b0b0b",
      onInverse: "#ffffff",
      warning: "#b45309",
      warningSoft: "#fef3e2",
      star: "#d9440c",
      photo: ["#ffd9b8", "#3d8fb5", "#1d5f80"],
    },
    radius: { sm: 4, md: 6, lg: 8, pill: 999 },
    display: { fontStyle: "italic", fontWeight: "900", letterSpacing: -0.8, textTransform: "uppercase" },
    heading: { fontWeight: "900", letterSpacing: -0.3 },
    label: { fontSize: 12, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  },
};

const storageKey = "wavelens-theme";

async function readStoredTheme() {
  try {
    if (Platform.OS === "web") {
      return typeof window === "undefined" ? null : window.localStorage.getItem(storageKey);
    }
    return await SecureStore.getItemAsync(storageKey);
  } catch {
    return null;
  }
}

async function storeTheme(name: ThemeName) {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") window.localStorage.setItem(storageKey, name);
      return;
    }
    await SecureStore.setItemAsync(storageKey, name);
  } catch {
    // Remembering the choice is a convenience; the app works without it.
  }
}

type ThemeContextValue = AppTheme & { setTheme: (name: ThemeName) => void; toggleTheme: () => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState<ThemeName>("navy");

  useEffect(() => {
    void readStoredTheme().then((stored) => {
      if (stored === "navy" || stored === "sport") setName(stored);
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const setTheme = (next: ThemeName) => {
      setName(next);
      void storeTheme(next);
    };
    return { ...themes[name], setTheme, toggleTheme: () => setTheme(name === "navy" ? "sport" : "navy") };
  }, [name]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("useAppTheme must be used inside AppThemeProvider");
  return theme;
}

// Builds a screen's styles from the active theme, rebuilding only when the theme changes.
export function useThemedStyles<T>(factory: (theme: AppTheme) => T): T {
  const theme = useAppTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(theme), [theme.name]);
}
