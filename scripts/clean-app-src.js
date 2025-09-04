// scripts/clean-app-src.js
const fs = require("fs");
const path = require("path");

const target = path.join(process.cwd(), "app", "src");

try {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log("⚠️  Removed stray folder:", target);
  }
} catch (e) {
  console.error("Cleanup failed:", e?.message);
}