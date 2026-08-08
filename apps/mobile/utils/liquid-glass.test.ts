import { selectSheetSurfaceMode } from "@/utils/liquid-glass";

const supportedIOS = {
  platform: "ios",
  liquidGlassAvailable: true,
  glassEffectApiAvailable: true,
  reduceTransparencyEnabled: false,
};

describe("Liquid Glass sheet selection", () => {
  it("対応するiOS環境ではLiquid Glassを選ぶ", () => {
    expect(selectSheetSurfaceMode(supportedIOS)).toBe("glass");
  });

  it.each([
    ["iOS以外", { ...supportedIOS, platform: "android" }],
    ["Liquid Glass非対応", { ...supportedIOS, liquidGlassAvailable: false }],
    ["runtime API非対応", { ...supportedIOS, glassEffectApiAvailable: false }],
    [
      "透明度を下げる設定",
      { ...supportedIOS, reduceTransparencyEnabled: true },
    ],
  ])("%sではsemantic Surfaceへフォールバックする", (_, capabilities) => {
    expect(selectSheetSurfaceMode(capabilities)).toBe("surface");
  });
});
