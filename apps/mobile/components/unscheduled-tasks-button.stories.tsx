import type { Meta, StoryObj } from "@storybook/react-native";
import { fn } from "storybook/test";

import { UnscheduledTasksButton } from "@/components/unscheduled-tasks-button";

const meta = {
  title: "Components/UnscheduledTasksButton",
  component: UnscheduledTasksButton,
  args: {
    onPress: fn(),
  },
} satisfies Meta<typeof UnscheduledTasksButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { count: 0 },
};

export const MultipleTasks: Story = {
  args: { count: 12 },
};

export const Dark: Story = {
  args: { count: 12 },
  parameters: { colorScheme: "dark" },
};
