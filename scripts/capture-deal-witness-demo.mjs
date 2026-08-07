#!/usr/bin/env node

/**
 * Capture the silent, wholly synthetic Deal Witness fallback walkthrough.
 *
 * Prerequisites:
 *   python3 -m http.server 8421 --bind 127.0.0.1 --directory frontend
 *   NODE_PATH=<bundled-node-modules> node scripts/capture-deal-witness-demo.mjs
 *
 * Optional environment variables:
 *   DEMO_BASE_URL=http://127.0.0.1:8421
 *   DEMO_OUTPUT=artifacts/deal-witness-demo.mp4
 *   DEMO_TIMING_SCALE=0.1       # quick technical preview
 *   DEMO_PREVIEW_DIR=/tmp/demo  # also save named PNG checkpoints
 */

import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const execFileAsync = promisify(execFile);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const baseUrl = (process.env.DEMO_BASE_URL || "http://127.0.0.1:8421").replace(/\/$/, "");
const outputPath = path.resolve(
  repositoryRoot,
  process.env.DEMO_OUTPUT || "artifacts/deal-witness-demo.mp4",
);
const previewDirectory = process.env.DEMO_PREVIEW_DIR
  ? path.resolve(process.env.DEMO_PREVIEW_DIR)
  : null;
const timingScale = Number.parseFloat(process.env.DEMO_TIMING_SCALE || "1");
const chromePath =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ffmpegPath = process.env.FFMPEG_PATH || "/opt/homebrew/bin/ffmpeg";
const ffprobePath = process.env.FFPROBE_PATH || "/opt/homebrew/bin/ffprobe";

if (!(timingScale > 0)) throw new Error("DEMO_TIMING_SCALE must be greater than zero");

const sleep = (page, milliseconds) => page.waitForTimeout(Math.max(20, milliseconds * timingScale));

