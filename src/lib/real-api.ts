/**
 * Real backend API client. Replaces the fabricated numbers in demo-data.ts's
 * METRICS export with a live call to GET /metrics, which reads directly from
 * app/ml_artifacts/training_results.txt (see app/routers/metrics.py).
 *
 * IMPORTANT: the backend currently has ONE trained pipeline (the synthetic
 * 2026 dataset). The "original" vs "ieee" pipeline toggle in this UI was
 * fabricated data for BOTH options -- there is no live /metrics-equivalent
 * for an IEEE-CIS pipeline yet on this backend. Until that exists, this
 * client only serves real data for "original" and throws clearly, rather
 * than silently falling back to fake numbers, if "ieee" is requested.
 */

const API_BASE = import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:8000";

export interface BaselineRow {
  label: string;
  roc_auc: number;
  pr_auc: number;
  threshold: number;
  precision: number;
  recall: number;
  cost_inr: number;
}

export interface CostCurvePoint {
  threshold: number;
  cost_inr: number;
  fp: number;
  fn: number;
}

export interface RealMetrics {
  model: string;
  held_out_test_set_size: number;
  auc: number;
  precision: number;
  recall: number;
  cost_optimal_threshold: number;
  cost_optimal_total_cost_inr: number;
  default_threshold_cost_inr: number;
  confusion_matrix_at_optimal_threshold: string;
  cost_figures_source: string;
  baseline_comparison_raw: string;
  baseline_comparison: BaselineRow[] | null;
  cost_curve: { curve: CostCurvePoint[]; cost_fp: number; cost_fn: number } | null;
}

export class BackendNotReadyError extends Error {}

export async function fetchRealMetrics(pipeline: "original" | "ieee"): Promise<RealMetrics> {
  if (pipeline === "ieee") {
    throw new BackendNotReadyError(
      "No live /metrics endpoint exists yet for the IEEE-CIS pipeline on this backend. " +
      "The 'ieee' numbers shown previously were entirely fabricated placeholder data, not real " +
      "results. Wire this up once app/routers/metrics.py (or an ieee-specific variant) supports it."
    );
  }

  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) {
    throw new Error(`Backend returned ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();

  if (data.error) {
    throw new BackendNotReadyError(data.error);
  }

  return data as RealMetrics;
}

export interface RealAuditEvent {
  transaction_id: string;
  stage: string;
  actor: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export async function fetchRealAuditLog(transactionId?: string): Promise<RealAuditEvent[]> {
  const url = transactionId
    ? `${API_BASE}/audit-log?transaction_id=${encodeURIComponent(transactionId)}`
    : `${API_BASE}/audit-log`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Backend returned ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export interface RealDemoCustomer {
  real_razorpay_customer_id: string;
  real_razorpay_customer_name: string;
  transaction_count: number;
}

export async function fetchRealDemoCustomers(): Promise<RealDemoCustomer[]> {
  const res = await fetch(`${API_BASE}/demo/entity-drift/customers`);
  if (!res.ok) {
    throw new Error(`Backend returned ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export interface DriftResult {
  transaction_id: string;
  drift_score: number;
  drift_signals: string[];
  framing_note: string;
}

export interface EntityDriftResponse {
  real_razorpay_customer_id: string;
  real_razorpay_customer_name: string;
  history_size: number;
  latest_transaction_id: string;
  drift_result: DriftResult;
  note: string;
}

export async function runRealEntityDriftDemo(customerId: string): Promise<EntityDriftResponse> {
  const res = await fetch(`${API_BASE}/demo/entity-drift/${encodeURIComponent(customerId)}`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Backend returned ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

/** Maps the real backend's DecisionOutcome enum values to the UI's Decision type. */
export function outcomeToDecision(outcome: string): "approve" | "review" | "block" {
  if (outcome === "auto_approve") return "approve";
  if (outcome === "auto_reject") return "block";
  return "review"; // escalate_to_human
}

export interface TransactionPayload {
  transaction_id: string;
  amount_usd: number;
  merchant_category: string;
  card_type: string;
  auth_method: string;
  channel: string;
  device_type: string;
  is_foreign_transaction: boolean;
  hours_since_last_txn: number;
  txn_count_last_24h: number;
  distance_from_home_km: number;
  card_age_months: number;
  customer_age: number;
  account_balance_usd: number;
  is_new_merchant: boolean;
  used_vpn: boolean;
  ip_country_mismatch: boolean;
  billing_shipping_mismatch: boolean;
  cvv_retry_count: number;
  velocity_score: number;
  time_of_day_hour: number;
  day_of_week: number;
  is_ai_generated_scam_attempt: boolean;
  merchant_risk_score: number;
  prior_disputes: number;
}

export interface ProcessResult {
  drift: { transaction_id: string; drift_score: number; drift_signals: string[]; framing_note: string };
  score: {
    transaction_id: string;
    score: number;
    evidence: { signal: string; direction: string; strength: number; description: string }[];
    model_version: string;
  };
  review: { transaction_id: string; verdict: string; confidence_adjustment: number; reason: string };
  decision: { transaction_id: string; outcome: string; final_score: number; reason: string };
}

/** Runs a transaction through the full real pipeline: ingest -> process -> read back. */
export async function runRealTransaction(txn: TransactionPayload): Promise<ProcessResult> {
  const ingestRes = await fetch(`${API_BASE}/transactions/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(txn),
  });
  if (!ingestRes.ok) {
    throw new Error(`Ingest failed (${ingestRes.status}): ${await ingestRes.text()}`);
  }

  const processRes = await fetch(`${API_BASE}/transactions/${encodeURIComponent(txn.transaction_id)}/process`, {
    method: "POST",
  });
  if (!processRes.ok) {
    throw new Error(`Process failed (${processRes.status}): ${await processRes.text()}`);
  }
  return processRes.json();
}
