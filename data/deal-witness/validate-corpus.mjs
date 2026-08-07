import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generate } from "./generate-corpus.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(HERE, "../..");
const CORPUS_ROOT = path.join(HERE, "corpus");
const MAYA_ID = "person-maya-soren";
const MAYA_DEPARTED_AT = "2027-09-03T17:00:00.000Z";
const SELECTED_ITEM_ID = "item-commitment-001";
const DEMONSTRATED_TERM = "Before lenders release the first construction draw, the sponsor must deposit the noise-mitigation budget and an independent engineer must certify it is fully funded.";

const EXPECTED_CHANNEL_COUNTS = {
  approval_memo: 20,
  authority_permit_record: 28,
  call_summary: 48,
  construction_update: 24,
  counsel_markup: 36,
  email: 112,
  external_signal: 1,
  financial_model_note: 40,
  financing_draft: 11,
  inspection_record: 16,
  meeting_record: 56,
  technical_report: 40
};

const EXPECTED_BUNDLE_COUNTS = {
  "bundle-01-maya-relationships-origination": 72,
  "bundle-02-economics-credit": 96,
  "bundle-03-technical-construction": 112,
  "bundle-04-authority-stakeholder-context": 72,
  "bundle-05-historical-relationships-recovery": 78,
  "bundle-06-financing-draft-v7": 1,
  "bundle-07-financing-draft-v8-corrected": 1
};

const EXPECTED_ITEM_TYPE_COUNTS = {
  commitment: 108,
  decision: 72,
  investigation_question: 36,
  risk: 72
};

const EXPECTED_REGION_CLUSTER_COUNTS = {
  Decisions: 3,
  Money: 3,
  Promises: 4,
  Risks: 3
};

const EXPECTED_REGION_ITEM_COUNTS = {
  Decisions: 54,
  Money: 66,
  Promises: 96,
  Risks: 72
};

const EXPECTED_GENERATED_PATHS = [
  "corpus/atomic-items.jsonl",
  "corpus/contract-match-results.jsonl",
  "corpus/expert-candidates.json",
  "corpus/ingestion-replay.jsonl",
  "corpus/investigation-paths.json",
  "corpus/item-relationships.jsonl",
  "corpus/manifest.json",
  "corpus/map-clusters.json",
  "corpus/organizations.json",
  "corpus/people.json",
  "corpus/provenance-links.jsonl",
  "corpus/source-records.jsonl",
  "corpus/visible-bundles.json",
  "everos-runtime-observation.json",
  "expected-state.json"
].sort();

const failures = [];
let assertionCount = 0;

