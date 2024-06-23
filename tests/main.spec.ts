import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("http://localhost:3000/list");

  await expect(page).toHaveTitle(/tascal/);
});
