import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = path.join(frontendRoot, "fixtures", "deal-witness.json");
const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
const appSource = await readFile(path.join(frontendRoot, "app.js"), "utf8");
const htmlSource = await readFile(path.join(frontendRoot, "index.html"), "utf8");
const stylesSource = await readFile(path.join(frontendRoot, "styles.css"), "utf8");

const clusterById = new Map(fixture.clusters.map((cluster) => [cluster.id, cluster]));
const exampleById = new Map(fixture.clusters.map((cluster) => [cluster.representative.id, cluster.representative]));
const evidence = fixture.sources.flatMap((source) =>
  source.evidence.map((item) => ({ ...item, sourceId: source.id, sourceOrder: source.order })),
);
const evidenceById = new Map(evidence.map((item) => [item.id, item]));
const sourceById = new Map(fixture.sources.map((source) => [source.id, source]));
const aggregateFields = [
  "atomicCount",
  "sourceCount",
  "provenanceCount",
  "relationshipCount",
  "contractScopedCount",
];

function sum(items, selector) {
  return items.reduce((total, item) => total + selector(item), 0);
}

function expectedExampleIds() {
  return fixture.clusters
    .map((cluster) => cluster.representative)
    .filter((example) => example.expectedInDraft)
    .map((example) => example.id);
}

function missingFromDraft(draft) {
  const written = new Set(draft.links.map((link) => link.exampleId));
  return expectedExampleIds().filter((id) => !written.has(id));
}

function exampleStateAtStep(step, exampleId) {
  let rank = 0;
  const throughSource = sourceById.get(step.sourceThroughId);
  for (const source of [...fixture.sources].sort((a, b) => a.order - b.order)) {
    if (source.order > throughSource.order) break;
    const cutoff =
      source.id === throughSource.id
        ? source.evidence.find((item) => item.id === step.evidenceThroughId).order
        : Number.POSITIVE_INFINITY;
    for (const item of [...source.evidence].sort((a, b) => a.order - b.order)) {
      if (item.order > cutoff) continue;
      for (const claim of item.claims) {
        if (!claim.exampleIds.includes(exampleId)) continue;
        rank = Math.max(rank, claim.effect === "confirm" ? 2 : 1);
      }
    }
  }
  return ["hidden", "heard", "confirmed"][rank];
}

test("uses the v2 schema and exact approved scale target", () => {
  assert.equal(fixture.schemaVersion, "deal-witness.v2");
  assert.equal(fixture.teachingLine, "A covenant is just a promise that protects the money.");
  assert.deepEqual(
    {
      months: fixture.river.months,
      organizations: fixture.river.organizationCount,
      peopleRoles: fixture.river.peopleRoleCount,
      records: fixture.river.evidenceRecordCount,
      preloaded: fixture.river.preloadedRecordCount,
      staged: fixture.river.stagedLiveRecordCount,
      atomic: fixture.river.atomicItemCount,
      provenance: fixture.river.provenanceLinkCount,
      relationships: fixture.river.typedRelationshipCount,
      contractScoped: fixture.river.contractScopedItemCount,
      clusters: fixture.river.clusterCount,
      bundles: fixture.river.bundleCount,
    },
    {
      months: 9,
      organizations: 14,
      peopleRoles: 36,
      records: 432,
      preloaded: 430,
      staged: 2,
      atomic: 288,
      provenance: 864,
      relationships: 576,
      contractScoped: 144,
      clusters: 13,
      bundles: 7,
    },
  );
});

test("compresses atomic scale into thirteen stable clusters", () => {
  assert.equal(fixture.clusters.length, 13);
  assert.deepEqual(
    [...fixture.regions].sort((a, b) => a.order - b.order).map((region) => region.id),
    ["decisions", "risks", "promises", "money"],
  );
  assert.equal(new Set(fixture.clusters.map((cluster) => cluster.id)).size, 13);
  assert.equal(
    new Set(fixture.clusters.map((cluster) => cluster.regionId + ":" + cluster.regionSlot)).size,
    13,
  );
  assert.equal(sum(fixture.clusters, (cluster) => cluster.metrics.atomicCount), 288);
  assert.equal(sum(fixture.clusters, (cluster) => cluster.metrics.provenanceCount), 864);
  assert.equal(sum(fixture.clusters, (cluster) => cluster.metrics.relationshipCount), 576);
  assert.equal(sum(fixture.clusters, (cluster) => cluster.metrics.contractScopedCount), 144);
  assert.ok(fixture.clusters.every((cluster) => cluster.representative && !Array.isArray(cluster.representative)));
  assert.equal(fixture.atomicItems, undefined);
});

