import { expect, test } from "@playwright/test";

test("operator can bootstrap a tenant and review impact", async ({ page }) => {
  await page.route("**/v1/admin/organizations", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ id: "org-demo" }),
    }),
  );
  await page.route("**/v1/sustainability/summary**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          event: "RECYCLED",
          count: 3,
          weightGrams: 4200,
          carbonAvoidedGrams: 950,
        },
      ]),
    }),
  );

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Every handoff leaves proof." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Operations" }).click();

  await page.getByLabel("Admin key").fill("test-admin-key");
  await page.getByLabel("Organization name").fill("Demo Chain");
  await page.getByLabel("Slug").fill("demo-chain");
  await page.getByRole("button", { name: "Create organization" }).click();
  await expect(page.getByLabel("Organization ID")).toHaveValue("org-demo");
  await expect(page.getByText("organizations saved.")).toBeVisible();

  await page.getByRole("link", { name: "Impact dashboard" }).click();
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Organization ID").fill("org-demo");
  await page.getByLabel("Admin key").fill("test-admin-key");
  await page.getByRole("button", { name: "Refresh dashboard" }).click();
  await expect(page.getByRole("heading", { name: "3 items" })).toBeVisible();
  await expect(page.getByText("4200 g material")).toBeVisible();
});

test("public verification entry explains its privacy boundary", async ({
  page,
}) => {
  await page.goto("/verify");
  await expect(
    page.getByRole("heading", { name: "Scan trust, not marketing." }),
  ).toBeVisible();
  await expect(page.getByText("Public tokens are opaque")).toBeVisible();
  await expect(page.getByRole("link", { name: "Operations" })).toBeVisible();
});
