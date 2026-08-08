import { act, renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { taskQueryKeys } from "@/hooks/use-tasks";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";

let mockFocusCallback: (() => void) | undefined;

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: () => void) => {
    mockFocusCallback = callback;
  },
}));

describe("useRefreshOnFocus", () => {
  it("初回focusを飛ばし、復帰時にactiveかつstaleなtask queryだけ再取得する", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { gcTime: Infinity } },
    });
    const refetchQueries = jest
      .spyOn(queryClient, "refetchQueries")
      .mockResolvedValue();

    const { unmount } = renderHook(() => useRefreshOnFocus(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    act(() => mockFocusCallback?.());
    expect(refetchQueries).not.toHaveBeenCalled();

    act(() => mockFocusCallback?.());
    expect(refetchQueries).toHaveBeenCalledWith({
      queryKey: taskQueryKeys.all,
      stale: true,
      type: "active",
    });
    unmount();
    queryClient.clear();
  });
});
