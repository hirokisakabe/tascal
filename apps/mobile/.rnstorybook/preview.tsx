import type { Preview } from "@storybook/react-native";
import { Appearance, StyleSheet, View } from "react-native";
import {
  SafeAreaProvider,
  type InitialWindowMetrics,
} from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";

const initialMetrics: InitialWindowMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const colorScheme =
        context.parameters.colorScheme === "dark" ? "dark" : "light";
      Appearance.setColorScheme(colorScheme);

      return (
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <View
            style={[
              styles.canvas,
              { backgroundColor: Colors[colorScheme].background },
            ]}
          >
            <Story />
          </View>
        </SafeAreaProvider>
      );
    },
  ],
  parameters: {
    colorScheme: "light",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    padding: 16,
  },
});

export default preview;
