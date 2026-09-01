export type PipelineId = "original" | "ieee";

export type Decision = "approve" | "review" | "block";

export interface Metrics {
  auc: number;
  aucDelta: number;
  recall: number;
  recallDelta: number;
  optimalThreshold: number;
  defaultThreshold: number;
  costSaved: number;
  falsePositiveRate: number;
  precision: number;
  trainedOn: string;
  version: string;
  baselines: { label: string; auc: number; recall: number; netCost: number }[];
  costCurve: { threshold: number; cost: number }[];
}

export interface ShapFeature {
  feature: string;
  value: number;
}

export interface StageResult {
  id: string;
  name: string;
  detail: string;
  score: number | null;
  latencyMs: number;
}

export interface TxnPreset {
  id: string;
  label: string;
  note: string;
  amount: number;
  customer: string;
  merchantCategory: string;
  deviceAgeDays: number;
  geoDistanceKm: number;
  velocity1h: number;
  decision: Decision;
  confidence: number;
  stages: StageResult[];
  shap: ShapFeature[];
  reviewerReasoning: string;
}

export interface AuditEvent {
  id: string;
  txnId: string;
  stage: string;
  amount: number;
  decision: Decision | "pending";
  ts: string;
  hash: string;
  pipeline: PipelineId;
}

export interface CustomerEntity {
  id: string;
  name: string;
  city: string;
  medianTicket: number;
  txnCount: number;
  driftScore: number;
  flagged: boolean;
  history: { id: string; date: string; amount: number; category: string; decision: Decision }[];
}

export const PIPELINES: { id: PipelineId; label: string; blurb: string }[] = [
  { id: "original", label: "Original", blurb: "Razorpay curated ledger · 8 live entities" },
  { id: "ieee", label: "IEEE-CIS", blurb: "590k txn public benchmark · 434 features" },
];

const METRICS: Record<PipelineId, Metrics> = {
  original: {
    auc: 0.941,
    aucDelta: 0.023,
    recall: 0.874,
    recallDelta: 0.061,
    optimalThreshold: 0.62,
    defaultThreshold: 0.5,
    costSaved: 4820000,
    falsePositiveRate: 0.031,
    precision: 0.792,
    trainedOn: "184,220 labelled transactions",
    version: "v3.2.1",
    baselines: [
      { label: "Rules", auc: 0.712, recall: 0.61, netCost: 1420000 },
      { label: "Naive", auc: 0.843, recall: 0.74, netCost: 880000 },
      { label: "Trained", auc: 0.941, recall: 0.874, netCost: 312000 },
    ],
    costCurve: [
      { threshold: 0.3, cost: 1180000 },
      { threshold: 0.4, cost: 820000 },
      { threshold: 0.5, cost: 574000 },
      { threshold: 0.62, cost: 312000 },
      { threshold: 0.75, cost: 468000 },
      { threshold: 0.9, cost: 910000 },
    ],
  },
  ieee: {
    auc: 0.968,
    aucDelta: 0.041,
    recall: 0.913,
    recallDelta: 0.087,
    optimalThreshold: 0.71,
    defaultThreshold: 0.5,
    costSaved: 7140000,
    falsePositiveRate: 0.021,
    precision: 0.861,
    trainedOn: "590,540 benchmark transactions",
    version: "cis-v1.4",
    baselines: [
      { label: "Rules", auc: 0.688, recall: 0.57, netCost: 2260000 },
      { label: "Naive", auc: 0.861, recall: 0.79, netCost: 1140000 },
      { label: "Trained", auc: 0.968, recall: 0.913, netCost: 402000 },
    ],
    costCurve: [
      { threshold: 0.3, cost: 1640000 },
      { threshold: 0.4, cost: 1080000 },
      { threshold: 0.5, cost: 742000 },
      { threshold: 0.71, cost: 402000 },
      { threshold: 0.85, cost: 596000 },
      { threshold: 0.95, cost: 1240000 },
    ],
  },
};

export function getMetrics(pipeline: PipelineId): Metrics {
  return METRICS[pipeline];
}

