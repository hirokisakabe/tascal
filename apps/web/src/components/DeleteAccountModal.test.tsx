import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { renderWithQueryClient } from "../test/helpers";

const mockDeleteAccount = vi.fn();

vi.mock("../api/users", () => ({
  deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args) as unknown,
}));

describe("DeleteAccountModal", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("確認メッセージが表示される", () => {
    renderWithQueryClient(<DeleteAccountModal {...defaultProps} />);

    expect(screen.getByText("アカウント削除")).toBeInTheDocument();
    expect(
      screen.getByText(
        "この操作は取り消せません。アカウントとすべてのデータが完全に削除されます。",
      ),
    ).toBeInTheDocument();
  });

  it("キャンセルボタンで閉じる", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<DeleteAccountModal {...defaultProps} />);

    await user.click(screen.getByText("キャンセル"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("削除ボタンで API を呼び出す", async () => {
    mockDeleteAccount.mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderWithQueryClient(<DeleteAccountModal {...defaultProps} />);

    await user.click(screen.getByText("削除する"));

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalled();
    });
  });

  it("削除に失敗した場合エラーメッセージを表示する", async () => {
    mockDeleteAccount.mockRejectedValue(new Error("失敗"));
    const user = userEvent.setup();
    renderWithQueryClient(<DeleteAccountModal {...defaultProps} />);

    await user.click(screen.getByText("削除する"));

    await waitFor(() => {
      expect(
        screen.getByText("アカウントの削除に失敗しました"),
      ).toBeInTheDocument();
    });
  });

  it("open が false の場合モーダルが表示されない", () => {
    renderWithQueryClient(
      <DeleteAccountModal {...defaultProps} open={false} />,
    );

    expect(screen.queryByText("アカウント削除")).not.toBeInTheDocument();
  });
});
