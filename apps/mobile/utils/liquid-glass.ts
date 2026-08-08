type SheetSurfaceMode = "glass" | "surface";

type SheetSurfaceCapabilities = {
  glassEffectApiAvailable: boolean;
  liquidGlassAvailable: boolean;
  platform: string;
  reduceTransparencyEnabled: boolean;
};

export function selectSheetSurfaceMode({
  glassEffectApiAvailable,
  liquidGlassAvailable,
  platform,
  reduceTransparencyEnabled,
}: SheetSurfaceCapabilities): SheetSurfaceMode {
  return platform === "ios" &&
    liquidGlassAvailable &&
    glassEffectApiAvailable &&
    !reduceTransparencyEnabled
    ? "glass"
    : "surface";
}