export const TXN_PRESETS: TxnPreset[] = [
  {
    id: "TXN-7685",
    label: "Curated real fraud case",
    note: "Confirmed chargeback · account takeover pattern",
    amount: 48200,
    customer: "cust_1207",
    merchantCategory: "electronics",
    deviceAgeDays: 2,
    geoDistanceKm: 1840,
    velocity1h: 9,
    decision: "block",
    confidence: 0.92,
    stages: [
      { id: "a1", name: "Agent 1 · Signal intake", detail: "velocity + device risk scored", score: 0.31, latencyMs: 180 },
      { id: "a2", name: "Agent 2 · Entity context", detail: "merchant category mismatch vs profile", score: 0.66, latencyMs: 340 },
      { id: "a3", name: "Agent 3 · Model inference", detail: "SHAP contributions attached", score: 0.88, latencyMs: 410 },
      { id: "router", name: "Decision Router", detail: "score exceeds 0.62 cost-optimal cut", score: 0.88, latencyMs: 46 },
    ],
    shap: [
      { feature: "amount_deviation", value: 0.31 },
      { feature: "device_age_days", value: 0.24 },
      { feature: "geo_distance_km", value: 0.18 },
      { feature: "velocity_1h", value: 0.12 },
      { feature: "merchant_history", value: -0.07 },
    ],
    reviewerReasoning:
      "Velocity spike coincides with a 1,840 km geo jump on a 2-day-old device. Amount is 6.2x the profile median and the merchant category has no prior history on this entity. Block and require identity re-verification before retry.",
  },
  {
    id: "TXN-7684",
    label: "Routine grocery purchase",
    note: "Clean baseline · approved on first pass",
    amount: 1250,
    customer: "cust_8842",
    merchantCategory: "grocery",
    deviceAgeDays: 412,
    geoDistanceKm: 3,
    velocity1h: 1,
    decision: "approve",
    confidence: 0.96,
    stages: [
      { id: "a1", name: "Agent 1 · Signal intake", detail: "known device, nominal velocity", score: 0.06, latencyMs: 120 },
      { id: "a2", name: "Agent 2 · Entity context", detail: "matches 14-month spend profile", score: 0.08, latencyMs: 210 },
      { id: "a3", name: "Agent 3 · Model inference", detail: "low contribution across all features", score: 0.07, latencyMs: 260 },
      { id: "router", name: "Decision Router", detail: "well below threshold — auto approve", score: 0.07, latencyMs: 31 },
    ],
    shap: [
      { feature: "device_age_days", value: -0.22 },
      { feature: "merchant_history", value: -0.16 },
      { feature: "amount_deviation", value: 0.05 },
      { feature: "geo_distance_km", value: -0.04 },
      { feature: "velocity_1h", value: 0.02 },
    ],
    reviewerReasoning:
      "Every signal sits inside the entity's established envelope. No evidence supporting escalation; approving without step-up keeps friction at zero.",
  },
  {
    id: "TXN-7683",
    label: "Borderline high-ticket travel",
    note: "Ambiguous · routed to human review queue",
    amount: 22900,
    customer: "cust_5519",
    merchantCategory: "travel",
    deviceAgeDays: 96,
    geoDistanceKm: 640,
    velocity1h: 3,
    decision: "review",
    confidence: 0.58,
    stages: [
      { id: "a1", name: "Agent 1 · Signal intake", detail: "moderate velocity, trusted device", score: 0.24, latencyMs: 150 },
      { id: "a2", name: "Agent 2 · Entity context", detail: "first travel spend for this entity", score: 0.49, latencyMs: 300 },
      { id: "a3", name: "Agent 3 · Model inference", detail: "score inside the uncertainty band", score: 0.58, latencyMs: 380 },
      { id: "router", name: "Decision Router", detail: "within ±0.06 of threshold — escalate", score: 0.58, latencyMs: 38 },
    ],
    shap: [
      { feature: "amount_deviation", value: 0.27 },
      { feature: "merchant_history", value: 0.19 },
      { feature: "geo_distance_km", value: 0.09 },
      { feature: "device_age_days", value: -0.11 },
      { feature: "velocity_1h", value: 0.03 },
    ],
    reviewerReasoning:
      "Amount and an unseen merchant category push the score up, but the device is well established and geo movement is domestic. Not enough separation to auto-block — send to L2 with the travel receipt request.",
  },
];

