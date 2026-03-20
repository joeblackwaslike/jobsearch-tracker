#!/usr/bin/env node

/**
 * HTML Fixture Capture Script (Plain JavaScript)
 *
 * Captures real HTML from job board pages for use in adapter regression tests.
 *
 * ## Usage
 *
 * ```bash
 * # Capture all public boards (no auth required)
 * node scripts/capture-fixtures.mjs
 *
 * # Capture all boards including auth-gated (LinkedIn, Wellfound, TeamBlind)
 * node scripts/capture-fixtures.mjs --with-auth
 *
 * # Capture specific boards only
 * node scripts/capture-fixtures.mjs greenhouse ashby lever
 * ```
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import * as yaml from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, "../src/content/adapters/__tests__/fixtures");
const CONFIG_PATH = path.join(__dirname, "capture-config.yaml");

// Ensure fixtures directory exists
if (!fs.existsSync(FIXTURES_DIR)) {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

async function captureFixture(page, boardName, config) {
  console.log(`\n📸 Capturing ${boardName}...`);
  console.log(`   URL: ${config.url}`);
  console.log(`   Waiting for: ${config.wait_for}`);

  try {
    // Navigate to the job page
    const response = await page.goto(config.url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    if (!response || !response.ok()) {
      console.error(`   ❌ Failed to load page (HTTP ${response?.status()})`);
      return false;
    }

    // Wait for the key element to appear
    try {
      await page.waitForSelector(config.wait_for, { timeout: 15000 });
    } catch (_err) {
      console.error(`   ❌ Timeout waiting for selector: ${config.wait_for}`);
      console.error(`   The page may require login or the selector may be incorrect.`);
      return false;
    }

    // Give dynamic content time to render (React/Vue apps)
    await page.waitForTimeout(2000);

    // Capture the full HTML
    const html = await page.evaluate(() => document.documentElement.outerHTML);

    // Save to fixture file
    const fixturePath = path.join(FIXTURES_DIR, `${boardName}.html`);
    fs.writeFileSync(fixturePath, html, "utf-8");

    console.log(`   ✅ Saved to fixtures/${boardName}.html (${html.length} bytes)`);
    return true;
  } catch (err) {
    console.error(`   ❌ Error: ${err.message}`);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const withAuth = args.includes("--with-auth");
  const specificBoards = args.filter((a) => !a.startsWith("--"));

  // Load config
  const configContent = fs.readFileSync(CONFIG_PATH, "utf-8");
  const config = yaml.parse(configContent);

  // Filter boards
  let boardsToCapture = Object.entries(config.boards);

  if (specificBoards.length > 0) {
    boardsToCapture = boardsToCapture.filter(([name]) => specificBoards.includes(name));
  }

  if (!withAuth) {
    boardsToCapture = boardsToCapture.filter(([, cfg]) => !cfg.requires_auth);
  }

  if (boardsToCapture.length === 0) {
    console.log("No boards to capture. Use --with-auth to include auth-gated boards.");
    process.exit(0);
  }

  console.log(`\n🚀 Capturing ${boardsToCapture.length} board(s)...\n`);

  // Launch browser
  let browser;
  if (withAuth) {
    // Use persistent context with existing Chrome profile
    const userDataDir =
      process.platform === "darwin"
        ? path.join(process.env.HOME, "Library/Application Support/Google/Chrome/Default")
        : process.platform === "win32"
          ? path.join(process.env.LOCALAPPDATA, "Google/Chrome/User Data/Default")
          : path.join(process.env.HOME, ".config/google-chrome/Default");

    if (!fs.existsSync(userDataDir)) {
      console.error(`\n❌ Chrome profile not found at: ${userDataDir}`);
      console.error(`   Please ensure you have Chrome installed and have logged into`);
      console.error(`   LinkedIn, Wellfound, and TeamBlind in your default Chrome profile.\n`);
      process.exit(1);
    }

    console.log(`Using Chrome profile: ${userDataDir}\n`);

    browser = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: "chrome",
    });
  } else {
    browser = await chromium.launch({
      headless: false,
      channel: "chromium",
    });
  }

  const page = withAuth ? browser.pages()[0] : await browser.newPage();

  const results = {};

  for (const [boardName, boardConfig] of boardsToCapture) {
    results[boardName] = await captureFixture(page, boardName, boardConfig);
  }

  await browser.close();

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 Capture Summary");
  console.log("=".repeat(60));

  const successful = Object.entries(results).filter(([, ok]) => ok);
  const failed = Object.entries(results).filter(([, ok]) => !ok);

  console.log(`\n✅ Successful: ${successful.length}`);
  for (const [name] of successful) console.log(`   - ${name}`);

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    for (const [name] of failed) console.log(`   - ${name}`);
    console.log(`\n💡 For auth-required boards, use --with-auth and ensure you're logged in.`);
    console.log(`💡 For URL-expired boards, update the URL in capture-config.yaml.\n`);
    process.exit(1);
  }

  console.log("\n✨ All captures completed successfully!\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
