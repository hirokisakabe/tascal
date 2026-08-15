import type { Meta, StoryObj } from "@storybook/react-native";
import { LoginForm } from "./login-form";

const meta = {
  title: "Auth/LoginForm",
  component: LoginForm,
  args: {
    onSignIn: () => Promise.resolve(),
  },
} satisfies Meta<typeof LoginForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmailNotVerified: Story = {
  args: {
    initialError:
      "メールアドレスの確認が必要です。確認メールを再送しました。メール内のリンクを Web で開いてから、もう一度ログインしてください。",
  },
};

export const EmailNotVerifiedDark: Story = {
  ...EmailNotVerified,
  parameters: { colorScheme: "dark" },
};