export const AUDIT_EVENTS: AuditEvent[] = [
  { id: "ev_10241", txnId: "TXN-7685", stage: "router", amount: 48200, decision: "block", ts: "2026-09-01 09:41:58", hash: "9f4c…a71e", pipeline: "original" },
  { id: "ev_10240", txnId: "TXN-7685", stage: "agent-3", amount: 48200, decision: "pending", ts: "2026-09-01 09:41:57", hash: "2b18…cc04", pipeline: "original" },
  { id: "ev_10239", txnId: "TXN-7685", stage: "agent-2", amount: 48200, decision: "pending", ts: "2026-09-01 09:41:56", hash: "7ad3…19bf", pipeline: "original" },
  { id: "ev_10238", txnId: "TXN-7685", stage: "agent-1", amount: 48200, decision: "pending", ts: "2026-09-01 09:41:56", hash: "c051…8e2a", pipeline: "original" },
  { id: "ev_10237", txnId: "TXN-7684", stage: "router", amount: 1250, decision: "approve", ts: "2026-09-01 09:41:44", hash: "44de…b620", pipeline: "original" },
  { id: "ev_10236", txnId: "TXN-7684", stage: "agent-3", amount: 1250, decision: "pending", ts: "2026-09-01 09:41:43", hash: "81fa…5d17", pipeline: "original" },
  { id: "ev_10235", txnId: "TXN-7683", stage: "router", amount: 22900, decision: "review", ts: "2026-09-01 09:41:20", hash: "0cc7…33a9", pipeline: "original" },
  { id: "ev_10234", txnId: "TXN-7683", stage: "agent-2", amount: 22900, decision: "pending", ts: "2026-09-01 09:41:19", hash: "e5b2…7710", pipeline: "original" },
  { id: "ev_10233", txnId: "TXN-7682", stage: "router", amount: 3400, decision: "approve", ts: "2026-09-01 09:40:51", hash: "3f90…21cd", pipeline: "ieee" },
  { id: "ev_10232", txnId: "TXN-7681", stage: "agent-1", amount: 9750, decision: "pending", ts: "2026-09-01 09:40:13", hash: "aa4b…9f38", pipeline: "ieee" },
  { id: "ev_10231", txnId: "TXN-7681", stage: "router", amount: 9750, decision: "review", ts: "2026-09-01 09:40:14", hash: "6d21…4c8e", pipeline: "ieee" },
  { id: "ev_10230", txnId: "TXN-7680", stage: "router", amount: 640, decision: "approve", ts: "2026-09-01 09:39:02", hash: "b7c4…0a55", pipeline: "ieee" },
];

