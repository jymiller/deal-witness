(() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const SCHEMA_VERSION = "deal-witness.v2";
  const EXPECTED_REGION_IDS = ["decisions", "risks", "promises", "money"];
  const MAX_CLUSTERS = 14;
  const MIN_CLUSTERS = 12;
  const MAX_SOURCE_BUNDLES = 7;
  const MAX_REPRESENTATIVE_EVIDENCE_PER_BUNDLE = 12;
  const MAX_RIVER_TOKENS = 18;
  const MAX_RANKED_CONTACTS = 6;
  const MAX_TRANSCRIPT_ENTRIES = 12;
  const MAX_REPLAY_DURATION_MS = 180000;
  const AGGREGATE_FIELDS = ["atomicCount", "sourceCount", "provenanceCount", "relationshipCount", "contractScopedCount"];
  const STATE_RANK = { hidden: 0, heard: 1, confirmed: 2 };
  const STATE_LABELS = {
    hidden: "Not heard yet",
    heard: "Heard once",
    confirmed: "Confirmed",
    written: "Written in draft",
    missing: "Missing from draft",
  };
  const DECISION_LABELS = {
    REVIEWING: "REVIEWING",
    READY: "READY",
    HOLD_FOR_REVIEW: "HOLD FOR REVIEW",
  };

  const elements = {
    app: document.querySelector("#app"),
    productName: document.querySelector("#product-name"),
    productTagline: document.querySelector("#product-tagline"),
    dataLabel: document.querySelector("#data-label"),
    replayDuration: document.querySelector("#replay-duration"),
    storyBar: document.querySelector(".story-bar"),
    weekStakes: document.querySelector("#week-stakes"),
    stepEyebrow: document.querySelector("#step-eyebrow"),
    stepTitle: document.querySelector("#step-title"),
    stepNarration: document.querySelector("#step-narration"),
    connectorLabel: document.querySelector("#connector-label"),
    connectorName: document.querySelector("#connector-name"),
    connectorDeadline: document.querySelector("#connector-deadline"),
    connectorRole: document.querySelector("#connector-role"),
    connectorStatus: document.querySelector("#connector-status"),
    connectorBoundary: document.querySelector("#connector-boundary"),
    decisionBlock: document.querySelector("#decision-block"),
    decisionValue: document.querySelector("#decision-value"),
    decisionReason: document.querySelector("#decision-reason"),
    evidenceRiver: document.querySelector("#evidence-river"),
    riverKicker: document.querySelector("#river-kicker"),
    riverTitle: document.querySelector("#river-title"),
    riverTruth: document.querySelector("#river-truth"),
    riverMetrics: document.querySelector("#river-metrics"),
    riverStream: document.querySelector("#river-stream"),
    compressionLabel: document.querySelector("#compression-label"),
    compressionOutput: document.querySelector("#compression-output"),
    stage: document.querySelector("#stage"),
    connectionLayer: document.querySelector("#connection-layer"),
    sourceList: document.querySelector("#source-list"),
    sourceQuoteLabel: document.querySelector("#source-quote-label"),
    sourceSummary: document.querySelector("#source-summary"),
    evidenceList: document.querySelector("#evidence-list"),
    completionShell: document.querySelector("#completion-shell"),
    completionKicker: document.querySelector("#completion-kicker"),
    completionTitle: document.querySelector("#completion-title"),
    completionMode: document.querySelector("#completion-mode"),
    knowledgePanel: document.querySelector("#knowledge-panel"),
    knowledgeKicker: document.querySelector("#knowledge-kicker"),
    knowledgeTitle: document.querySelector("#knowledge-title"),
    knowledgeState: document.querySelector("#knowledge-state"),
    knowledgeSummary: document.querySelector("#knowledge-summary"),
    capabilityLegend: document.querySelector("#capability-legend"),
    contactRanking: document.querySelector("#contact-ranking"),
    knowledgeHistory: document.querySelector("#knowledge-history"),
    memoryTarget: document.querySelector("#memory-target"),
    simulationCall: document.querySelector("#simulation-call"),
    simulationLabel: document.querySelector("#simulation-label"),
    simulationTitle: document.querySelector("#simulation-title"),
    simulationAuthority: document.querySelector("#simulation-authority"),
    simulationPlay: document.querySelector("#simulation-play"),
    simulationMute: document.querySelector("#simulation-mute"),
    simulationSkip: document.querySelector("#simulation-skip"),
    simulationFallback: document.querySelector("#simulation-fallback"),
    simulationStatus: document.querySelector("#simulation-status"),
    loopStages: document.querySelector("#loop-stages"),
    completionTranscript: document.querySelector("#completion-transcript"),
    memoryReceipt: document.querySelector("#memory-receipt"),
    receiptLabel: document.querySelector("#receipt-label"),
    receiptTitle: document.querySelector("#receipt-title"),
    receiptItems: document.querySelector("#receipt-items"),
    receiptRecipe: document.querySelector("#receipt-recipe"),
    dealMapGrid: document.querySelector("#deal-map-grid"),
    exampleDrawer: document.querySelector("#example-drawer"),
    exampleKicker: document.querySelector("#example-kicker"),
    exampleTitle: document.querySelector("#example-title"),
    exampleScale: document.querySelector("#example-scale"),
    exampleValue: document.querySelector("#example-value"),
    examplePlain: document.querySelector("#example-plain"),
    exampleProvenance: document.querySelector("#example-provenance"),
    teachingCard: document.querySelector("#teaching-card"),
    teachingLine: document.querySelector("#teaching-line"),
    contractShell: document.querySelector("#contract-shell"),
    contractPaper: document.querySelector("#contract-paper"),
    contractTitle: document.querySelector("#contract-title"),
    paperOverline: document.querySelector("#paper-overline"),
    paperRevision: document.querySelector("#paper-revision"),
    paperFooterLeft: document.querySelector("#paper-footer-left"),
    paperFooterRight: document.querySelector("#paper-footer-right"),
    clauseList: document.querySelector("#clause-list"),
    calloutTitle: document.querySelector("#callout-title"),
    calloutBody: document.querySelector("#callout-body"),
    previousButton: document.querySelector("#previous-button"),
    playButton: document.querySelector("#play-button"),
    playLabel: document.querySelector("#play-label"),
    playIcon: document.querySelector(".play-icon"),
    nextButton: document.querySelector("#next-button"),
    replayButton: document.querySelector("#replay-button"),
    stepTrack: document.querySelector("#step-track"),
    autoMeterFill: document.querySelector("#auto-meter-fill"),
    liveStatus: document.querySelector("#live-status"),
    errorPanel: document.querySelector("#error-panel"),
    errorMessage: document.querySelector("#error-message"),
  };

  let fixture;
  let sourceIndexById;
  let clusterById;
  let exampleById;
  let clusterByExampleId;
  let draftById;
  let evidenceById;
  let clusterElements;
  let sourceElements;
  let stepButtons;
  let currentStepIndex = 0;
  let currentStates = new Map();
  let currentExampleStates = new Map();
  let currentSupport = new Map();
  let currentAggregates = new Map();
  let playing = false;
  let timerId = 0;
  let animationFrameId = 0;
  let connectionFrameId = 0;
  let connectionTimeoutId = 0;
  let timerStartedAt = 0;
  let remainingMs = 0;
  let manualExampleId = null;
  let contactElements;
  let simulationMuted = false;
  let simulationSpeaking = false;
  let resizeObserver;

  function assert(condition, message) {
    if (!condition) throw new Error(`Fixture contract: ${message}`);
  }

  function isText(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function unique(values) {
    return new Set(values).size === values.length;
  }

  function formatCount(value) {
    return new Intl.NumberFormat("en", {
      notation: value >= 1000 ? "compact" : "standard",
      maximumFractionDigits: 1,
    }).format(value);
  }

  function validateFixture(data) {
    assert(data && typeof data === "object", "root must be an object");
    assert(data.schemaVersion === SCHEMA_VERSION, `schemaVersion must be ${SCHEMA_VERSION}`);
    assert(isText(data.product?.name) && isText(data.product?.tagline), "product name and tagline are required");
    assert(isText(data.product?.documentTitle) && isText(data.product?.description), "document metadata is required");
    assert(isText(data.deal?.title) && isText(data.deal?.dataLabel), "deal title and data label are required");
    assert(isText(data.teachingLine), "teachingLine is required");
    assert(isText(data.story?.demonstratedOmissionId), "story.demonstratedOmissionId is required");
    assert(isText(data.story?.teachingClusterId), "story.teachingClusterId is required");
    assert(isText(data.story?.exampleKicker), "story.exampleKicker is required");
    assert(isText(data.story?.weekStakes?.ariaLabel), "story.weekStakes aria label is required");
    assert(
      Array.isArray(data.story?.weekStakes?.items) && data.story.weekStakes.items.length > 0,
      "story.weekStakes items are required",
    );
    for (const item of data.story.weekStakes.items) {
      assert(isText(item.day) && isText(item.label), "each week stake needs fixture-owned day and label copy");
      assert(["standard", "departure", "deadline"].includes(item.tone), "week stake tone is invalid");
    }
    assert(
      isText(data.historicalNavigator?.name) && isText(data.historicalNavigator?.role),
      "historical navigator name and role are required",
    );
    assert(
      isText(data.historicalNavigator?.deadline) && isText(data.historicalNavigator?.boundary),
      "historical navigator deadline and boundary are required",
    );
    assert(isText(data.memoryLayer?.systemName) && isText(data.memoryLayer?.modeLabel), "memory-layer labels are required");
    assert(isText(data.memoryLayer?.ownerLabel), "memory owner label is required");
    assert(isText(data.memoryLayer?.seedTarget?.appId) && isText(data.memoryLayer?.seedTarget?.projectId), "memory seed target IDs are required");
    assert(
      ["sessionCount", "episodeCount", "profileCount"].every(
        (field) => Number.isSafeInteger(data.memoryLayer.seedTarget[field]) && data.memoryLayer.seedTarget[field] >= 0,
      ),
      "memory seed target counts must be non-negative safe integers",
    );
    assert(isText(data.paper?.overline) && isText(data.paper?.footerLeft) && isText(data.paper?.footerRight), "paper labels are required");
    assert(isText(data.river?.kicker) && isText(data.river?.title), "Evidence River labels are required");
    assert(isText(data.river?.truthLabel) && isText(data.river?.compressionLabel), "Evidence River truth copy is required");
    assert(isText(data.river?.outputLabel), "Evidence River outputLabel is required");
    const riverCountFields = [
      "months",
      "organizationCount",
      "peopleRoleCount",
      "evidenceRecordCount",
      "preloadedRecordCount",
      "stagedLiveRecordCount",
      "atomicItemCount",
      "provenanceLinkCount",
      "typedRelationshipCount",
      "clusterCount",
      "contractScopedItemCount",
      "bundleCount",
      "investigationPathCount",
      "completedPathCount",
      "openPathCount",
    ];
    assert(
      riverCountFields.every((field) => Number.isSafeInteger(data.river[field]) && data.river[field] >= 0),
      "Evidence River aggregate counts must be non-negative safe integers",
    );
    assert(
      data.river.preloadedRecordCount + data.river.stagedLiveRecordCount === data.river.evidenceRecordCount,
      "preloaded and staged-live records must equal the evidence total",
    );
    assert(
      data.river.completedPathCount + data.river.openPathCount === data.river.investigationPathCount,
      "completed and open investigation paths must equal the path total",
    );
    assert(Array.isArray(data.river.metrics) && data.river.metrics.length > 0, "Evidence River metrics are required");
    assert(unique(data.river.metrics.map((metric) => metric.key)), "Evidence River metric keys must be unique");
    for (const metric of data.river.metrics) {
      assert(riverCountFields.includes(metric.key) && isText(metric.label), `river metric ${metric.key} is invalid`);
    }
    assert(
      Array.isArray(data.river.sampleEvidenceIds) &&
        data.river.sampleEvidenceIds.length > 0 &&
        data.river.sampleEvidenceIds.length <= MAX_RIVER_TOKENS,
      `Evidence River needs 1–${MAX_RIVER_TOKENS} bounded sample tokens`,
    );
    assert(Array.isArray(data.river.stagedLiveEvidenceIds), "river stagedLiveEvidenceIds are required");
    assert(
      isText(data.knowledgeDirectory?.kicker) &&
        isText(data.knowledgeDirectory?.title) &&
        isText(data.knowledgeDirectory?.summary) &&
        isText(data.knowledgeDirectory?.historicalNote),
      "Who Knows What labels are required",
    );
    assert(
      Array.isArray(data.knowledgeDirectory?.capabilityLegend) && data.knowledgeDirectory.capabilityLegend.length === 3,
      "Who Knows What needs three capability types",
    );
    const capabilityIds = data.knowledgeDirectory.capabilityLegend.map((item) => item.id);
    assert(
      JSON.stringify([...capabilityIds].sort()) ===
        JSON.stringify(["authorized_approve", "can_certify", "likely_knows"]),
      "capability types must distinguish likely knowledge, evidence/certification, and approval",
    );
    assert(unique(capabilityIds), "capability IDs must be unique");
    assert(
      data.knowledgeDirectory.capabilityLegend.every(
        (item) => isText(item.icon) && isText(item.label) && isText(item.description),
      ),
      "capability types need fixture-owned icon, label, and description",
    );
   assert(
      Array.isArray(data.knowledgeDirectory?.contacts) &&
        data.knowledgeDirectory.contacts.length >= 3 &&
        data.knowledgeDirectory.contacts.length <= MAX_RANKED_CONTACTS,
      `Who Knows What needs 3–${MAX_RANKED_CONTACTS} ranked contacts`,
    );
    const contactIds = new Set(data.knowledgeDirectory.contacts.map((contact) => contact.id));
    assert(contactIds.size === data.knowledgeDirectory.contacts.length, "contact IDs must be unique");
    assert(
      JSON.stringify(data.knowledgeDirectory.contacts.map((contact) => contact.rank).sort((a, b) => a - b)) ===
        JSON.stringify(Array.from({ length: data.knowledgeDirectory.contacts.length }, (_, index) => index + 1)),
      "contact ranks must be contiguous from one",
    );
    for (const contact of data.knowledgeDirectory.contacts) {
      assert(
        isText(contact.name) && isText(contact.role) && isText(contact.organization),
        contact.id + " needs name, role, and organization",
      );
      assert(contact.name !== data.historicalNavigator.name, contact.id + " cannot be the departed historical navigator");
      assert(isText(contact.contactChannel) && isText(contact.why), contact.id + " needs channel and ranking rationale");
      assert(capabilityIds.includes(contact.capability), contact.id + " has an unknown capability");
      assert(Array.isArray(contact.subjectAreas) && contact.subjectAreas.length > 0, contact.id + " needs subject areas");
      assert(contact.subjectAreas.every(isText), contact.id + " subject areas need display copy");
      assert(Array.isArray(contact.receiptIds) && contact.receiptIds.length > 0, contact.id + " needs receipt evidence IDs");
      assert(typeof contact.selected === "boolean", contact.id + " needs selected boolean");
    }
    const selectedContacts = data.knowledgeDirectory.contacts.filter((contact) => contact.selected);
    assert(selectedContacts.length === 1, "exactly one non-Maya recovery contact must be selected");
    assert(selectedContacts[0].capability === "can_certify", "the selected recovery contact must be able to provide evidence or certify");
    assert(isText(data.completionLoop?.kicker) && isText(data.completionLoop?.title), "completion-loop labels are required");
    assert(isText(data.completionLoop?.modeLabel), "completion-loop modeLabel is required");
    assert(
      isText(data.completionLoop?.simulation?.label) &&
        isText(data.completionLoop?.simulation?.title) &&
        isText(data.completionLoop?.simulation?.authorityLabel),
      "prepared simulation labels are required",
    );
    assert(
      ["playLabel", "muteLabel", "unmuteLabel", "skipLabel", "silentFallback"].every((field) =>
        isText(data.completionLoop.simulation[field]),
      ),
      "prepared simulation control and fallback copy is required",
    );
    assert(
      Array.isArray(data.completionLoop.simulation.utteranceEntryIds) &&
        data.completionLoop.simulation.utteranceEntryIds.length > 0,
      "prepared simulation utterance entries are required",
    );
    assert(Array.isArray(data.completionLoop?.stages) && data.completionLoop.stages.length >= 2, "completion-loop stages are required");
    assert(unique(data.completionLoop.stages.map((stage) => stage.id)), "completion-loop stage IDs must be unique");
    assert(data.completionLoop.stages.every((stage) => isText(stage.id) && isText(stage.label)), "completion-loop stage labels are required");
    assert(
      Array.isArray(data.completionLoop?.transcript) &&
        data.completionLoop.transcript.length >= 3 &&
        data.completionLoop.transcript.length <= MAX_TRANSCRIPT_ENTRIES,
      `completion transcript needs 3–${MAX_TRANSCRIPT_ENTRIES} bounded entries`,
    );
    assert(unique(data.completionLoop.transcript.map((entry) => entry.id)), "completion transcript IDs must be unique");
    const loopStageIds = new Set(data.completionLoop.stages.map((stage) => stage.id));
    for (const entry of data.completionLoop.transcript) {
      assert(loopStageIds.has(entry.stageId), `${entry.id} references an unknown completion stage`);
      assert(isText(entry.speaker) && isText(entry.role) && isText(entry.text), `${entry.id} needs fixture-owned transcript copy`);
      assert(typeof entry.substantive === "boolean", `${entry.id} needs substantive boolean`);
      assert(["question", "routing", "vague", "substantive", "stored"].includes(entry.status), `${entry.id} has an invalid status`);
      assert(Array.isArray(entry.evidenceIds), `${entry.id} evidenceIds must be an array`);
    }
    const transcriptIds = new Set(data.completionLoop.transcript.map((entry) => entry.id));
    assert(
      data.completionLoop.simulation.utteranceEntryIds.every((id) => transcriptIds.has(id)),
      "prepared simulation utterance IDs must reference transcript entries",
    );
    assert(transcriptIds.has(data.completionLoop.closureEntryId), "closureEntryId must reference the transcript");
    assert(transcriptIds.has(data.completionLoop.receiptEntryId), "receiptEntryId must reference the transcript");
    assert(
      data.completionLoop.transcript.find((entry) => entry.id === data.completionLoop.closureEntryId).substantive,
      "the closure entry must be substantive",
    );
    assert(
      data.completionLoop.transcript.some((entry) => entry.status === "vague" && !entry.substantive),
      "the transcript must demonstrate that a vague reply does not close the gap",
    );
    assert(
      data.completionLoop.transcript.every((entry) => entry.speaker !== data.historicalNavigator.name),
      "the departed historical navigator cannot be an active transcript speaker",
    );
    const selectedContact = selectedContacts[0];
    const selectedVagueEntry = data.completionLoop.transcript.find(
      (entry) => entry.status === "vague" && entry.speaker === selectedContact.name,
    );
    assert(selectedVagueEntry && !selectedVagueEntry.substantive, "the selected expert must give a vague non-closing response");
    const selectedClosureEntry = data.completionLoop.transcript.find(
      (entry) => entry.id === data.completionLoop.closureEntryId,
    );
    assert(
      selectedClosureEntry.speaker === selectedContact.name && selectedClosureEntry.substantive,
      "the selected non-Maya expert must provide the substantive closure",
    );
    assert(
      data.completionLoop.transcript.findIndex((entry) => entry.id === data.completionLoop.receiptEntryId) >
        data.completionLoop.transcript.findIndex((entry) => entry.id === data.completionLoop.closureEntryId),
      "the memory receipt must follow substantive closure",
    );
    assert(isText(data.completionLoop.receipt?.label) && isText(data.completionLoop.receipt?.title), "memory receipt labels are required");
    assert(Array.isArray(data.completionLoop.receipt?.items) && data.completionLoop.receipt.items.length > 0, "memory receipt items are required");
    assert(data.completionLoop.receipt.items.every(isText), "memory receipt items need display copy");
    assert(isText(data.completionLoop.receipt?.recipe), "investigation recipe copy is required");
    assert(Array.isArray(data.regions) && data.regions.length === 4, "exactly four regions are required");
    assert(
      Array.isArray(data.clusters) && data.clusters.length >= MIN_CLUSTERS && data.clusters.length <= MAX_CLUSTERS,
      `${MIN_CLUSTERS}–${MAX_CLUSTERS} stable clusters are required`,
    );
    assert(
      Array.isArray(data.sources) && data.sources.length >= 2 && data.sources.length <= MAX_SOURCE_BUNDLES,
      `2–${MAX_SOURCE_BUNDLES} source bundles are required`,
    );
    assert(data.river.bundleCount === data.sources.length, "river bundleCount must match visible source bundles");
    assert(data.river.clusterCount === data.clusters.length, "river clusterCount must match stable clusters");
    assert(Array.isArray(data.drafts) && data.drafts.length >= 2, "review and corrected drafts are required");
    assert(Array.isArray(data.presentation?.steps) && data.presentation.steps.length >= 2, "presentation steps are required");
    assert(
      Object.keys(DECISION_LABELS).every((decision) => isText(data.presentation.decisionReasons?.[decision])),
      "fixture-owned decision reasons are required",
    );

    const sortedRegions = [...data.regions].sort((a, b) => a.order - b.order);
    assert(
      JSON.stringify(sortedRegions.map((region) => region.id)) === JSON.stringify(EXPECTED_REGION_IDS),
      "regions must stay in Decisions, Risks, Promises, Money order",
    );
    for (const region of data.regions) {
      assert(isText(region.label) && isText(region.icon) && isText(region.help), `${region.id} needs fixture-owned display copy`);
    }

    for (const collection of [data.regions, data.clusters, data.sources, data.drafts, data.presentation.steps]) {
      assert(unique(collection.map((item) => item.id)), "IDs must be unique inside every collection");
    }

    const regionIds = new Set(data.regions.map((region) => region.id));
    const clusterIds = new Set(data.clusters.map((cluster) => cluster.id));
    const sourceIds = new Set(data.sources.map((source) => source.id));
    const draftIds = new Set(data.drafts.map((draft) => draft.id));
    const exampleIds = new Set();
    const regionSlots = new Set();
    const paperSlots = new Set();

    for (const cluster of data.clusters) {
      assert(regionIds.has(cluster.regionId), `${cluster.id} references an unknown region`);
      assert(Number.isInteger(cluster.regionSlot) && cluster.regionSlot >= 0, `${cluster.id} needs a non-negative regionSlot`);
      assert(!regionSlots.has(`${cluster.regionId}:${cluster.regionSlot}`), `${cluster.id} duplicates a region slot`);
      assert(isText(cluster.label) && isText(cluster.summary), `${cluster.id} needs label and summary`);
      assert(
        AGGREGATE_FIELDS.every((field) => Number.isSafeInteger(cluster.metrics?.[field]) && cluster.metrics[field] >= 0),
        `${cluster.id} needs non-negative aggregate metrics`,
      );
      assert(cluster.metrics.atomicCount > 0 && cluster.metrics.sourceCount > 0, `${cluster.id} needs atomic items and sources`);
      assert(cluster.metrics.provenanceCount > 0 && cluster.metrics.relationshipCount > 0, `${cluster.id} needs provenance and relationships`);
      assert(
        Number.isInteger(cluster.metrics?.densityPercent) && cluster.metrics.densityPercent >= 0 && cluster.metrics.densityPercent <= 100,
        `${cluster.id} needs densityPercent from 0 to 100`,
      );
      assert(cluster.representative && typeof cluster.representative === "object", `${cluster.id} needs one representative example`);
      const example = cluster.representative;
      assert(isText(example.id) && !exampleIds.has(example.id), `${cluster.id} needs a unique representative ID`);
      assert(isText(example.label) && isText(example.displayValue) && isText(example.plainLanguage), `${example.id} needs fixture-owned copy`);
      assert(typeof example.expectedInDraft === "boolean", `${example.id} needs expectedInDraft boolean`);
      if (example.expectedInDraft) {
        assert(Number.isInteger(example.paperSlot) && example.paperSlot >= 0, `${example.id} needs a paperSlot`);
        assert(!paperSlots.has(example.paperSlot), `${example.id} duplicates a paper slot`);
        paperSlots.add(example.paperSlot);
      } else {
        assert(example.paperSlot === null, `${example.id} must use paperSlot null when it is not expected in the draft`);
      }
      regionSlots.add(`${cluster.regionId}:${cluster.regionSlot}`);
      exampleIds.add(example.id);
    }
    assert(
      JSON.stringify([...paperSlots].sort((a, b) => a - b)) === JSON.stringify(Array.from({ length: paperSlots.size }, (_, index) => index)),
      "paper slots must be contiguous from zero",
    );

    assert(exampleIds.has(data.story.demonstratedOmissionId), "demonstratedOmissionId must reference a representative example");
    assert(clusterIds.has(data.story.teachingClusterId), "teachingClusterId must reference a cluster");
    const omissionCluster = data.clusters.find((cluster) => cluster.representative.id === data.story.demonstratedOmissionId);
    assert(omissionCluster.representative.expectedInDraft, "demonstrated omission must be expected in the draft");

    const evidenceIds = new Set();
    const firstEvidenceByCluster = new Map();
    const claimedExamples = new Map();
    const approvedOmissionEvidence = new Set();
    const aggregateTotalsByCluster = new Map(
      data.clusters.map((cluster) => [cluster.id, Object.fromEntries(AGGREGATE_FIELDS.map((field) => [field, 0]))]),
    );
    const stagedLiveEvidenceIds = new Set();
    let totalRecords = 0;
    let totalPreloadedRecords = 0;
    let totalStagedLiveRecords = 0;
    const sortedSources = [...data.sources].sort((a, b) => a.order - b.order);
    assert(sortedSources.every((source, index) => source.order === index), "source bundle order must be contiguous from zero");

    for (const source of sortedSources) {
      assert(isText(source.railLabel) && isText(source.label) && isText(source.summary), `${source.id} needs fixture-owned display copy`);
      assert(
        Array.isArray(source.evidence) && source.evidence.length > 0 && source.evidence.length <= MAX_REPRESENTATIVE_EVIDENCE_PER_BUNDLE,
        `${source.id} needs 1–${MAX_REPRESENTATIVE_EVIDENCE_PER_BUNDLE} representative evidence items`,
      );
      assert(Number.isSafeInteger(source.recordCount) && source.recordCount >= source.evidence.length, `${source.id} recordCount is invalid`);
      assert(Number.isSafeInteger(source.preloadedCount) && source.preloadedCount >= 0, `${source.id} preloadedCount is invalid`);
      assert(Number.isSafeInteger(source.stagedLiveCount) && source.stagedLiveCount >= 0, `${source.id} stagedLiveCount is invalid`);
      assert(source.preloadedCount + source.stagedLiveCount === source.recordCount, `${source.id} load counts must equal recordCount`);
      assert(Array.isArray(source.clusterDeltas), `${source.id} clusterDeltas must be an array`);
      assert(
        source.clusterDeltas.length > 0 || (source.preloadedCount === 0 && source.stagedLiveCount > 0),
        `${source.id} needs cluster deltas unless it is staged-only document evidence`,
      );
      assert(unique(source.clusterDeltas.map((delta) => delta.clusterId)), `${source.id} repeats a cluster delta`);
      const sourceEvidenceIds = new Set(source.evidence.map((evidence) => evidence.id));
      for (const delta of source.clusterDeltas) {
        assert(clusterIds.has(delta.clusterId), `${source.id} delta references an unknown cluster`);
        assert(sourceEvidenceIds.has(delta.evidenceId), `${source.id} delta must cite representative evidence in its bundle`);
        assert(
          AGGREGATE_FIELDS.every((field) => Number.isSafeInteger(delta[field]) && delta[field] >= 0),
          `${source.id} delta for ${delta.clusterId} is invalid`,
        );
        const totals = aggregateTotalsByCluster.get(delta.clusterId);
        for (const field of AGGREGATE_FIELDS) totals[field] += delta[field];
      }
      totalRecords += source.recordCount;
      totalPreloadedRecords += source.preloadedCount;
      totalStagedLiveRecords += source.stagedLiveCount;
      const sortedEvidence = [...source.evidence].sort((a, b) => a.order - b.order);
      assert(sortedEvidence.every((evidence, index) => evidence.order === index), `${source.id} evidence order must be contiguous`);

      for (const evidence of sortedEvidence) {
        assert(isText(evidence.id) && !evidenceIds.has(evidence.id), `${source.id} evidence IDs must be unique`);
        assert(isText(evidence.kind) && isText(evidence.kindLabel), `${evidence.id} needs kind and kindLabel`);
        assert(isText(evidence.label) && isText(evidence.stakeholder), `${evidence.id} needs label and stakeholder`);
        assert(["approved", "external"].includes(evidence.origin), `${evidence.id} has an unsupported origin`);
       assert(["preloaded_metadata", "staged_live"].includes(evidence.loadMode), `${evidence.id} has an unsupported loadMode`);
        if (evidence.loadMode === "staged_live") {
          stagedLiveEvidenceIds.add(evidence.id);
          assert(evidence.claims.length === 0, `${evidence.id} staged-live draft records cannot update memory claims`);
        }
        assert(typeof evidence.governance?.canConfirm === "boolean", `${evidence.id} needs canConfirm`);
        assert(typeof evidence.governance?.canBlock === "boolean", `${evidence.id} needs canBlock`);
        assert(Array.isArray(evidence.claims), `${evidence.id} claims must be an array`);
        if (evidence.origin === "external") {
          assert(!evidence.governance.canConfirm && !evidence.governance.canBlock, `${evidence.id} external evidence must be heard-only and non-blocking`);
         assert(isText(evidence.timestamp), `${evidence.id} external evidence needs a synthetic timestamp`);
          assert(isText(evidence.timestampLabel), `${evidence.id} external evidence needs a display timestamp`);
        }

        const claimedHere = new Set();
        for (const claim of evidence.claims) {
          assert(clusterIds.has(claim.clusterId), `${evidence.id} references an unknown cluster`);
          assert(["heard", "confirm"].includes(claim.effect), `${evidence.id} has an unsupported claim effect`);
          assert(!claimedHere.has(claim.clusterId), `${evidence.id} repeats a cluster claim`);
          assert(Array.isArray(claim.exampleIds), `${evidence.id} exampleIds must be an array`);
          assert(claim.exampleIds.every((id) => exampleIds.has(id)), `${evidence.id} references an unknown example`);
          assert(
            claim.exampleIds.every((id) => clusterByIdFor(data, claim.clusterId).representative.id === id),
            `${evidence.id} exampleIds must belong to the claimed cluster`,
          );
          if (claim.effect === "confirm") {
            assert(evidence.governance.canConfirm, `${evidence.id} cannot confirm claims`);
            assert(firstEvidenceByCluster.has(claim.clusterId), `${claim.clusterId} must be heard before it is confirmed`);
          } else if (!firstEvidenceByCluster.has(claim.clusterId)) {
            firstEvidenceByCluster.set(claim.clusterId, evidence.id);
          }
          if (!evidence.governance.canConfirm) assert(claim.effect === "heard", `${evidence.id} must remain heard-only`);
          if (evidence.origin === "external") {
            assert(clusterByIdFor(data, claim.clusterId).regionId === "risks", `${evidence.id} external evidence may illuminate Risks only`);
            assert(!claim.exampleIds.includes(data.story.demonstratedOmissionId), `${evidence.id} external evidence cannot support the demonstrated omission`);
          }
          for (const exampleId of claim.exampleIds) {
            if (!claimedExamples.has(exampleId)) claimedExamples.set(exampleId, new Set());
            claimedExamples.get(exampleId).add(evidence.id);
            if (
              exampleId === data.story.demonstratedOmissionId &&
              claim.effect === "confirm" &&
              evidence.origin === "approved" &&
              evidence.governance.canBlock
            ) {
              approvedOmissionEvidence.add(evidence.id);
            }
          }
          claimedHere.add(claim.clusterId);
        }
        evidenceIds.add(evidence.id);
      }
    }

    assert(data.clusters.every((cluster) => firstEvidenceByCluster.has(cluster.id)), "every cluster must be heard by representative evidence");
    assert(approvedOmissionEvidence.size > 0, "demonstrated omission needs approved, confirming, blocking-capable evidence");
    for (const cluster of data.clusters) {
      const totals = aggregateTotalsByCluster.get(cluster.id);
      assert(
        AGGREGATE_FIELDS.every((field) => totals[field] === cluster.metrics[field]),
        `${cluster.id} source deltas must sum to final aggregate metrics`,
      );
    }
    assert(totalRecords === data.river.evidenceRecordCount, "source record counts must equal Evidence River total");
    assert(totalPreloadedRecords === data.river.preloadedRecordCount, "source preloaded counts must equal Evidence River total");
    assert(totalStagedLiveRecords === data.river.stagedLiveRecordCount, "source staged-live counts must equal Evidence River total");
    assert(
      data.clusters.reduce((sum, cluster) => sum + cluster.metrics.atomicCount, 0) === data.river.atomicItemCount,
      "cluster atomic counts must equal Evidence River total",
    );
    assert(
      data.clusters.reduce((sum, cluster) => sum + cluster.metrics.provenanceCount, 0) === data.river.provenanceLinkCount,
      "cluster provenance counts must equal Evidence River total",
    );
    assert(
      data.clusters.reduce((sum, cluster) => sum + cluster.metrics.relationshipCount, 0) === data.river.typedRelationshipCount,
      "cluster relationship counts must equal Evidence River total",
    );
    assert(
      data.clusters.reduce((sum, cluster) => sum + cluster.metrics.contractScopedCount, 0) === data.river.contractScopedItemCount,
      "cluster contract-scoped counts must equal Evidence River total",
    );
    assert(data.river.sampleEvidenceIds.every((id) => evidenceIds.has(id)), "Evidence River samples must reference representative evidence");
    assert(unique(data.river.sampleEvidenceIds), "Evidence River sample IDs must be unique");
   for (const entry of data.completionLoop.transcript) {
     assert(entry.evidenceIds.every((id) => evidenceIds.has(id)), `${entry.id} references unknown evidence`);
   }
    const evidenceRecordById = new Map(
      sortedSources.flatMap((source) => source.evidence.map((evidence) => [evidence.id, evidence])),
    );
    for (const contact of data.knowledgeDirectory.contacts) {
      assert(contact.receiptIds.every((id) => evidenceIds.has(id)), `${contact.id} references unknown receipt evidence`);
      assert(
        contact.receiptIds.every((id) => evidenceRecordById.get(id).origin === "approved"),
        `${contact.id} ranking receipts must be approved deal evidence`,
      );
    }
    assert(
      selectedContact.receiptIds.some((id) => selectedClosureEntry.evidenceIds.includes(id)),
      "the selected expert ranking and substantive closure must share an approved receipt",
    );
   const closureEntry = data.completionLoop.transcript.find((entry) => entry.id === data.completionLoop.closureEntryId);
    assert(
      closureEntry.evidenceIds.some((id) => {
        const evidence = sortedSources.flatMap((source) => source.evidence).find((item) => item.id === id);
        return (
          evidence.origin === "approved" &&
          evidence.governance.canConfirm &&
          evidence.claims.some(
            (claim) =>
              claim.effect === "confirm" &&
              claim.exampleIds.includes(data.story.demonstratedOmissionId),
          )
        );
      }),
      "the substantive closure must cite approved evidence that confirms the demonstrated example",
    );
    const receiptEntry = data.completionLoop.transcript.find(
      (entry) => entry.id === data.completionLoop.receiptEntryId,
    );
    assert(
      receiptEntry.evidenceIds.some((id) => {
        const evidence = evidenceRecordById.get(id);
        return (
          evidence.origin === "approved" &&
          evidence.governance.canConfirm &&
          evidence.governance.canBlock &&
          evidence.claims.some(
            (claim) =>
              claim.effect === "confirm" &&
              claim.exampleIds.includes(data.story.demonstratedOmissionId),
          )
        );
      }),
      "the stored memory receipt must include approved blocking evidence for the demonstrated example",
    );
    assert(
      JSON.stringify([...stagedLiveEvidenceIds].sort()) === JSON.stringify([...data.river.stagedLiveEvidenceIds].sort()),
      "only the declared representative records may be staged live",
    );
    assert(data.river.stagedLiveEvidenceIds.length === data.river.stagedLiveRecordCount, "staged live evidence count must match aggregate");

    for (const draft of data.drafts) {
      assert(sourceIds.has(draft.sourceId), `${draft.id} references an unknown source bundle`);
      assert(isText(draft.label) && isText(draft.revisionLabel), `${draft.id} needs label and revisionLabel`);
      assert(evidenceIds.has(draft.evidenceId), `${draft.id} must reference its evidence record`);
      assert(
        data.sources.find((source) => source.id === draft.sourceId).evidence.some((evidence) => evidence.id === draft.evidenceId),
        `${draft.id} evidence must belong to its source bundle`,
      );
      assert(unique(draft.links.map((link) => link.exampleId)), `${draft.id} repeats a linked example`);
      for (const link of draft.links) {
        assert(exampleIds.has(link.exampleId), `${draft.id} links an unknown example`);
        assert(isText(link.excerpt), `${draft.id} needs an excerpt for ${link.exampleId}`);
      }
    }

    const expectedExampleIds = data.clusters
      .map((cluster) => cluster.representative)
      .filter((example) => example.expectedInDraft)
      .map((example) => example.id);
    const missingForDraft = (draft) => expectedExampleIds.filter((id) => !draft.links.some((link) => link.exampleId === id));
    const reviewDraft = data.drafts.find((draft) => {
      const missing = missingForDraft(draft);
      return missing.length === 1 && missing[0] === data.story.demonstratedOmissionId;
    });
    assert(reviewDraft, "one review draft must omit exactly the demonstrated example");
    const correctedDraft = data.drafts.find(
      (draft) => draft.revisionOf === reviewDraft.id && missingForDraft(draft).length === 0,
    );
    assert(correctedDraft, "a later corrected draft must reconnect every expected example");

    let previousSourceOrder = -1;
    let totalDuration = 0;
    let sawReadyBeforeHold = false;
    let sawHold = false;
    let sawReadyAfterHold = false;
    let presentedReviewDraft = false;
    let presentedCorrectedDraftAfterHold = false;
    let previousEvidenceOrder = -1;
    let previousTranscriptOrder = -1;
    let previousStepSourceId = null;
    for (const step of data.presentation.steps) {
      const source = data.sources.find((item) => item.id === step.sourceThroughId);
      assert(source, `${step.id} references an unknown source bundle`);
      assert(source.order >= previousSourceOrder, `${step.id} moves the source rail backward`);
      const evidenceThrough = source.evidence.find((evidence) => evidence.id === step.evidenceThroughId);
      assert(evidenceThrough, `${step.id} evidenceThroughId must reference the current source bundle`);
      if (previousStepSourceId === source.id) {
        assert(evidenceThrough.order >= previousEvidenceOrder, `${step.id} moves evidence inside a bundle backward`);
      }
      assert(isText(step.eyebrow) && isText(step.title) && isText(step.narration), `${step.id} needs fixture-owned story copy`);
      assert(isText(step.historicalStatus), `${step.id} needs a historicalStatus`);
      assert(
        ["hidden", "ranked", "selected", "confirmed"].includes(step.knowledgeState),
        `${step.id} has an unsupported Who Knows What state`,
      );
      assert(["volume", "flow", "compress", "paths", "memory", "check"].includes(step.riverMode), `${step.id} has an unsupported riverMode`);
      assert(loopStageIds.has(step.loopStageId), `${step.id} references an unknown completion-loop stage`);
      assert(step.transcriptThroughId === null || transcriptIds.has(step.transcriptThroughId), `${step.id} transcriptThroughId is invalid`);
      if (step.transcriptThroughId !== null) {
        const transcriptOrder = data.completionLoop.transcript.findIndex((entry) => entry.id === step.transcriptThroughId);
        assert(transcriptOrder >= previousTranscriptOrder, `${step.id} moves the completion transcript backward`);
        previousTranscriptOrder = transcriptOrder;
      }
      assert(step.selectedExampleId === null || exampleIds.has(step.selectedExampleId), `${step.id} selectedExampleId is invalid`);
      if (step.draftId !== null) {
        assert(draftIds.has(step.draftId), `${step.id} references an unknown draft`);
        assert(isText(step.calloutTitle) && isText(step.calloutBody), `${step.id} needs draft callout copy`);
      }
      assert(Object.hasOwn(DECISION_LABELS, step.decision), `${step.id} has an unsupported decision`);
      assert(Number.isInteger(step.durationMs) && step.durationMs > 0, `${step.id} needs a positive durationMs`);

      if (step.draftId) {
        const presentedDraft = data.drafts.find((draft) => draft.id === step.draftId);
        const draftSource = data.sources.find((candidate) => candidate.id === presentedDraft.sourceId);
        assert(source.order >= draftSource.order, `${step.id} reveals paper before its source bundle`);
        if (source.id === draftSource.id) {
          const draftEvidenceOrder = source.evidence.find((evidence) => evidence.id === presentedDraft.evidenceId).order;
          assert(evidenceThrough.order >= draftEvidenceOrder, `${step.id} reveals paper before its evidence record`);
        }
        const missing = missingForDraft(presentedDraft);
        assert(
          (missing.length > 0) === (step.decision === "HOLD_FOR_REVIEW"),
          `${step.id} decision must be derived from the checked draft, not source sentiment`,
        );
        if (step.decision === "HOLD_FOR_REVIEW") {
          assert(presentedDraft.id === reviewDraft.id, `${step.id} must present the one-example review omission`);
          assert(step.selectedExampleId === data.story.demonstratedOmissionId, `${step.id} must open the demonstrated representative example`);
          assert(
            data.sources
              .filter((candidate) => candidate.order <= source.order)
              .some((candidate) =>
                candidate.evidence.some((evidence) =>
                  (candidate.order < source.order || evidence.order <= evidenceThrough.order) &&
                  evidence.claims.some(
                    (claim) =>
                      claim.clusterId === omissionCluster.id &&
                      claim.effect === "confirm" &&
                      claim.exampleIds.includes(data.story.demonstratedOmissionId) &&
                      evidence.origin === "approved" &&
                      evidence.governance.canBlock,
                  ),
                ),
              ),
            `${step.id} omission must already be confirmed by approved evidence`,
          );
          presentedReviewDraft = true;
        }
        if (sawHold && step.decision === "READY") {
          assert(presentedDraft.id === correctedDraft.id, `${step.id} must present the complete corrected child draft`);
          presentedCorrectedDraftAfterHold = true;
        }
      } else {
        assert(step.decision !== "HOLD_FOR_REVIEW", `${step.id} cannot hold without a checked draft`);
      }

      if (step.decision === "READY" && !sawHold) sawReadyBeforeHold = true;
      if (step.decision === "HOLD_FOR_REVIEW") sawHold = true;
      if (step.decision === "READY" && sawHold) sawReadyAfterHold = true;
      totalDuration += step.durationMs;
      previousSourceOrder = source.order;
      previousStepSourceId = source.id;
      previousEvidenceOrder = evidenceThrough.order;
    }
    assert(sawReadyBeforeHold && sawHold && sawReadyAfterHold, "presentation must include READY → HOLD FOR REVIEW → READY");
    assert(presentedReviewDraft && presentedCorrectedDraftAfterHold, "presentation must show the review omission and its corrected child");
    assert(totalDuration <= MAX_REPLAY_DURATION_MS, "the replay must finish within three minutes");
    return data;
  }

  function clusterByIdFor(data, clusterId) {
    return data.clusters.find((cluster) => cluster.id === clusterId);
  }

  function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function buildSourceRail() {
    const fragment = document.createDocumentFragment();
    sourceElements = new Map();
    elements.sourceList.style.setProperty("--source-count", String(fixture.sources.length));

    for (const source of [...fixture.sources].sort((a, b) => a.order - b.order)) {
      const item = document.createElement("li");
      item.className = "source-item";
      item.dataset.sourceId = source.id;
      item.dataset.sourceState = "future";

      const number = document.createElement("span");
      number.className = "source-number";
      number.setAttribute("aria-hidden", "true");
      number.append(createTextElement("span", "", String(source.order + 1).padStart(2, "0")));

      const copy = document.createElement("span");
      copy.className = "source-item-copy";
      copy.append(
        createTextElement("span", "source-name", source.railLabel),
        createTextElement("span", "source-meta", `${formatCount(source.recordCount)} records`),
      );
      if (source.evidence.some((evidence) => isText(evidence.historicalRelationship))) {
        copy.append(createTextElement("span", "source-connector", `Historical ${fixture.historicalNavigator.name} trail`));
     }

      const kinds = unique(source.evidence.map((evidence) => evidence.kindLabel))
        ? source.evidence.map((evidence) => evidence.kindLabel)
        : [...new Set(source.evidence.map((evidence) => evidence.kindLabel))];
      item.title = `${source.label}: ${kinds.join(", ")}`;
      item.append(number, copy);
      fragment.append(item);
      sourceElements.set(source.id, item);
    }
    elements.sourceList.replaceChildren(fragment);
  }

  function buildDealMap() {
    const fragment = document.createDocumentFragment();
    clusterElements = new Map();

    for (const region of [...fixture.regions].sort((a, b) => a.order - b.order)) {
      const section = document.createElement("section");
      section.className = "region-card";
      section.dataset.regionId = region.id;
      section.setAttribute("aria-labelledby", `region-${region.id}-title`);

      const header = document.createElement("header");
      header.className = "region-heading";
      const icon = createTextElement("span", "region-icon", region.icon);
      icon.setAttribute("aria-hidden", "true");
      const headingCopy = document.createElement("div");
      const title = createTextElement("h3", "region-title", region.label);
      title.id = `region-${region.id}-title`;
      headingCopy.append(title, createTextElement("p", "region-help", region.help));
      header.append(icon, headingCopy);
      section.append(header);

      const clusterGrid = document.createElement("div");
      clusterGrid.className = "concept-grid cluster-grid";
      const clusters = fixture.clusters
        .filter((cluster) => cluster.regionId === region.id)
        .sort((a, b) => a.regionSlot - b.regionSlot);

      for (const cluster of clusters) {
        const card = document.createElement("article");
        card.className = "concept-card cluster-card";
        card.dataset.clusterId = cluster.id;
        card.dataset.state = "hidden";
        card.setAttribute("aria-hidden", "true");

        const top = document.createElement("div");
        top.className = "cluster-top";
        const atomicMetric = createTextElement("strong", "cluster-atomic-count", "0 items");
        top.append(
          createTextElement("span", "concept-label", cluster.label),
          atomicMetric,
        );
        const summary = createTextElement("p", "cluster-summary", cluster.summary);
        const metrics = document.createElement("div");
        metrics.className = "cluster-metrics";
        const sourceMetric = createTextElement("span", "", "0 sources");
        const provenanceMetric = createTextElement("span", "", "0 provenance");
        metrics.append(sourceMetric, provenanceMetric);
        const density = document.createElement("span");
        density.className = "density-meter";
        density.style.setProperty("--density", "0%");
        density.setAttribute("role", "img");
        density.setAttribute("aria-label", `Cluster density ${cluster.metrics.densityPercent} percent`);

        const footer = document.createElement("div");
        footer.className = "cluster-footer";
        const state = createTextElement("span", "state-badge", STATE_LABELS.hidden);
        const support = createTextElement("span", "support-badge", "No revealed evidence");
        const inspect = document.createElement("button");
        inspect.type = "button";
        inspect.className = "inspect-example";
        inspect.textContent = "Inspect one";
        inspect.disabled = true;
        inspect.setAttribute("aria-label", `Inspect one representative item in ${cluster.label}`);
        inspect.addEventListener("click", () => {
          pausePlayback();
          manualExampleId = cluster.representative.id;
          renderExample(fixture.presentation.steps[currentStepIndex], { focus: true });
          renderClusters(fixture.presentation.steps[currentStepIndex]);
          requestConnectionDraw();
        });
        footer.append(state, support, inspect);
        card.append(top, summary, metrics, density, footer);
        clusterGrid.append(card);
        clusterElements.set(cluster.id, {
          card,
          state,
          support,
          inspect,
          atomicMetric,
          sourceMetric,
          provenanceMetric,
          density,
        });
      }
      section.append(clusterGrid);

      if (region.id === "decisions") {
        const decisionCard = document.createElement("div");
        decisionCard.className = "decision-region-card";
        decisionCard.id = "decision-region-card";
        decisionCard.dataset.decision = "reviewing";
        decisionCard.append(
          createTextElement("span", "decision-label", "Current call"),
          createTextElement("strong", "decision-region-value", "REVIEWING"),
          createTextElement("p", "decision-region-copy", fixture.presentation.decisionReasons.REVIEWING),
        );
        section.append(decisionCard);
      }
      fragment.append(section);
    }
    elements.dealMapGrid.replaceChildren(fragment);
  }

  function buildStepTrack() {
    const fragment = document.createDocumentFragment();
    stepButtons = [];
    elements.stepTrack.style.setProperty("--step-count", String(fixture.presentation.steps.length));
    fixture.presentation.steps.forEach((step, index) => {
      const button = document.createElement("button");
      button.className = "step-dot";
      button.type = "button";
      button.dataset.stepState = "future";
      button.setAttribute("aria-label", `Go to step ${index + 1}: ${step.title}`);
      button.title = `${index + 1}. ${step.title}`;
      button.append(createTextElement("span", "", String(index + 1).padStart(2, "0")));
      button.addEventListener("click", () => setStep(index, { manual: true }));
      fragment.append(button);
      stepButtons.push(button);
    });
    elements.stepTrack.replaceChildren(fragment);
  }

  function buildWeekStakes() {
    const timeline = fixture.story.weekStakes;
    const fragment = document.createDocumentFragment();
    for (const item of timeline.items) {
      const entry = document.createElement("li");
      entry.className = `week-stake${item.tone === "standard" ? "" : ` is-${item.tone}`}`;
      entry.append(
        createTextElement("span", "", item.day),
        createTextElement("strong", "", item.label),
      );
      fragment.append(entry);
    }
    elements.weekStakes.setAttribute("aria-label", timeline.ariaLabel);
    elements.weekStakes.replaceChildren(fragment);
  }

  function buildEvidenceRiver() {
    elements.riverKicker.textContent = fixture.river.kicker;
    elements.riverTitle.textContent = fixture.river.title;
    elements.riverTruth.textContent = fixture.river.truthLabel;
    elements.compressionLabel.textContent = fixture.river.compressionLabel;
    elements.compressionOutput.textContent = `${formatCount(fixture.river.clusterCount)} ${fixture.river.outputLabel}`;

    const metricFragment = document.createDocumentFragment();
    for (const metric of fixture.river.metrics) {
      const item = document.createElement("div");
      item.className = "river-metric";
      item.dataset.metricKey = metric.key;
      item.append(
        createTextElement("strong", "", formatCount(fixture.river[metric.key])),
        createTextElement("span", "", metric.label),
      );
      metricFragment.append(item);
    }
    elements.riverMetrics.replaceChildren(metricFragment);

    const tokenFragment = document.createDocumentFragment();
    fixture.river.sampleEvidenceIds.forEach((id, index) => {
      const { evidence, source } = evidenceById.get(id);
      const token = document.createElement("span");
      token.className = `river-token${evidence.loadMode === "staged_live" ? " is-live" : ""}`;
      token.dataset.evidenceId = id;
      token.style.setProperty("--token-index", String(index));
      token.style.setProperty("--token-top", `${4 + Math.floor(index / 2) * 18}px`);
      token.style.setProperty("--token-left", index % 2 === 0 ? "0%" : "calc(50% + 3px)");
      token.style.setProperty("--token-lane-top", index % 2 === 0 ? "3px" : "17px");
      token.textContent = evidence.kindLabel;
      token.title = `${source.label}: ${evidence.label}`;
      tokenFragment.append(token);
    });
    elements.riverStream.replaceChildren(tokenFragment);
  }

  function buildCompletionLoop() {
    elements.completionKicker.textContent = fixture.completionLoop.kicker;
    elements.completionTitle.textContent = fixture.completionLoop.title;
    elements.completionMode.textContent = fixture.completionLoop.modeLabel;
    buildWhoKnowsWhat();
    const simulation = fixture.completionLoop.simulation;
    elements.simulationLabel.textContent = simulation.label;
    elements.simulationTitle.textContent = simulation.title;
    elements.simulationAuthority.textContent = simulation.authorityLabel;
    elements.simulationPlay.textContent = simulation.playLabel;
    elements.simulationMute.textContent = simulation.muteLabel;
    elements.simulationSkip.textContent = simulation.skipLabel;
    elements.simulationFallback.textContent = simulation.silentFallback;
    const fragment = document.createDocumentFragment();
    fixture.completionLoop.stages.forEach((stage, index) => {
      const item = document.createElement("li");
      item.className = "loop-stage";
      item.dataset.loopStageId = stage.id;
      item.dataset.stageState = "future";
      item.append(
        createTextElement("span", "loop-stage-number", String(index + 1).padStart(2, "0")),
        createTextElement("strong", "", stage.label),
      );
      fragment.append(item);
    });
    elements.loopStages.replaceChildren(fragment);
    elements.receiptLabel.textContent = fixture.completionLoop.receipt.label;
    elements.receiptTitle.textContent = fixture.completionLoop.receipt.title;
    elements.receiptRecipe.textContent = fixture.completionLoop.receipt.recipe;
    const receiptItems = document.createDocumentFragment();
    for (const item of fixture.completionLoop.receipt.items) receiptItems.append(createTextElement("li", "", item));
    elements.receiptItems.replaceChildren(receiptItems);
  }

  function buildWhoKnowsWhat() {
    const directory = fixture.knowledgeDirectory;
    elements.knowledgeKicker.textContent = directory.kicker;
    elements.knowledgeTitle.textContent = directory.title;
    elements.knowledgeSummary.textContent = directory.summary;
    elements.knowledgeHistory.textContent = directory.historicalNote;

    const capabilityFragment = document.createDocumentFragment();
    const capabilityById = new Map(directory.capabilityLegend.map((capability) => [capability.id, capability]));
    for (const capability of directory.capabilityLegend) {
      const item = document.createElement("li");
      item.dataset.capability = capability.id;
      item.title = capability.description;
      item.append(
        createTextElement("span", "capability-icon", capability.icon),
        createTextElement("span", "", capability.label),
      );
      capabilityFragment.append(item);
    }
    elements.capabilityLegend.replaceChildren(capabilityFragment);

    contactElements = new Map();
    const contactFragment = document.createDocumentFragment();
    for (const contact of [...directory.contacts].sort((a, b) => a.rank - b.rank)) {
      const capability = capabilityById.get(contact.capability);
      const item = document.createElement("li");
      item.className = "contact-card";
      item.dataset.contactId = contact.id;
      item.dataset.capability = contact.capability;
      item.dataset.contactState = "ranked";

      const heading = document.createElement("header");
      const identity = document.createElement("div");
      identity.append(
        createTextElement("span", "contact-rank", `Rank ${contact.rank}`),
        createTextElement("strong", "contact-name", contact.name),
        createTextElement("span", "contact-role", `${contact.role} · ${contact.organization}`),
      );
      const capabilityBadge = document.createElement("span");
      capabilityBadge.className = "contact-capability";
      capabilityBadge.append(
        createTextElement("span", "capability-icon", capability.icon),
        createTextElement("span", "", capability.label),
      );
      heading.append(identity, capabilityBadge);

      const subjects = document.createElement("div");
      subjects.className = "contact-subjects";
      contact.subjectAreas.forEach((subject) => subjects.append(createTextElement("span", "", subject)));
      const channel = createTextElement("p", "contact-channel", contact.contactChannel);

      const details = document.createElement("details");
      details.className = "contact-why";
      details.append(createTextElement("summary", "", "Why this person?"));
      details.append(createTextElement("p", "", contact.why));
      const receipts = document.createElement("div");
      receipts.className = "contact-receipts";
      receipts.setAttribute("aria-label", "Ranking receipts");
      contact.receiptIds.forEach((id) => receipts.append(createTextElement("span", "", evidenceById.get(id).evidence.label)));
      details.append(receipts);

      item.append(heading, subjects, channel, details);
      item.setAttribute(
        "aria-label",
        `Rank ${contact.rank}: ${contact.name}, ${contact.role} at ${contact.organization}. ${capability.label}. ${contact.contactChannel}.`,
      );
      contactElements.set(contact.id, item);
      contactFragment.append(item);
    }
    elements.contactRanking.replaceChildren(contactFragment);

    const seed = fixture.memoryLayer.seedTarget;
    elements.memoryTarget.textContent = `${fixture.memoryLayer.modeLabel} · ${seed.appId} / ${seed.projectId} · ${seed.sessionCount} sessions · ${seed.episodeCount} episodes · ${seed.profileCount} profiles`;
  }

  function hydrateFixture(data) {
    fixture = data;
    sourceIndexById = new Map(fixture.sources.map((source) => [source.id, source.order]));
    clusterById = new Map(fixture.clusters.map((cluster) => [cluster.id, cluster]));
    exampleById = new Map(fixture.clusters.map((cluster) => [cluster.representative.id, cluster.representative]));
    clusterByExampleId = new Map(fixture.clusters.map((cluster) => [cluster.representative.id, cluster]));
    draftById = new Map(fixture.drafts.map((draft) => [draft.id, draft]));
    evidenceById = new Map(
      fixture.sources.flatMap((source) => source.evidence.map((evidence) => [evidence.id, { evidence, source }])),
    );

    document.title = fixture.product.documentTitle;
    document.querySelector("meta[name='description']").setAttribute("content", fixture.product.description);
    elements.productName.textContent = fixture.product.name;
    elements.productTagline.textContent = fixture.product.tagline;
    elements.dataLabel.textContent = fixture.deal.dataLabel;
    elements.teachingLine.textContent = fixture.teachingLine;
    elements.connectorLabel.textContent = fixture.historicalNavigator.label;
    elements.connectorName.textContent = fixture.historicalNavigator.name;
    elements.connectorDeadline.textContent = fixture.historicalNavigator.deadline;
    elements.connectorRole.textContent = fixture.historicalNavigator.role;
    elements.connectorBoundary.textContent = fixture.historicalNavigator.boundary;
    elements.paperOverline.textContent = fixture.paper.overline;
    elements.paperFooterLeft.textContent = fixture.paper.footerLeft;
    elements.paperFooterRight.textContent = fixture.paper.footerRight;
    elements.replayDuration.textContent = formatDuration(totalReplayDuration());
    buildWeekStakes();
    buildEvidenceRiver();
    buildCompletionLoop();
    buildSourceRail();
    buildDealMap();
    buildStepTrack();
    bindControls();

    remainingMs = fixture.presentation.steps[0].durationMs;
    render({ announce: false });
    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(requestConnectionDraw);
      resizeObserver.observe(elements.stage);
    } else {
      window.addEventListener("resize", requestConnectionDraw, { passive: true });
    }
    elements.app.setAttribute("aria-busy", "false");
  }

  function totalReplayDuration() {
    return fixture.presentation.steps.reduce((sum, step) => sum + step.durationMs, 0);
  }

  function formatDuration(milliseconds) {
    const totalSeconds = Math.round(milliseconds / 1000);
    return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
  }

  function evidenceIsRevealed(source, evidence, step) {
    const throughOrder = sourceIndexById.get(step.sourceThroughId);
    if (source.order < throughOrder) return true;
    if (source.order > throughOrder) return false;
    const cutoff = source.evidence.find((item) => item.id === step.evidenceThroughId);
    return evidence.order <= cutoff.order;
  }

  function deriveState(step) {
    const sourceThroughOrder = sourceIndexById.get(step.sourceThroughId);
    const states = new Map(fixture.clusters.map((cluster) => [cluster.id, "hidden"]));
    const exampleStates = new Map(fixture.clusters.map((cluster) => [cluster.representative.id, "hidden"]));
    const aggregates = new Map(
      fixture.clusters.map((cluster) => [cluster.id, Object.fromEntries(AGGREGATE_FIELDS.map((field) => [field, 0]))]),
    );
    const support = new Map(
      fixture.clusters.map((cluster) => [cluster.id, { total: 0, approved: 0, external: 0, confirming: 0, historical: 0 }]),
    );

    for (const source of [...fixture.sources].sort((a, b) => a.order - b.order)) {
      if (source.order > sourceThroughOrder) break;
      for (const delta of source.clusterDeltas) {
        const deltaEvidence = source.evidence.find((evidence) => evidence.id === delta.evidenceId);
        if (!evidenceIsRevealed(source, deltaEvidence, step)) continue;
        const current = aggregates.get(delta.clusterId);
        for (const field of AGGREGATE_FIELDS) current[field] += delta[field];
      }
      for (const evidence of [...source.evidence].sort((a, b) => a.order - b.order)) {
        if (!evidenceIsRevealed(source, evidence, step)) continue;
        for (const claim of evidence.claims) {
          const counts = support.get(claim.clusterId);
          counts.total += 1;
          counts[evidence.origin] += 1;
          if (claim.effect === "confirm") counts.confirming += 1;
          if (isText(evidence.historicalRelationship)) counts.historical += 1;
          const nextState = claim.effect === "confirm" ? "confirmed" : "heard";
          if (STATE_RANK[nextState] > STATE_RANK[states.get(claim.clusterId)]) states.set(claim.clusterId, nextState);
          for (const exampleId of claim.exampleIds) {
            if (STATE_RANK[nextState] > STATE_RANK[exampleStates.get(exampleId)]) exampleStates.set(exampleId, nextState);
          }
        }
      }
    }

    const missing = [];
    const draft = step.draftId ? draftById.get(step.draftId) : null;
    if (draft) {
      const linked = new Set(draft.links.map((link) => link.exampleId));
      for (const cluster of fixture.clusters) {
        const example = cluster.representative;
        if (!example.expectedInDraft) continue;
        if (linked.has(example.id)) {
          states.set(cluster.id, "written");
          exampleStates.set(example.id, "written");
        }
        else if (states.get(cluster.id) !== "hidden") {
          states.set(cluster.id, "missing");
          exampleStates.set(example.id, "missing");
          missing.push(example.id);
        }
      }
    }
    return { states, exampleStates, support, aggregates, missing, draft };
  }

  function render({ announce = true } = {}) {
    const step = fixture.presentation.steps[currentStepIndex];
    const derived = deriveState(step);
    currentStates = derived.states;
    currentExampleStates = derived.exampleStates;
    currentSupport = derived.support;
    currentAggregates = derived.aggregates;
    elements.stepEyebrow.textContent = step.eyebrow;
    elements.stepTitle.textContent = step.title;
    elements.stepNarration.textContent = step.narration;
    elements.connectorStatus.textContent = step.historicalStatus;
    renderEvidenceRiver(step);
    renderDecision(step.decision);
    renderSourceRail(step);
    renderClusters(step);
    renderExample(step);
    renderCompletionLoop(step);
    renderContract(step, derived.draft, derived.missing);
    renderProgress();
    updateControlState();
    requestConnectionDraw();

    if (announce) {
      const source = fixture.sources.find((item) => item.id === step.sourceThroughId);
      const missingMessage = derived.missing.length ? ` One representative required term is missing from the checked draft.` : "";
      elements.liveStatus.textContent = `Step ${currentStepIndex + 1} of ${fixture.presentation.steps.length}. ${step.title}. Source bundle: ${source.label}. Decision: ${DECISION_LABELS[step.decision]}.${missingMessage}`;
    }
  }

  function renderDecision(decision) {
    const decisionKey = decision.toLowerCase();
    const label = DECISION_LABELS[decision];
    const reason = fixture.presentation.decisionReasons[decision];
    elements.decisionBlock.dataset.decision = decisionKey;
    elements.decisionValue.textContent = label;
    elements.decisionReason.textContent = reason;
    const decisionCard = document.querySelector("#decision-region-card");
    decisionCard.dataset.decision = decisionKey;
    decisionCard.querySelector(".decision-region-value").textContent = label;
    decisionCard.querySelector(".decision-region-copy").textContent = reason;
    decisionCard.setAttribute("aria-label", `Current closing decision: ${label}. ${reason}`);
  }

  function renderEvidenceRiver(step) {
    elements.evidenceRiver.dataset.mode = step.riverMode;
    for (const token of elements.riverStream.querySelectorAll(".river-token")) {
      const record = evidenceById.get(token.dataset.evidenceId);
      token.hidden = !record || !evidenceIsRevealed(record.source, record.evidence, step);
    }
  }

  function renderSourceRail(step) {
    const throughOrder = sourceIndexById.get(step.sourceThroughId);
    for (const source of fixture.sources) {
      const item = sourceElements.get(source.id);
      const state = source.order < throughOrder ? "past" : source.order === throughOrder ? "current" : "future";
      item.dataset.sourceState = state;
      item.setAttribute(
        "aria-label",
        `Stage ${source.order + 1} of ${fixture.sources.length}: ${source.label}. ${formatCount(source.recordCount)} records. ${state}.`,
      );
      if (state === "current") item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    }

    const source = fixture.sources.find((item) => item.id === step.sourceThroughId);
    const revealedEvidence = source.evidence.filter((evidence) => evidenceIsRevealed(source, evidence, step));
    elements.sourceQuoteLabel.textContent = `${source.label} · ${revealedEvidence.length} of ${source.evidence.length} representative items`;
    elements.sourceSummary.textContent = source.summary;
    const fragment = document.createDocumentFragment();
    for (const evidence of [...source.evidence].sort((a, b) => a.order - b.order)) {
      if (!evidenceIsRevealed(source, evidence, step)) continue;
      const item = document.createElement("li");
      item.className = `evidence-item${evidence.origin === "external" ? " is-external" : ""}`;
      const top = document.createElement("div");
      top.className = "evidence-item-top";
      top.append(
        createTextElement("span", "evidence-kind", evidence.kindLabel),
        createTextElement("span", "evidence-governance", evidence.origin === "external" ? "External · heard only" : "Approved deal evidence"),
      );
     if (evidence.timestamp) {
        const time = createTextElement("time", "evidence-time", evidence.timestampLabel || evidence.timestamp);
        time.dateTime = evidence.timestamp;
        top.prepend(time);
      }
      item.append(
        top,
        createTextElement("strong", "evidence-name", evidence.label),
        createTextElement("span", "evidence-stakeholder", evidence.stakeholder),
      );
      if (isText(evidence.historicalRelationship)) {
        item.append(createTextElement("span", "evidence-connector-note", evidence.historicalRelationship));
      }
      item.setAttribute(
        "aria-label",
        `${evidence.kindLabel}: ${evidence.label}. ${evidence.stakeholder}. ${evidence.origin === "external" ? "External, heard-only, cannot confirm and cannot block." : "Approved deal evidence."}${isText(evidence.historicalRelationship) ? ` ${evidence.historicalRelationship}` : ""}`,
      );
      fragment.append(item);
    }
    elements.evidenceList.replaceChildren(fragment);
  }

  function activeExampleIdFor(step) {
    return manualExampleId || step.selectedExampleId;
  }

  function renderClusters(step) {
    const activeExampleId = activeExampleIdFor(step);
    for (const cluster of fixture.clusters) {
      const state = currentStates.get(cluster.id);
      const counts = currentSupport.get(cluster.id);
      const aggregates = currentAggregates.get(cluster.id);
      const entry = clusterElements.get(cluster.id);
      entry.card.dataset.state = state;
      entry.card.classList.toggle("is-focused", activeExampleId === cluster.representative.id);
      entry.state.textContent = STATE_LABELS[state];
      entry.inspect.disabled = state === "hidden";
      entry.atomicMetric.textContent = `${formatCount(aggregates.atomicCount)} items`;
      entry.sourceMetric.textContent = `${formatCount(aggregates.sourceCount)} sources`;
      entry.provenanceMetric.textContent = `${formatCount(aggregates.provenanceCount)} provenance`;
      const completion = cluster.metrics.atomicCount ? aggregates.atomicCount / cluster.metrics.atomicCount : 0;
      const visibleDensity = Math.round(cluster.metrics.densityPercent * completion);
      entry.density.style.setProperty("--density", `${visibleDensity}%`);
      entry.density.setAttribute("aria-label", `Current cluster density ${visibleDensity} percent`);

      if (counts.total === 0) entry.support.textContent = "No revealed evidence";
      else if (counts.approved === 0) entry.support.textContent = `${counts.external} external · heard only`;
      else entry.support.textContent = `${counts.total} evidence · ${counts.approved} approved`;

      if (state === "hidden") {
        entry.card.setAttribute("aria-hidden", "true");
        entry.card.removeAttribute("aria-label");
      } else {
        entry.card.setAttribute("aria-hidden", "false");
        const missingQualifier = state === "missing" ? " Confirmed in memory but missing from the checked draft." : "";
        entry.card.setAttribute(
          "aria-label",
          `${cluster.label}. ${cluster.summary}. Currently ${formatCount(aggregates.atomicCount)} atomic items, ${formatCount(aggregates.sourceCount)} sources, ${formatCount(aggregates.provenanceCount)} provenance links. State: ${STATE_LABELS[state]}.${missingQualifier}`,
        );
      }
    }
    elements.teachingCard.setAttribute(
      "aria-hidden",
      currentStates.get(fixture.story.teachingClusterId) === "hidden" ? "true" : "false",
    );
  }

  function evidenceSupportForExample(step, exampleId) {
    const throughOrder = sourceIndexById.get(step.sourceThroughId);
    const result = { total: 0, approved: 0, external: 0, historical: 0 };
    for (const source of fixture.sources) {
      if (source.order > throughOrder) continue;
      for (const evidence of source.evidence) {
        if (!evidenceIsRevealed(source, evidence, step)) continue;
        if (!evidence.claims.some((claim) => claim.exampleIds.includes(exampleId))) continue;
        result.total += 1;
        result[evidence.origin] += 1;
        if (isText(evidence.historicalRelationship)) result.historical += 1;
      }
    }
    return result;
  }

  function renderExample(step, { focus = false } = {}) {
    const exampleId = activeExampleIdFor(step);
    if (!exampleId) {
      elements.exampleDrawer.setAttribute("aria-hidden", "true");
      return;
    }
    const example = exampleById.get(exampleId);
    const cluster = clusterByExampleId.get(exampleId);
    const counts = evidenceSupportForExample(step, exampleId);
    const state = currentExampleStates.get(exampleId);
    elements.exampleDrawer.setAttribute("aria-hidden", "false");
    elements.exampleDrawer.dataset.state = state;
    elements.exampleKicker.textContent = step.exampleKicker || fixture.story.exampleKicker;
    elements.exampleTitle.textContent = example.label;
    elements.exampleScale.textContent = `1 example · ${formatCount(cluster.metrics.atomicCount)} items in cluster`;
    elements.exampleValue.textContent = example.displayValue;
    elements.examplePlain.textContent = example.plainLanguage;
    const provenance = document.createDocumentFragment();
    provenance.append(
     createTextElement("span", "", `${counts.total} revealed evidence`),
     createTextElement("span", "", `${counts.approved} approved`),
      createTextElement("span", "", `${counts.historical} historical ${fixture.historicalNavigator.name} edge${counts.historical === 1 ? "" : "s"}`),
     createTextElement("strong", "", STATE_LABELS[state]),
    );
    elements.exampleProvenance.replaceChildren(provenance);
    if (focus) elements.exampleDrawer.focus({ preventScroll: false });
  }

  function simulationAudioAvailable() {
    return typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance === "function";
  }

  function cancelSimulationAudio(message = "") {
    if (simulationAudioAvailable()) window.speechSynthesis.cancel();
    simulationSpeaking = false;
    elements.simulationPlay.setAttribute("aria-pressed", "false");
    elements.simulationPlay.textContent = fixture?.completionLoop?.simulation?.playLabel || "Play prepared call";
    elements.simulationSkip.disabled = true;
    if (message) elements.simulationStatus.textContent = message;
  }

  function visibleSimulationEntries() {
    if (!fixture) return [];
    const step = fixture.presentation.steps[currentStepIndex];
    if (!step || step.transcriptThroughId === null) return [];
    const throughIndex = fixture.completionLoop.transcript.findIndex((entry) => entry.id === step.transcriptThroughId);
    const allowedIds = new Set(fixture.completionLoop.simulation.utteranceEntryIds);
    return fixture.completionLoop.transcript
      .slice(0, throughIndex + 1)
      .filter((entry) => allowedIds.has(entry.id));
  }

  function playPreparedSimulation() {
    pausePlayback();
    if (simulationMuted) {
      elements.simulationStatus.textContent = "Audio is muted. The authoritative transcript remains visible.";
      return;
    }
    if (!simulationAudioAvailable()) {
      elements.simulationStatus.textContent = fixture.completionLoop.simulation.silentFallback;
      return;
    }
    const entries = visibleSimulationEntries();
    if (!entries.length) {
      elements.simulationStatus.textContent = "No prepared-call turns are visible at this step yet.";
      return;
    }
    cancelSimulationAudio();
    simulationSpeaking = true;
    elements.simulationPlay.setAttribute("aria-pressed", "true");
    elements.simulationPlay.textContent = "Stop prepared call";
    elements.simulationSkip.disabled = false;
    elements.simulationStatus.textContent = `Playing ${entries.length} prepared transcript turn${entries.length === 1 ? "" : "s"}.`;
    entries.forEach((entry, index) => {
      const utterance = new window.SpeechSynthesisUtterance(`${entry.speaker}. ${entry.text}`);
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      if (index === entries.length - 1) {
        utterance.onend = () => {
          simulationSpeaking = false;
          elements.simulationPlay.setAttribute("aria-pressed", "false");
          elements.simulationPlay.textContent = fixture.completionLoop.simulation.playLabel;
          elements.simulationStatus.textContent = "Prepared audio complete. Transcript and receipts remain authoritative.";
        };
        utterance.onerror = () => {
          cancelSimulationAudio(fixture.completionLoop.simulation.silentFallback);
        };
      }
      window.speechSynthesis.speak(utterance);
    });
  }

  function toggleSimulationMute() {
    simulationMuted = !simulationMuted;
    cancelSimulationAudio(
      simulationMuted
        ? "Audio muted. Continue silently with the authoritative transcript."
        : "Audio available. Nothing plays until you choose Play prepared call.",
    );
    elements.simulationMute.setAttribute("aria-pressed", String(simulationMuted));
    elements.simulationMute.textContent = simulationMuted
      ? fixture.completionLoop.simulation.unmuteLabel
      : fixture.completionLoop.simulation.muteLabel;
  }

  function renderWhoKnowsWhat(step) {
    const state = step.knowledgeState;
    const hidden = state === "hidden";
    const selectedContact = fixture.knowledgeDirectory.contacts.find((contact) => contact.selected);
    elements.knowledgePanel.setAttribute("aria-hidden", hidden ? "true" : "false");
    if (hidden) {
      elements.simulationCall.setAttribute("aria-hidden", "true");
      return;
    }

    const stateCopy = {
      ranked: `${fixture.knowledgeDirectory.contacts.length} candidates ranked`,
      selected: `${selectedContact.name} selected`,
      confirmed: `${selectedContact.name} · sourced response captured`,
    };
    elements.knowledgeState.textContent = stateCopy[state];
    for (const contact of fixture.knowledgeDirectory.contacts) {
      const item = contactElements.get(contact.id);
      const selected = contact.selected && (state === "selected" || state === "confirmed");
      item.dataset.contactState = contact.selected && state === "confirmed" ? "confirmed" : selected ? "selected" : "ranked";
      if (selected) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
    }

    const showSimulation = state === "selected" || state === "confirmed";
    elements.simulationCall.setAttribute("aria-hidden", showSimulation ? "false" : "true");
    const visibleEntries = visibleSimulationEntries();
    elements.simulationPlay.disabled = !showSimulation || !visibleEntries.length;
    elements.simulationMute.disabled = !showSimulation || !simulationAudioAvailable();
    elements.simulationSkip.disabled = !showSimulation || !simulationSpeaking;
    elements.simulationMute.setAttribute("aria-pressed", String(simulationMuted));
    elements.simulationMute.textContent = simulationMuted
      ? fixture.completionLoop.simulation.unmuteLabel
      : fixture.completionLoop.simulation.muteLabel;
    if (!simulationSpeaking) {
      elements.simulationStatus.textContent = simulationAudioAvailable()
        ? state === "confirmed"
          ? "Sourced response captured. Optional audio can replay the visible turns."
          : "Prepared call ready. Audio starts only on presenter request."
        : fixture.completionLoop.simulation.silentFallback;
    }
  }

  function renderCompletionLoop(step) {
    cancelSimulationAudio();
    const hiddenForPaper = step.draftId !== null;
    elements.completionShell.setAttribute("aria-hidden", hiddenForPaper ? "true" : "false");
    if (hiddenForPaper) return;
    renderWhoKnowsWhat(step);

    const activeStageIndex = fixture.completionLoop.stages.findIndex((stage) => stage.id === step.loopStageId);
    [...elements.loopStages.children].forEach((item, index) => {
      const state = index < activeStageIndex ? "past" : index === activeStageIndex ? "current" : "future";
      item.dataset.stageState = state;
      if (state === "current") item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });

    const throughIndex = step.transcriptThroughId === null
      ? -1
      : fixture.completionLoop.transcript.findIndex((entry) => entry.id === step.transcriptThroughId);
    const fragment = document.createDocumentFragment();
    fixture.completionLoop.transcript.slice(0, throughIndex + 1).forEach((entry) => {
      const item = document.createElement("article");
      item.className = `transcript-entry status-${entry.status}`;
      const header = document.createElement("header");
      header.append(
        createTextElement("strong", "", entry.speaker),
        createTextElement("span", "", entry.role),
      );
      const status = createTextElement(
        "span",
        "transcript-status",
        entry.substantive ? "Substantive · can update memory" : entry.status === "vague" ? "Vague · gap stays open" : "Investigation step",
      );
      item.append(header, createTextElement("p", "", entry.text), status);
      if (entry.evidenceIds.length) {
        const citations = document.createElement("div");
        citations.className = "transcript-citations";
        citations.setAttribute("aria-label", "Cited evidence receipts");
        for (const evidenceId of entry.evidenceIds) {
          citations.append(createTextElement("span", "", evidenceById.get(evidenceId).evidence.label));
        }
        item.append(citations);
      }
      fragment.append(item);
    });
    elements.completionTranscript.replaceChildren(fragment);

    const receiptIndex = fixture.completionLoop.transcript.findIndex(
      (entry) => entry.id === fixture.completionLoop.receiptEntryId,
    );
    elements.memoryReceipt.setAttribute("aria-hidden", throughIndex >= receiptIndex ? "false" : "true");
    if (throughIndex >= 0) elements.completionTranscript.scrollTop = elements.completionTranscript.scrollHeight;
  }

  function renderContract(step, draft, missing) {
    if (!draft) {
      elements.contractShell.setAttribute("aria-hidden", "true");
      elements.contractShell.dataset.draftState = "none";
      elements.clauseList.replaceChildren();
      return;
    }
    elements.contractShell.setAttribute("aria-hidden", "false");
    elements.contractShell.dataset.draftState = missing.length ? "missing" : "complete";
    elements.contractTitle.textContent = draft.label;
    elements.paperRevision.textContent = draft.revisionLabel;
    elements.calloutTitle.textContent = step.calloutTitle;
    elements.calloutBody.textContent = step.calloutBody;

    const links = new Map(draft.links.map((link) => [link.exampleId, link]));
    const expectedClusters = fixture.clusters
      .filter((cluster) => cluster.representative.expectedInDraft)
      .sort((a, b) => a.representative.paperSlot - b.representative.paperSlot);
    elements.clauseList.style.setProperty("--clause-count", String(expectedClusters.length));
    const fragment = document.createDocumentFragment();
    for (const cluster of expectedClusters) {
      const example = cluster.representative;
      const link = links.get(example.id);
      const item = document.createElement("li");
      item.className = `clause-slot ${link ? "is-written" : "is-empty"}`;
      item.dataset.exampleId = example.id;
      item.style.gridRow = String(example.paperSlot + 1);
      if (link) {
        const copy = document.createElement("div");
        copy.append(
          createTextElement("p", "clause-text", link.excerpt),
          createTextElement("span", "clause-link-label", `Linked to ${cluster.label} example`),
        );
        item.append(copy);
        item.setAttribute("aria-label", `Clause ${example.paperSlot + 1}. ${link.excerpt} Linked to the ${cluster.label} representative.`);
      } else {
        item.append(createTextElement("span", "sr-only", `Clause ${example.paperSlot + 1} is blank. ${example.label} is missing from this draft.`));
      }
      fragment.append(item);
    }
    elements.clauseList.replaceChildren(fragment);
  }

  function renderProgress() {
    stepButtons.forEach((button, index) => {
      const state = index < currentStepIndex ? "past" : index === currentStepIndex ? "current" : "future";
      button.dataset.stepState = state;
      if (state === "current") button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
  }

  function setStep(index, { manual = true, announce = true } = {}) {
    const bounded = Math.max(0, Math.min(index, fixture.presentation.steps.length - 1));
    if (manual) pausePlayback();
    manualExampleId = null;
    currentStepIndex = bounded;
    remainingMs = fixture.presentation.steps[currentStepIndex].durationMs;
    render({ announce });
    elements.autoMeterFill.style.width = "0%";
  }

  function updateControlState() {
    const duration = formatDuration(totalReplayDuration());
    elements.previousButton.disabled = currentStepIndex === 0;
    elements.nextButton.disabled = currentStepIndex === fixture.presentation.steps.length - 1;
    elements.playButton.setAttribute("aria-pressed", String(playing));
    elements.playIcon.textContent = playing ? "Ⅱ" : "▶";
    if (playing) elements.playLabel.textContent = "Pause";
    else if (currentStepIndex === fixture.presentation.steps.length - 1) elements.playLabel.textContent = `Play again ${duration}`;
    else elements.playLabel.textContent = `Play ${duration}`;
  }

  function startPlayback({ restart = false } = {}) {
    if (playing && !restart) return;
    if (playing && restart) pausePlayback();
    if (restart || currentStepIndex === fixture.presentation.steps.length - 1) {
      currentStepIndex = 0;
      manualExampleId = null;
      remainingMs = fixture.presentation.steps[0].durationMs;
      render({ announce: true });
      elements.autoMeterFill.style.width = "0%";
    } else if (remainingMs <= 0) {
      remainingMs = fixture.presentation.steps[currentStepIndex].durationMs;
    }
    playing = true;
    updateControlState();
    scheduleTimer();
  }

  function pausePlayback() {
    if (!playing) return;
    remainingMs = Math.max(0, remainingMs - (performance.now() - timerStartedAt));
    playing = false;
    window.clearTimeout(timerId);
    window.cancelAnimationFrame(animationFrameId);
    updateControlState();
    updateMeter();
  }

  function togglePlayback() {
    if (playing) pausePlayback();
    else startPlayback();
  }

  function scheduleTimer() {
    timerStartedAt = performance.now();
    timerId = window.setTimeout(handleTimerComplete, remainingMs);
    animationFrameId = window.requestAnimationFrame(updateMeter);
  }

  function handleTimerComplete() {
    if (currentStepIndex < fixture.presentation.steps.length - 1) {
      currentStepIndex += 1;
      manualExampleId = null;
      remainingMs = fixture.presentation.steps[currentStepIndex].durationMs;
      render({ announce: true });
      scheduleTimer();
    } else {
      remainingMs = 0;
      playing = false;
      updateControlState();
      elements.autoMeterFill.style.width = "100%";
    }
  }

  function updateMeter() {
    const duration = fixture.presentation.steps[currentStepIndex].durationMs;
    const remaining = playing ? Math.max(0, remainingMs - (performance.now() - timerStartedAt)) : remainingMs;
    elements.autoMeterFill.style.width = `${Math.max(0, Math.min(1, 1 - remaining / duration)) * 100}%`;
    if (playing) animationFrameId = window.requestAnimationFrame(updateMeter);
  }

  function requestConnectionDraw() {
    window.cancelAnimationFrame(connectionFrameId);
    window.clearTimeout(connectionTimeoutId);
    connectionFrameId = window.requestAnimationFrame(() => {
      drawConnections();
      connectionTimeoutId = window.setTimeout(drawConnections, 280);
    });
  }

  function appendConnection(start, end, state, orientation, { dot = true, extraClass = "" } = {}) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("class", `connection-path ${state}${extraClass ? ` ${extraClass}` : ""}`);
    if (orientation === "horizontal") {
      const bend = Math.max(35, Math.abs(end.x - start.x) * 0.4);
      path.setAttribute("d", `M ${start.x} ${start.y} C ${start.x + bend} ${start.y}, ${end.x - bend} ${end.y}, ${end.x} ${end.y}`);
    } else {
      const bend = Math.max(35, Math.abs(end.y - start.y) * 0.4);
      path.setAttribute("d", `M ${start.x} ${start.y} C ${start.x} ${start.y + bend}, ${end.x} ${end.y - bend}, ${end.x} ${end.y}`);
    }
    elements.connectionLayer.append(path);
    if (!dot) return;
    const endpoint = document.createElementNS(SVG_NS, "circle");
    endpoint.setAttribute("class", `connection-dot ${state}`);
    endpoint.setAttribute("cx", String(end.x));
    endpoint.setAttribute("cy", String(end.y));
    endpoint.setAttribute("r", state === "missing" ? "7" : "5");
    elements.connectionLayer.append(endpoint);
  }

  function drawSourceToCluster(stageRect, source, cluster, { externalOnly = false, selected = false, offset = 0 } = {}) {
    const sourceRect = sourceElements.get(source.id).getBoundingClientRect();
    const cardRect = clusterElements.get(cluster.id).card.getBoundingClientRect();
    const horizontal = cardRect.left > sourceRect.right + 20;
    const start = horizontal
      ? { x: sourceRect.right - stageRect.left, y: sourceRect.top + sourceRect.height / 2 - stageRect.top + offset }
      : { x: sourceRect.left + sourceRect.width / 2 - stageRect.left + offset, y: sourceRect.bottom - stageRect.top };
    const end = horizontal
      ? { x: cardRect.left - stageRect.left, y: cardRect.top + cardRect.height / 2 - stageRect.top }
      : { x: cardRect.left + cardRect.width / 2 - stageRect.left, y: cardRect.top - stageRect.top };
    appendConnection(
      start,
      end,
      "memory",
      horizontal ? "horizontal" : "vertical",
      { dot: false, extraClass: `${externalOnly ? "external" : "approved"}${selected ? " selected" : ""}` },
    );
  }

  function drawMemoryPaths(step, stageRect) {
    const selectedExampleId = activeExampleIdFor(step);
    if (step.draftId && selectedExampleId) {
      const selectedCluster = clusterByExampleId.get(selectedExampleId);
      fixture.sources
        .filter((source) => source.order <= sourceIndexById.get(step.sourceThroughId))
        .filter((source) =>
          source.evidence.some(
            (evidence) =>
              evidenceIsRevealed(source, evidence, step) &&
              evidence.origin === "approved" &&
              evidence.governance.canBlock &&
              evidence.claims.some((claim) => claim.exampleIds.includes(selectedExampleId)),
          ),
        )
        .forEach((source, index) => drawSourceToCluster(stageRect, source, selectedCluster, { selected: true, offset: (index - 1) * 4 }));
      return;
    }

    if (step.draftId) return;
    const source = fixture.sources.find((item) => item.id === step.sourceThroughId);
    const clusterClaims = new Map();
    for (const evidence of source.evidence) {
      if (!evidenceIsRevealed(source, evidence, step)) continue;
      for (const claim of evidence.claims) {
        if (currentStates.get(claim.clusterId) === "hidden") continue;
        if (!clusterClaims.has(claim.clusterId)) clusterClaims.set(claim.clusterId, { approved: 0, external: 0 });
        clusterClaims.get(claim.clusterId)[evidence.origin] += 1;
      }
    }
    [...clusterClaims.entries()].slice(0, 6).forEach(([clusterId, counts], index) => {
      drawSourceToCluster(stageRect, source, clusterById.get(clusterId), {
        externalOnly: counts.approved === 0,
        offset: (index - Math.min(clusterClaims.size, 6) / 2) * 2,
      });
    });
  }

  function drawContractPaths(step, stageRect) {
    if (!step.draftId || elements.contractShell.getAttribute("aria-hidden") === "true") return;
    const paperRect = elements.contractPaper.getBoundingClientRect();
    for (const cluster of fixture.clusters.filter((item) => item.representative.expectedInDraft)) {
      const state = currentStates.get(cluster.id);
      if (state !== "written" && state !== "missing") continue;
      const cardRect = clusterElements.get(cluster.id).card.getBoundingClientRect();
      const target = elements.clauseList.querySelector(`[data-example-id="${cluster.representative.id}"]`);
      if (!target) continue;
      const targetRect = target.getBoundingClientRect();
      const horizontal = paperRect.left > cardRect.right + 20;
      const start = horizontal
        ? { x: cardRect.right - stageRect.left, y: cardRect.top + cardRect.height / 2 - stageRect.top }
        : { x: cardRect.left + cardRect.width / 2 - stageRect.left, y: cardRect.bottom - stageRect.top };
      const end = horizontal
        ? {
            x: state === "missing" ? paperRect.left - stageRect.left - 3 : targetRect.left - stageRect.left + 1,
            y: targetRect.top + targetRect.height / 2 - stageRect.top,
          }
        : {
            x: targetRect.left + targetRect.width / 2 - stageRect.left,
            y: state === "missing" ? paperRect.top - stageRect.top - 3 : targetRect.top - stageRect.top + 1,
          };
      appendConnection(start, end, state, horizontal ? "horizontal" : "vertical");
    }
  }

  function drawExpertRecoveryPath(step, stageRect) {
    if (step.draftId || step.knowledgeState === "hidden" || elements.knowledgePanel.getAttribute("aria-hidden") === "true") return;
    const selectedContact = fixture.knowledgeDirectory.contacts.find((contact) => contact.selected);
    const contactElement = contactElements.get(selectedContact.id);
    const selectedCluster = clusterByExampleId.get(fixture.story.demonstratedOmissionId);
    if (!contactElement || !selectedCluster) return;
    const contactRect = contactElement.getBoundingClientRect();
    const clusterRect = clusterElements.get(selectedCluster.id).card.getBoundingClientRect();
    if (!contactRect.width || !clusterRect.width) return;
    const horizontal = contactRect.left > clusterRect.right + 20;
    const start = horizontal
      ? { x: clusterRect.right - stageRect.left, y: clusterRect.top + clusterRect.height / 2 - stageRect.top }
      : { x: clusterRect.left + clusterRect.width / 2 - stageRect.left, y: clusterRect.bottom - stageRect.top };
    const end = horizontal
      ? { x: contactRect.left - stageRect.left, y: contactRect.top + contactRect.height / 2 - stageRect.top }
      : { x: contactRect.left + contactRect.width / 2 - stageRect.left, y: contactRect.top - stageRect.top };
    const filled = currentExampleStates.get(fixture.story.demonstratedOmissionId) === "confirmed";
    appendConnection(start, end, "memory", horizontal ? "horizontal" : "vertical", {
      dot: false,
      extraClass: `expert-route ${filled ? "filled" : "hollow"}`,
    });
  }

  function drawConnections() {
    elements.connectionLayer.replaceChildren();
    if (!fixture) return;
    const stageRect = elements.stage.getBoundingClientRect();
    if (!stageRect.width || !stageRect.height) return;
    elements.connectionLayer.setAttribute("viewBox", `0 0 ${stageRect.width} ${stageRect.height}`);
    const step = fixture.presentation.steps[currentStepIndex];
    drawMemoryPaths(step, stageRect);
    drawExpertRecoveryPath(step, stageRect);
    drawContractPaths(step, stageRect);
  }

  function bindControls() {
    elements.previousButton.addEventListener("click", () => setStep(currentStepIndex - 1, { manual: true }));
    elements.nextButton.addEventListener("click", () => setStep(currentStepIndex + 1, { manual: true }));
    elements.playButton.addEventListener("click", togglePlayback);
    elements.replayButton.addEventListener("click", () => startPlayback({ restart: true }));
    elements.simulationPlay.addEventListener("click", () => {
      if (simulationSpeaking) cancelSimulationAudio("Prepared audio stopped. Continue with the visible transcript.");
      else playPreparedSimulation();
    });
    elements.simulationMute.addEventListener("click", toggleSimulationMute);
    elements.simulationSkip.addEventListener("click", () => {
      cancelSimulationAudio("Audio skipped. Continue silently with the authoritative transcript.");
    });
    document.addEventListener("keydown", (event) => {
      const target = event.target;
      const textInteractive =
        target instanceof HTMLElement &&
        (target.matches("input, select, textarea") || target.isContentEditable);
      if (textInteractive) return;
      const nativeInteractive =
        target instanceof HTMLElement && target.matches("button, a, summary, [role='button']");
      if (nativeInteractive && event.code === "Space") return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        setStep(currentStepIndex + 1, { manual: true });
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        setStep(currentStepIndex - 1, { manual: true });
      } else if (event.key === "Home") {
        event.preventDefault();
        setStep(0, { manual: true });
      } else if (event.key === "End") {
        event.preventDefault();
        setStep(fixture.presentation.steps.length - 1, { manual: true });
      } else if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        startPlayback({ restart: true });
      } else if (event.code === "Space") {
        event.preventDefault();
        togglePlayback();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && playing) pausePlayback();
      if (document.hidden) cancelSimulationAudio("Audio stopped while the page was hidden.");
    });
    window.addEventListener("pagehide", () => cancelSimulationAudio());
  }

  function showError(error) {
    console.error(error);
    elements.app.setAttribute("aria-busy", "false");
    elements.errorMessage.textContent = `${error.message} Serve the frontend over HTTP, then refresh.`;
    elements.errorPanel.hidden = false;
    elements.storyBar.hidden = true;
    elements.evidenceRiver.hidden = true;
    elements.stage.hidden = true;
    document.querySelector(".legend").hidden = true;
    document.querySelector(".presenter-controls").hidden = true;
    elements.liveStatus.textContent = "Deal Witness could not load its local fixture.";
  }

  async function init() {
    try {
      const fixtureUrl = document.documentElement.dataset.fixtureUrl;
      assert(fixtureUrl, "the document needs data-fixture-url");
      const response = await fetch(fixtureUrl, { cache: "no-store", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Fixture request failed with HTTP ${response.status}.`);
      hydrateFixture(validateFixture(await response.json()));
    } catch (error) {
      showError(error instanceof Error ? error : new Error("Unknown fixture error."));
    }
  }

  init();
})();
