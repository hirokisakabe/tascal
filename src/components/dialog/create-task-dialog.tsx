import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { TextInput, Typography, Button } from "../parts";
import { CommonDialog } from "./common-dialog";
import { CommonSelect } from "./common-select";
import { createTask, useCategories } from "@/lib";
import { YearMonthDay, convertYearMonthDayToStr } from "@/model";

export function CreateTaskDialog({
  isOpen,
  handleClose,
  initialYmd,
}: {
  isOpen: boolean;
  handleClose: () => unknown;
  initialYmd?: YearMonthDay;
}) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      "input-task-title": undefined,
      "input-task-target-date":
        initialYmd && convertYearMonthDayToStr(initialYmd),
    },
  });

  const categories = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<
    | {
        id: string;
        name: string;
      }
    | undefined
  >(undefined);

  const onSubmit = useCallback(
    async (data: { [x: string]: unknown }) => {
      const title = data["input-task-title"];
      const targetDate = data["input-task-target-date"];

      if (!(typeof title === "string")) {
        console.error(`title is invalid: ${title}`);
        return;
      }

      if (
        !(typeof targetDate === "string" || typeof targetDate === "undefined")
      ) {
        console.error(`targetDate is invalid: ${targetDate}`);
        return;
      }

      await createTask({
        title,
        targetDate,
      });
      reset();
      handleClose();
    },
    [reset, handleClose],
  );

  return (
    <CommonDialog
      isOpen={isOpen}
      handleClose={handleClose}
      title="タスクを作成"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mt-2">
          <div className="py-2">
            <Typography>タイトル</Typography>
          </div>
          <TextInput
            placeholder="タスクを入力"
            {...register("input-task-title")}
          />
        </div>
        <div className="mt-2">
          <div className="py-2">
            <Typography>実施日</Typography>
          </div>
          <input type="date" {...register("input-task-target-date")} />
        </div>
        <div className="mt-2">
          <div className="py-2">
            <Typography>カテゴリ</Typography>
          </div>
          {categories && (
            <CommonSelect
              options={categories}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
          )}
        </div>
        <div className="pt-3">
          <div className="-mr-2 flex justify-end space-x-2">
            <Button type="button" onClick={handleClose} color="secondary">
              キャンセル
            </Button>
            <Button type="submit">作成</Button>
          </div>
        </div>
      </form>
    </CommonDialog>
  );
}
