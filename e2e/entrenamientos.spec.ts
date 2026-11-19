import { expect, test } from "@playwright/test";

/** Embeddable videos from the coach's channel. */
const EMBEDDED = [{ id: "qFckwZNa3m4", title: "Handstand Costa Rica" }];

/** Its music's rights holder blocks playback outside YouTube. */
const LINKED = {
  id: "ZIaVBZe3M3U",
  title: "Calistenia / Streetworkout Costa Rica",
};

test("the training page is reachable from the header", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Entrenamientos" })
    .click();

  await expect(page).toHaveURL("/entrenamientos");
  await expect(page).toHaveTitle(/Entrenamientos/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Entrenamientos",
  );
  await expect(page.getByText("cinco pilares")).toBeVisible();
});

test("the training page embeds the coach's videos without tracking cookies", async ({
  page,
}) => {
  await page.goto("/entrenamientos");
  const frames = page.getByRole("main").locator("iframe");
  await expect(frames).toHaveCount(EMBEDDED.length);

  for (const [i, video] of EMBEDDED.entries()) {
    const frame = frames.nth(i);
    await expect(frame).toHaveAttribute("title", video.title);
    await expect(frame).toHaveAttribute(
      "src",
      `https://www.youtube-nocookie.com/embed/${video.id}`,
    );
  }
});

test("a video that can't be embedded links to YouTube with its thumbnail", async ({
  page,
}) => {
  await page.goto("/entrenamientos");
  const link = page
    .getByRole("main")
    .getByRole("link", { name: new RegExp(LINKED.title.replace("/", "\\/")) });

  await expect(link).toHaveAttribute(
    "href",
    `https://www.youtube.com/watch?v=${LINKED.id}`,
  );
  // Decorative (alt=""): the link's text already names the video.
  const thumbnail = link.locator("img");
  await thumbnail.scrollIntoViewIfNeeded();
  await expect
    .poll(() => thumbnail.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
});

test("the training page links to the coach's WhatsApp", async ({ page }) => {
  await page.goto("/entrenamientos");
  await expect(
    page.getByRole("main").getByRole("link", { name: /WhatsApp/ }),
  ).toHaveAttribute("href", /^https:\/\/wa\.me\/\d+\?text=/);
});
