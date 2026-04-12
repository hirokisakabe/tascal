import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";

type ModalWrapperProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function ModalWrapper({ open, onClose, children }: ModalWrapperProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/50 transition-opacity duration-200 ease-out data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center">
        <DialogPanel
          transition
          className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
        >
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
