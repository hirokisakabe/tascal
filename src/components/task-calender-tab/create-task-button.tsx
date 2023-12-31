import { useCallback, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/solid";
import { CreateTaskDialog } from "@/components/dialog";
import { YearMonthDay } from "@/model";

export function CreateTaskButton({ ymd }: { ymd: YearMonthDay }) {
  const [isOpenDialog, setIsOpenDialog] = useState(false);
  const openDialog = useCallback(() => setIsOpenDialog(true), []);
  const closeDialog = useCallback(() => setIsOpenDialog(false), []);

  return (
    <>
      <button onClick={openDialog}>
        <PlusIcon className="w-5 text-slate-600" />
      </button>
      <CreateTaskDialog
        isOpen={isOpenDialog}
        handleClose={closeDialog}
        initialYmd={ymd}
      />
    </>
  );
}
