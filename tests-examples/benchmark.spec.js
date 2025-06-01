import { test, expect } from "@playwright/test";
import prompts from "./prompts.json";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

test.beforeEach(async ({ page }) => {
  const url = process.env.TEST_URL;
  if (!url) {
    throw new Error("VISUALIZATION_URL environment variable is not set");
  }
  await page.goto(url);
});

test.describe("Visual Scenes Benchmark", () => {
  test.skip("Scene: ", async ({ page }) => {
    const prompt = prompts.at(-1);
    // Wait for the page to load and the visualization to be ready
    // Wait for the canvas element to be rendered and visible
    await page.waitForSelector("canvas", { state: "visible" });

    await page.waitForTimeout(2_000);

    const chatbox = page.getByRole("textbox");
    const messageScrollPanel = page.locator("#scrollRef");

    await chatbox.fill(`/ai ${prompt}`);
    await chatbox.press("Enter");

    const doneMessages = await messageScrollPanel
      .getByText("Done! Json returned!")
      .all();
    const doneMessagesCount = doneMessages.length;

    // Wait until a new "Done! Json returned!" message appears
    await expect(async () => {
      const newDoneMessages = await messageScrollPanel
        .getByText("Done! Json returned!")
        .all();
      expect(newDoneMessages.length).toBe(doneMessagesCount + 1);
    }).toPass({
      timeout: 120_000,
    }); // wait up to 60 seconds

    const canvas = await page.locator("canvas");
    // Move mouse to the center of the canvas before zooming

    // const box = await canvas.boundingBox();
    // if (box) {
    //   await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    //   await page.mouse.wheel(0, -30); // Scroll up to zoom in
    // }
    // await page.waitForTimeout(5_000);

    await canvas.screenshot({ path: `pictures/${prompt}.png` });
  });

  prompts.slice(0).forEach((prompt) => {
    test(`Scene: ${prompt}`, async ({ page }) => {
      // Wait for the page to load and the visualization to be ready
      // Wait for the canvas element to be rendered and visible
      await page.waitForSelector("canvas", {
        state: "visible",
        timeout: 60_000,
      });

      await page.waitForTimeout(2_000);

      const chatbox = page.getByRole("textbox");
      const messageScrollPanel = page.locator("#scrollRef");

      const doneMessages = await messageScrollPanel
        .getByText("Done! Json returned!")
        .all();
      const doneMessagesCount = doneMessages.length;

      await chatbox.fill(`/ai ${prompt}`);
      await chatbox.press("Enter");

      // Wait until a new "Done! Json returned!" message appears
      await expect(async () => {
        const newDoneMessages = await messageScrollPanel
          .getByText("Done! Json returned!")
          .all();
        expect(newDoneMessages.length).toBe(doneMessagesCount + 1);
      }).toPass({
        timeout: 300_000,
      }); // wait up to 5 minutes

      await page.waitForTimeout(5_000); // in case scene is in still updating
      const canvas = await page.locator("canvas");
      await canvas.screenshot({ path: `pictures/${prompt}.png` });
    });
  });
});
