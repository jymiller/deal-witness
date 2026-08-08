import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [growthMap, recoveryExplorer] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../explorer.html", import.meta.url), "utf8"),
]);

test("both Deal Witness experiences link to each other", () => {
  assert.match(growthMap, /Choose Deal Witness view/);
  assert.match(growthMap, /Growth map/);
  assert.match(growthMap, /Recovery explorer/);
  assert.match(growthMap, /href=&quot;\/explorer\.html&quot;/);

  assert.match(recoveryExplorer, /Choose Deal Witness view/);
  assert.match(recoveryExplorer, /href="\.\/">Growth map<\/a>/);
  assert.match(recoveryExplorer, /Recovery explorer/);
});

test("each view marks itself as the current page", () => {
  assert.match(growthMap, /target=&quot;_top&quot; aria-current=&quot;page&quot;&gt;Growth map/);
  assert.match(recoveryExplorer, /href="\.\/explorer\.html" aria-current="page">Recovery explorer/);
});
