import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT_ROOT = HERE;
const GENERATOR_VERSION = "2.0.0";
const GENERATOR_SEED = "deal-witness-project-asterline-v2";
const SYNTHETIC_NOTICE = "Wholly synthetic demo data. Every organization, person, project, place, event, source, quote, amount, and term is invented and is not modeled on a real airport, financing, company, or public figure.";
const DEMONSTRATED_TERM = "Before lenders release the first construction draw, the sponsor must deposit the noise-mitigation budget and an independent engineer must certify it is fully funded.";
const MAYA_DEPARTED_AT = "2027-09-03T17:00:00.000Z";
const EVEROS_RUNTIME_OBSERVATION = {
  observation_type: "provider_runtime_extraction_summary",
  app_id: "deal-witness",
  project_id: "synthetic-airport-discovery-v1",
  session_ids: ["foundation", "gap-resolution", "later-use"],
  input_message_count: 20,
  observed_episode_count: 10,
  observed_profile_count: 5,
  profiles_represent_distinct_participants: true,
  shared_episodes_across_participants_observed: true,
  memory_space_mode_inference: "behavior_consistent_with_team_collaboration",
  memory_space_mode_confirmed: false,
  operational_gate_path: "data/deal-witness/everos-operational-gate.json",
  fixture_truth: false,
  source_truth: false,
  provider_generated_concepts_predeclared: false,
  provider_generated_concepts_copied_into_fixture: false,
  interpretation: "A live EverOS Cloud observation supplied by the co-leader shows that provider concepts can emerge from the synthetic discovery seed. Counts are runtime diagnostics only; deterministic fixture and source truth remain in the generated corpus.",
  concepts: "intentionally omitted",
  secrets_included: false
};

