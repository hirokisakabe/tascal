import { useEffect, useState, type PropsWithChildren } from "react";
import {
  AccessibilityInfo,
  Platform,
  View,
  type ViewProps,
} from "react-native";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";

import { selectSheetSurfaceMode } from "@/utils/liquid-glass";

type SheetSurfaceProps = PropsWithChildren<
  ViewProps & {
    fallbackBackgroundColor: string;
    glassTintColor: string;
  }
>;

export function SheetSurface({
  children,
  fallbackBackgroundColor,
  glassTintColor,
  style,
  ...viewProps
}: SheetSurfaceProps) {
  // Start opaque so reduced-transparency users never see a glass flash while
  // React Native reads their accessibility preference.
  const [reduceTransparencyEnabled, setReduceTransparencyEnabled] =
    useState(true);

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    let mounted = true;
    void AccessibilityInfo.isReduceTransparencyEnabled()
      .then((enabled) => {
        if (mounted) setReduceTransparencyEnabled(enabled);
      })
      .catch(() => {
        if (mounted) setReduceTransparencyEnabled(true);
      });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      setReduceTransparencyEnabled,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const surfaceMode = selectSheetSurfaceMode({
    platform: Platform.OS,
    liquidGlassAvailable: Platform.OS === "ios" && isLiquidGlassAvailable(),
    glassEffectApiAvailable:
      Platform.OS === "ios" && isGlassEffectAPIAvailable(),
    reduceTransparencyEnabled,
  });

  if (surfaceMode === "glass") {
    return (
      <GlassView
        {...viewProps}
        glassEffectStyle="regular"
        style={style}
        testID="liquid-glass-sheet"
        tintColor={glassTintColor}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View
      {...viewProps}
      style={[style, { backgroundColor: fallbackBackgroundColor }]}
      testID="surface-sheet"
    >
      {children}
    </View>
  );
}
