import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Redirect, Slot, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { Colors } from "@/constants/theme";

const lightNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.background,
    text: Colors.light.text,
    border: Colors.light.borderLight,
    notification: Colors.light.danger,
  },
};

const darkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.background,
    text: Colors.dark.text,
    border: Colors.dark.borderLight,
    notification: Colors.dark.danger,
  },
};

function AuthGate() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 現在のルートが login かどうか判定
  const isOnLogin = segments[0] === "login";

  if (!user && !isOnLogin) {
    return <Redirect href="/login" />;
  }

  if (user && isOnLogin) {
    return <Redirect href="/(tabs)" />;
  }

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider
        value={
          colorScheme === "dark" ? darkNavigationTheme : lightNavigationTheme
        }
      >
        <AuthGate />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
