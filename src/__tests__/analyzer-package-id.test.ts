// Run with: npm test
//
// Scope: the package-id validator that guards both the analyze API and the
// /insights/[packageId] route. The bug: asset/crawler paths like "script.js",
// "script.js.map", and "robots.txt" are dot-separated lowercase tokens, so the
// old reverse-domain regex accepted them as package ids — and on /insights they
// got appended to analyzer_rate_limits.unique_packages, burning the 20/day cap.
//
// fail-old / pass-new: the "script.js" / "script.js.map" / "robots.txt" reject
// cases fail against the pre-fix regex (which accepted them) and pass now.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isValidPackageId,
  parsePackageId,
} from "../lib/analyzer/play-store-scraper";

// ── Reject: asset / crawler paths ────────────────────────────────────────────

for (const bad of [
  "script.js",
  "script.js.map",
  "robots.txt",
  "sitemap.xml",
  "styles.css",
  "favicon.ico",
  "logo.svg",
  "manifest.webmanifest",
  "data.json",
  "image.png",
  "photo.jpeg",
  "site.webmanifest",
]) {
  test(`isValidPackageId rejects asset-like "${bad}"`, () => {
    assert.equal(isValidPackageId(bad), false);
  });
  test(`parsePackageId rejects asset-like "${bad}"`, () => {
    assert.equal(parsePackageId(bad), null);
  });
}

// ── Reject: malformed / non-package strings ──────────────────────────────────

for (const bad of [
  "",
  "   ",
  "whatsapp", // single segment
  ".com.x", // leading dot
  "com.", // trailing dot
  "1com.app", // segment can't start with a digit (first char)
]) {
  test(`isValidPackageId rejects "${bad}"`, () => {
    assert.equal(isValidPackageId(bad), false);
  });
}

test("isValidPackageId rejects non-string input", () => {
  assert.equal(isValidPackageId(undefined), false);
  assert.equal(isValidPackageId(null), false);
  assert.equal(isValidPackageId(42), false);
});

// ── Accept: real package ids ─────────────────────────────────────────────────

for (const good of [
  "com.whatsapp",
  "in.example.app",
  "com.google.android.youtube",
  "com.instagram.android",
  "org.telegram.messenger",
  "com.king.candycrushsaga",
]) {
  test(`isValidPackageId accepts "${good}"`, () => {
    assert.equal(isValidPackageId(good), true);
  });
  test(`parsePackageId accepts bare "${good}"`, () => {
    assert.equal(parsePackageId(good), good);
  });
}

// ── parsePackageId: URL forms ────────────────────────────────────────────────

test("parsePackageId extracts id from a full Play Store URL", () => {
  assert.equal(
    parsePackageId(
      "https://play.google.com/store/apps/details?id=com.whatsapp"
    ),
    "com.whatsapp"
  );
});

test("parsePackageId extracts id with trailing query params", () => {
  assert.equal(
    parsePackageId(
      "https://play.google.com/store/apps/details?id=in.example.app&hl=en&gl=in"
    ),
    "in.example.app"
  );
});

test("parsePackageId tolerates market:// scheme", () => {
  assert.equal(
    parsePackageId("market://details?id=com.instagram.android"),
    "com.instagram.android"
  );
});

test("parsePackageId rejects a URL whose id= is asset-like", () => {
  // Defensive: even via the query-param path, an asset-like id must not pass.
  assert.equal(
    parsePackageId("https://play.google.com/store/apps/details?id=script.js"),
    null
  );
});

test("parsePackageId trims surrounding whitespace on a bare id", () => {
  assert.equal(parsePackageId("  com.whatsapp  "), "com.whatsapp");
});
