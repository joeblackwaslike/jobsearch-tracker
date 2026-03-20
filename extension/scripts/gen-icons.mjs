#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceIcon = path.resolve(process.env.HOME, "Downloads/tracker.png");
const outputDir = path.resolve(__dirname, "../src/assets/icons");

const sizes = [16, 32, 48, 128];

// Color tints: gray (default) and green (active)
const tints = {
  gray: { r: 156, g: 163, b: 175 }, // Tailwind gray-400
  green: { r: 34, g: 197, b: 94 }, // Tailwind green-500
};

async function generateIcons() {
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  console.log("Generating extension icons...");
  console.log(`Source: ${sourceIcon}`);
  console.log(`Output: ${outputDir}\n`);

  for (const [colorName, tint] of Object.entries(tints)) {
    console.log(`Generating ${colorName} variants:`);

    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${colorName}-${size}.png`);

      await sharp(sourceIcon)
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .tint(tint)
        .png()
        .toFile(outputPath);

      console.log(`  ✓ icon-${colorName}-${size}.png`);
    }
  }

  console.log("\n✅ Icon generation complete!");
  console.log(`Generated ${sizes.length * Object.keys(tints).length} icon files.`);
}

generateIcons().catch((err) => {
  console.error("❌ Error generating icons:", err);
  process.exit(1);
});
