import type { Meta, StoryObj } from "@storybook/react-native";
import { fn } from "storybook/test";

import { DayTaskBottomSheet } from "@/components/day-task-bottom-sheet";
import {
  createTask,
  representativeTasks,
} from "@/components/storybook/task-fixtures";

const meta = {
  title: "Components/DayTaskBottomSheet",
  component: DayTaskBottomSheet,
  args: {
    date: "2026-08-08",
    onAddTask: fn(),
    onClose: fn(),
    onOpenTask: fn(),
    onToggleTask: fn(),
    title: "8月8日（土）",
    visible: true,
  },
} satisfies Meta<typeof DayTaskBottomSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    canAddTask: true,
    tasks: [],
  },
};

export const MultipleTasks: Story = {
  args: {
    canAddTask: true,
    tasks: representativeTasks,
  },
};

export const LongTitle: Story = {
  args: {
    tasks: [
      createTask({
        title:
          "予定を立てるときに折り返しと省略表示を確認するための、とても長いタスクタイトル",
      }),
    ],
  },
};

export const Dark: Story = {
  args: {
    canAddTask: true,
    tasks: representativeTasks,
  },
  parameters: { colorScheme: "dark" },
};
