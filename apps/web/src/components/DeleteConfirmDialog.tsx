import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

type DeleteConfirmDialogProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteConfirmDialog({
  open,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/50 transition-opacity duration-200 ease-out data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center">
        <DialogPanel
          transition
          className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
        >
          <DialogTitle className="mb-2 text-lg font-bold text-on-surface">
            タスクの削除
          </DialogTitle>
          <p className="mb-6 text-sm text-on-surface-secondary">
            このタスクを削除しますか？この操作は取り消せません。
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-border bg-white px-4 py-2 text-sm text-on-surface-secondary hover:bg-surface-hover"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-md bg-danger px-4 py-2 text-sm text-white hover:bg-danger-dark"
            >
              削除
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
