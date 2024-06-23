import { test as setup, expect } from "@playwright/test";
// eslint-disable-next-line no-restricted-imports
import { PrismaClient } from "@prisma/client";

const authFile = "playwright/.auth/user.json";

const GOOGLE_ACCOUNT_EMAIL = process.env.GOOGLE_ACCOUNT_EMAIL;
const GOOGLE_ACCOUNT_PASSWORD = process.env.GOOGLE_ACCOUNT_PASSWORD;

if (!GOOGLE_ACCOUNT_EMAIL || !GOOGLE_ACCOUNT_PASSWORD) {
  throw new Error(
    "Please set GOOGLE_ACCOUNT_EMAIL and GOOGLE_ACCOUNT_PASSWORD",
  );
}

setup.describe.configure({ mode: "serial" });

setup("authenticate", async ({ page }) => {
  await page.goto("http://localhost:3000/login");

  await page.getByRole("button", { name: "Signin with Google" }).click();

  await page.waitForURL("https://accounts.google.com/**");

  await page.getByLabel("Email or phone").click();
  await page.getByLabel("Email or phone").fill(GOOGLE_ACCOUNT_EMAIL);

  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("Enter your password").click();
  await page.getByLabel("Enter your password").fill(GOOGLE_ACCOUNT_PASSWORD);

  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.waitForURL("http://localhost:3000/list");

  await expect(page.getByText("Hiroki")).toBeVisible();

  await page.context().storageState({ path: authFile });
});

setup("seed database", async () => {
  const prismaClient = new PrismaClient();

  await prismaClient.task.create({
    data: {
      title: "ふがタイトル",
      targetDate: new Date("2020-01-02"),
      author: {
        connect: {
          email: GOOGLE_ACCOUNT_EMAIL,
        },
      },
    },
  });

  prismaClient.$disconnect();
});
