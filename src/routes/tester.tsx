import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { DecisionBadge } from "@/components/DecisionBadge";
import { formatInr } from "@/lib/demo-data";
import {
  runRealTransaction,
  outcomeToDecision,
  type TransactionPayload,
  type ProcessResult,
} from "@/lib/real-api";

export const Route = createFileRoute("/tester")({
  head: () => ({
    meta: [
      { title: "Live Transaction Tester — Fraudline Console" },
      {
        name: "description",
        content:
          "Submit a real transaction to the live backend and watch it flow through Agent 1, 2, 3 and the Decision Router with real SHAP evidence and reviewer reasoning.",
      },
    ],
  }),
  component: Tester,
});

/**
 * Preset REQUEST BODIES, not pre-baked results. Clicking "Run" sends one of these
 * to the real backend and displays whatever it actually decides -- the outcome
 * is not scripted, unlike the previous fabricated version of this page.
 */
const PRESETS: { id: string; label: string; note: string; payload: Omit<TransactionPayload, "transaction_id"> }[] = [
  {
    id: "clean",
    label: "Routine grocery purchase",
    note: "Established card, familiar merchant, no unusual signals",
    payload: {
      amount_usd: 45, merchant_category: "grocery", card_type: "debit", auth_method: "pin",
      channel: "pos", device_type: "terminal", is_foreign_transaction: false,
      hours_since_last_txn: 20, txn_count_last_24h: 1, distance_from_home_km: 3,
      card_age_months: 36, customer_age: 42, account_balance_usd: 4200, is_new_merchant: false,
      used_vpn: false, ip_country_mismatch: false, billing_shipping_mismatch: false,
      cvv_retry_count: 0, velocity_score: 12, time_of_day_hour: 18, day_of_week: 3,
      is_ai_generated_scam_attempt: false, merchant_risk_score: 8, prior_disputes: 0,
    },
  },
  {
    id: "borderline",
    label: "New merchant, elevated velocity",
    note: "First-time merchant plus a burst of recent transactions -- ambiguous",
    payload: {
      amount_usd: 310, merchant_category: "electronics", card_type: "credit", auth_method: "otp",
      channel: "web", device_type: "mobile", is_foreign_transaction: false,
      hours_since_last_txn: 0.5, txn_count_last_24h: 6, distance_from_home_km: 40,
      card_age_months: 14, customer_age: 27, account_balance_usd: 1800, is_new_merchant: true,
      used_vpn: false, ip_country_mismatch: false, billing_shipping_mismatch: false,
      cvv_retry_count: 1, velocity_score: 55, time_of_day_hour: 23, day_of_week: 5,
      is_ai_generated_scam_attempt: false, merchant_risk_score: 38, prior_disputes: 0,
    },
  },
  {
    id: "high-risk",
    label: "VPN, foreign txn, CVV retries",
    note: "Multiple independent risk signals stacked together",
    payload: {
      amount_usd: 890, merchant_category: "digital_goods", card_type: "credit", auth_method: "otp",
      channel: "web", device_type: "desktop", is_foreign_transaction: true,
      hours_since_last_txn: 0.1, txn_count_last_24h: 9, distance_from_home_km: 6200,
      card_age_months: 3, customer_age: 24, account_balance_usd: 300, is_new_merchant: true,
      used_vpn: true, ip_country_mismatch: true, billing_shipping_mismatch: true,
      cvv_retry_count: 4, velocity_score: 88, time_of_day_hour: 3, day_of_week: 6,
      is_ai_generated_scam_attempt: false, merchant_risk_score: 74, prior_disputes: 2,
    },
  },
];

