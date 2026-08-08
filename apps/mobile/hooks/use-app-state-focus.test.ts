import { act, renderHook } from "@testing-library/react-native";
import { focusManager } from "@tanstack/react-query";
import { AppState, Platform, type AppStateStatus } from "react-native";

import { useAppStateFocus } from "@/hooks/use-app-state-focus";

describe("useAppStateFocus", () => {
  it("初期状態とAppState変更をfocusManagerへ同期し、unmount時に購読を解除する", () => {
    const remove = jest.fn();
    let onChange: ((status: AppStateStatus) => void) | undefined;
    const addEventListener = jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_event, listener) => {
        onChange = listener;
        return { remove };
      });
    const setFocused = jest.spyOn(focusManager, "setFocused");

    expect(Platform.OS).not.toBe("web");
    const { unmount } = renderHook(() => useAppStateFocus());

    expect(setFocused).toHaveBeenLastCalledWith(
      AppState.currentState === "active",
    );
    expect(addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );

    act(() => onChange?.("background"));
    expect(setFocused).toHaveBeenLastCalledWith(false);

    act(() => onChange?.("active"));
    expect(setFocused).toHaveBeenLastCalledWith(true);

    unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
