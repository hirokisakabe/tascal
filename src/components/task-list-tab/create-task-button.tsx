"use client";

import { useCallback, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/solid";
import { CreateTaskDialog } from "@/components/dialog";

export function CreateTaskButton() {
  const [isOpenDialog, setIsOpenDialog] = useState(false);
  const openDialog = useCallback(() => setIsOpenDialog(true), []);
  const closeDialog = useCallback(() => setIsOpenDialog(false), []);

  return (
    <>
      <button onClick={openDialog}>
        <div className="flex items-center rounded-md px-2 text-sm outline outline-1">
          <PlusIcon className="w-6" />
          タスクを追加
        </div>
      </button>
      <CreateTaskDialog isOpen={isOpenDialog} handleClose={closeDialog} />
    </>
  );
}