function seedFromString(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed) {
  let state = seedFromString(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(values, rng) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

function pad(value, width = 3) {
  return String(value).padStart(width, "0");
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function jsonl(values) {
  return `${values.map((value) => JSON.stringify(value)).join("\n")}\n`;
}

function interpolateTimestamp(start, end, index, count) {
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  const ratio = count <= 1 ? 0 : index / (count - 1);
  return new Date(Math.round(startMs + (endMs - startMs) * ratio)).toISOString();
}

function countBy(values, keyFn) {
  const counts = {};
  for (const value of values) {
    const key = keyFn(value);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

const organizations = [
  ["org-asterline-infrastructure", "Asterline Infrastructure Holdings", "project sponsor"],
  ["org-asterline-runway", "Asterline Runway Company", "project company"],
  ["org-harbor-glass", "Harbor Glass Private Credit", "lead private-credit lender"],
  ["org-cobalt-finch", "Cobalt Finch Capital", "co-lender coordinator"],
  ["org-skyvale-authority", "Skyvale Airport Authority", "airport authority"],
  ["org-civic-aerodrome-review", "Civic Aerodrome Review Office", "aviation review office"],
  ["org-copper-kite", "Copper Kite Construction", "engineering and construction contractor"],
  ["org-north-loom", "North Loom Engineering", "runway design engineer"],
  ["org-clearspan", "Clearspan Independent Engineering", "independent engineer"],
  ["org-morrow-field", "Morrow Field Environment", "environmental and noise adviser"],
  ["org-almanac-counsel", "Almanac Project Counsel", "sponsor counsel"],
  ["org-juniper-ledger", "Juniper Ledger Counsel", "lender counsel"],
  ["org-beacon-quill", "Beacon Quill Risk Partners", "insurance and construction-risk adviser"],
  ["org-skyvale-community", "Skyvale Community Coordination Forum", "community coordination group"]
].map(([id, name, role], index) => ({
  id,
  name,
  role,
  synthetic: true,
  display_order: index + 1
}));

const people = [
  ["person-lena-voss", "Lena Voss", "sponsor managing director", "org-asterline-infrastructure"],
  ["person-omar-vale", "Omar Vale", "sponsor finance director", "org-asterline-infrastructure"],
  ["person-priya-dune", "Priya Dune", "sponsor project director", "org-asterline-infrastructure"],
  ["person-ellis-march", "Ellis March", "sponsor treasury lead", "org-asterline-infrastructure"],
  ["person-jonah-crest", "Jonah Crest", "project-company chief executive", "org-asterline-runway"],
  ["person-talia-wren", "Talia Wren", "project-controls lead", "org-asterline-runway"],
  ["person-marc-ives", "Marc Ives", "draw coordinator", "org-asterline-runway"],
  ["person-maya-soren", "Maya Soren", "senior deal lead and cross-organization analytical hub", "org-harbor-glass"],
  ["person-ren-ito", "Ren Ito", "credit committee chair", "org-harbor-glass"],
  ["person-celia-north", "Celia North", "portfolio-risk lead", "org-harbor-glass"],
  ["person-anton-reef", "Anton Reef", "loan-operations lead", "org-harbor-glass"],
  ["person-nia-calder", "Nia Calder", "co-lender lead", "org-cobalt-finch"],
  ["person-felix-orr", "Felix Orr", "syndication manager", "org-cobalt-finch"],
  ["person-dara-pike", "Dara Pike", "portfolio analyst", "org-cobalt-finch"],
  ["person-amara-quinn", "Amara Quinn", "authority program director", "org-skyvale-authority"],
  ["person-theo-bell", "Theo Bell", "airfield-operations lead", "org-skyvale-authority"],
  ["person-ines-ward", "Ines Ward", "public-engagement director", "org-skyvale-authority"],
  ["person-sora-keene", "Sora Keene", "aviation-review director", "org-civic-aerodrome-review"],
  ["person-bram-holt", "Bram Holt", "permit-review counsel", "org-civic-aerodrome-review"],
  ["person-keira-moss", "Keira Moss", "construction program executive", "org-copper-kite"],
  ["person-luc-renn", "Luc Renn", "construction scheduler", "org-copper-kite"],
  ["person-veda-snow", "Veda Snow", "commercial manager", "org-copper-kite"],
  ["person-ian-fable", "Ian Fable", "lead runway designer", "org-north-loom"],
  ["person-meera-sol", "Meera Sol", "pavement-systems engineer", "org-north-loom"],
  ["person-ada-rook", "Ada Rook", "independent-engineering director", "org-clearspan"],
  ["person-noel-brant", "Noel Brant", "certification lead", "org-clearspan"],
  ["person-esme-lark", "Esme Lark", "environmental-acoustics lead", "org-morrow-field"],
  ["person-ravi-fen", "Ravi Fen", "mitigation analyst", "org-morrow-field"],
  ["person-gwen-alder", "Gwen Alder", "sponsor counsel", "org-almanac-counsel"],
  ["person-tobias-quill", "Tobias Quill", "project-agreements counsel", "org-almanac-counsel"],
  ["person-mira-stone", "Mira Stone", "lender counsel", "org-juniper-ledger"],
  ["person-devon-lake", "Devon Lake", "financing associate", "org-juniper-ledger"],
  ["person-june-hollow", "June Hollow", "insurance adviser", "org-beacon-quill"],
  ["person-arlo-pruitt", "Arlo Pruitt", "construction-risk analyst", "org-beacon-quill"],
  ["person-selah-reed", "Selah Reed", "community-forum chair", "org-skyvale-community"],
  ["person-milo-hart", "Milo Hart", "resident liaison", "org-skyvale-community"]
].map(([id, name, role, organizationId], index) => ({
  id,
  name,
  role,
  organization_id: organizationId,
  synthetic: true,
  is_maya: id === "person-maya-soren",
  relationship_started_at: id === "person-maya-soren" ? "2016-04-18T09:00:00.000Z" : null,
  trusted_analytical_hub: id === "person-maya-soren",
  departed_at: id === "person-maya-soren" ? MAYA_DEPARTED_AT : null,
  available_for_recovery_contact: id !== "person-maya-soren",
  subject_areas: [role, "Project Asterline"],
  prepared_contact_channel: {
    mode: "prepared_simulated_contact",
    live_delivery_enabled: false,
    real_dialing_enabled: false,
    calendar_integration_enabled: false,
    meeting_platform_integration_enabled: false,
    messaging_integration_enabled: false,
    silent_fallback: "synchronized prepared transcript"
  },
  knowledge_capabilities: {
    likely_knows: true,
    can_provide_evidence: !role.includes("resident liaison"),
    can_certify: id === "person-ada-rook" || id === "person-noel-brant",
    authorized_to_confirm: ["person-ada-rook", "person-noel-brant", "person-ren-ito", "person-mira-stone"].includes(id),
    authorized_to_approve: ["person-ren-ito", "person-lena-voss", "person-amara-quinn"].includes(id)
  },
  display_order: index + 1
}));

const bundles = [
  {
    id: "bundle-01-maya-relationships-origination",
    title: "Maya relationships and origination",
    record_count: 72,
    load_mode: "preloaded_replay",
    artifact_path: "data/deal-witness/evidence/01-maya-relationships-origination.md",
    coverage_start: "2027-01-11T09:00:00.000Z",
    coverage_end: "2027-02-28T17:00:00.000Z",
    maya_replay_role: "noticing relationship context"
  },
  {
    id: "bundle-02-economics-credit",
    title: "Economics and credit",
    record_count: 96,
    load_mode: "preloaded_replay",
    artifact_path: "data/deal-witness/evidence/02-economics-credit.md",
    coverage_start: "2027-02-05T09:00:00.000Z",
    coverage_end: "2027-04-30T17:00:00.000Z",
    maya_replay_role: "connecting economics and credit decisions"
  },
  {
    id: "bundle-03-technical-construction",
    title: "Technical and construction",
    record_count: 112,
    load_mode: "preloaded_replay",
    artifact_path: "data/deal-witness/evidence/03-technical-construction.md",
    coverage_start: "2027-03-03T09:00:00.000Z",
    coverage_end: "2027-06-25T17:00:00.000Z",
    maya_replay_role: "following technical dependencies"
  },
  {
    id: "bundle-04-authority-stakeholder-context",
    title: "Authority and stakeholder context",
    record_count: 72,
    load_mode: "preloaded_replay",
    artifact_path: "data/deal-witness/evidence/04-authority-stakeholder-context.md",
    coverage_start: "2027-04-09T09:00:00.000Z",
    coverage_end: "2027-07-30T17:00:00.000Z",
    maya_replay_role: "noticing cross-domain questions"
  },
  {
    id: "bundle-05-historical-relationships-recovery",
    title: "Historical relationships and post-departure recovery",
    record_count: 78,
    load_mode: "preloaded_replay",
    artifact_path: "data/deal-witness/evidence/05-historical-relationships-recovery.md",
    coverage_start: "2027-02-18T09:00:00.000Z",
    coverage_end: "2027-09-08T16:45:00.000Z",
    maya_replay_role: "historical provenance and relationship edges only"
  },
  {
    id: "bundle-06-financing-draft-v7",
    title: "Financing draft v7",
    record_count: 1,
    load_mode: "staged_live",
    artifact_path: "data/deal-witness/evidence/06-financing-draft-v7.md",
    coverage_start: "2027-09-09T09:12:00.000Z",
    coverage_end: "2027-09-09T09:12:00.000Z",
    maya_replay_role: null
  },
  {
    id: "bundle-07-financing-draft-v8-corrected",
    title: "Financing draft v8 corrected",
    record_count: 1,
    load_mode: "staged_live",
    artifact_path: "data/deal-witness/evidence/07-financing-draft-v8-corrected.md",
    coverage_start: "2027-09-09T15:40:00.000Z",
    coverage_end: "2027-09-09T15:40:00.000Z",
    maya_replay_role: null
  }
].map((bundle, index) => ({ ...bundle, display_order: index + 1, synthetic: true }));

const channelCounts = {
  email: 112,
  meeting_record: 56,
  call_summary: 48,
  technical_report: 40,
  financial_model_note: 40,
  counsel_markup: 36,
  authority_permit_record: 28,
  construction_update: 24,
  approval_memo: 20,
  inspection_record: 16,
  financing_draft: 11,
  external_signal: 1
};

const bundleChannelCounts = {
  "bundle-01-maya-relationships-origination": {
    email: 28,
    meeting_record: 18,
    call_summary: 18,
    counsel_markup: 4,
    authority_permit_record: 2,
    approval_memo: 2
  },
  "bundle-02-economics-credit": {
    email: 22,
    meeting_record: 10,
    call_summary: 8,
    financial_model_note: 40,
    counsel_markup: 4,
    approval_memo: 8,
    financing_draft: 4
  },
  "bundle-03-technical-construction": {
    email: 24,
    meeting_record: 10,
    call_summary: 8,
    technical_report: 40,
    authority_permit_record: 2,
    construction_update: 16,
    inspection_record: 12
  },
  "bundle-04-authority-stakeholder-context": {
    email: 18,
    meeting_record: 10,
    call_summary: 8,
    counsel_markup: 7,
    authority_permit_record: 24,
    construction_update: 2,
    approval_memo: 2,
    external_signal: 1
  },
  "bundle-05-historical-relationships-recovery": {
    email: 20,
    meeting_record: 8,
    call_summary: 6,
    counsel_markup: 21,
    construction_update: 6,
    approval_memo: 8,
    inspection_record: 4,
    financing_draft: 5
  },
  "bundle-06-financing-draft-v7": { financing_draft: 1 },
  "bundle-07-financing-draft-v8-corrected": { financing_draft: 1 }
};

const clusterDefinitions = [
  ["cluster-money-facility-pricing", "Money", "Facility & pricing", 22, ["facility margin", "commitment fee", "tenor", "interest reserve"]],
  ["cluster-money-sources-uses", "Money", "Sources & uses", 22, ["sponsor equity", "construction costs", "contingency", "capitalized interest"]],
  ["cluster-money-draw-liquidity", "Money", "Draw schedule & liquidity", 22, ["first draw", "draw forecast", "liquidity buffer", "payment sequence"]],
  ["cluster-promises-construction-completion", "Promises", "Construction & completion", 24, ["completion test", "construction milestone", "contractor obligation", "completion support"]],
  ["cluster-promises-first-draw", "Promises", "First-draw requirements", 24, ["first-draw evidence", "funding condition", "engineer certification", "release package"]],
  ["cluster-promises-reporting-controls", "Promises", "Reporting & controls", 24, ["monthly reporting", "budget control", "change approval", "record retention"]],
  ["cluster-promises-stakeholder-mitigation", "Promises", "Stakeholder & mitigation commitments", 24, ["noise mitigation", "community coordination", "operating protocol", "stakeholder notice"]],
  ["cluster-risks-delivery-cost", "Risks", "Delivery & cost", 24, ["schedule pressure", "cost escalation", "supply timing", "interface delay"]],
  ["cluster-risks-permits-community", "Risks", "Permits & community", 24, ["permit sequence", "community concern", "operating restriction", "review timing"]],
  ["cluster-risks-coordination-knowledge", "Risks", "Coordination & knowledge continuity", 24, ["departure recovery gap", "cross-team dependency", "unrecorded rationale", "contact continuity"]],
  ["cluster-decisions-credit-structure", "Decisions", "Credit & structure", 18, ["credit structure", "lender allocation", "pricing decision", "approval condition"]],
  ["cluster-decisions-design-scope", "Decisions", "Design & scope", 18, ["runway scope", "design option", "construction sequence", "technical baseline"]],
  ["cluster-decisions-release-escalation", "Decisions", "Release & escalation", 18, ["release gate", "review owner", "hold rule", "escalation path"]]
].map(([id, region, label, targetItemCount, subjects], index) => ({
  id,
  region,
  label,
  target_item_count: targetItemCount,
  subjects,
  display_order: index + 1,
  visible: true,
  density_definition: "Supported atomic items divided by total atomic items in the cluster; never an evidence-confidence score."
}));

const preferredOrganizationsByCluster = {
  "cluster-money-facility-pricing": ["org-harbor-glass", "org-cobalt-finch", "org-asterline-infrastructure"],
  "cluster-money-sources-uses": ["org-asterline-infrastructure", "org-asterline-runway", "org-harbor-glass"],
  "cluster-money-draw-liquidity": ["org-asterline-runway", "org-harbor-glass", "org-cobalt-finch"],
  "cluster-promises-construction-completion": ["org-copper-kite", "org-north-loom", "org-clearspan"],
  "cluster-promises-first-draw": ["org-harbor-glass", "org-asterline-infrastructure", "org-clearspan"],
  "cluster-promises-reporting-controls": ["org-asterline-runway", "org-harbor-glass", "org-juniper-ledger"],
  "cluster-promises-stakeholder-mitigation": ["org-asterline-infrastructure", "org-morrow-field", "org-skyvale-authority"],
  "cluster-risks-delivery-cost": ["org-copper-kite", "org-beacon-quill", "org-asterline-runway"],
  "cluster-risks-permits-community": ["org-skyvale-authority", "org-civic-aerodrome-review", "org-skyvale-community"],
  "cluster-risks-coordination-knowledge": ["org-harbor-glass", "org-asterline-runway", "org-clearspan"],
  "cluster-decisions-credit-structure": ["org-harbor-glass", "org-cobalt-finch", "org-juniper-ledger"],
  "cluster-decisions-design-scope": ["org-north-loom", "org-copper-kite", "org-skyvale-authority"],
  "cluster-decisions-release-escalation": ["org-harbor-glass", "org-juniper-ledger", "org-asterline-runway"]
};

function createAtomicItems(rng) {
  const clusterSlots = [];
  for (const cluster of clusterDefinitions) {
    let reserved = 0;
    if (cluster.id === "cluster-promises-first-draw") reserved = 2;
    if (cluster.id === "cluster-risks-permits-community") reserved = 1;
    for (let index = 0; index < cluster.target_item_count - reserved; index += 1) {
      clusterSlots.push(cluster.id);
    }
  }

  const typeSlots = [
    ...Array(72).fill("decision"),
    ...Array(107).fill("commitment"),
    ...Array(71).fill("risk"),
    ...Array(35).fill("investigation_question")
  ];
  const shuffledClusters = shuffle(clusterSlots, rng);
  const shuffledTypes = shuffle(typeSlots, rng);
  const counters = { decision: 0, commitment: 1, risk: 1, investigation_question: 1 };

  const selectedItem = {
    id: "item-commitment-001",
    type: "commitment",
    map_cluster_id: "cluster-promises-first-draw",
    label: "Noise-mitigation funding and engineer certification before first draw",
    statement: DEMONSTRATED_TERM,
    selected_for_demo: true,
    selection_context: {
      central: false,
      highest_risk: false,
      uniquely_important: false,
      explanation: "Selected only as a legible representative example among 144 contract-scoped items."
    },
    synthetic: true
  };
  const externalRiskItem = {
    id: "item-risk-001",
    type: "risk",
    map_cluster_id: "cluster-risks-permits-community",
    label: "Unverified rise in runway-noise opposition",
    statement: "Background public comments suggest rising questions about runway noise, but the signal remains unverified and cannot confirm a financing term or block release.",
    selected_for_demo: false,
    background_external_signal_only: true,
    synthetic: true
  };
  const selectedQuestionItem = {
    id: "item-investigation-question-001",
    type: "investigation_question",
    map_cluster_id: "cluster-promises-first-draw",
    label: "Which approved evidence defines the noise-mitigation first-draw requirement?",
    statement: "Which approved internal record and technical expert establish what must be funded and certified before the first construction draw?",
    selected_for_demo: false,
    synthetic: true
  };

  const items = [selectedItem, externalRiskItem, selectedQuestionItem];
  for (let index = 0; index < shuffledTypes.length; index += 1) {
    const type = shuffledTypes[index];
    const clusterId = shuffledClusters[index];
    counters[type] += 1;
    const id = `item-${type.replaceAll("_", "-")}-${pad(counters[type])}`;
    const cluster = clusterDefinitions.find((entry) => entry.id === clusterId);
    const subject = cluster.subjects[counters[type] % cluster.subjects.length];
    const ordinal = counters[type];
    const statementByType = {
      decision: `The synthetic deal team recorded decision ${pad(ordinal)} for ${subject}, subject to the cited dependencies and review path.`,
      commitment: `The responsible synthetic stakeholder committed to document ${subject} before milestone ${1 + (ordinal % 9)}.`,
      risk: `The working record identifies uncertainty around ${subject} and its possible effect on timing, cost, or release readiness.`,
      investigation_question: `The investigation asks which approved source resolves ${subject} before the next review.`
    };
    items.push({
      id,
      type,
      map_cluster_id: clusterId,
      label: `${cluster.label} · ${type.replaceAll("_", " ")} ${pad(ordinal)}`,
      statement: statementByType[type],
      selected_for_demo: false,
      synthetic: true
    });
  }

  const eligibleForContract = shuffle(
    items.filter((item) => item.id !== selectedItem.id && item.type !== "investigation_question" && clusterDefinitions.find((cluster) => cluster.id === item.map_cluster_id).region !== "Risks"),
    rng
  );
  const contractIds = new Set([selectedItem.id, ...eligibleForContract.slice(0, 143).map((item) => item.id)]);

  const forcedHeardIds = new Set([
    externalRiskItem.id,
    ...Array.from({ length: 8 }, (_, index) => `item-investigation-question-${pad(17 + index)}`)
  ]);
  const additionalHeardCandidates = shuffle(
    items.filter((item) => !contractIds.has(item.id) && !forcedHeardIds.has(item.id)),
    rng
  );
  for (const item of additionalHeardCandidates.slice(0, 44 - forcedHeardIds.size)) {
    forcedHeardIds.add(item.id);
  }

  const preferredPeopleByOrganization = new Map();
  for (const person of people) {
    if (!preferredPeopleByOrganization.has(person.organization_id)) preferredPeopleByOrganization.set(person.organization_id, []);
    preferredPeopleByOrganization.get(person.organization_id).push(person.id);
  }

  for (const item of items) {
    const organizationsForCluster = preferredOrganizationsByCluster[item.map_cluster_id];
    const responsibleOrganizationId = organizationsForCluster[seedFromString(item.id) % organizationsForCluster.length];
    const organizationPeople = preferredPeopleByOrganization.get(responsibleOrganizationId);
    item.responsible_organization_id = responsibleOrganizationId;
    item.responsible_person_id = organizationPeople[seedFromString(`${item.id}:person`) % organizationPeople.length];
    item.contract_scoped = contractIds.has(item.id);
    item.required_for_release = contractIds.has(item.id);
    item.verification_at_recovery_ready = forcedHeardIds.has(item.id) ? "heard" : "confirmed";
    item.memory_owner = "institution";
    item.preserved_after_maya_departure = true;
  }

  return items.sort((left, right) => left.id.localeCompare(right.id));
}

function createRecordSlots(rng) {
  const preloadedBundles = bundles.slice(0, 5);
  const slots = [];
  let globalIndex = 1;
  for (const bundle of preloadedBundles) {
    const channels = shuffle(
      Object.entries(bundleChannelCounts[bundle.id]).flatMap(([channel, count]) => Array(count).fill(channel)),
      rng
    );
    if (channels.length !== bundle.record_count) throw new Error(`Channel plan does not match ${bundle.id}`);
    for (let localIndex = 0; localIndex < bundle.record_count; localIndex += 1) {
      slots.push({
        index: globalIndex,
        bundle_id: bundle.id,
        local_index: localIndex + 1,
        occurred_at: interpolateTimestamp(bundle.coverage_start, bundle.coverage_end, localIndex, bundle.record_count),
        channel: channels[localIndex]
      });
      globalIndex += 1;
    }
  }

  const externalIndex = 315;
  const lockedIndexes = new Set();
  const forceChannel = (targetIndex, desiredChannel) => {
    const target = slots[targetIndex - 1];
    if (target.channel !== desiredChannel) {
      const candidate = slots.find((slot) => slot.bundle_id === target.bundle_id && !lockedIndexes.has(slot.index) && slot.channel === desiredChannel);
      if (!candidate) throw new Error(`Unable to reserve ${desiredChannel} for source ${targetIndex}`);
      [target.channel, candidate.channel] = [candidate.channel, target.channel];
      lockedIndexes.add(candidate.index);
    }
    lockedIndexes.add(targetIndex);
  };
  forceChannel(externalIndex, "external_signal");
  forceChannel(425, "call_summary");
  forceChannel(426, "email");
  forceChannel(427, "meeting_record");
  forceChannel(428, "meeting_record");
  forceChannel(429, "approval_memo");
  forceChannel(430, "meeting_record");

  slots[423].occurred_at = "2027-08-27T15:00:00.000Z";
  slots[424].occurred_at = "2027-09-06T09:00:00.000Z";
  slots[425].occurred_at = "2027-09-06T09:45:00.000Z";
  slots[426].occurred_at = "2027-09-06T09:30:00.000Z";
  slots[427].occurred_at = "2027-09-07T14:00:00.000Z";
  slots[428].occurred_at = "2027-08-31T16:20:00.000Z";
  slots[429].occurred_at = "2027-09-08T16:45:00.000Z";

  slots.push({
    index: 431,
    bundle_id: bundles[5].id,
    local_index: 1,
    occurred_at: bundles[5].coverage_start,
    channel: "financing_draft"
  });
  slots.push({
    index: 432,
    bundle_id: bundles[6].id,
    local_index: 1,
    occurred_at: bundles[6].coverage_start,
    channel: "financing_draft"
  });
  return slots;
}

function recordCapability(channel, bundleId, localIndex) {
  if (channel === "external_signal") return false;
  if (bundleId === bundles[5].id || bundleId === bundles[6].id) return false;
  if (["technical_report", "counsel_markup", "authority_permit_record", "approval_memo", "inspection_record", "financing_draft"].includes(channel)) return true;
  if (["financial_model_note", "construction_update"].includes(channel)) return localIndex % 2 === 0;
  if (bundleId === bundles[4].id && ["email", "meeting_record", "call_summary"].includes(channel)) return localIndex % 3 === 0;
  return false;
}

function createSourceRecords(rng) {
  const slots = createRecordSlots(rng);
  const organizationByPerson = new Map(people.map((person) => [person.id, person.organization_id]));
  const mayaThresholdByBundle = {
    [bundles[0].id]: 60,
    [bundles[1].id]: 48,
    [bundles[2].id]: 40,
    [bundles[3].id]: 32,
    [bundles[4].id]: 78
  };
  const involvementStages = ["noticed", "connected", "followed_up", "synthesized", "relationship_preserved"];

  const records = slots.map((slot) => {
    const sourceId = `source-${pad(slot.index, 4)}`;
    const bundle = bundles.find((entry) => entry.id === slot.bundle_id);
    const author = people[(slot.index - 1) % people.length];
    const mayaInvolved = bundle.load_mode === "preloaded_replay" && slot.local_index <= mayaThresholdByBundle[bundle.id] && Date.parse(slot.occurred_at) < Date.parse(MAYA_DEPARTED_AT);
    const secondPerson = people[(slot.index * 7) % people.length];
    const participantIds = [...new Set([
      author.id,
      secondPerson.id,
      ...(mayaInvolved ? ["person-maya-soren"] : [])
    ])];
    const organizationIds = [...new Set(participantIds.map((personId) => organizationByPerson.get(personId)))];
    const canConfirm = recordCapability(slot.channel, slot.bundle_id, slot.local_index);
    const titleChannel = slot.channel.replaceAll("_", " ");
    const record = {
      id: sourceId,
      bundle_id: slot.bundle_id,
      channel: slot.channel,
      title: `${titleChannel[0].toUpperCase()}${titleChannel.slice(1)} ${pad(slot.index, 4)}`,
      occurred_at: slot.occurred_at,
      author_person_id: author.id,
      participant_person_ids: participantIds,
      organization_ids: organizationIds,
      summary: `Synthetic ${titleChannel} record ${pad(slot.index, 4)} captures a bounded Project Asterline observation, decision, question, or commitment with a human-readable citation.`,
      citation_locator: `${sourceId}#summary`,
      synthetic: true,
      can_confirm: canConfirm,
      can_block: false,
      can_confirm_comparison_result: slot.channel === "financing_draft",
      authority_level: canConfirm ? "qualified" : "working",
      support_role: canConfirm ? "qualified_memory_source" : "context_or_initial_report",
      stored_state: bundle.load_mode === "preloaded_replay" ? "preload_ready" : "staged_live",
      presentation_mode: bundle.load_mode === "preloaded_replay" ? "stored_fixture_metadata_replay" : "staged_live_write",
      replay_order: bundle.load_mode === "preloaded_replay" ? slot.index : null,
      performs_live_write_during_replay: false,
      maya_involvement: mayaInvolved ? involvementStages[(slot.local_index - 1) % involvementStages.length] : null
    };
    if (slot.channel === "external_signal") {
      record.title = "Synthetic civic bulletin: questions about runway-noise mitigation";
      record.author_person_id = "person-selah-reed";
      record.participant_person_ids = ["person-selah-reed", "person-milo-hart"];
      record.organization_ids = ["org-skyvale-community"];
      record.summary = "A wholly invented public-comment digest reports rising questions about how the fictional project will fund runway-noise mitigation. It is background context only.";
      record.can_confirm = false;
      record.can_block = false;
      record.authority_level = "background";
      record.support_role = "raises_investigation_question_only";
      record.narrative_prominence = "background";
      record.external_signal = {
        synthetic_notice: SYNTHETIC_NOTICE,
        invented_outlet: "Skyvale Civic Bulletin",
        invented_headline: "Neighbors ask how Asterline runway works will fund quieter operations",
        invented_public_figure: "Selah Reed, synthetic community-forum chair",
        invented_location: "North Apron District",
        invented_quote: "People want to see what is funded before the work begins.",
        invented_sentiment_measure: {
          label: "rising concern",
          score: 0.68,
          analytical_authority: "none"
        }
      };
    }
    return record;
  });

  const setSpecialRecord = (index, values) => {
    Object.assign(records[index - 1], values);
    const participantIds = values.participant_person_ids ?? records[index - 1].participant_person_ids;
    records[index - 1].organization_ids = [...new Set(participantIds.map((personId) => organizationByPerson.get(personId)))];
  };
  setSpecialRecord(424, {
    title: "Historical Maya relationship edge to engineering and credit owners",
    author_person_id: "person-maya-soren",
    participant_person_ids: ["person-maya-soren", "person-ada-rook", "person-ren-ito"],
    summary: "Historical institution-owned relationship memory shows that Maya repeatedly worked with Ada Rook on independent-engineer evidence and Ren Ito on approved credit conditions. It is a routing receipt, not the technical or approval fact itself.",
    can_confirm: false,
    authority_level: "historical_relationship",
    support_role: "historical_routing_evidence"
  });
  setSpecialRecord(425, {
    title: "Monday recovery exposes an unfinished first-draw path",
    author_person_id: "person-talia-wren",
    participant_person_ids: ["person-talia-wren", "person-marc-ives"],
    summary: "With Maya already gone, the stored evidence shows that noise mitigation is connected to first-draw readiness but does not yet reveal the controlling condition, certifier, or approval receipt.",
    can_confirm: false,
    authority_level: "working",
    support_role: "heard_gap"
  });
  setSpecialRecord(426, {
    title: "Ada Rook's initial vague reply does not close the gap",
    author_person_id: "person-ada-rook",
    participant_person_ids: ["person-ada-rook", "person-noel-brant"],
    summary: "The prepared reply says only, ‘The budget is covered.’ It does not cite the funding schedule, approved release condition, or certification package, so the path remains hollow.",
    can_confirm: false,
    authority_level: "working",
    support_role: "insufficient_answer",
    prepared_interaction: true,
    live_outreach: false
  });
  setSpecialRecord(427, {
    title: "Prepared evidence-grounded question to Ada Rook",
    author_person_id: null,
    participant_person_ids: ["person-ada-rook"],
    summary: "Deal Witness cites the unfinished first-draw path, historical Maya-to-Ada relationship edge, and known technical receipts, then asks Ada what must be funded and certified before release and which source controls.",
    can_confirm: false,
    authority_level: "prepared_question",
    support_role: "evidence_grounded_question",
    prepared_interaction: true,
    live_outreach: false,
    simulated_call: true,
    synchronized_transcript: true,
    silent_fallback: "prepared transcript and provenance panel"
  });
  setSpecialRecord(428, {
    title: "Ada Rook substantive sourced engineering answer",
    author_person_id: "person-ada-rook",
    participant_person_ids: ["person-ada-rook", "person-noel-brant"],
    summary: "Ada Rook cites the independent-engineer certification package and confirms that certification must show the sponsor's noise-mitigation budget is fully funded before first draw.",
    can_confirm: true,
    authority_level: "expert_confirmation",
    support_role: "substantive_human_confirmation",
    prepared_interaction: true,
    live_outreach: false
  });
  setSpecialRecord(429, {
    title: "Ren Ito approved committee record",
    author_person_id: "person-ren-ito",
    participant_person_ids: ["person-ren-ito", "person-celia-north"],
    summary: DEMONSTRATED_TERM,
    can_confirm: true,
    authority_level: "approved_internal",
    support_role: "approved_internal_record",
    maya_involvement: null,
    retrieved_at: "2027-09-08T10:00:00.000Z"
  });
  setSpecialRecord(430, {
    title: "EverOS post-departure memory-completion capture",
    author_person_id: "person-ada-rook",
    participant_person_ids: ["person-ada-rook", "person-ren-ito"],
    summary: "EverOS stores the post-departure answer, attribution, timestamps, vague non-answer, expert receipt, approved internal record, synchronized transcript citations, and reusable investigation recipe.",
    can_confirm: false,
    authority_level: "derived_memory_capture",
    support_role: "memory_completion_capture",
    prepared_interaction: true,
    live_outreach: false
  });
  setSpecialRecord(431, {
    title: "Financing draft v7",
    author_person_id: "person-mira-stone",
    participant_person_ids: ["person-mira-stone", "person-devon-lake", "person-ren-ito"],
    summary: "The first staged-live synthetic financing draft contains 143 of 144 expected contract-scoped items and omits the selected example.",
    can_confirm: false,
    authority_level: "contract_version",
    support_role: "direct_contract_comparison",
    contract_version: 7
  });
  setSpecialRecord(432, {
    title: "Financing draft v8 corrected",
    author_person_id: "person-mira-stone",
    participant_person_ids: ["person-mira-stone", "person-devon-lake", "person-ren-ito"],
    summary: `The second staged-live synthetic financing draft contains all 144 expected items, including: ${DEMONSTRATED_TERM}`,
    can_confirm: false,
    authority_level: "contract_version",
    support_role: "direct_contract_comparison",
    contract_version: 8
  });

  return records;
}

function createProvenanceLinks(items, records, rng) {
  const preloadedRecords = records.filter((record) => record.stored_state === "preload_ready");
  const itemById = new Map(items.map((item) => [item.id, item]));
  const shuffledItemIds = shuffle(items.map((item) => item.id), rng);
  const targetDegree = new Map();
  shuffledItemIds.forEach((itemId, index) => {
    targetDegree.set(itemId, index < 72 ? 2 : index < 216 ? 3 : 4);
  });
  const swapDegree = (itemId, desiredDegree) => {
    if (targetDegree.get(itemId) === desiredDegree) return;
    const otherId = [...targetDegree].find(([candidateId, degree]) => degree === desiredDegree && !["item-commitment-001", "item-risk-001"].includes(candidateId))?.[0];
    if (!otherId) throw new Error(`Unable to reserve provenance degree ${desiredDegree}`);
    const current = targetDegree.get(itemId);
    targetDegree.set(itemId, desiredDegree);
    targetDegree.set(otherId, current);
  };
  swapDegree("item-commitment-001", 4);
  swapDegree("item-risk-001", 2);

  const sourceCapacity = new Map(preloadedRecords.map((record, index) => [record.id, index < 4 ? 3 : 2]));
  const linkedSourcesByItem = new Map(items.map((item) => [item.id, new Set()]));
  const edges = [];
  const addEdge = (itemId, sourceId, forcedEffect = null) => {
    if (sourceCapacity.get(sourceId) <= 0) return false;
    if (linkedSourcesByItem.get(itemId).has(sourceId)) return false;
    linkedSourcesByItem.get(itemId).add(sourceId);
    sourceCapacity.set(sourceId, sourceCapacity.get(sourceId) - 1);
    edges.push({ item_id: itemId, source_record_id: sourceId, forced_effect: forcedEffect });
    return true;
  };

  const selectedSources = [
    ["source-0425", "heard"],
    ["source-0428", "confirms"],
    ["source-0429", "confirms"],
    ["source-0430", "supports"]
  ];
  for (const [sourceId, effect] of selectedSources) addEdge("item-commitment-001", sourceId, effect);
  addEdge("item-risk-001", "source-0315", "raises_question");

  const confirmingSources = preloadedRecords.filter((record) => record.can_confirm && !["source-0428", "source-0429", "source-0430"].includes(record.id));
  const nonConfirmingSources = preloadedRecords.filter((record) => !record.can_confirm && record.channel !== "external_signal");
  let confirmingCursor = 0;
  let nonConfirmingCursor = 0;
  for (const item of items) {
    if (item.id === "item-commitment-001" || item.id === "item-risk-001") continue;
    const candidates = item.verification_at_recovery_ready === "confirmed" ? confirmingSources : nonConfirmingSources;
    let cursor = item.verification_at_recovery_ready === "confirmed" ? confirmingCursor : nonConfirmingCursor;
    let added = false;
    for (let attempt = 0; attempt < candidates.length; attempt += 1) {
      const source = candidates[(cursor + attempt) % candidates.length];
      if (addEdge(item.id, source.id, item.verification_at_recovery_ready === "confirmed" ? "confirms" : "heard")) {
        cursor += attempt + 1;
        added = true;
        break;
      }
    }
    if (!added) throw new Error(`Unable to seed provenance for ${item.id}`);
    if (item.verification_at_recovery_ready === "confirmed") confirmingCursor = cursor;
    else nonConfirmingCursor = cursor;
  }

  const remainingItemSlots = [];
  for (const item of items) {
    const remaining = targetDegree.get(item.id) - linkedSourcesByItem.get(item.id).size;
    for (let index = 0; index < remaining; index += 1) remainingItemSlots.push(item.id);
  }
  const remainingSourceSlots = [];
  for (const [sourceId, capacity] of sourceCapacity) {
    for (let index = 0; index < capacity; index += 1) remainingSourceSlots.push(sourceId);
  }
  const shuffledSourceSlots = shuffle(remainingSourceSlots, rng).sort((left, right) => {
    const leftRecord = records[Number(left.slice(-4)) - 1];
    const rightRecord = records[Number(right.slice(-4)) - 1];
    return Number(rightRecord.can_confirm) - Number(leftRecord.can_confirm);
  });

  for (const sourceId of shuffledSourceSlots) {
    const source = records[Number(sourceId.slice(-4)) - 1];
    const validIndexes = [];
    for (let index = 0; index < remainingItemSlots.length; index += 1) {
      const itemId = remainingItemSlots[index];
      const item = itemById.get(itemId);
      if (linkedSourcesByItem.get(itemId).has(sourceId)) continue;
      if (item.verification_at_recovery_ready === "heard" && source.can_confirm) continue;
      if (source.channel === "external_signal") {
        const region = clusterDefinitions.find((cluster) => cluster.id === item.map_cluster_id).region;
        if (region !== "Risks" && item.type !== "investigation_question") continue;
      }
      validIndexes.push(index);
    }
    if (validIndexes.length === 0) throw new Error(`Unable to place provenance slot for ${sourceId}`);
    const chosenListIndex = validIndexes[Math.floor(rng() * validIndexes.length)];
    const [itemId] = remainingItemSlots.splice(chosenListIndex, 1);
    addEdge(itemId, sourceId);
  }
  if (remainingItemSlots.length !== 0) throw new Error(`Unfilled item provenance slots: ${remainingItemSlots.length}`);

  const edgesByItem = new Map(items.map((item) => [item.id, []]));
  for (const edge of edges) edgesByItem.get(edge.item_id).push(edge);
  for (const item of items) {
    const itemEdges = edgesByItem.get(item.id).sort((left, right) => left.source_record_id.localeCompare(right.source_record_id));
    let confirmedAssigned = itemEdges.some((edge) => edge.forced_effect === "confirms");
    for (const edge of itemEdges) {
      const source = records[Number(edge.source_record_id.slice(-4)) - 1];
      let effect = edge.forced_effect;
      if (!effect) {
        if (item.verification_at_recovery_ready === "heard") effect = source.channel === "external_signal" ? "raises_question" : "heard";
        else if (!confirmedAssigned && source.can_confirm) {
          effect = "confirms";
          confirmedAssigned = true;
        } else effect = source.can_confirm ? "supports" : "heard";
      }
      edge.effect = effect;
      edge.citation_locator = source.citation_locator;
      edge.active = true;
      delete edge.forced_effect;
    }
    if (item.verification_at_recovery_ready === "confirmed" && !itemEdges.some((edge) => edge.effect === "confirms")) {
      throw new Error(`Confirmed item lacks confirming provenance: ${item.id}`);
    }
    const timestamps = itemEdges
      .map((edge) => {
        const record = records[Number(edge.source_record_id.slice(-4)) - 1];
        return record.retrieved_at ?? record.occurred_at;
      })
      .sort();
    item.first_observed_at = timestamps[0];
    item.last_supported_at = timestamps.at(-1);
  }

  return edges
    .sort((left, right) => left.item_id.localeCompare(right.item_id) || left.source_record_id.localeCompare(right.source_record_id))
    .map((edge, index) => ({ id: `provenance-${pad(index + 1, 4)}`, ...edge }));
}

function createRelationships(items, provenanceLinks) {
  const itemsBySource = new Map();
  for (const link of provenanceLinks) {
    if (!itemsBySource.has(link.source_record_id)) itemsBySource.set(link.source_record_id, []);
    itemsBySource.get(link.source_record_id).push(link.item_id);
  }
  const relationshipTypes = ["depends_on", "constrains", "answers", "creates_risk_for"];
  const relationships = [];
  for (const item of items) {
    const candidateByTarget = new Map();
    for (const link of provenanceLinks.filter((entry) => entry.item_id === item.id)) {
      for (const targetId of itemsBySource.get(link.source_record_id)) {
        if (targetId === item.id || candidateByTarget.has(targetId)) continue;
        candidateByTarget.set(targetId, link.source_record_id);
      }
    }
    const candidates = [...candidateByTarget.entries()].sort(([left], [right]) => left.localeCompare(right));
    if (candidates.length < 2) throw new Error(`Item ${item.id} lacks two source-backed relationship targets`);
    for (let index = 0; index < 2; index += 1) {
      const [targetId, sourceId] = candidates[(seedFromString(item.id) + index) % candidates.length];
      relationships.push({
        id: `relationship-${pad(relationships.length + 1, 4)}`,
        from_item_id: item.id,
        to_item_id: targetId,
        type: relationshipTypes[relationships.length % relationshipTypes.length],
        basis_record_id: sourceId,
        synthetic: true
      });
    }
  }
  const historicalRelationshipItems = itemsBySource.get("source-0424") ?? [];
  if (historicalRelationshipItems.length >= 2) {
    for (let index = 0; index < 2; index += 1) {
      const fromId = historicalRelationshipItems[index];
      const toId = historicalRelationshipItems[(index + 1) % historicalRelationshipItems.length];
      const relationship = relationships.find((entry) => entry.from_item_id === fromId);
      relationship.to_item_id = toId;
      relationship.type = index === 0 ? "depends_on" : "answers";
      relationship.basis_record_id = "source-0424";
    }
  }
  return relationships;
}

function createExpertCandidates(itemRelationships) {
  const relationshipBasisIds = itemRelationships
    .filter((relationship) => relationship.basis_record_id === "source-0424")
    .map((relationship) => relationship.id)
    .slice(0, 4);
  return {
    id: "expert-ranking-selected-example",
    selected_example_item_id: "item-commitment-001",
    display_surface: "who_knows_what_side_panel",
    deal_map_region: null,
    is_fifth_deal_map_region: false,
    generated_from: "deterministic historical evidence, person-role metadata, and relationship memory",
    provider_generated_concepts_used: false,
    maya_status: {
      person_id: "person-maya-soren",
      departed_at: MAYA_DEPARTED_AT,
      candidate_for_contact: false,
      historical_relationship_basis_record_id: "source-0424"
    },
    ranked_candidates: [
      {
        rank: 1,
        person_id: "person-ada-rook",
        organization_id: "org-clearspan",
        role: "independent-engineering director",
        subject_areas: ["independent-engineer certification", "noise-mitigation funding evidence", "first-draw technical package"],
        prepared_contact_channel: "prepared_simulated_call",
        capabilities: {
          likely_knows: true,
          can_provide_evidence: true,
          can_certify: true,
          authorized_to_confirm: true,
          authorized_to_approve: false
        },
        why_this_person: "Historical Maya relationship evidence links Ada to the certification path; her earlier technical authorship identifies Clearspan as the independent engineer; Ada can provide and certify engineering evidence.",
        evidence_basis_record_ids: ["source-0169", "source-0424", "source-0425"],
        relationship_basis_ids: relationshipBasisIds
      },
      {
        rank: 2,
        person_id: "person-ren-ito",
        organization_id: "org-harbor-glass",
        role: "credit committee chair",
        subject_areas: ["approved credit conditions", "release authorization", "committee records"],
        prepared_contact_channel: "prepared_transcript",
        capabilities: {
          likely_knows: true,
          can_provide_evidence: true,
          can_certify: false,
          authorized_to_confirm: true,
          authorized_to_approve: true
        },
        why_this_person: "Historical Maya relationship evidence and Ren's participation in an earlier approval record link him to credit decisions. He can own approval evidence but cannot issue the engineering certification.",
        evidence_basis_record_ids: ["source-0356", "source-0424"],
        relationship_basis_ids: relationshipBasisIds
      },
      {
        rank: 3,
        person_id: "person-talia-wren",
        organization_id: "org-asterline-runway",
        role: "project-controls lead",
        subject_areas: ["project controls", "draw coordination context"],
        prepared_contact_channel: "prepared_transcript",
        capabilities: {
          likely_knows: true,
          can_provide_evidence: false,
          can_certify: false,
          authorized_to_confirm: false,
          authorized_to_approve: false
        },
        why_this_person: "Talia appears in working project-control records and can explain context, but the receipts do not show authority to confirm, approve, or certify the term.",
        evidence_basis_record_ids: ["source-0425"],
        relationship_basis_ids: []
      }
    ],
    selected_contact_person_id: "person-ada-rook",
    selection_reason: "Highest source-backed fit for certification evidence; selection is based on capabilities and receipts, not source volume.",
    synthetic: true
  };
}

function createInvestigationPaths(items, provenanceLinks, records) {
  const questions = items.filter((item) => item.type === "investigation_question").sort((left, right) => left.id.localeCompare(right.id));
  const confirmedItems = items.filter((item) => item.verification_at_recovery_ready === "confirmed" && item.type !== "investigation_question" && item.responsible_person_id !== "person-maya-soren");
  const heardItems = items.filter((item) => item.verification_at_recovery_ready === "heard" && item.type !== "investigation_question");
  const linksByItem = new Map(items.map((item) => [item.id, []]));
  for (const link of provenanceLinks) linksByItem.get(link.item_id).push(link);
  const paths = [];

  paths.push({
    id: "investigation-path-001",
    selected_for_demo: true,
    question_item_id: "item-investigation-question-001",
    originating_risk_item_id: "item-risk-001",
    resolved_item_id: "item-commitment-001",
    status: "completed",
    gap_state_before: "hollow",
    gap_state_after: "source_backed_human_confirmed",
    prepared_interaction: true,
    live_outreach: false,
    question: "The stored receipts connect noise mitigation to first draw but do not show the approved funding and certification condition. Ada, what must be funded and certified before release, and which source controls?",
    maya_historical_relationship_basis: {
      person_id: "person-maya-soren",
      source_record_id: "source-0424",
      historical_only: true,
      available_for_contact: false,
      purpose: "Shows whom Maya trusted for engineering evidence and credit approval; it does not establish the financing term."
    },
    expert_ranking_id: "expert-ranking-selected-example",
    initial_non_answer: {
      source_record_id: "source-0426",
      attributed_to_person_id: "person-ada-rook",
      answer: "The budget is covered.",
      sufficient_to_close_gap: false,
      reason: "No funding schedule, approved release condition, certification receipt, or citation."
    },
    substantive_answer: {
      text: DEMONSTRATED_TERM,
      attributed_to_person_ids: ["person-ada-rook", "person-ren-ito"],
      receipt_source_record_ids: ["source-0428", "source-0429"],
      sufficient_to_close_gap: true
    },
    prepared_outreach: {
      contact_person_id: "person-ada-rook",
      channel: "prepared_simulated_call",
      label: "Prepared / simulated — no real dialing or messaging",
      real_dialing: false,
      calendar_action: false,
      meeting_platform_action: false,
      messaging_action: false,
      synchronized_transcript_and_provenance: true,
      silent_fallback: "prepared transcript and provenance panel",
      transcript_source_record_ids: ["source-0427", "source-0426", "source-0428"]
    },
    steps: [
      { kind: "noticed", at: "2027-07-12T12:00:00.000Z", source_record_ids: ["source-0315"], result: "background signal raises a question only" },
      { kind: "gap_exposed", at: "2027-09-06T09:00:00.000Z", source_record_ids: ["source-0425"], result: "hollow path remains HEARD after Maya has gone" },
      { kind: "searched_historical_memory", at: "2027-09-06T09:10:00.000Z", source_record_ids: ["source-0424", "source-0425"], result: "historical evidence and relationship edges identify candidate experts" },
      { kind: "ranked_experts", at: "2027-09-06T09:20:00.000Z", source_record_ids: ["source-0424", "source-0425"], result: "Ada Rook ranks first with source-backed Why this person reasoning" },
      { kind: "prepared_question", at: "2027-09-06T09:30:00.000Z", source_record_ids: ["source-0427"], person_ids: ["person-ada-rook"], result: "prepared simulated outreach asks a receipt-grounded question" },
      { kind: "insufficient_answer", at: "2027-09-06T09:45:00.000Z", source_record_ids: ["source-0426"], person_ids: ["person-ada-rook"], result: "vague reply leaves the gap open" },
      { kind: "confirmed", at: "2027-09-08T10:00:00.000Z", source_record_ids: ["source-0428", "source-0429"], person_ids: ["person-ada-rook", "person-ren-ito"], result: "substantive answer and approved receipt close the gap" },
      { kind: "captured", at: "2027-09-08T16:45:00.000Z", source_record_ids: ["source-0430"], person_ids: ["person-ada-rook", "person-ren-ito"], result: "EverOS stores answer, attribution, receipts, timestamps, citations, transcript, and recipe" }
    ],
    investigation_recipe: {
      trigger: "supported cluster contains an unresolved dependency path",
      question_pattern: "State the known receipts, name the missing fact, ask who owns it, and request the controlling source.",
      closure_rule: "Do not close on a vague or unattributed answer; require a substantive answer plus a qualifying receipt.",
      stored_in: "EverOS",
      reusable: true
    },
    institution_owned: true,
    preserved_after_maya_departure: true
  });

  for (let index = 1; index < 24; index += 1) {
    const question = questions[index];
    const completed = index < 16;
    const candidateItem = completed
      ? confirmedItems[(index * 7) % confirmedItems.length]
      : heardItems[(index * 7) % heardItems.length];
    const sourceLinks = linksByItem.get(candidateItem.id).sort((left, right) => left.source_record_id.localeCompare(right.source_record_id));
    const confirmingLink = completed ? sourceLinks.find((link) => link.effect === "confirms") : null;
    if (completed && !confirmingLink) throw new Error(`Completed path candidate lacks confirming provenance: ${candidateItem.id}`);
    const selectedLinks = completed
      ? [...sourceLinks.filter((link) => link.id !== confirmingLink.id).slice(0, 2), confirmingLink]
      : sourceLinks.filter((link) => ["heard", "raises_question"].includes(link.effect)).slice(0, 2);
    if (selectedLinks.length === 0) throw new Error(`Investigation path candidate lacks usable provenance: ${candidateItem.id}`);
    const sourceIds = selectedLinks.map((link) => link.source_record_id);
    const availableAt = (sourceId) => {
      const record = records[Number(sourceId.slice(-4)) - 1];
      return record.retrieved_at ?? record.occurred_at;
    };
    const noticedAt = availableAt(sourceIds[0]);
    const searchedAt = new Date(Math.max(Date.parse(noticedAt), Date.parse(availableAt(sourceIds[Math.min(1, sourceIds.length - 1)])))).toISOString();
    const closeAt = new Date(Math.max(...sourceIds.map((sourceId) => Date.parse(availableAt(sourceId))))).toISOString();
    paths.push({
      id: `investigation-path-${pad(index + 1)}`,
      selected_for_demo: false,
      question_item_id: question.id,
      originating_risk_item_id: null,
      resolved_item_id: completed ? candidateItem.id : null,
      status: completed ? "completed" : "open",
      gap_state_before: "hollow",
      gap_state_after: completed ? "source_backed_human_confirmed" : "hollow",
      prepared_interaction: true,
      live_outreach: false,
      question: question.statement,
      steps: completed
        ? [
            { kind: "noticed", at: noticedAt, source_record_ids: [sourceIds[0]], result: "gap exposed" },
            { kind: "searched_historical_memory", at: searchedAt, source_record_ids: [sourceIds[Math.min(1, sourceIds.length - 1)]], result: "historical evidence identifies an accountable expert path" },
            { kind: "contacted_expert", at: closeAt, source_record_ids: [sourceIds.at(-1)], person_ids: [candidateItem.responsible_person_id], result: "prepared non-Maya expert interaction" },
            { kind: "confirmed", at: closeAt, source_record_ids: [sourceIds.at(-1)], person_ids: [candidateItem.responsible_person_id], result: "qualifying evidence closes the gap" },
            { kind: "captured", at: closeAt, source_record_ids: [sourceIds.at(-1)], result: "EverOS stores the answer, receipts, and recipe" }
          ]
        : [
            { kind: "noticed", at: noticedAt, source_record_ids: [sourceIds[0]], result: "gap exposed" },
            { kind: "insufficient_answer", at: closeAt, source_record_ids: [sourceIds.at(-1)], result: "gap remains open" }
          ],
      substantive_answer: completed
        ? {
            text: candidateItem.statement,
            attributed_to_person_ids: [candidateItem.responsible_person_id],
            receipt_source_record_ids: [sourceIds.at(-1)],
            sufficient_to_close_gap: true
          }
        : null,
      investigation_recipe: {
        trigger: "hollow source path",
        closure_rule: "Require a substantive attributed answer and qualifying receipt.",
        stored_in: "EverOS",
        reusable: true
      },
      institution_owned: true,
      preserved_after_maya_departure: true
    });
  }
  return paths;
}

function createContractMatchResults(items) {
  const contractItems = items.filter((item) => item.contract_scoped).sort((left, right) => left.id.localeCompare(right.id));
  const results = [];
  for (const [draftSourceId, version] of [["source-0431", 7], ["source-0432", 8]]) {
    for (const [index, item] of contractItems.entries()) {
      const missing = version === 7 && item.selected_for_demo;
      results.push({
        id: `contract-match-v${version}-${pad(index + 1)}`,
        draft_source_record_id: draftSourceId,
        item_id: item.id,
        match_state: missing ? "missing" : "matched",
        connection_state: missing ? "broken" : version === 8 && item.selected_for_demo ? "repaired" : "intact",
        required_for_release: item.required_for_release,
        selected_for_demo: item.selected_for_demo,
        match_locator: missing ? null : `${draftSourceId}#term-${pad(index + 1)}`,
        comparison_mode: "deterministic_fixture",
        can_block: missing && item.required_for_release && item.verification_at_recovery_ready === "confirmed"
      });
    }
  }
  return results;
}

function createReplayFrames(items, records, provenanceLinks, investigationPaths) {
  const preloaded = records.filter((record) => record.stored_state === "preload_ready").sort((left, right) => left.replay_order - right.replay_order);
  const itemById = new Map(items.map((item) => [item.id, item]));
  const linksBySource = new Map(preloaded.map((record) => [record.id, []]));
  for (const link of provenanceLinks) linksBySource.get(link.source_record_id).push(link);
  const seenItems = new Set();
  const populatedClusters = new Set();
  const revealedEffectsByItem = new Map();
  const pathFirstOrder = new Map();
  const pathCompletionOrder = new Map();
  for (const investigationPath of investigationPaths) {
    const sourceOrders = investigationPath.steps
      .flatMap((step) => step.source_record_ids)
      .map((sourceId) => records[Number(sourceId.slice(-4)) - 1]?.replay_order)
      .filter(Boolean);
    pathFirstOrder.set(investigationPath.id, Math.min(...sourceOrders));
    const completionSources = investigationPath.steps
      .filter((step) => ["confirmed", "captured", "handed_off"].includes(step.kind))
      .flatMap((step) => step.source_record_ids)
      .map((sourceId) => records[Number(sourceId.slice(-4)) - 1]?.replay_order)
      .filter(Boolean);
    pathCompletionOrder.set(investigationPath.id, completionSources.length ? Math.max(...completionSources) : null);
  }

  let visibleLinkCount = 0;
  const frames = [];
  for (const record of preloaded) {
    const newLinks = linksBySource.get(record.id);
    visibleLinkCount += newLinks.length;
    for (const link of newLinks) {
      seenItems.add(link.item_id);
      populatedClusters.add(itemById.get(link.item_id).map_cluster_id);
      if (!revealedEffectsByItem.has(link.item_id)) revealedEffectsByItem.set(link.item_id, []);
      revealedEffectsByItem.get(link.item_id).push(link.effect);
    }
    let heard = 0;
    let confirmed = 0;
    for (const effects of revealedEffectsByItem.values()) {
      if (effects.includes("confirms")) confirmed += 1;
      else heard += 1;
    }
    const visiblePaths = investigationPaths.filter((entry) => pathFirstOrder.get(entry.id) <= record.replay_order);
    const completedPaths = visiblePaths.filter((entry) => pathCompletionOrder.get(entry.id) !== null && pathCompletionOrder.get(entry.id) <= record.replay_order);
    frames.push({
      replay_order: record.replay_order,
      source_record_id: record.id,
      replay_offset_ms: (record.replay_order - 1) * 14,
      presentation_mode: "stored_fixture_metadata_replay",
      performs_live_write: false,
      channel: record.channel,
      bundle_id: record.bundle_id,
      counters: {
        records_visible: record.replay_order,
        provenance_links_visible: visibleLinkCount,
        atomic_items_visible: seenItems.size,
        clusters_visible: populatedClusters.size,
        heard_visible: heard,
        confirmed_visible: confirmed,
        hollow_paths_visible: visiblePaths.length - completedPaths.length,
        completed_investigation_paths_visible: completedPaths.length
      },
      checkpoint: [72, 168, 280, 352, 430].includes(record.replay_order)
    });
  }
  return frames;
}

function createExpectedState(manifest, items, clusters, contractResults, investigationPaths) {
  const selected = items.find((item) => item.selected_for_demo);
  const v7Missing = contractResults.filter((result) => result.draft_source_record_id === "source-0431" && result.match_state === "missing");
  const v8Missing = contractResults.filter((result) => result.draft_source_record_id === "source-0432" && result.match_state === "missing");
  return {
    schema_version: "2.0.0",
    fixture_id: "deal-witness-airport-canonical-v2",
    generated_by: {
      version: GENERATOR_VERSION,
      seed: GENERATOR_SEED,
      dataset_sha256: manifest.dataset_sha256
    },
    synthetic: true,
    fiction_notice: SYNTHETIC_NOTICE,
    scenario: {
      project_name: "Project Asterline",
      project_site: "Asterline Gateway",
      financing_type: "private credit",
      facility_amount_minor_units: 38000000000,
      currency: "USD",
      corpus_start: "2027-01-11T09:00:00.000Z",
      maya_departed_at: MAYA_DEPARTED_AT,
      recovery_started_at: "2027-09-06T09:00:00.000Z",
      recovery_completed_at: "2027-09-08T16:45:00.000Z",
      draft_v7_at: "2027-09-09T09:12:00.000Z",
      draft_v8_at: "2027-09-09T15:40:00.000Z",
      scheduled_close_at: "2027-09-10T10:00:00.000Z"
    },
    corpus_manifest_path: "data/deal-witness/corpus/manifest.json",
    everos_runtime_observation_path: "data/deal-witness/everos-runtime-observation.json",
    everos_operational_gate_path: "data/deal-witness/everos-operational-gate.json",
    language_contract: {
      demonstrated_term: DEMONSTRATED_TERM,
      missing_connection_label: "Remembered, but missing from draft",
      selected_example_copy: "Selected example · 1 of 144 contract-scoped items",
      human_value_copy: "Deal Witness preserves the institution-owned evidence and connections Maya built; it does not replace her judgment, curiosity, relationships, or synthesis."
    },
    state_definitions: {
      verification_states: ["heard", "confirmed", "in_contract"],
      contract_match_states: ["not_checked", "matched", "missing"],
      connection_states: ["pending", "intact", "broken", "repaired", "none"],
      deal_statuses: [
        { id: "ready", display: "READY", meaning: "No unresolved fixture blocker; not authority to close, fund, or release money." },
        { id: "hold_for_review", display: "HOLD FOR REVIEW", meaning: "A confirmed required item is missing from the checked draft and needs human review." }
      ]
    },
    map_contract: {
      cluster_count: clusters.length,
      stable_cluster_ids_across_snapshots: true,
      region_order: ["Money", "Promises", "Risks", "Decisions"],
      atomic_item_count: items.length,
      selected_example_item_id: selected.id,
      selected_example_is_central: false,
      selected_example_is_highest_risk: false,
      selected_example_is_uniquely_important: false
    },
    replay_contract: {
      label: "Replaying 430 deterministic preload-ready fixture records",
      preloaded_record_count: 430,
      staged_live_record_count: 2,
      formal_snapshot_count: 3,
      presentation_mode: "stored_fixture_metadata_replay",
      performs_live_api_writes: false,
      provider_persistence_claimed: false,
      everos_bulk_load_allowed: false,
      everos_operational_gate_path: "data/deal-witness/everos-operational-gate.json",
      first_visual_priority: "Evidence River fills provenance, reveals hollow paths, and compresses 288 items into 13 clusters."
    },
    memory_completion_contract: {
      active_agent_not_passive_archive: true,
      selected_investigation_path_id: "investigation-path-001",
      loop: [
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
      ],
      maya_contact_allowed: false,
      selected_contact_person_id: "person-ada-rook",
      expert_ranking_path: "data/deal-witness/corpus/expert-candidates.json",
      prepared_interaction: true,
      live_outreach: false,
      voice_stack_required: false,
      everos_capture_fields: ["answer", "attribution", "timestamps", "receipts", "citations", "investigation_recipe"],
      open_path_count: investigationPaths.filter((entry) => entry.status === "open").length,
      completed_path_count: investigationPaths.filter((entry) => entry.status === "completed").length
    },
    who_knows_what_contract: {
      display_surface: "side_panel",
      deal_map_region: null,
      is_fifth_deal_map_region: false,
      candidate_count_for_selected_example: 3,
      required_fields: [
        "person_id",
        "organization_id",
        "role",
        "subject_areas",
        "prepared_contact_channel",
        "evidence_basis_record_ids",
        "why_this_person",
        "likely_knows",
        "can_provide_evidence",
        "can_certify",
        "authorized_to_confirm",
        "authorized_to_approve"
      ],
      selected_candidate_person_id: "person-ada-rook",
      maya_is_historical_only: true
    },
    snapshots: [
      {
        id: "post_departure_recovery_ready",
        at: "2027-09-08T16:45:00.000Z",
        active_contract_source_record_id: null,
        deal_status_id: "ready",
        deal_status_display: "READY",
        state_counts: { heard: 44, confirmed: 244, in_contract: 0 },
        contract_results: { not_checked: 144, matched: 0, missing: 0 },
        blocking_item_ids: [],
        selected_example_state: { verification_state: "confirmed", contract_match_state: "not_checked", connection_state: "pending" },
        preserved_memory_provenance_link_count: 864
      },
      {
        id: "draft_v7_reviewed",
        at: "2027-09-09T09:12:00.000Z",
        active_contract_source_record_id: "source-0431",
        deal_status_id: "hold_for_review",
        deal_status_display: "HOLD FOR REVIEW",
        state_counts: { heard: 44, confirmed: 101, in_contract: 143 },
        contract_results: { not_checked: 0, matched: 143, missing: v7Missing.length },
        blocking_item_ids: v7Missing.filter((result) => result.can_block).map((result) => result.item_id),
        selected_example_state: { verification_state: "confirmed", contract_match_state: "missing", connection_state: "broken" },
        preserved_memory_provenance_link_count: 864
      },
      {
        id: "draft_v8_reviewed",
        at: "2027-09-09T15:40:00.000Z",
        active_contract_source_record_id: "source-0432",
        deal_status_id: "ready",
        deal_status_display: "READY",
        state_counts: { heard: 44, confirmed: 100, in_contract: 144 },
        contract_results: { not_checked: 0, matched: 144, missing: v8Missing.length },
        blocking_item_ids: [],
        selected_example_state: { verification_state: "in_contract", contract_match_state: "matched", connection_state: "repaired" },
        preserved_memory_provenance_link_count: 864
      }
    ],
    status_transitions: [
      { event: "post_departure_memory_completed", from_status_id: null, to_status_id: "ready", reason_item_ids: [] },
      { event: "draft_v7_checked", from_status_id: "ready", to_status_id: "hold_for_review", reason_item_ids: [selected.id] },
      { event: "draft_v8_checked", from_status_id: "hold_for_review", to_status_id: "ready", reason_item_ids: [] }
    ],
    visual_contract: {
      evidence_river: {
        source: "deterministic preload-ready fixture metadata",
        replay_record_count: 430,
        live_write_count: 0,
        counters: ["records", "organizations", "people", "atomic_items", "provenance_links", "relationships", "clusters", "hollow_paths", "completed_paths"]
      },
      selected_example_item_id: selected.id,
      progression: [
        { after_event: "working_source_replayed", verification_state: "heard", contract_match_state: "not_checked", connection_state: "pending" },
        { after_event: "substantive_answer_captured", verification_state: "confirmed", contract_match_state: "not_checked", connection_state: "pending" },
        { after_event: "draft_v7_checked", verification_state: "confirmed", contract_match_state: "missing", connection_state: "broken" },
        { after_event: "draft_v8_checked", verification_state: "in_contract", contract_match_state: "matched", connection_state: "repaired" }
      ]
    },
    validation_invariants: [
      "All corpus counts, references, channel totals, bundle totals, and snapshot totals must match the approved deterministic scale.",
      "The selected example is one of 144 contract-scoped items and does not receive central, highest-risk, or uniquely-important rank.",
      "The blocker predicate is confirmed plus required_for_release plus missing; selected_for_demo never causes a blocker.",
      "A vague or unattributed answer cannot close a hollow path; a substantive answer plus qualifying receipt is required.",
      "Maya is already gone when recovery begins; her historical relationship edges may rank candidates but never answer the question or confirm the term.",
      "EverOS preserves answers, attribution, receipts, citations, and investigation recipes after Maya departs.",
      "The external signal remains background, cannot confirm memory, cannot block, and never confirms the demonstrated commitment.",
      "The 430-record Evidence River is a stored-metadata replay; only v7 and v8 are staged live.",
      "READY, CONFIRMED, and IN CONTRACT retain the stated legal and operational guardrails."
    ]
  };
}

export function generate(outputRoot = DEFAULT_OUTPUT_ROOT) {
  const rng = createRng(GENERATOR_SEED);
  const corpusDir = path.join(outputRoot, "corpus");
  fs.mkdirSync(corpusDir, { recursive: true });

  const atomicItems = createAtomicItems(rng);
  const sourceRecords = createSourceRecords(rng);
  const provenanceLinks = createProvenanceLinks(atomicItems, sourceRecords, rng);
  const itemRelationships = createRelationships(atomicItems, provenanceLinks);
  const expertCandidates = createExpertCandidates(itemRelationships);
  const investigationPaths = createInvestigationPaths(atomicItems, provenanceLinks, sourceRecords);
  const contractMatchResults = createContractMatchResults(atomicItems);
  const replayFrames = createReplayFrames(atomicItems, sourceRecords, provenanceLinks, investigationPaths);
  const mapClusters = clusterDefinitions.map(({ subjects, target_item_count: targetItemCount, ...cluster }) => ({
    ...cluster,
    item_count: atomicItems.filter((item) => item.map_cluster_id === cluster.id).length,
    target_item_count: targetItemCount
  }));

  const componentFiles = {
    "organizations.json": json(organizations),
    "people.json": json(people),
    "visible-bundles.json": json(bundles),
    "source-records.jsonl": jsonl(sourceRecords),
    "atomic-items.jsonl": jsonl(atomicItems),
    "provenance-links.jsonl": jsonl(provenanceLinks),
    "item-relationships.jsonl": jsonl(itemRelationships),
    "expert-candidates.json": json(expertCandidates),
    "map-clusters.json": json(mapClusters),
    "investigation-paths.json": json(investigationPaths),
    "contract-match-results.jsonl": jsonl(contractMatchResults),
    "ingestion-replay.jsonl": jsonl(replayFrames)
  };
  const hash = crypto.createHash("sha256");
  for (const [relativePath, contents] of Object.entries(componentFiles).sort(([left], [right]) => left.localeCompare(right))) {
    hash.update(relativePath);
    hash.update("\0");
    hash.update(contents);
  }
  const datasetSha256 = hash.digest("hex");

  const manifest = {
    schema_version: "2.0.0",
    corpus_id: "deal-witness-airport-corpus-v2",
    generator_version: GENERATOR_VERSION,
    generator_seed: GENERATOR_SEED,
    dataset_sha256: datasetSha256,
    synthetic: true,
    fiction_notice: SYNTHETIC_NOTICE,
    scenario: {
      project_name: "Project Asterline",
      project_site: "Asterline Gateway",
      facility_display: "$380M",
      facility_amount_minor_units: 38000000000,
      currency: "USD",
      evidence_months: 9,
      corpus_start: "2027-01-11T09:00:00.000Z",
      corpus_end: "2027-09-09T15:40:00.000Z"
    },
    approved_counts: {
      organizations: organizations.length,
      people: people.length,
      source_records: sourceRecords.length,
      channels: Object.keys(channelCounts).length,
      atomic_items: atomicItems.length,
      decisions: atomicItems.filter((item) => item.type === "decision").length,
      commitments: atomicItems.filter((item) => item.type === "commitment").length,
      risks: atomicItems.filter((item) => item.type === "risk").length,
      investigation_questions: atomicItems.filter((item) => item.type === "investigation_question").length,
      provenance_links: provenanceLinks.length,
      item_relationships: itemRelationships.length,
      contract_scoped_items: atomicItems.filter((item) => item.contract_scoped).length,
      map_clusters: mapClusters.length,
      visible_bundles: bundles.length,
      formal_snapshots: 3,
      investigation_paths: investigationPaths.length,
      expert_rankings: 1,
      contract_match_results: contractMatchResults.length,
      replay_frames: replayFrames.length
    },
    channel_counts: countBy(sourceRecords, (record) => record.channel),
    bundle_counts: countBy(sourceRecords, (record) => record.bundle_id),
    preload_contract: {
      preloaded_record_count: 430,
      staged_live_record_count: 2,
      preloaded_bundle_count: 5,
      staged_live_bundle_count: 2,
      replay_performs_live_writes: false,
      provider_persistence_claimed: false,
      everos_bulk_load_allowed: false,
      operational_gate_path: "data/deal-witness/everos-operational-gate.json"
    },
    demonstrated_omission: {
      item_id: "item-commitment-001",
      text: DEMONSTRATED_TERM,
      selected_for_demo: true,
      central: false,
      highest_risk: false,
      uniquely_important: false,
      one_of_contract_scoped_items: 144
    },
    files: Object.keys(componentFiles).map((relativePath) => `data/deal-witness/corpus/${relativePath}`),
    everos_runtime_observation_path: "data/deal-witness/everos-runtime-observation.json",
    everos_operational_gate_path: "data/deal-witness/everos-operational-gate.json"
  };
  const expectedState = createExpectedState(manifest, atomicItems, mapClusters, contractMatchResults, investigationPaths);

  for (const [relativePath, contents] of Object.entries(componentFiles)) {
    fs.writeFileSync(path.join(corpusDir, relativePath), contents, "utf8");
  }
  fs.writeFileSync(path.join(corpusDir, "manifest.json"), json(manifest), "utf8");
  fs.writeFileSync(path.join(outputRoot, "expected-state.json"), json(expectedState), "utf8");
  fs.writeFileSync(path.join(outputRoot, "everos-runtime-observation.json"), json(EVEROS_RUNTIME_OBSERVATION), "utf8");

  return {
    dataset_sha256: datasetSha256,
    counts: manifest.approved_counts,
    channel_counts: manifest.channel_counts,
    bundle_counts: manifest.bundle_counts
  };
}

function parseOutputRoot(argv) {
  const outputIndex = argv.indexOf("--output-root");
  if (outputIndex === -1) return DEFAULT_OUTPUT_ROOT;
  if (!argv[outputIndex + 1]) throw new Error("--output-root requires a path");
  return path.resolve(argv[outputIndex + 1]);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = generate(parseOutputRoot(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