export const CUSTOMERS: CustomerEntity[] = [
  {
    id: "cust_8842",
    name: "Ananya Deshpande",
    city: "Pune",
    medianTicket: 1180,
    txnCount: 214,
    driftScore: 0.31,
    flagged: false,
    history: [
      { id: "TXN-7684", date: "2026-09-01", amount: 1250, category: "grocery", decision: "approve" },
      { id: "TXN-7602", date: "2026-08-28", amount: 940, category: "grocery", decision: "approve" },
      { id: "TXN-7511", date: "2026-08-21", amount: 1320, category: "fuel", decision: "approve" },
      { id: "TXN-7488", date: "2026-08-14", amount: 1090, category: "pharmacy", decision: "approve" },
    ],
  },
  {
    id: "cust_1207",
    name: "Rohit Malhotra",
    city: "Gurugram",
    medianTicket: 7750,
    txnCount: 168,
    driftScore: 0.93,
    flagged: true,
    history: [
      { id: "TXN-7685", date: "2026-09-01", amount: 48200, category: "electronics", decision: "block" },
      { id: "TXN-7669", date: "2026-08-31", amount: 31500, category: "electronics", decision: "review" },
      { id: "TXN-7640", date: "2026-08-30", amount: 8100, category: "dining", decision: "approve" },
      { id: "TXN-7521", date: "2026-08-19", amount: 7400, category: "dining", decision: "approve" },
    ],
  },
  {
    id: "cust_5519",
    name: "Meera Krishnan",
    city: "Chennai",
    medianTicket: 4200,
    txnCount: 97,
    driftScore: 0.62,
    flagged: false,
    history: [
      { id: "TXN-7683", date: "2026-09-01", amount: 22900, category: "travel", decision: "review" },
      { id: "TXN-7590", date: "2026-08-26", amount: 4400, category: "apparel", decision: "approve" },
      { id: "TXN-7502", date: "2026-08-18", amount: 3980, category: "grocery", decision: "approve" },
    ],
  },
  {
    id: "cust_3390",
    name: "Vikram Shetty",
    city: "Bengaluru",
    medianTicket: 2600,
    txnCount: 331,
    driftScore: 0.44,
    flagged: false,
    history: [
      { id: "TXN-7671", date: "2026-08-31", amount: 2710, category: "saas", decision: "approve" },
      { id: "TXN-7615", date: "2026-08-29", amount: 2480, category: "saas", decision: "approve" },
      { id: "TXN-7540", date: "2026-08-22", amount: 3100, category: "dining", decision: "approve" },
    ],
  },
  {
    id: "cust_7741",
    name: "Farhan Qureshi",
    city: "Hyderabad",
    medianTicket: 890,
    txnCount: 76,
    driftScore: 0.38,
    flagged: false,
    history: [
      { id: "TXN-7660", date: "2026-08-30", amount: 910, category: "mobility", decision: "approve" },
      { id: "TXN-7588", date: "2026-08-25", amount: 780, category: "mobility", decision: "approve" },
      { id: "TXN-7499", date: "2026-08-17", amount: 1020, category: "grocery", decision: "approve" },
    ],
  },
  {
    id: "cust_2264",
    name: "Sneha Bhatt",
    city: "Ahmedabad",
    medianTicket: 15400,
    txnCount: 58,
    driftScore: 0.57,
    flagged: false,
    history: [
      { id: "TXN-7650", date: "2026-08-30", amount: 16800, category: "jewellery", decision: "approve" },
      { id: "TXN-7561", date: "2026-08-23", amount: 14200, category: "jewellery", decision: "approve" },
      { id: "TXN-7480", date: "2026-08-13", amount: 15900, category: "apparel", decision: "approve" },
    ],
  },
  {
    id: "cust_9018",
    name: "Karthik Rao",
    city: "Kochi",
    medianTicket: 3300,
    txnCount: 142,
    driftScore: 0.49,
    flagged: false,
    history: [
      { id: "TXN-7644", date: "2026-08-30", amount: 3210, category: "fuel", decision: "approve" },
      { id: "TXN-7570", date: "2026-08-24", amount: 3560, category: "grocery", decision: "approve" },
      { id: "TXN-7492", date: "2026-08-16", amount: 2980, category: "fuel", decision: "approve" },
    ],
  },
  {
    id: "cust_4455",
    name: "Divya Nair",
    city: "Mumbai",
    medianTicket: 5800,
    txnCount: 203,
    driftScore: 0.35,
    flagged: false,
    history: [
      { id: "TXN-7638", date: "2026-08-30", amount: 5900, category: "dining", decision: "approve" },
      { id: "TXN-7552", date: "2026-08-22", amount: 6100, category: "apparel", decision: "approve" },
      { id: "TXN-7470", date: "2026-08-12", amount: 5400, category: "grocery", decision: "approve" },
    ],
  },
];

export function formatInr(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  return `₹${value.toLocaleString("en-IN")}`;
}

export function decisionLabel(decision: Decision | "pending"): string {
  return { approve: "approved", review: "review", block: "blocked", pending: "in-flight" }[decision];
}