function check(condition, message) {
  assertionCount += 1;
  if (!condition) failures.push(message);
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

function same(left, right) {
  return JSON.stringify(stableValue(left)) === JSON.stringify(stableValue(right));
}

function checkSame(actual, expected, message) {
  check(same(actual, expected), `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(HERE, relativePath), "utf8"));
}

function readJsonl(relativePath) {
  const contents = fs.readFileSync(path.join(HERE, relativePath), "utf8").trim();
  return contents ? contents.split("\n").map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`${relativePath}:${index + 1}: ${error.message}`);
    }
  }) : [];
}

function countBy(values, keyFunction) {
  const counts = {};
  for (const value of values) {
    const key = keyFunction(value);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function checkUniqueIds(values, label) {
  const ids = values.map((value) => value.id);
  check(ids.every((id) => typeof id === "string" && id.length > 0), `${label} must all have non-empty string IDs`);
  check(new Set(ids).size === ids.length, `${label} IDs must be unique`);
}

function indexById(values) {
  return new Map(values.map((value) => [value.id, value]));
}

function validTimestamp(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function listFilesRecursively(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...listFilesRecursively(absolutePath));
    else if (entry.isFile()) files.push(absolutePath);
  }
  return files;
}

function collectKeys(value, keys = []) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectKeys(entry, keys));
  } else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      keys.push(key);
      collectKeys(entry, keys);
    }
  }
  return keys;
}

function textAtRepositoryPath(relativePath) {
  return fs.readFileSync(path.join(REPOSITORY_ROOT, relativePath), "utf8");
}

const manifest = readJson("corpus/manifest.json");
const organizations = readJson("corpus/organizations.json");
const people = readJson("corpus/people.json");
const bundles = readJson("corpus/visible-bundles.json");
const sources = readJsonl("corpus/source-records.jsonl");
const items = readJsonl("corpus/atomic-items.jsonl");
const provenance = readJsonl("corpus/provenance-links.jsonl");
const relationships = readJsonl("corpus/item-relationships.jsonl");
const experts = readJson("corpus/expert-candidates.json");
const clusters = readJson("corpus/map-clusters.json");
const paths = readJson("corpus/investigation-paths.json");
const matchResults = readJsonl("corpus/contract-match-results.jsonl");
const replay = readJsonl("corpus/ingestion-replay.jsonl");
const expectedState = readJson("expected-state.json");
const runtimeObservation = readJson("everos-runtime-observation.json");
const operationalGate = readJson("everos-operational-gate.json");

const organizationById = indexById(organizations);
const personById = indexById(people);
const bundleById = indexById(bundles);
const sourceById = indexById(sources);
const itemById = indexById(items);
const provenanceById = indexById(provenance);
const relationshipById = indexById(relationships);
const clusterById = indexById(clusters);
const pathById = indexById(paths);

// Scale and manifest truth.
check(manifest.synthetic === true, "manifest must identify the corpus as wholly synthetic");
check(manifest.scenario.evidence_months === 9, "manifest must declare exactly nine evidence months");
check(manifest.scenario.facility_display === "$380M", "scenario must use the approved synthetic $380M facility");
check(manifest.scenario.facility_amount_minor_units === 38_000_000_000, "facility amount must be $380M in minor units");
check(manifest.scenario.corpus_start === "2027-01-11T09:00:00.000Z", "corpus start must remain canonical");
check(manifest.scenario.corpus_end === "2027-09-09T15:40:00.000Z", "corpus end must be the v8 timestamp");
checkSame(manifest.approved_counts, {
  organizations: 14,
  people: 36,
  source_records: 432,
  channels: 12,
  atomic_items: 288,
  decisions: 72,
  commitments: 108,
  risks: 72,
  investigation_questions: 36,
  provenance_links: 864,
  item_relationships: 576,
  contract_scoped_items: 144,
  map_clusters: 13,
  visible_bundles: 7,
  formal_snapshots: 3,
  investigation_paths: 24,
  expert_rankings: 1,
  contract_match_results: 288,
  replay_frames: 430
}, "manifest approved counts must match the canonical scale");
checkSame(manifest.channel_counts, EXPECTED_CHANNEL_COUNTS, "manifest channel counts must match the canonical distribution");
checkSame(manifest.bundle_counts, EXPECTED_BUNDLE_COUNTS, "manifest bundle counts must match the canonical distribution");

check(organizations.length === 14, "corpus must contain exactly 14 organizations");
check(people.length === 36, "corpus must contain exactly 36 named people/roles");
check(sources.length === 432, "corpus must contain exactly 432 source records");
check(items.length === 288, "corpus must contain exactly 288 atomic items");
check(provenance.length === 864, "corpus must contain exactly 864 provenance links");
check(relationships.length === 576, "corpus must contain exactly 576 typed relationships");
check(clusters.length === 13, "Deal Map must contain exactly 13 clusters");
check(bundles.length === 7, "corpus must contain exactly seven visible bundles");
check(paths.length === 24, "corpus must contain exactly 24 investigation paths");
check(matchResults.length === 288, "corpus must contain exactly 288 contract-match rows");
check(replay.length === 430, "Evidence River must contain exactly 430 replay frames");
check(expectedState.snapshots.length === 3, "expected state must contain exactly three formal snapshots");

checkUniqueIds(organizations, "organizations");
checkUniqueIds(people, "people");
checkUniqueIds(bundles, "visible bundles");
checkUniqueIds(sources, "source records");
checkUniqueIds(items, "atomic items");
checkUniqueIds(provenance, "provenance links");
checkUniqueIds(relationships, "item relationships");
checkUniqueIds(clusters, "map clusters");
checkUniqueIds(paths, "investigation paths");
checkUniqueIds(matchResults, "contract-match results");

const evidenceMonths = [...new Set(sources.map((source) => source.occurred_at.slice(0, 7)))].sort();
checkSame(evidenceMonths, ["2027-01", "2027-02", "2027-03", "2027-04", "2027-05", "2027-06", "2027-07", "2027-08", "2027-09"], "source timestamps must span exactly the approved nine calendar months");

// Organizations, people, and role-based routing.
for (const organization of organizations) {
  check(organization.synthetic === true, `${organization.id} must be synthetic`);
  check(typeof organization.name === "string" && organization.name.length > 0, `${organization.id} must have a name`);
  check(typeof organization.role === "string" && organization.role.length > 0, `${organization.id} must have a role`);
}
for (const person of people) {
  check(person.synthetic === true, `${person.id} must be synthetic`);
  check(typeof person.name === "string" && person.name.length > 0, `${person.id} must be named`);
  check(typeof person.role === "string" && person.role.length > 0, `${person.id} must have a named role`);
  check(organizationById.has(person.organization_id), `${person.id} references unknown organization ${person.organization_id}`);
  check(Array.isArray(person.subject_areas) && person.subject_areas.length > 0, `${person.id} must have subject areas`);
  check(person.prepared_contact_channel?.mode === "prepared_simulated_contact", `${person.id} must use a prepared contact channel`);
  for (const field of ["live_delivery_enabled", "real_dialing_enabled", "calendar_integration_enabled", "meeting_platform_integration_enabled", "messaging_integration_enabled"]) {
    check(person.prepared_contact_channel?.[field] === false, `${person.id}.${field} must be false`);
  }
  for (const field of ["likely_knows", "can_provide_evidence", "can_certify", "authorized_to_confirm", "authorized_to_approve"]) {
    check(typeof person.knowledge_capabilities?.[field] === "boolean", `${person.id} must distinguish capability ${field}`);
  }
}
const mayaEntries = people.filter((person) => person.id === MAYA_ID || person.is_maya);
check(mayaEntries.length === 1 && mayaEntries[0].id === MAYA_ID, "exactly one person must be Maya Soren");
const maya = personById.get(MAYA_ID);
check(maya?.departed_at === MAYA_DEPARTED_AT, "Maya departure timestamp must be 2027-09-03 17:00Z");
check(maya?.available_for_recovery_contact === false, "Maya must be unavailable for recovery contact");
check(maya?.trusted_analytical_hub === true, "Maya must remain the historical analytical through-line");

// Source records, channels, bundle partition, and source authority.
checkSame(countBy(sources, (source) => source.channel), EXPECTED_CHANNEL_COUNTS, "source channel counts must match exactly");
checkSame(countBy(sources, (source) => source.bundle_id), EXPECTED_BUNDLE_COUNTS, "source bundle counts must match exactly");
const expectedSourceIds = Array.from({ length: 432 }, (_, index) => `source-${String(index + 1).padStart(4, "0")}`);
checkSame(sources.map((source) => source.id), expectedSourceIds, "source IDs must be contiguous and ordered");
for (const source of sources) {
  check(bundleById.has(source.bundle_id), `${source.id} references unknown bundle ${source.bundle_id}`);
  check(validTimestamp(source.occurred_at), `${source.id} must have a valid occurred_at timestamp`);
  check(source.synthetic === true, `${source.id} must be synthetic`);
  check(typeof source.can_confirm === "boolean", `${source.id} must expose boolean can_confirm`);
  check(!Object.hasOwn(source, "can_confirm_memory"), `${source.id} uses retired can_confirm_memory instead of can_confirm`);
  check(source.can_block === false, `${source.id} cannot independently block review`);
  check(source.author_person_id === null || personById.has(source.author_person_id), `${source.id} references unknown author ${source.author_person_id}`);
  check(Array.isArray(source.participant_person_ids) && source.participant_person_ids.every((id) => personById.has(id)), `${source.id} has an unknown participant`);
  if (source.author_person_id !== null) check(source.participant_person_ids.includes(source.author_person_id), `${source.id} author must appear among participants`);
  check(Array.isArray(source.organization_ids) && source.organization_ids.every((id) => organizationById.has(id)), `${source.id} has an unknown organization`);
  const participantOrganizations = [...new Set(source.participant_person_ids.map((id) => personById.get(id).organization_id))].sort();
  checkSame([...source.organization_ids].sort(), participantOrganizations, `${source.id} organization list must derive from its participants`);
  check(typeof source.citation_locator === "string" && source.citation_locator.startsWith(`${source.id}#`), `${source.id} must have an addressable citation locator`);
}

const preloadSources = sources.filter((source) => source.stored_state === "preload_ready");
const stagedSources = sources.filter((source) => source.stored_state === "staged_live");
check(preloadSources.length === 430, "exactly 430 source records must be preload_ready");
check(stagedSources.length === 2, "exactly two source records must be staged_live");
checkSame(preloadSources.map((source) => source.id), expectedSourceIds.slice(0, 430), "only records 1-430 may be preload_ready");
checkSame(stagedSources.map((source) => source.id), ["source-0431", "source-0432"], "only v7 and v8 may be staged live");
for (const [index, source] of preloadSources.entries()) {
  check(source.presentation_mode === "stored_fixture_metadata_replay", `${source.id} must replay stored fixture metadata`);
  check(source.replay_order === index + 1, `${source.id} replay order must be contiguous`);
  check(source.performs_live_write_during_replay === false, `${source.id} replay must not perform a live write`);
}
for (const source of stagedSources) {
  check(source.presentation_mode === "staged_live_write", `${source.id} must be labeled staged_live_write`);
  check(source.replay_order === null, `${source.id} must not have a replay order`);
  check(source.channel === "financing_draft", `${source.id} must be a financing draft`);
  check([7, 8].includes(source.contract_version), `${source.id} must be v7 or v8`);
}

const postDepartureMayaSources = sources.filter((source) => Date.parse(source.occurred_at) >= Date.parse(MAYA_DEPARTED_AT) && (
  source.author_person_id === MAYA_ID ||
  source.participant_person_ids.includes(MAYA_ID) ||
  source.maya_involvement !== null
));
check(postDepartureMayaSources.length === 0, `Maya appears in post-departure source records: ${postDepartureMayaSources.map((source) => source.id).join(", ")}`);
const historicalMayaEdge = sourceById.get("source-0424");
check(historicalMayaEdge?.occurred_at < MAYA_DEPARTED_AT, "source-0424 must predate Maya's departure");
check(historicalMayaEdge?.support_role === "historical_routing_evidence" && historicalMayaEdge?.can_confirm === false, "source-0424 must be historical routing evidence, not confirming evidence");

const externalSignals = sources.filter((source) => source.channel === "external_signal");
check(externalSignals.length === 1, "there must be exactly one quiet external signal");
const externalSignal = externalSignals[0];
check(externalSignal?.can_confirm === false, "external signal must have can_confirm=false");
check(externalSignal?.can_block === false, "external signal must have can_block=false");
check(externalSignal?.authority_level === "background", "external signal must remain background authority");
check(externalSignal?.support_role === "raises_investigation_question_only", "external signal may only raise an investigation question");
check(externalSignal?.narrative_prominence === "background", "external signal must have background narrative prominence");
check(typeof externalSignal?.external_signal?.synthetic_notice === "string" && externalSignal.external_signal.synthetic_notice.includes("Wholly synthetic"), "all external-signal details must sit behind a synthetic notice");
for (const field of ["invented_outlet", "invented_headline", "invented_public_figure", "invented_location", "invented_quote", "invented_sentiment_measure"]) {
  check(Object.hasOwn(externalSignal?.external_signal ?? {}, field), `external signal must keep ${field} behind its synthetic notice`);
}

// Atomic items and Deal Map compression.
checkSame(countBy(items, (item) => item.type), EXPECTED_ITEM_TYPE_COUNTS, "atomic-item type counts must match exactly");
check(items.filter((item) => item.contract_scoped).length === 144, "exactly 144 items must be contract-scoped");
check(items.filter((item) => item.required_for_release).length === 144, "exactly 144 items must be required for release in the fixture");
check(items.every((item) => item.contract_scoped === item.required_for_release), "contract-scoped and required-for-release flags must align in this fixture");
checkSame(countBy(items, (item) => item.verification_at_recovery_ready), { confirmed: 244, heard: 44 }, "recovery-ready verification states must be 44 heard and 244 confirmed");
for (const item of items) {
  check(clusterById.has(item.map_cluster_id), `${item.id} references unknown cluster ${item.map_cluster_id}`);
  check(organizationById.has(item.responsible_organization_id), `${item.id} references unknown responsible organization`);
  check(personById.has(item.responsible_person_id), `${item.id} references unknown responsible person`);
  check(personById.get(item.responsible_person_id)?.organization_id === item.responsible_organization_id, `${item.id} responsible person must belong to its responsible organization`);
  check(["heard", "confirmed"].includes(item.verification_at_recovery_ready), `${item.id} has invalid recovery-ready verification state`);
  check(item.memory_owner === "institution" && item.preserved_after_maya_departure === true, `${item.id} must remain institution-owned after Maya leaves`);
  const retiredSchemaKeys = collectKeys(item).filter((key) => /^(primary|critical|hero)(_|$)/i.test(key));
  check(retiredSchemaKeys.length === 0, `${item.id} contains retired centrality schema keys: ${retiredSchemaKeys.join(", ")}`);
}
const selectedItems = items.filter((item) => item.selected_for_demo);
check(selectedItems.length === 1 && selectedItems[0].id === SELECTED_ITEM_ID, "exactly one item must be selected_for_demo");
const selectedItem = itemById.get(SELECTED_ITEM_ID);
check(selectedItem?.statement === DEMONSTRATED_TERM, "selected demonstrated term must match canonical wording exactly");
check(selectedItem?.contract_scoped === true && selectedItem?.required_for_release === true, "selected item must be one of the 144 required contract-scoped items");
checkSame(selectedItem?.selection_context, {
  central: false,
  highest_risk: false,
  uniquely_important: false,
  explanation: "Selected only as a legible representative example among 144 contract-scoped items."
}, "selected item must be explicitly non-central, non-unique, and not highest-risk");

checkSame(countBy(clusters, (cluster) => cluster.region), EXPECTED_REGION_CLUSTER_COUNTS, "cluster counts by the four fixed regions must match");
const itemCountsByRegion = countBy(items, (item) => clusterById.get(item.map_cluster_id).region);
checkSame(itemCountsByRegion, EXPECTED_REGION_ITEM_COUNTS, "item compression by map region must match");
for (const cluster of clusters) {
  check(["Money", "Promises", "Risks", "Decisions"].includes(cluster.region), `${cluster.id} uses an invalid fifth region ${cluster.region}`);
  const actualCount = items.filter((item) => item.map_cluster_id === cluster.id).length;
  check(cluster.item_count === actualCount, `${cluster.id} item_count must match assigned items`);
  check(cluster.target_item_count === actualCount, `${cluster.id} must meet its deterministic target count`);
  check(cluster.visible === true, `${cluster.id} must be visible`);
}

// Provenance quality and relationship integrity.
for (const link of provenance) {
  check(itemById.has(link.item_id), `${link.id} references unknown item ${link.item_id}`);
  check(sourceById.has(link.source_record_id), `${link.id} references unknown source ${link.source_record_id}`);
  check(link.citation_locator === sourceById.get(link.source_record_id)?.citation_locator, `${link.id} citation must resolve to its source locator`);
  check(["heard", "supports", "confirms", "raises_question"].includes(link.effect), `${link.id} has invalid provenance effect ${link.effect}`);
  check(link.active === true, `${link.id} must be active`);
  if (link.effect === "confirms") check(sourceById.get(link.source_record_id)?.can_confirm === true, `${link.id} confirms from a source without can_confirm authority`);
}
const provenancePerItem = countBy(provenance, (link) => link.item_id);
const itemDegreeDistribution = countBy(Object.values(provenancePerItem), (degree) => String(degree));
checkSame(itemDegreeDistribution, { "2": 72, "3": 144, "4": 72 }, "provenance degree distribution must remain deterministic");
const provenancePerSource = countBy(provenance, (link) => link.source_record_id);
check(Object.keys(provenancePerSource).length === 430, "every preload-ready source and no staged source must have atomic provenance");
for (const source of preloadSources) check((provenancePerSource[source.id] ?? 0) > 0, `${source.id} must be used by at least one atomic item`);
for (const source of stagedSources) check(!Object.hasOwn(provenancePerSource, source.id), `${source.id} must be used only for direct contract comparison, not historical provenance`);
for (const item of items) {
  const itemLinks = provenance.filter((link) => link.item_id === item.id);
  if (item.verification_at_recovery_ready === "confirmed") {
    check(itemLinks.some((link) => link.effect === "confirms"), `${item.id} is confirmed but lacks a confirming provenance link`);
  } else {
    check(!itemLinks.some((link) => link.effect === "confirms"), `${item.id} is heard but has a confirming provenance link`);
  }
  const times = itemLinks.map((link) => {
    const source = sourceById.get(link.source_record_id);
    return source.retrieved_at ?? source.occurred_at;
  }).sort();
  check(item.first_observed_at === times[0], `${item.id} first_observed_at must derive from provenance`);
  check(item.last_supported_at === times.at(-1), `${item.id} last_supported_at must derive from provenance`);
}
const selectedProvenance = provenance
  .filter((link) => link.item_id === SELECTED_ITEM_ID)
  .map((link) => [link.source_record_id, link.effect]);
checkSame(selectedProvenance, [["source-0425", "heard"], ["source-0428", "confirms"], ["source-0429", "confirms"], ["source-0430", "supports"]], "selected item must have the canonical post-departure support trail");
const externalSignalLinks = provenance.filter((link) => link.source_record_id === externalSignal?.id);
check(externalSignalLinks.length > 0, "external signal must sharpen at least one investigation path");
for (const link of externalSignalLinks) {
  const linkedItem = itemById.get(link.item_id);
  const region = clusterById.get(linkedItem.map_cluster_id).region;
  check(region === "Risks" || linkedItem.type === "investigation_question", `${link.id} improperly uses the external signal outside Risks/questions`);
  check(linkedItem.id !== SELECTED_ITEM_ID, "external signal must never create or confirm the demonstrated Promise item");
  check(link.effect !== "confirms", "external signal must never confirm memory");
}

for (const relationship of relationships) {
  check(itemById.has(relationship.from_item_id), `${relationship.id} references unknown from-item`);
  check(itemById.has(relationship.to_item_id), `${relationship.id} references unknown to-item`);
  check(relationship.from_item_id !== relationship.to_item_id, `${relationship.id} must not be a self relationship`);
  check(["depends_on", "constrains", "answers", "creates_risk_for"].includes(relationship.type), `${relationship.id} has invalid type ${relationship.type}`);
  check(sourceById.has(relationship.basis_record_id), `${relationship.id} references unknown basis source`);
  check(provenance.some((link) => link.item_id === relationship.from_item_id && link.source_record_id === relationship.basis_record_id), `${relationship.id} basis must cite its from-item`);
  check(provenance.some((link) => link.item_id === relationship.to_item_id && link.source_record_id === relationship.basis_record_id), `${relationship.id} basis must cite its to-item`);
}
checkSame(countBy(relationships, (relationship) => relationship.from_item_id), Object.fromEntries(items.map((item) => [item.id, 2])), "every atomic item must have exactly two outgoing relationships");
check(relationships.filter((relationship) => relationship.basis_record_id === "source-0424").length === 2, "historical Maya relationship evidence must back exactly two typed relationships");

// Bundle contract and human-readable evidence artifact consistency.
checkSame(bundles.map((bundle) => bundle.display_order), [1, 2, 3, 4, 5, 6, 7], "visible bundle order must be stable");
check(bundles.slice(0, 5).every((bundle) => bundle.load_mode === "preloaded_replay"), "the first five bundles must be preload replays");
check(bundles.slice(5).every((bundle) => bundle.load_mode === "staged_live"), "only the two draft bundles may be staged live");
check(bundles.slice(0, 5).reduce((sum, bundle) => sum + bundle.record_count, 0) === 430, "preload bundle counts must total 430");
for (const bundle of bundles) {
  const bundleSources = sources.filter((source) => source.bundle_id === bundle.id);
  check(bundleSources.length === bundle.record_count, `${bundle.id} record count must equal its source partition`);
  check(validTimestamp(bundle.coverage_start) && validTimestamp(bundle.coverage_end), `${bundle.id} must have valid coverage timestamps`);
  check(bundleSources.every((source) => source.occurred_at >= bundle.coverage_start && source.occurred_at <= bundle.coverage_end), `${bundle.id} contains a source outside its coverage range`);
  check(fs.existsSync(path.join(REPOSITORY_ROOT, bundle.artifact_path)), `${bundle.id} artifact path does not exist`);

  const artifact = textAtRepositoryPath(bundle.artifact_path);
  const declaredId = artifact.match(/\*\*Bundle ID:\*\*\s*`([^`]+)`/)?.[1];
  const declaredRecords = Number(artifact.match(/\*\*Records:\*\*\s*(\d+)/)?.[1]);
  const declaredMode = artifact.match(/\*\*Ingestion mode:\*\*\s*`([^`]+)`/)?.[1];
  check(declaredId === bundle.id, `${bundle.artifact_path} declares bundle ID ${declaredId ?? "<missing>"}, expected ${bundle.id}`);
  check(declaredRecords === bundle.record_count, `${bundle.artifact_path} declares ${declaredRecords} records, expected ${bundle.record_count}`);
  check(declaredMode === bundle.load_mode, `${bundle.artifact_path} declares mode ${declaredMode ?? "<missing>"}, expected ${bundle.load_mode}`);

  const recordMetadata = artifact.match(/\*\*Records:\*\*\s*\d+\s*\(([^)]+)\)/)?.[1];
  if (recordMetadata) {
    const declaredChannels = {};
    for (const token of recordMetadata.split(",")) {
      const match = token.trim().replaceAll("`", "").match(/^(\d+)\s+([a-z_]+)$/);
      check(Boolean(match), `${bundle.artifact_path} has unparseable channel metadata token: ${token.trim()}`);
      if (match) declaredChannels[match[2]] = Number(match[1]);
    }
    checkSame(declaredChannels, countBy(bundleSources, (source) => source.channel), `${bundle.artifact_path} channel metadata must match generated records`);
  }
}

// Who Knows What remains a source-backed side panel with independent capabilities.
check(experts.id === "expert-ranking-selected-example", "expert ranking fixture must have the canonical ID");
check(experts.selected_example_item_id === SELECTED_ITEM_ID, "expert ranking must resolve the selected example");
check(experts.display_surface === "who_knows_what_side_panel", "Who Knows What must be a side panel");
check(experts.deal_map_region === null && experts.is_fifth_deal_map_region === false, "Who Knows What must not become a fifth Deal Map region");
check(experts.provider_generated_concepts_used === false, "expert ranking must not use provider-generated concepts as fixture truth");
check(experts.maya_status?.person_id === MAYA_ID && experts.maya_status?.candidate_for_contact === false, "Maya must be historical-only and unavailable in expert ranking");
check(experts.maya_status?.departed_at === MAYA_DEPARTED_AT, "expert ranking must preserve Maya's departure time");
check(experts.maya_status?.historical_relationship_basis_record_id === "source-0424", "expert ranking must cite Maya's historical relationship receipt");
check(Array.isArray(experts.ranked_candidates) && experts.ranked_candidates.length === 3, "selected example must rank exactly three candidates");
checkSame(experts.ranked_candidates.map((candidate) => candidate.rank), [1, 2, 3], "expert ranks must be contiguous");
check(experts.ranked_candidates[0]?.person_id === "person-ada-rook", "Ada Rook must rank first");
check(experts.selected_contact_person_id === "person-ada-rook", "Ada Rook must be the selected non-Maya contact");
check(!experts.ranked_candidates.some((candidate) => candidate.person_id === MAYA_ID), "Maya must never be a recovery candidate");
const capabilitySignatures = new Set();
for (const candidate of experts.ranked_candidates) {
  const person = personById.get(candidate.person_id);
  check(Boolean(person), `expert rank ${candidate.rank} references unknown person`);
  check(person?.organization_id === candidate.organization_id, `expert rank ${candidate.rank} organization must match person metadata`);
  check(person?.role === candidate.role, `expert rank ${candidate.rank} role must match person metadata`);
  check(Array.isArray(candidate.subject_areas) && candidate.subject_areas.length > 0, `expert rank ${candidate.rank} must expose subject areas`);
  check(typeof candidate.prepared_contact_channel === "string" && candidate.prepared_contact_channel.startsWith("prepared_"), `expert rank ${candidate.rank} must use a prepared channel`);
  check(typeof candidate.why_this_person === "string" && candidate.why_this_person.length > 40, `expert rank ${candidate.rank} must explain Why this person?`);
  check(Array.isArray(candidate.evidence_basis_record_ids) && candidate.evidence_basis_record_ids.length > 0, `expert rank ${candidate.rank} must cite evidence`);
  check(candidate.evidence_basis_record_ids.every((id) => sourceById.has(id)), `expert rank ${candidate.rank} cites an unknown evidence record`);
  check(candidate.relationship_basis_ids.every((id) => relationshipById.has(id)), `expert rank ${candidate.rank} cites an unknown relationship`);
  const capabilityFields = ["likely_knows", "can_provide_evidence", "can_certify", "authorized_to_confirm", "authorized_to_approve"];
  check(capabilityFields.every((field) => typeof candidate.capabilities?.[field] === "boolean"), `expert rank ${candidate.rank} must distinguish all five capabilities`);
  capabilitySignatures.add(capabilityFields.map((field) => Number(candidate.capabilities[field])).join(""));
}
check(capabilitySignatures.size === 3, "ranked experts must not collapse distinct capabilities into one score");
const adaCandidate = experts.ranked_candidates[0];
check(adaCandidate.capabilities.can_provide_evidence && adaCandidate.capabilities.can_certify && adaCandidate.capabilities.authorized_to_confirm && !adaCandidate.capabilities.authorized_to_approve, "Ada must provide/certify/confirm technical evidence without lender approval authority");
checkSame(adaCandidate.evidence_basis_record_ids, ["source-0169", "source-0424", "source-0425"], "Ada's rank must use only historical/gap evidence, not her later answer");
const renCandidate = experts.ranked_candidates[1];
check(renCandidate.capabilities.authorized_to_approve && !renCandidate.capabilities.can_certify, "Ren must own approval evidence without engineering certification authority");
checkSame(renCandidate.evidence_basis_record_ids, ["source-0356", "source-0424"], "Ren's rank must use only historical approval/relationship evidence, not his later receipt");

check(expectedState.who_knows_what_contract?.display_surface === "side_panel", "expected state must place Who Knows What in a side panel");
check(expectedState.who_knows_what_contract?.deal_map_region === null && expectedState.who_knows_what_contract?.is_fifth_deal_map_region === false, "expected state must not make Who Knows What a map region");
check(expectedState.who_knows_what_contract?.selected_candidate_person_id === "person-ada-rook", "expected state must select Ada Rook");
check(expectedState.who_knows_what_contract?.maya_is_historical_only === true, "expected state must keep Maya historical-only");

// Active post-departure memory-completion loop.
checkSame(countBy(paths, (investigationPath) => investigationPath.status), { completed: 16, open: 8 }, "investigation paths must be 16 completed and 8 open");
for (const investigationPath of paths) {
  check(itemById.has(investigationPath.question_item_id), `${investigationPath.id} references unknown question item`);
  check(itemById.get(investigationPath.question_item_id)?.type === "investigation_question", `${investigationPath.id} question_item_id must reference an investigation question`);
  check(investigationPath.originating_risk_item_id === null || itemById.get(investigationPath.originating_risk_item_id)?.type === "risk", `${investigationPath.id} originating risk must reference a risk`);
  check(investigationPath.resolved_item_id === null || itemById.has(investigationPath.resolved_item_id), `${investigationPath.id} references unknown resolved item`);
  check(investigationPath.prepared_interaction === true && investigationPath.live_outreach === false, `${investigationPath.id} must be prepared and non-live`);
  check(investigationPath.gap_state_before === "hollow", `${investigationPath.id} must begin hollow`);
  check(investigationPath.institution_owned === true && investigationPath.preserved_after_maya_departure === true, `${investigationPath.id} must be institution-owned and preserved`);
  check(investigationPath.investigation_recipe?.stored_in === "EverOS" && investigationPath.investigation_recipe?.reusable === true, `${investigationPath.id} must retain a reusable EverOS recipe`);
  for (const step of investigationPath.steps) {
    check(validTimestamp(step.at), `${investigationPath.id} has a step with invalid timestamp`);
    check(step.source_record_ids.every((id) => sourceById.has(id)), `${investigationPath.id} step cites an unknown source`);
    check((step.person_ids ?? []).every((id) => personById.has(id) && id !== MAYA_ID), `${investigationPath.id} attempts to use Maya or an unknown person as a recovery contact`);
  }
  if (investigationPath.status === "completed") {
    check(investigationPath.gap_state_after === "source_backed_human_confirmed", `${investigationPath.id} completed without a source-backed human-confirmed state`);
    check(investigationPath.substantive_answer?.sufficient_to_close_gap === true, `${investigationPath.id} completed without a substantive answer`);
    check(investigationPath.substantive_answer?.attributed_to_person_ids?.every((id) => personById.has(id) && id !== MAYA_ID), `${investigationPath.id} substantive answer must be attributed to non-Maya people`);
    check(investigationPath.substantive_answer?.receipt_source_record_ids?.some((id) => sourceById.get(id)?.can_confirm === true), `${investigationPath.id} completed without a qualifying receipt`);
  } else {
    check(investigationPath.gap_state_after === "hollow", `${investigationPath.id} open path must remain hollow`);
    check(investigationPath.resolved_item_id === null && investigationPath.substantive_answer === null, `${investigationPath.id} open path must not claim a resolution`);
  }
}

const selectedPath = pathById.get("investigation-path-001");
check(selectedPath?.selected_for_demo === true, "investigation-path-001 must be selected for demo");
check(selectedPath?.resolved_item_id === SELECTED_ITEM_ID, "selected investigation path must resolve the demonstrated item");
check(selectedPath?.originating_risk_item_id === "item-risk-001", "quiet external context must sharpen the selected investigation question");
check(selectedPath?.expert_ranking_id === experts.id, "selected path must reference the expert ranking");
check(selectedPath?.maya_historical_relationship_basis?.historical_only === true && selectedPath?.maya_historical_relationship_basis?.available_for_contact === false, "selected path must use Maya only as historical routing evidence");
check(selectedPath?.initial_non_answer?.source_record_id === "source-0426" && selectedPath?.initial_non_answer?.sufficient_to_close_gap === false, "Ada's vague source-0426 answer must leave the gap open");
check(selectedPath?.initial_non_answer?.answer === "The budget is covered.", "prepared vague-answer copy must remain deterministic across transcript and fixture");
check(sourceById.get("source-0426")?.can_confirm === false && sourceById.get("source-0426")?.support_role === "insufficient_answer", "vague reply source must not confirm memory");
check(sourceById.get("source-0428")?.channel === "meeting_record", "Ada's substantive source-0428 answer must be a meeting_record");
checkSame(selectedPath?.substantive_answer?.receipt_source_record_ids, ["source-0428", "source-0429"], "selected path must close on Ada's source and Ren's approved record");
checkSame(selectedPath?.substantive_answer?.attributed_to_person_ids, ["person-ada-rook", "person-ren-ito"], "selected substantive answer must retain Ada and Ren attribution");
check(selectedPath?.substantive_answer?.text === DEMONSTRATED_TERM, "selected substantive answer must preserve the canonical term");
check(selectedPath?.prepared_outreach?.contact_person_id === "person-ada-rook", "prepared outreach must contact Ada, not Maya");
for (const field of ["real_dialing", "calendar_action", "meeting_platform_action", "messaging_action"]) {
  check(selectedPath?.prepared_outreach?.[field] === false, `prepared outreach ${field} must be false`);
}
check(selectedPath?.prepared_outreach?.synchronized_transcript_and_provenance === true, "prepared outreach must synchronize transcript and provenance");
check(typeof selectedPath?.prepared_outreach?.silent_fallback === "string", "prepared outreach must have a silent fallback");
checkSame(selectedPath?.prepared_outreach?.transcript_source_record_ids, ["source-0427", "source-0426", "source-0428"], "prepared transcript must cite question, vague answer, and sourced answer");
const selectedStepKinds = selectedPath.steps.map((step) => step.kind);
checkSame(selectedStepKinds, ["noticed", "gap_exposed", "searched_historical_memory", "ranked_experts", "prepared_question", "insufficient_answer", "confirmed", "captured"], "selected recovery loop must preserve every canonical stage");
check(selectedPath.steps.find((step) => step.kind === "captured")?.source_record_ids.includes("source-0430"), "EverOS capture must be source-0430");

checkSame(expectedState.memory_completion_contract?.loop, [
  "ingest",
  "map",
  "expose_gap",
  "search_historical_evidence_and_relationship_memory",
  "rank_source_backed_candidate_experts",
  "explain_why_this_person",
  "prepare_evidence_grounded_question",
  "reject_vague_answer",
  "capture_substantive_answer_with_receipts",
  "update_memory",
  "use_completed_memory"
], "expected-state loop must describe the complete active-memory cycle");
check(expectedState.memory_completion_contract?.active_agent_not_passive_archive === true, "Deal Witness must be an active memory-completion agent");
check(expectedState.memory_completion_contract?.maya_contact_allowed === false, "expected state must forbid Maya contact");
check(expectedState.memory_completion_contract?.selected_contact_person_id === "person-ada-rook", "expected state must route the selected question to Ada");
check(expectedState.memory_completion_contract?.prepared_interaction === true && expectedState.memory_completion_contract?.live_outreach === false, "expected state must label outreach prepared and non-live");
check(expectedState.memory_completion_contract?.voice_stack_required === false, "no voice stack may be required");
checkSame(expectedState.memory_completion_contract?.everos_capture_fields, ["answer", "attribution", "timestamps", "receipts", "citations", "investigation_recipe"], "EverOS capture fields must preserve answer provenance and recipe");

// Contract comparison and the selected example's state machine.
const contractItems = items.filter((item) => item.contract_scoped);
for (const result of matchResults) {
  const item = itemById.get(result.item_id);
  check(Boolean(item), `${result.id} references unknown item ${result.item_id}`);
  check(item?.contract_scoped === true, `${result.id} references a non-contract-scoped item`);
  check(["source-0431", "source-0432"].includes(result.draft_source_record_id), `${result.id} references an invalid draft source`);
  check(["matched", "missing"].includes(result.match_state), `${result.id} has invalid match state`);
  check(result.required_for_release === item?.required_for_release, `${result.id} required flag must derive from the item`);
  check(result.selected_for_demo === item?.selected_for_demo, `${result.id} selected flag must mirror display metadata only`);
  const expectedCanBlock = result.match_state === "missing" && item?.required_for_release === true && item?.verification_at_recovery_ready === "confirmed";
  check(result.can_block === expectedCanBlock, `${result.id} blocker must derive only from confirmed + required + missing, independently of selected_for_demo`);
  check((result.match_state === "missing") === (result.match_locator === null), `${result.id} locator must be absent only when missing`);
}
for (const contractItem of contractItems) {
  check(matchResults.filter((result) => result.item_id === contractItem.id).length === 2, `${contractItem.id} must have one v7 and one v8 match row`);
}
const v7Results = matchResults.filter((result) => result.draft_source_record_id === "source-0431");
const v8Results = matchResults.filter((result) => result.draft_source_record_id === "source-0432");
check(v7Results.length === 144 && v8Results.length === 144, "each draft must compare all 144 contract-scoped items");
check(v7Results.filter((result) => result.match_state === "matched").length === 143, "v7 must match exactly 143 items");
checkSame(v7Results.filter((result) => result.match_state === "missing").map((result) => result.item_id), [SELECTED_ITEM_ID], "v7 must omit only the selected demonstrated item");
checkSame(v7Results.filter((result) => result.can_block).map((result) => result.item_id), [SELECTED_ITEM_ID], "v7 must show exactly one blocker");
check(v7Results.find((result) => result.item_id === SELECTED_ITEM_ID)?.connection_state === "broken", "v7 selected connection must be broken");
check(v8Results.every((result) => result.match_state === "matched" && result.can_block === false), "v8 must match all 144 items with no blocker");
check(v8Results.find((result) => result.item_id === SELECTED_ITEM_ID)?.connection_state === "repaired", "v8 selected connection must be repaired");

checkSame(expectedState.scenario, {
  project_name: "Project Asterline",
  project_site: "Asterline Gateway",
  financing_type: "private credit",
  facility_amount_minor_units: 38_000_000_000,
  currency: "USD",
  corpus_start: "2027-01-11T09:00:00.000Z",
  maya_departed_at: MAYA_DEPARTED_AT,
  recovery_started_at: "2027-09-06T09:00:00.000Z",
  recovery_completed_at: "2027-09-08T16:45:00.000Z",
  draft_v7_at: "2027-09-09T09:12:00.000Z",
  draft_v8_at: "2027-09-09T15:40:00.000Z",
  scheduled_close_at: "2027-09-10T10:00:00.000Z"
}, "expected-state chronology must follow Maya-gone Monday through Friday close");
checkSame(expectedState.map_contract?.region_order, ["Money", "Promises", "Risks", "Decisions"], "expected state must expose only the four fixed regions");
check(expectedState.map_contract?.cluster_count === 13 && expectedState.map_contract?.atomic_item_count === 288, "expected state must preserve map compression counts");
check(expectedState.map_contract?.selected_example_item_id === SELECTED_ITEM_ID, "expected state must identify the selected example");
for (const flag of ["selected_example_is_central", "selected_example_is_highest_risk", "selected_example_is_uniquely_important"]) {
  check(expectedState.map_contract?.[flag] === false, `expected-state ${flag} must be false`);
}

const recoverySnapshot = expectedState.snapshots.find((snapshot) => snapshot.id === "post_departure_recovery_ready");
const v7Snapshot = expectedState.snapshots.find((snapshot) => snapshot.id === "draft_v7_reviewed");
const v8Snapshot = expectedState.snapshots.find((snapshot) => snapshot.id === "draft_v8_reviewed");
check(recoverySnapshot?.at === "2027-09-08T16:45:00.000Z" && recoverySnapshot?.deal_status_display === "READY", "recovery snapshot must be READY Wednesday after sourced completion");
checkSame(recoverySnapshot?.state_counts, { heard: 44, confirmed: 244, in_contract: 0 }, "recovery snapshot state counts must match");
checkSame(recoverySnapshot?.contract_results, { not_checked: 144, matched: 0, missing: 0 }, "recovery snapshot must precede draft comparison");
check(v7Snapshot?.at === "2027-09-09T09:12:00.000Z" && v7Snapshot?.deal_status_display === "HOLD FOR REVIEW", "v7 snapshot must hold Thursday morning");
checkSame(v7Snapshot?.state_counts, { heard: 44, confirmed: 101, in_contract: 143 }, "v7 snapshot state counts must match");
checkSame(v7Snapshot?.contract_results, { not_checked: 0, matched: 143, missing: 1 }, "v7 snapshot contract counts must match");
checkSame(v7Snapshot?.blocking_item_ids, [SELECTED_ITEM_ID], "v7 snapshot must have one blocker");
checkSame(v7Snapshot?.selected_example_state, { verification_state: "confirmed", contract_match_state: "missing", connection_state: "broken" }, "v7 selected state must be confirmed but missing/broken");
check(v8Snapshot?.at === "2027-09-09T15:40:00.000Z" && v8Snapshot?.deal_status_display === "READY", "v8 snapshot must return READY Thursday afternoon");
checkSame(v8Snapshot?.state_counts, { heard: 44, confirmed: 100, in_contract: 144 }, "v8 snapshot state counts must match");
checkSame(v8Snapshot?.contract_results, { not_checked: 0, matched: 144, missing: 0 }, "v8 snapshot contract counts must match");
checkSame(v8Snapshot?.selected_example_state, { verification_state: "in_contract", contract_match_state: "matched", connection_state: "repaired" }, "v8 selected state must be in contract and repaired");
checkSame(expectedState.status_transitions?.map((transition) => [transition.event, transition.from_status_id, transition.to_status_id]), [
  ["post_departure_memory_completed", null, "ready"],
  ["draft_v7_checked", "ready", "hold_for_review"],
  ["draft_v8_checked", "hold_for_review", "ready"]
], "status transitions must remain READY -> HOLD FOR REVIEW -> READY after recovery");

// Evidence River replay: cumulative counters are monotone; quality-state counters may migrate.
checkSame(replay.map((frame) => frame.replay_order), Array.from({ length: 430 }, (_, index) => index + 1), "replay orders must be contiguous");
checkSame(replay.map((frame) => frame.source_record_id), expectedSourceIds.slice(0, 430), "replay frames must follow preload source IDs exactly");
check(replay.every((frame, index) => frame.replay_offset_ms === index * 14), "replay offsets must be deterministic and contiguous");
check(replay.every((frame) => frame.presentation_mode === "stored_fixture_metadata_replay" && frame.performs_live_write === false), "Evidence River replay must never perform live writes");
const cumulativeCounterKeys = ["records_visible", "provenance_links_visible", "atomic_items_visible", "clusters_visible", "confirmed_visible", "completed_investigation_paths_visible"];
for (const key of cumulativeCounterKeys) {
  check(replay.every((frame, index) => index === 0 || frame.counters[key] >= replay[index - 1].counters[key]), `replay cumulative counter ${key} must be monotone`);
}
check(replay.every((frame, index) => index === 0 || frame.counters.heard_visible + frame.counters.confirmed_visible >= replay[index - 1].counters.heard_visible + replay[index - 1].counters.confirmed_visible), "visible supported-item total must be monotone while HEARD items may become CONFIRMED");
check(replay.every((frame, index) => index === 0 || frame.counters.hollow_paths_visible + frame.counters.completed_investigation_paths_visible >= replay[index - 1].counters.hollow_paths_visible + replay[index - 1].counters.completed_investigation_paths_visible), "visible path total must be monotone while hollow paths may complete");
checkSame(replay.filter((frame) => frame.checkpoint).map((frame) => frame.replay_order), [72, 168, 280, 352, 430], "replay checkpoints must align with preload bundle boundaries");
checkSame(replay.at(-1)?.counters, {
  records_visible: 430,
  provenance_links_visible: 864,
  atomic_items_visible: 288,
  clusters_visible: 13,
  heard_visible: 44,
  confirmed_visible: 244,
  hollow_paths_visible: 8,
  completed_investigation_paths_visible: 16
}, "final Evidence River counters must match the canonical corpus");
check(expectedState.replay_contract?.preloaded_record_count === 430 && expectedState.replay_contract?.staged_live_record_count === 2, "expected replay contract must distinguish 430 replayed from two staged-live records");
check(expectedState.replay_contract?.presentation_mode === "stored_fixture_metadata_replay", "expected replay contract must use stored_fixture_metadata_replay");
check(expectedState.replay_contract?.performs_live_api_writes === false, "Evidence River must claim zero live API writes");
check(expectedState.replay_contract?.provider_persistence_claimed === false, "Evidence River must not claim provider persistence before the operational gate clears");
check(expectedState.replay_contract?.everos_bulk_load_allowed === false, "expected state must preserve the EverOS bulk-load gate");
check(expectedState.replay_contract?.label === "Replaying 430 deterministic preload-ready fixture records", "Evidence River label must say preload-ready fixture records, not provider-stored records");
check(expectedState.visual_contract?.evidence_river?.source === "deterministic preload-ready fixture metadata", "visual contract must describe preload-ready fixture metadata without a persistence claim");

// EverOS runtime observation is diagnostics only; fixture truth remains deterministic.
check(runtimeObservation.observation_type === "provider_runtime_extraction_summary", "EverOS runtime observation must be labeled as provider diagnostics");
check(runtimeObservation.app_id === "deal-witness" && runtimeObservation.project_id === "synthetic-airport-discovery-v1", "EverOS observation identifiers must match the supplied seed scope");
checkSame(runtimeObservation.session_ids, ["foundation", "gap-resolution", "later-use"], "EverOS observation must preserve the three supplied sessions");
check(runtimeObservation.input_message_count === 20 && runtimeObservation.observed_episode_count === 10 && runtimeObservation.observed_profile_count === 5, "EverOS runtime observation must report exactly 20 messages, 10 episodes, and 5 profiles");
check(runtimeObservation.profiles_represent_distinct_participants === true && runtimeObservation.shared_episodes_across_participants_observed === true, "EverOS observation must retain the distinct-participant/shared-episode basis for its mode inference");
check(runtimeObservation.memory_space_mode_inference === "behavior_consistent_with_team_collaboration" && runtimeObservation.memory_space_mode_confirmed === false, "EverOS Memory Space mode must remain inferred, not confirmed");
check(runtimeObservation.operational_gate_path === "data/deal-witness/everos-operational-gate.json", "EverOS runtime observation must point to the operational gate");
check(runtimeObservation.fixture_truth === false && runtimeObservation.source_truth === false, "EverOS observation must never be fixture or source truth");
check(runtimeObservation.provider_generated_concepts_predeclared === false && runtimeObservation.provider_generated_concepts_copied_into_fixture === false, "provider-generated concepts must not be predeclared or copied into the fixture");
check(runtimeObservation.concepts === "intentionally omitted", "provider-generated concept labels must be omitted from checked-in runtime diagnostics");
check(runtimeObservation.secrets_included === false, "runtime observation must not include secrets");
const fixtureTruthTexts = [
  fs.readFileSync(path.join(CORPUS_ROOT, "source-records.jsonl"), "utf8"),
  fs.readFileSync(path.join(CORPUS_ROOT, "atomic-items.jsonl"), "utf8"),
  fs.readFileSync(path.join(CORPUS_ROOT, "map-clusters.json"), "utf8")
].join("\n");
check(!/observed_episode_count|observed_profile_count|provider_runtime_extraction_summary/.test(fixtureTruthTexts), "provider runtime diagnostics must not leak into fixture/source truth");

// Immutable EverOS Memory Space mode is an operational gate, not demo narration.
check(operationalGate.status === "blocked_pending_console_confirmation", "EverOS preload gate must remain blocked pending Console confirmation");
check(operationalGate.required_scenario_mode === "Team Collaboration", "EverOS preload requires Team Collaboration mode");
check(operationalGate.console_confirmation?.required === true && operationalGate.console_confirmation?.confirmed === false && operationalGate.console_confirmation?.confirmed_mode === null, "Team Collaboration must not be represented as confirmed before Console verification");
check(operationalGate.runtime_observation?.distinct_profile_count === 5 && operationalGate.runtime_observation?.shared_episodes_across_participants_observed === true, "operational gate must retain the observed basis for the Team-mode inference");
check(operationalGate.runtime_observation?.inference_is_confirmation === false, "five profiles and shared episodes must remain an inference, not confirmation");
check(operationalGate.provider_constraints?.scenario_mode_immutable_after_first_data === true, "operational gate must record immutable scenario mode");
check(operationalGate.provider_constraints?.documented_v2_api_read_endpoint_available === false && operationalGate.provider_constraints?.documented_v2_api_change_endpoint_available === false, "operational gate must record the missing documented v2 read/change endpoints");
check(operationalGate.provider_constraints?.app_id_changes_scenario_mode === false && operationalGate.provider_constraints?.project_id_changes_scenario_mode === false, "app/project identifiers must not be treated as Memory Space mode selectors");
check(operationalGate.provider_constraints?.api_key_is_bound_to_memory_space === true, "operational gate must record that the environment key is Memory-Space-bound");
check(operationalGate.prohibited_until_confirmed?.includes("bulk_load_430_preload_ready_records"), "operational gate must explicitly prohibit the 430-record bulk load");
check(operationalGate.resolution?.if_personal?.includes("fresh memory space explicitly configured for Team Collaboration"), "Personal-mode resolution must require a fresh explicit Team space and reseed");
check(operationalGate.demo_narration === false && operationalGate.fixture_truth === false && operationalGate.source_truth === false, "operational gate must stay outside narration and fixture/source truth");
check(operationalGate.secret_handling?.interface === "environment variables only", "operational gate must use environment-variable secret interfaces only");
check(operationalGate.secret_handling?.secret_values_in_file === false && operationalGate.secret_handling?.print_or_log_secret_values === false, "operational gate must prohibit storing or printing secret values");
const gateText = fs.readFileSync(path.join(HERE, "everos-operational-gate.json"), "utf8");
check(!/(?:"(?:api_key|access_token|secret|password)"\s*:\s*"(?!<|\$\{)[^"\s]{8,}")|(?:sk-|Bearer\s+)[A-Za-z0-9_-]{12,}/i.test(gateText), "operational gate appears to contain a secret value");
check(manifest.preload_contract?.provider_persistence_claimed === false, "manifest must not claim provider persistence before Console confirmation");
check(manifest.preload_contract?.everos_bulk_load_allowed === false && manifest.preload_contract?.operational_gate_path === "data/deal-witness/everos-operational-gate.json", "manifest must preserve the blocked operational gate");
check(expectedState.everos_operational_gate_path === "data/deal-witness/everos-operational-gate.json", "expected state must point to the operational gate");

// Canonical narrative contract and evidence pack.
const narrativePaths = [
  "docs/deal-witness/product-contract.md",
  "docs/deal-witness/demo-script.md",
  "docs/deal-witness/terminology.md",
  "data/deal-witness/evidence/README.md",
  ...bundles.map((bundle) => bundle.artifact_path)
];
const uniqueNarrativePaths = [...new Set(narrativePaths)];
for (const relativePath of uniqueNarrativePaths) check(fs.existsSync(path.join(REPOSITORY_ROOT, relativePath)), `missing canonical narrative artifact ${relativePath}`);
const narrativeByPath = new Map(uniqueNarrativePaths.filter((relativePath) => fs.existsSync(path.join(REPOSITORY_ROOT, relativePath))).map((relativePath) => [relativePath, textAtRepositoryPath(relativePath)]));
const allNarrative = [...narrativeByPath.values()].join("\n");
for (const [relativePath, text] of narrativeByPath) {
  check(/synthetic/i.test(text), `${relativePath} must prominently identify its content as synthetic`);
}
check(!/\$24M|24 million|factory scenario|owners? cannot take cash out/i.test(allNarrative), "deprecated $24M factory/owner-cash-out story remains in canonical artifacts");
check(!/\b(?:Enid|Snowflake|Cortex|Voice Cursor|LaserData|RocketRide|Raven|Cognee|HandOff|NOUS)\b/.test(allNarrative), "canonical artifacts mention an out-of-scope system or repository");
check(!/Records 1[–-]430 are already stored in EverOS/i.test(allNarrative), "narrative incorrectly claims the gated 430-record corpus is already stored in EverOS");
check(!/\b(?:default_space|Team Collaboration|blocked_pending_console_confirmation)\b/i.test(allNarrative), "operational Memory Space gate must not appear in demo narration");
check(!/can_confirm_memory/.test(allNarrative), "human-readable evidence uses retired can_confirm_memory instead of source-schema can_confirm");

const productContract = narrativeByPath.get("docs/deal-witness/product-contract.md") ?? "";
const demoScript = narrativeByPath.get("docs/deal-witness/demo-script.md") ?? "";
const terminology = narrativeByPath.get("docs/deal-witness/terminology.md") ?? "";
const evidenceReadme = narrativeByPath.get("data/deal-witness/evidence/README.md") ?? "";
for (const [label, text] of [["product contract", productContract], ["demo script", demoScript], ["evidence manifest", evidenceReadme]]) {
  check(text.includes(DEMONSTRATED_TERM), `${label} must preserve the exact demonstrated term`);
  check(/Maya[^\n]{0,120}(?:already gone|already left|departed)/i.test(text), `${label} must establish that Maya is already gone`);
  check(/closes? (?:this )?Friday|Friday(?:'s)? (?:target )?close/i.test(text), `${label} must establish the Friday close`);
  check(/Who Knows What/i.test(text) && /(?:side panel|right-side panel)/i.test(text) && /not a fifth/i.test(text), `${label} must keep Who Knows What outside the four-region map`);
  check(/prepared/i.test(text) && /no real (?:call|dialing|outreach)|explicitly non-live/i.test(text), `${label} must label outreach as prepared and non-live`);
  check(/vague/i.test(text) && /(?:stays|remains|leaves|keeps)[^\n]{0,40}(?:open|hollow)|vague[^\n]{0,40}open/i.test(text), `${label} must keep vague answers open`);
  check(/144 contract-scoped items/i.test(text), `${label} must frame the example as one of 144 contract-scoped items`);
  check(/430[^\n]{0,80}(?:preload-ready|stored fixture|replayed)/i.test(text) && (/(?:only )?v7 and v8[^\n]{0,50}staged live/i.test(text) || /only staged-live[^\n]{0,80}v7 and v8/i.test(text)), `${label} must distinguish 430 replayed fixture records from v7/v8 staged live`);
}
check(/three-minute demo/i.test(demoScript) && /2:55[–-]3:00/.test(demoScript), "demo script must remain a timed three-minute presentation");
check(/20 messages[^\n]{0,30}10 episodes[^\n]{0,30}5 profiles/i.test(demoScript), "demo must keep 20/10/5 in a separate runtime-only observation");
check(/inference-only/i.test(demoScript) && /never fixture or deal-source truth/i.test(demoScript), "demo must keep runtime observations out of fixture/source truth");
check(/(?:Maya|She)[^\n]{0,40}appears only[^\n]{0,120}historical/i.test(productContract), "product contract must limit Maya to historical provenance/relationship edges");
check(/Maya cannot be (?:interviewed or )?contacted/i.test(productContract), "product contract must prohibit recovery contact with Maya");
check(/Money[^\n]*Promises[^\n]*Risks[^\n]*Decisions/i.test(productContract), "product contract must name the four fixed regions");
check(/Covenant\s*\|\s*\*\*A promise that protects the money\*\*/i.test(terminology), "terminology must define a covenant as a promise that protects the money");
for (const state of ["HEARD", "CONFIRMED", "MISSING", "IN CONTRACT", "READY", "HOLD FOR REVIEW"]) {
  check(terminology.includes(`**${state}**`), `terminology must define ${state}`);
}
check(/READY[^\n]{0,160}not permission to [^\n]{0,80}(?:close|fund)/i.test(terminology), "terminology must retain the READY legal guardrail");
check(/IN CONTRACT[^\n]{0,160}not a judgment about enforceability/i.test(terminology), "terminology must retain the IN CONTRACT legal guardrail");
check(!/post-departure memory[^\n]{0,30}READY[^\n]{0,30}on Monday/i.test(productContract), "product contract must not date the completed recovery snapshot to Monday; closure occurs Wednesday");
check(!/Monday post-departure snapshot[^\n]{0,20}READY/i.test(demoScript), "demo must not call the Wednesday completed recovery snapshot a Monday snapshot");

// Dataset hash and byte-for-byte deterministic regeneration.
const hash = crypto.createHash("sha256");
const componentRelativePaths = manifest.files.map((entry) => path.basename(entry)).sort();
for (const relativePath of componentRelativePaths) {
  const contents = fs.readFileSync(path.join(CORPUS_ROOT, relativePath));
  hash.update(relativePath);
  hash.update("\0");
  hash.update(contents);
}
const computedDatasetSha = hash.digest("hex");
check(computedDatasetSha === manifest.dataset_sha256, `manifest dataset SHA mismatch: expected ${manifest.dataset_sha256}, computed ${computedDatasetSha}`);
check(expectedState.generated_by?.dataset_sha256 === manifest.dataset_sha256, "expected state must carry the manifest dataset SHA");

let temporaryRoot;
try {
  temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "deal-witness-validation-"));
  const regenerated = generate(temporaryRoot);
  check(regenerated.dataset_sha256 === manifest.dataset_sha256, "regeneration returned a different dataset SHA");
  const regeneratedFiles = listFilesRecursively(temporaryRoot).map((filePath) => path.relative(temporaryRoot, filePath)).sort();
  checkSame(regeneratedFiles, EXPECTED_GENERATED_PATHS, "generator output file set must remain exact");
  for (const relativePath of EXPECTED_GENERATED_PATHS) {
    const checkedInPath = path.join(HERE, relativePath);
    const regeneratedPath = path.join(temporaryRoot, relativePath);
    check(fs.existsSync(checkedInPath), `checked-in generated output is missing: ${relativePath}`);
    check(fs.existsSync(regeneratedPath), `regeneration did not produce: ${relativePath}`);
    if (fs.existsSync(checkedInPath) && fs.existsSync(regeneratedPath)) {
      check(fs.readFileSync(checkedInPath).equals(fs.readFileSync(regeneratedPath)), `generated output is stale or nondeterministic: ${relativePath}`);
    }
  }
} finally {
  if (temporaryRoot && temporaryRoot.startsWith(`${os.tmpdir()}${path.sep}deal-witness-validation-`)) {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

if (failures.length > 0) {
  process.stderr.write(`Deal Witness corpus validation FAILED (${failures.length} failures across ${assertionCount} assertions)\n`);
  failures.forEach((failure, index) => process.stderr.write(`${String(index + 1).padStart(2, "0")}. ${failure}\n`));
  process.exitCode = 1;
} else {
  process.stdout.write([
    `Deal Witness corpus validation PASSED (${assertionCount} assertions)`,
    "Scale: 9 months · 14 organizations · 36 people · 432 records / 12 channels",
    "Memory: 288 atomic items (72 decisions / 108 commitments / 72 risks / 36 questions) · 864 provenance links · 576 relationships",
    "Map and demo: 13 clusters / 4 regions · 144 contract-scoped items · 7 bundles · 24 paths (16 completed / 8 open) · 3 snapshots",
    "Replay: 430 preload_ready stored_fixture_metadata_replay frames · staged live: v7 + v8 only",
    "State: READY -> HOLD FOR REVIEW (1 omission) -> READY (repaired)",
    "EverOS: runtime observation 20/10/5 kept diagnostic-only; 430-record bulk load blocked pending Console confirmation of Team Collaboration",
    `Dataset SHA-256: ${computedDatasetSha}`,
    "Determinism: all 15 generated outputs byte-identical"
  ].join("\n") + "\n");
}
