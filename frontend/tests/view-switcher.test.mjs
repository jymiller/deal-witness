import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [growthMap, recoveryExplorer, aboutPage, guidePage, deck] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../explorer.html", import.meta.url), "utf8"),
  readFile(new URL("../about.html", import.meta.url), "utf8"),
  readFile(new URL("../guide.html", import.meta.url), "utf8"),
  readFile(new URL("../assets/deal-witness-hackathon-deck.pdf", import.meta.url)),
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

test("both Deal Witness experiences expose compact project links", () => {
  assert.match(growthMap, /href=&quot;\.\/guide\.html&quot; target=&quot;_top&quot;&gt;How it works/);
  assert.match(growthMap, /href=&quot;\.\/about\.html&quot; target=&quot;_top&quot;&gt;About/);
  assert.match(
    growthMap,
    /href=&quot;\.\/assets\/deal-witness-hackathon-deck\.pdf&quot; target=&quot;_top&quot;&gt;View deck/,
  );

  assert.match(recoveryExplorer, /href="\.\/guide\.html">How it works<\/a>/);
  assert.match(recoveryExplorer, /href="\.\/about\.html">About<\/a>/);
  assert.match(
    recoveryExplorer,
    /href="\.\/assets\/deal-witness-hackathon-deck\.pdf">View deck<\/a>/,
  );
});

test("every existing public page exposes the explainer guide", () => {
  assert.match(aboutPage, /href="\.\/guide\.html">How it works<\/a>/);
  assert.match(guidePage, /Growth Map/i);
  assert.match(guidePage, /Recovery Explorer/i);
});

test("the public hackathon page and deck ship with the site", () => {
  assert.match(aboutPage, /EverMind \/ EverOS memory hackathon/);
  assert.match(aboutPage, /Wholly synthetic/i);
  assert.match(aboutPage, /\.\/assets\/deal-witness-hackathon-deck\.pdf/);
  assert.equal(deck.subarray(0, 5).toString("ascii"), "%PDF-");
  assert.ok(deck.length > 300_000);
});
