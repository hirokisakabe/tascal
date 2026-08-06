import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type UnscheduledTasksButtonProps = {
  count: number;
  onPress: () => void;
};

export function UnscheduledTasksButton({
  count,
  onPress,
}: UnscheduledTasksButtonProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <Pressable
      accessibilityLabel={`未スケジュールタスク ${count}件`}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.button, { borderColor: colors.controlBorder }]}
    >
      <IconSymbol
        color={colors.icon}
        name="list.bullet"
        size={22}
        weight="semibold"
      />
      {count > 0 ? (
        <View
          style={[styles.badge, { backgroundColor: colors.tintBackground }]}
        >
          <ThemedText style={[styles.badgeText, { color: colors.onTint }]}>
            {count}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    position: "relative",
    width: 44,
  },
  badge: {
    alignItems: "center",
    borderRadius: 9,
    justifyContent: "center",
    minHeight: 18,
    minWidth: 18,
    paddingHorizontal: 4,
    position: "absolute",
    right: -5,
    top: -5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 13,
  },
});