async function installPresentationOverlay(page) {
  await page.evaluate(() => {
    document.querySelector("#dw-demo-overlay")?.remove();
    document.querySelector("#dw-demo-overlay-style")?.remove();

    const style = document.createElement("style");
    style.id = "dw-demo-overlay-style";
    style.textContent = `
      #dw-demo-overlay {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        pointer-events: none;
        color: #f9f6ee;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      #dw-demo-badge {
        position: absolute;
        right: 18px;
        bottom: 17px;
        padding: 8px 12px;
        color: #f9f6ee;
        background: rgba(18, 38, 54, 0.96);
        border: 1px solid rgba(255, 255, 255, 0.48);
        border-radius: 999px;
        box-shadow: 0 8px 24px rgba(9, 24, 35, 0.2);
        font-size: 10px;
        font-weight: 850;
        letter-spacing: 0.11em;
        line-height: 1;
        text-transform: uppercase;
      }

      #dw-demo-caption {
        position: absolute;
        left: 50%;
        bottom: 76px;
        width: min(900px, calc(100vw - 96px));
        padding: 13px 18px 14px;
        opacity: 0;
        color: #f9f6ee;
        background: rgba(17, 38, 55, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.28);
        border-radius: 13px;
        box-shadow: 0 16px 38px rgba(9, 24, 35, 0.28);
        text-align: center;
        transform: translate(-50%, 15px);
        transition: opacity 220ms ease, transform 220ms ease;
      }

      #dw-demo-caption[data-visible="true"] {
        opacity: 1;
        transform: translate(-50%, 0);
      }

      #dw-demo-caption-eyebrow {
        display: block;
        margin-bottom: 4px;
        color: #b9d6ca;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 10px;
        font-weight: 850;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      #dw-demo-caption-title {
        display: block;
        font-size: 23px;
        font-weight: 850;
        letter-spacing: -0.025em;
        line-height: 1.08;
      }

      #dw-demo-caption-detail {
        display: block;
        margin-top: 4px;
        color: #dce8e2;
        font-size: 13px;
        font-weight: 620;
        line-height: 1.25;
      }

      #dw-demo-title-card {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        opacity: 0;
        background:
          radial-gradient(circle at 14% 10%, rgba(51, 105, 126, 0.12), transparent 34%),
          linear-gradient(135deg, rgba(250, 248, 242, 0.99), rgba(232, 228, 218, 0.985));
        color: #122738;
        transition: opacity 420ms ease;
      }

      #dw-demo-title-card[data-visible="true"] { opacity: 1; }

      #dw-demo-title-inner {
        width: min(980px, calc(100vw - 140px));
        text-align: center;
      }

      #dw-demo-title-kicker {
        display: inline-block;
        margin-bottom: 22px;
        padding: 8px 12px;
        color: #ffffff;
        background: #17364b;
        border-radius: 999px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 11px;
        font-weight: 850;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      #dw-demo-title-card h1 {
        margin: 0;
        font-size: clamp(48px, 5.3vw, 76px);
        font-weight: 900;
        letter-spacing: -0.055em;
        line-height: 0.96;
      }

      #dw-demo-title-card p {
        max-width: 760px;
        margin: 20px auto 0;
        color: #365363;
        font-size: 20px;
        font-weight: 650;
        line-height: 1.35;
      }

      #dw-demo-title-card small {
        display: block;
        margin-top: 26px;
        color: #5d6a70;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 11px;
        font-weight: 760;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      #app {
        transform: translate3d(0, 0, 0) scale(1);
        transform-origin: top left;
        transition: transform 720ms cubic-bezier(.22, .72, .24, 1);
        will-change: transform;
      }

      body.dw-demo-focus-right #app {
        transform: translate3d(-1320px, -275px, 0) scale(1.75);
      }

      #dw-demo-focus-scrim {
        position: absolute;
        inset: 0;
        opacity: 0;
        background: rgba(9, 23, 34, 0.22);
        transition: opacity 500ms ease;
      }

      body.dw-demo-focus-right #dw-demo-focus-scrim { opacity: 1; }
    `;
    document.head.append(style);

    const overlay = document.createElement("div");
    overlay.id = "dw-demo-overlay";
    overlay.innerHTML = `
      <div id="dw-demo-focus-scrim"></div>
      <div id="dw-demo-badge">Prepared simulation · wholly synthetic · local replay</div>
      <div id="dw-demo-caption" data-visible="false">
        <span id="dw-demo-caption-eyebrow"></span>
        <strong id="dw-demo-caption-title"></strong>
        <span id="dw-demo-caption-detail"></span>
      </div>
      <section id="dw-demo-title-card" data-visible="false" aria-hidden="true">
        <div id="dw-demo-title-inner">
          <span id="dw-demo-title-kicker"></span>
          <h1></h1>
          <p></p>
          <small></small>
        </div>
      </section>
    `;
    document.body.append(overlay);
  });
}

async function setCaption(page, { eyebrow, title, detail = "" }) {
  await page.evaluate(({ eyebrow, title, detail }) => {
    document.querySelector("#dw-demo-caption-eyebrow").textContent = eyebrow;
    document.querySelector("#dw-demo-caption-title").textContent = title;
    document.querySelector("#dw-demo-caption-detail").textContent = detail;
    document.querySelector("#dw-demo-caption-detail").hidden = !detail;
    document.querySelector("#dw-demo-caption").dataset.visible = "true";
  }, { eyebrow, title, detail });
}

async function hideCaption(page) {
  await page.evaluate(() => {
    document.querySelector("#dw-demo-caption").dataset.visible = "false";
  });
}

async function setTitleCard(page, { kicker, title, body, footer, visible }) {
  await page.evaluate(({ kicker, title, body, footer, visible }) => {
    const card = document.querySelector("#dw-demo-title-card");
    card.querySelector("#dw-demo-title-kicker").textContent = kicker;
    card.querySelector("h1").textContent = title;
    card.querySelector("p").textContent = body;
    card.querySelector("small").textContent = footer;
    card.dataset.visible = String(visible);
    card.setAttribute("aria-hidden", String(!visible));
  }, { kicker, title, body, footer, visible });
}

async function setRightFocus(page, focused) {
  await page.evaluate((nextFocused) => {
    document.body.classList.toggle("dw-demo-focus-right", nextFocused);
  }, focused);
}

async function preview(page, name) {
  if (!previewDirectory) return;
  await mkdir(previewDirectory, { recursive: true });
  await page.screenshot({ path: path.join(previewDirectory, `${name}.png`) });
}

async function clickStep(page, stepNumber, title) {
  await page
    .getByRole("button", { name: `Go to step ${stepNumber}: ${title}`, exact: true })
    .click();
  await page.waitForTimeout(180);
}

