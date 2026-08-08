import type { Meta, StoryObj } from "@storybook/react-native";
import type { ComponentProps } from "react";
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

function renderSurface(
  args: ComponentProps<typeof SheetSurface>,
  colorScheme: "light" | "dark",
) {
  return (
    <View style={styles.container}>
      <SheetSurface {...args} style={[styles.surface, args.style]}>
        {args.children ?? (
          <>
            <ThemedText type="defaultSemiBold">Sheet surface</ThemedText>
            <ThemedText>Glass対応端末とfallback表示を確認します。</ThemedText>
          </>
        )}
      </SheetSurface>
    </View>
  );
}

export const Light: Story = {
  args: {
    fallbackBackgroundColor: Colors.light.background,
    glassTintColor: Colors.light.glassTint,
  },
  render: (args) => renderSurface(args, "light"),
};

export const Dark: Story = {
  args: {
    fallbackBackgroundColor: Colors.dark.background,
    glassTintColor: Colors.dark.glassTint,
  },
  parameters: { colorScheme: "dark" },
  render: (args) => renderSurface(args, "dark"),
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