test("bundle deltas reproduce every aggregate without per-record DOM inflation", () => {
  for (const cluster of fixture.clusters) {
    const deltas = fixture.sources.flatMap((source) =>
      source.clusterDeltas.filter((delta) => delta.clusterId === cluster.id),
    );
    for (const field of aggregateFields) {
      assert.equal(
        sum(deltas, (delta) => delta[field]),
        cluster.metrics[field],
        cluster.id + " " + field,
      );
    }
  }
  assert.ok(fixture.sources.every((source) => source.evidence.length <= 12));
  assert.match(appSource, /MAX_REPRESENTATIVE_EVIDENCE_PER_BUNDLE\s*=\s*12/);
  assert.match(appSource, /MAX_RIVER_TOKENS\s*=\s*18/);
  assert.match(appSource, /MAX_RANKED_CONTACTS\s*=\s*6/);
  assert.match(appSource, /MAX_TRANSCRIPT_ENTRIES\s*=\s*12/);
  assert.doesNotMatch(appSource, /for\s*\([^)]*atomicItem/i);
  const maxSafeLabel = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number.MAX_SAFE_INTEGER);
  assert.ok(maxSafeLabel.length <= 10, "safe-integer aggregate label remains compact");
});

test("represents the required heterogeneous source layer", () => {
  const kinds = new Set(evidence.map((item) => item.kind));
  for (const required of [
    "email",
    "message",
    "notes",
    "call",
    "model",
    "estimate",
    "report",
    "analysis",
    "inspection",
    "markup",
    "approval",
    "draft",
  ]) {
    assert.ok(kinds.has(required), "missing source kind " + required);
  }
  assert.equal(sum(fixture.sources, (source) => source.recordCount), 432);
  assert.equal(sum(fixture.sources, (source) => source.preloadedCount), 430);
  assert.equal(sum(fixture.sources, (source) => source.stagedLiveCount), 2);
});

test("keeps synthetic public reporting quiet, heard-only, and non-blocking", () => {
  const external = evidence.filter((item) => item.origin === "external");
  assert.ok(external.length > 0);
  for (const item of external) {
    assert.equal(item.governance.canConfirm, false);
    assert.equal(item.governance.canBlock, false);
    assert.ok(item.claims.every((claim) => claim.effect === "heard"));
    assert.ok(item.claims.every((claim) => clusterById.get(claim.clusterId).regionId === "risks"));
    assert.ok(
      item.claims.every((claim) => !claim.exampleIds.includes(fixture.story.demonstratedOmissionId)),
    );
  }
  assert.doesNotMatch(JSON.stringify(fixture), /Public signals/i);
});

test("treats Maya as historical provenance and ranks non-Maya evidence owners", () => {
  assert.match(fixture.historicalNavigator.deadline, /gone Monday/i);
  assert.match(fixture.historicalNavigator.boundary, /cannot be contacted/i);
  assert.ok(
    fixture.completionLoop.transcript.every(
      (entry) => entry.speaker !== fixture.historicalNavigator.name,
    ),
  );
  assert.ok(
    fixture.knowledgeDirectory.contacts.every(
      (contact) => contact.name !== fixture.historicalNavigator.name,
    ),
  );
  assert.deepEqual(
    fixture.knowledgeDirectory.capabilityLegend.map((item) => item.id).sort(),
    ["authorized_approve", "can_certify", "likely_knows"],
  );
  const selected = fixture.knowledgeDirectory.contacts.filter((contact) => contact.selected);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].capability, "can_certify");
  assert.match(selected[0].contactChannel, /Prepared simulation/i);
  assert.ok(
    selected[0].receiptIds.every((id) => evidenceById.get(id).origin === "approved"),
  );
  assert.doesNotMatch(JSON.stringify(fixture), /ask maya/i);
});

test("rejects a vague expert reply and closes only on a sourced answer", () => {
  const selectedContact = fixture.knowledgeDirectory.contacts.find((contact) => contact.selected);
  const vague = fixture.completionLoop.transcript.find((entry) => entry.status === "vague");
  const closure = fixture.completionLoop.transcript.find(
    (entry) => entry.id === fixture.completionLoop.closureEntryId,
  );
  assert.equal(vague.speaker, selectedContact.name);
  assert.equal(vague.substantive, false);
  assert.equal(closure.speaker, selectedContact.name);
  assert.equal(closure.substantive, true);
  assert.ok(
    closure.evidenceIds.some((id) => {
      const item = evidenceById.get(id);
      return (
        item.origin === "approved" &&
            item.governance.canConfirm &&
        item.claims.some(
          (claim) =>
            claim.effect === "confirm" &&
            claim.exampleIds.includes(fixture.story.demonstratedOmissionId),
        )
      );
    }),
  );
  const vagueStep = fixture.presentation.steps.find((step) => step.id === "vague_answer");
  const substantiveStep = fixture.presentation.steps.find((step) => step.id === "substantive_answer");
  assert.equal(exampleStateAtStep(vagueStep, fixture.story.demonstratedOmissionId), "heard");
  assert.equal(exampleStateAtStep(substantiveStep, fixture.story.demonstratedOmissionId), "confirmed");
});