async function captureWalkthrough() {
  await mkdir(path.dirname(outputPath), { recursive: true });
  const captureDirectory = await mkdtemp(path.join(tmpdir(), "deal-witness-demo-"));
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const context = await browser.newContext({
    colorScheme: "light",
    deviceScaleFactor: 1,
    recordVideo: { dir: captureDirectory, size: { width: 1440, height: 810 } },
    viewport: { width: 1440, height: 810 },
  });
  const page = await context.newPage();
  const video = page.video();

  try {
    await page.goto(`${baseUrl}/index.html`, { waitUntil: "domcontentloaded" });
    const growthFrame = page.frameLocator('iframe[title="Deal Witness Growth Lanes"]');
    await growthFrame.locator("#dwl-reset").waitFor({ state: "visible" });
    await sleep(page, 500);
    await growthFrame.locator("#dwl-reset").click();
    await installPresentationOverlay(page);

    await setTitleCard(page, {
      kicker: "Deal Witness",
      title: "Great people leave.",
      body: "The deal remembers—and checks that the paper does too.",
      footer: "Prepared simulation · wholly synthetic replay · local fixture",
      visible: true,
    });
    await preview(page, "01-title");
    await sleep(page, 5000);
    await setTitleCard(page, {
      kicker: "Deal Witness",
      title: "Great people leave.",
      body: "The deal remembers—and checks that the paper does too.",
      footer: "Prepared simulation · wholly synthetic replay · local fixture",
      visible: false,
    });
    await sleep(page, 600);

    await setCaption(page, {
      eyebrow: "Evidence → causal memory",
      title: "One source enters a stable vertical map.",
      detail: "Decisions expose risks. Negotiated promises govern money.",
    });
    await growthFrame.locator("#dwl-next").click();
    await preview(page, "02-growth-lanes");
    await sleep(page, 4800);
    await hideCaption(page);
    await sleep(page, 500);

    await page.goto(`${baseUrl}/explorer.html`, { waitUntil: "domcontentloaded" });
    await page.locator("#app").waitFor({ state: "visible" });
    await page.locator("#step-title").filter({ hasText: "Maya is already gone" }).waitFor();
    await installPresentationOverlay(page);
    await setCaption(page, {
      eyebrow: "Monday → Friday",
      title: "Maya is already gone. The deal closes Friday.",
      detail: "Her historical routes remain. Her judgment is not cloned, and she is never contacted.",
    });
    await preview(page, "03-maya-gone");
    await sleep(page, 5000);
    await hideCaption(page);
    await sleep(page, 500);

    await clickStep(page, 2, "430 records flow in");
    await setCaption(page, {
      eyebrow: "Synthetic fixture replay",
      title: "Evidence bundles accumulate—without live connectors.",
      detail: "Teams, Slack, WhatsApp, email, SharePoint, models, and documents are local metadata only.",
    });
    await preview(page, "04-evidence-river");
    await sleep(page, 4800);
    await hideCaption(page);
    await sleep(page, 350);

    await clickStep(page, 3, "A navigable memory takes shape");
    await setCaption(page, {
      eyebrow: "Stable map",
      title: "Repeated receipts strengthen the same paths.",
      detail: "Positions stay fixed as evidence grows—no duplicate decision per document.",
    });
    await preview(page, "05-stable-map");
    await sleep(page, 5000);
    await hideCaption(page);
    await sleep(page, 350);

    await clickStep(page, 4, "Eight paths are still hollow");
    await setCaption(page, {
      eyebrow: "The map exposes the gap",
      title: "Eight paths are still hollow.",
      detail: "Historical relationships can route the search; only sourced evidence can close it.",
    });
    await preview(page, "06-open-gap");
    await sleep(page, 3800);
    await hideCaption(page);
    await sleep(page, 350);

    await clickStep(page, 8, "EverOS preserves the completed path");
    await page.evaluate(() => {
      document.querySelector("#completion-shell").scrollTop = 0;
      document.querySelector("#completion-transcript").scrollTop = 570;
    });
    await setRightFocus(page, true);
    await sleep(page, 850);
    await setCaption(page, {
      eyebrow: "Prepared recovery simulation",
      title: "A vague answer does not close the gap.",
      detail: "No source, no closure. The transcript and cited receipts are authoritative.",
    });
    await preview(page, "07-vague-rejected");
    await sleep(page, 5000);
    await hideCaption(page);
    await sleep(page, 300);

    await page.evaluate(() => {
      document.querySelector("#completion-transcript").scrollTo({ top: 840, behavior: "smooth" });
    });
    await sleep(page, 700);
    await setCaption(page, {
      eyebrow: "Source-backed answer",
      title: "Actor + action + timing + certification + citations.",
      detail: "Ada's sourced answer joins Ren's approved record; Maya remains historical provenance only.",
    });
    await preview(page, "08-sourced-answer");
    await sleep(page, 5400);
    await hideCaption(page);
    await sleep(page, 300);

    await page.evaluate(() => {
      const transcript = document.querySelector("#completion-transcript");
      transcript.scrollTo({ top: transcript.scrollHeight, behavior: "smooth" });
      const shell = document.querySelector("#completion-shell");
      shell.scrollTo({ top: shell.scrollHeight, behavior: "smooth" });
    });
    await sleep(page, 850);
    await setCaption(page, {
      eyebrow: "Ranked from receipts",
      title: "The completed path becomes reusable memory.",
      detail: "Prepared EverOS receipt · preloaded replay · no live outreach and no live write.",
    });
    await preview(page, "09-ranked-receipt");
    await sleep(page, 5200);
    await hideCaption(page);
    await setRightFocus(page, false);
    await sleep(page, 800);

    await clickStep(page, 9, "The memory catches an omission");
    await setCaption(page, {
      eyebrow: "Thursday · staged draft v7",
      title: "143 of 144: confirmed memory, missing paper.",
      detail: "The broken receipt-to-clause line moves the review to HOLD FOR REVIEW.",
    });
    await preview(page, "10-hold-for-review");
    await sleep(page, 5900);
    await hideCaption(page);
    await sleep(page, 1800);

    await clickStep(page, 10, "v8 reconnects memory to paper");
    await setCaption(page, {
      eyebrow: "Thursday · staged corrected draft v8",
      title: "144 of 144: the paper is repaired.",
      detail: "The restored clause reconnects memory to the current draft. READY returns.",
    });
    await preview(page, "11-repaired-ready");
    await sleep(page, 5900);
    await hideCaption(page);
    await sleep(page, 1500);

    await setTitleCard(page, {
      kicker: "Deal Witness",
      title: "The deal remembers.",
      body: "And it checks that the paper does too.",
      footer: "Wholly synthetic · prepared simulation · no live connectors, outreach, or bulk write",
      visible: true,
    });
    await preview(page, "12-end-card");
    await sleep(page, 6500);

    await context.close();
    const webmPath = await video.path();
    await browser.close();

    await execFileAsync(ffmpegPath, [
      "-y",
      "-i", webmPath,
      "-vf", "fps=30,scale=1440:810:flags=lanczos,format=yuv420p",
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "18",
      "-movflags", "+faststart",
      "-metadata", "title=Deal Witness prepared synthetic walkthrough",
      "-metadata", "comment=Wholly synthetic local replay; no live outreach or connector activity",
      "-an",
      outputPath,
    ], { maxBuffer: 16 * 1024 * 1024 });

    const { stdout } = await execFileAsync(ffprobePath, [
      "-v", "error",
      "-show_entries", "format=duration,size:stream=codec_name,profile,pix_fmt,width,height,r_frame_rate",
      "-of", "json",
      outputPath,
    ]);
    const probe = JSON.parse(stdout);
    const stream = probe.streams?.[0];
    const duration = Number.parseFloat(probe.format?.duration || "0");
    if (timingScale === 1 && (duration < 60 || duration > 90)) {
      throw new Error(`Final duration ${duration.toFixed(2)}s is outside the required 60–90s range`);
    }
    if (stream?.codec_name !== "h264" || stream?.width !== 1440 || stream?.height !== 810) {
      throw new Error(`Unexpected final video stream: ${JSON.stringify(stream)}`);
    }

    console.log(JSON.stringify({ outputPath, duration, probe }, null, 2));
    await rm(captureDirectory, { recursive: true, force: true });
  } catch (error) {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    throw error;
  }
}

await captureWalkthrough();
