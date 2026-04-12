import { useState } from "react";
import { DialogTitle } from "@headlessui/react";
import { ModalWrapper } from "./ModalWrapper";
import { deleteAccount } from "../api/users";

type DeleteAccountModalProps = {
  open: boolean;
  onClose: () => void;
};

export function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteAccount();
      window.location.href = "/login";
    } catch {
      setError("アカウントの削除に失敗しました");
      setIsDeleting(false);
    }
  };

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <DialogTitle className="text-lg font-bold text-on-surface">
        アカウント削除
      </DialogTitle>
      <p className="mt-2 text-sm text-on-surface-secondary">
        この操作は取り消せません。アカウントとすべてのデータが完全に削除されます。
      </p>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="rounded-md border border-border bg-white px-4 py-2 text-sm text-on-surface-secondary hover:bg-surface-hover disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={isDeleting}
          className="rounded-md bg-danger px-4 py-2 text-sm text-white hover:bg-danger-dark disabled:opacity-50"
        >
          {isDeleting ? "削除中..." : "削除する"}
        </button>
      </div>
    </ModalWrapper>
  );
}
