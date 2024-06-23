import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("http://localhost:3000/list");

  await expect(page).toHaveTitle(/tascal/);
});

test("Add task", async ({ page }) => {
  await page.goto("http://localhost:3000/list");

  await expect(page.getByText("テストタイトル")).not.toBeVisible();
  await expect(page.getByText("2020-01-01")).not.toBeVisible();

  await page.getByText("タスクを追加").click();

  await page.getByLabel("タイトル").click();
  await page.getByLabel("タイトル").fill("テストタイトル");

  await page.getByLabel("実施日").click();
  await page.getByLabel("実施日").fill("2020-01-01");

  await page.getByText("追加", { exact: true }).click();

  await expect(page.getByText("追加", { exact: true })).not.toBeVisible();

  await expect(page.getByText("テストタイトル")).toBeVisible();
  await expect(page.getByText("2020-01-01")).toBeVisible();
});