function Tester() {
  const [presetId, setPresetId] = useState(PRESETS[0]!.id);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const preset = PRESETS.find((p) => p.id === presetId)!;

  const run = useMutation({
    mutationFn: async () => {
      const payload: TransactionPayload = {
        transaction_id: `tester-${preset.id}-${Date.now()}`,
        ...preset.payload,
      };
      return runRealTransaction(payload);
    },
    onSuccess: (data) => setResult(data),
  });

  const decision = result ? outcomeToDecision(result.decision.outcome) : null;

  return (
    <AppShell title="Live transaction tester" breadcrumb="/ score">
      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 pb-3 pt-4">
          <div>
            <h2 className="text-[13px] font-semibold">Presets</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{preset.note}</p>
          </div>
          <button
            type="button"
            onClick={() => run.mutate()}
            disabled={run.isPending}
            className="chip-brand rounded-md px-3 py-1.5 text-[12px] font-medium disabled:opacity-50"
          >
            {run.isPending ? "Running through live pipeline…" : "Run against backend"}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 p-4 md:grid-cols-3">
          {PRESETS.map((p) => {
            const active = p.id === presetId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPresetId(p.id);
                  setResult(null);
                }}
                className={`rounded-md border p-3 text-left transition-colors ${
                  active ? "border-brand/40 bg-brand-soft/50" : "border-line bg-panel-2 hover:border-brand/25"
                }`}
              >
                <p className="num text-[12px] font-medium">{p.id}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{p.label}</p>
                <p className="num mt-2 text-[12px]">{formatInr(p.payload.amount_usd * 87)}</p>
              </button>
            );
          })}
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line px-4 py-3 md:grid-cols-5">
          {[
            ["Category", preset.payload.merchant_category],
            ["VPN", preset.payload.used_vpn ? "yes" : "no"],
            ["Foreign txn", preset.payload.is_foreign_transaction ? "yes" : "no"],
            ["CVV retries", preset.payload.cvv_retry_count],
            ["Velocity score", preset.payload.velocity_score],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="label-caps">{k}</dt>
              <dd className="num mt-1 text-[12px]">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {run.isError && (
        <div className="panel p-4">
          <p className="text-[12px] text-block">{(run.error as Error).message}. Is the backend running?</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <section className="panel xl:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 pb-3 pt-4">
            <h2 className="text-[13px] font-semibold">Agent pipeline</h2>
            <span className="num text-[10px] text-muted-foreground">
              Agent 1 (drift) → Agent 2 (score) → Agent 3 (review) → Router
            </span>
          </div>
          <div className="p-4">
            {!result ? (
              <p className="text-[12px] text-muted-foreground">
                Pick a preset and run it — this calls the real /transactions/ingest and
                /transactions/&#123;id&#125;/process endpoints, not a scripted animation.
              </p>
            ) : (
              <>
                <div className="rounded-md border border-line bg-panel-2 p-3">
                  <p className="label-caps">Agent 1 — Pattern/Evasion (drift)</p>
                  <p className="num mt-1 text-[12px]">drift score {result.drift.drift_score.toFixed(2)}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {result.drift.drift_signals.length > 0
                      ? result.drift.drift_signals.join("; ")
                      : "no elevated signal vs. population baseline"}
                  </p>
                </div>

                <div className="mt-3 rounded-md border border-line bg-panel-2 p-3">
                  <p className="label-caps">Agent 2 — Scoring</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="well h-1.5 flex-1 overflow-hidden p-0">
                      <span
                        className="animate-grow-row block h-full rounded-[3px]"
                        style={{ width: `${result.score.score * 100}%`, backgroundImage: "var(--gradient-brand)" }}
                      />
                    </span>
                    <span className="num w-14 text-right text-[11px]">{result.score.score.toFixed(3)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{result.score.model_version}</p>
                </div>

                <div className="mt-3 rounded-md border border-line bg-panel-2 p-3">
                  <p className="label-caps">Agent 3 — Reviewer</p>
                  <p className="num mt-1 text-[12px] font-medium">{result.review.verdict}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{result.review.reason}</p>
                </div>

                <div className="well mt-3 flex flex-wrap items-center justify-between gap-2 p-3">
                  <div>
                    <p className="label-caps">Router verdict</p>
                    <p className="mt-1 flex items-center gap-2 text-[13px] font-medium">
                      {decision && <DecisionBadge decision={decision} />}
                    </p>
                  </div>
                  <div className="num text-right text-[11px] text-muted-foreground">
                    <p>final score {result.decision.final_score.toFixed(3)}</p>
                    <p className="max-w-[220px] text-right">{result.decision.reason}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="panel xl:col-span-2">
          <div className="border-b border-line px-4 pb-3 pt-4">
            <h2 className="text-[13px] font-semibold">SHAP evidence</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Real per-feature contribution to the score</p>
          </div>
          <div className="space-y-2 p-4">
            {!result ? (
              <p className="text-[12px] text-muted-foreground">Run a transaction to see evidence.</p>
            ) : (
              result.score.evidence.map((e, i) => {
                const positive = e.direction === "supports_fraud";
                return (
                  <div key={e.signal} className="animate-stage-in" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="num flex justify-between text-[11px]">
                      <span className="text-muted-foreground">{e.signal}</span>
                      <span className={positive ? "text-block" : "text-approve"}>
                        {positive ? "+" : "−"}
                        {e.strength.toFixed(3)}
                      </span>
                    </div>
                    <div className="well mt-1 h-1.5 overflow-hidden p-0">
                      <span
                        className="block h-full rounded-[3px]"
                        style={{
                          width: `${Math.min(e.strength * 400, 100)}%`,
                          backgroundColor: positive ? "var(--block)" : "var(--approve)",
                        }}
                      />
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{e.description}</p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
