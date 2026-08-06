import { fireEvent, render, screen } from "@testing-library/react-native";

import { UnscheduledTasksButton } from "@/components/unscheduled-tasks-button";

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

jest.mock("@/components/ui/icon-symbol", () => {
  const { Text: MockText } = jest.requireActual("react-native");
  return {
    IconSymbol: ({ name }: { name: string }) => (
      <MockText testID="unscheduled-icon">{name}</MockText>
    ),
  };
});

describe("UnscheduledTasksButton", () => {
  it("箇条書きリストのアイコン、件数、読み上げ名を保って開く", () => {
    const onPress = jest.fn();
    render(<UnscheduledTasksButton count={3} onPress={onPress} />);

    const button = screen.getByRole("button", {
      name: "未スケジュールタスク 3件",
    });
    expect(screen.getByTestId("unscheduled-icon")).toHaveTextContent(
      "list.bullet",
    );
    expect(screen.getByText("3")).toBeOnTheScreen();

    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("0件ではbadgeを表示せず読み上げ名に件数を含める", () => {
    render(<UnscheduledTasksButton count={0} onPress={jest.fn()} />);

    expect(
      screen.getByRole("button", { name: "未スケジュールタスク 0件" }),
    ).toBeOnTheScreen();
    expect(screen.queryByText("0")).not.toBeOnTheScreen();
  });
});
