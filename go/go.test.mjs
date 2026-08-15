import assert from "node:assert/strict";
import test from "node:test";

import {
  PUBLISHED_DECKS,
  buildPublishedSlideUrl,
  normalizeSlideId,
} from "./go.mjs";


test("builds an LM URL with the stable Google Slides object id", () => {
  const value = buildPublishedSlideUrl("lm", "g3b42695220fc7acd_67");
  assert.ok(value);
  const url = new URL(value);

  assert.equal(url.hostname, "docs.google.com");
  assert.equal(url.searchParams.get("slide"), "id.g3b42695220fc7acd_67");
  assert.equal(url.searchParams.get("start"), "false");
});

test("accepts an id. prefix without duplicating it", () => {
  const value = buildPublishedSlideUrl("ssii", "id.g123_example");
  assert.ok(value);

  assert.equal(new URL(value).searchParams.get("slide"), "id.g123_example");
});

test("rejects unknown decks and malformed slide ids", () => {
  assert.equal(buildPublishedSlideUrl("unknown", "g123"), null);
  assert.equal(buildPublishedSlideUrl("lm", "https://evil.example"), null);
  assert.equal(buildPublishedSlideUrl("lm", ""), null);
  assert.equal(normalizeSlideId("g123?next=https://evil.example"), null);
});

test("keeps the bridge limited to the two published course decks", () => {
  assert.deepEqual(Object.keys(PUBLISHED_DECKS).sort(), ["lm", "ssii"]);
});
