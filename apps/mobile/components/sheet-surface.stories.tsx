import type { Meta, StoryObj } from "@storybook/react-native";
import { StyleSheet, View } from "react-native";

import { SheetSurface } from "@/components/sheet-surface";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";

const meta = {
  title: "Components/SheetSurface",
  component: SheetSurface,
} satisfies Meta<typeof SheetSurface>;

export default meta;

type Story = StoryObj<typeof meta>;

function renderSurface(colorScheme: "light" | "dark") {
  const colors = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <SheetSurface
        fallbackBackgroundColor={colors.background}
        glassTintColor={colors.glassTint}
        style={styles.surface}
      >
        <ThemedText type="defaultSemiBold">Sheet surface</ThemedText>
        <ThemedText>Glass対応端末とfallback表示を確認します。</ThemedText>
      </SheetSurface>
    </View>
  );
}

export const Light: Story = {
  args: {
    fallbackBackgroundColor: Colors.light.background,
    glassTintColor: Colors.light.glassTint,
  },
  render: () => renderSurface("light"),
};

export const Dark: Story = {
  args: {
    fallbackBackgroundColor: Colors.dark.background,
    glassTintColor: Colors.dark.glassTint,
  },
  parameters: { colorScheme: "dark" },
  render: () => renderSurface("dark"),
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  surface: {
    borderRadius: 20,
    gap: 8,
    minHeight: 220,
    padding: 24,
  },
});
