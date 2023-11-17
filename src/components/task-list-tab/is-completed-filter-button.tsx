"use client";

import { FunnelIcon } from "@heroicons/react/24/solid";

export function IsCompletedFilterButton({
  excludeIsCompleted,
  onClick,
}: {
  excludeIsCompleted: boolean;
  onClick: () => unknown;
}) {
  return (
    <>
      <button onClick={onClick}>
        <div className="flex items-center rounded-md px-2 text-sm outline outline-1">
          {excludeIsCompleted ? (
            <FunnelIcon className="w-6 fill-transparent stroke-black" />
          ) : (
            <FunnelIcon className="w-6 stroke-black" />
          )}
          完了済みのタスクを{excludeIsCompleted ? "非表示" : "表示"}
        </div>
      </button>
    </>
  );
}