test("stores answer, attribution, receipts, and a reusable recipe in preloaded memory", () => {
  const receiptEntry = fixture.completionLoop.transcript.find(
    (entry) => entry.id === fixture.completionLoop.receiptEntryId,
  );
  assert.equal(receiptEntry.status, "stored");
  assert.ok(receiptEntry.substantive);
  assert.ok(receiptEntry.evidenceIds.includes("everos_receipt"));
  assert.ok(
    receiptEntry.evidenceIds.some((id) => {
      const item = evidenceById.get(id);
      return (
        item.origin === "approved" &&
        item.governance.canConfirm &&
        item.governance.canBlock &&
        item.claims.some(
          (claim) =>
            claim.effect === "confirm" &&
            claim.exampleIds.includes(fixture.story.demonstratedOmissionId),
        )
      );
    }),
  );
  assert.equal(evidenceById.get("everos_receipt").loadMode, "preloaded_metadata");
  assert.match(fixture.completionLoop.receipt.title, /Answer \+ attribution \+ receipts/i);
  assert.match(fixture.completionLoop.receipt.recipe, /rank accountable evidence owners/i);
  assert.equal(fixture.memoryLayer.seedTarget.appId, "deal-witness");
  assert.equal(fixture.memoryLayer.seedTarget.projectId, "synthetic-airport-discovery-v1");
  assert.deepEqual(
    [
      fixture.memoryLayer.seedTarget.sessionCount,
      fixture.memoryLayer.seedTarget.episodeCount,
      fixture.memoryLayer.seedTarget.profileCount,
    ],
    [3, 10, 5],
  );
});

test("stages only v7 and v8 live and derives READY to HOLD to READY from paper", () => {
  const staged = evidence.filter((item) => item.loadMode === "staged_live");
  assert.deepEqual(staged.map((item) => item.id).sort(), ["draft_v7", "draft_v8"]);
  assert.ok(staged.every((item) => item.claims.length === 0));
  assert.deepEqual(fixture.river.stagedLiveEvidenceIds.sort(), ["draft_v7", "draft_v8"]);

  const v7 = fixture.drafts.find((draft) => draft.id === "closing_v7");
  const v8 = fixture.drafts.find((draft) => draft.id === "closing_v8");
  assert.deepEqual(missingFromDraft(v7), [fixture.story.demonstratedOmissionId]);
  assert.deepEqual(missingFromDraft(v8), []);
  assert.equal(v8.revisionOf, v7.id);
  assert.deepEqual(
    fixture.presentation.steps.slice(-3).map((step) => step.decision),
    ["READY", "HOLD_FOR_REVIEW", "READY"],
  );
  assert.equal(fixture.presentation.steps.at(-2).draftId, v7.id);
  assert.equal(fixture.presentation.steps.at(-1).draftId, v8.id);
});

test("keeps the presenter replay below three minutes", () => {
  const duration = sum(fixture.presentation.steps, (step) => step.durationMs);
  assert.equal(duration, 168000);
  assert.ok(duration < 180000);
  assert.equal(fixture.presentation.steps.length, 10);
  assert.deepEqual(
    fixture.presentation.steps.map((step) => step.knowledgeState),
    ["hidden", "hidden", "hidden", "hidden", "ranked", "selected", "confirmed", "confirmed", "confirmed", "confirmed"],
  );
});

test("step-gates river samples, keys compact metrics by schema, and preserves summary keyboard behavior", () => {
  assert.match(appSource, /token\.hidden = !record \|\| !evidenceIsRevealed/);
  assert.match(appSource, /item\.dataset\.metricKey = metric\.key/);
  assert.match(stylesSource, /river-metric\[data-metric-key="evidenceRecordCount"\]/);
  assert.doesNotMatch(stylesSource, /\.river-metric:nth-child/);
  assert.match(appSource, /button, a, summary, \[role='button'\]/);
});

test("keeps airport story copy and selected-example semantics in the fixture", () => {
  const controllerAndDom = appSource + "\n" + htmlSource;
  for (const literal of [
    "Skylark Reach",
    "Ada Rook",
    "Ren Ito",
    "Talia Wren",
    "Maya Torres",
    "$380M",
    "noise-mitigation budget",
    "first construction draw",
    "Maya is gone",
    "Deal closes",
    ...fixture.story.weekStakes.items.flatMap((item) => [item.day, item.label]),
  ]) {
    assert.ok(!controllerAndDom.includes(literal), "story literal leaked into DOM/controller: " + literal);
  }
  assert.ok(exampleById.has(fixture.story.demonstratedOmissionId));
  assert.doesNotMatch(controllerAndDom + JSON.stringify(fixture), /primaryConceptId|primary_concept_id/);
  assert.doesNotMatch(JSON.stringify(fixture), /\$24M|factory|owner cash-out|owners cannot take cash out/i);
});
