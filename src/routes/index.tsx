import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { StatTile } from "@/components/StatTile";
import { usePipeline } from "@/lib/pipeline-context";
import { fetchRealMetrics, BackendNotReadyError, type RealMetrics } from "@/lib/real-api";
import { formatInr } from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fraud Ops Overview — Fraudline Console" },
      {
        name: "description",
        content:
          "Model performance overview for the Fraudline fraud detection pipeline: AUC, recall, cost-optimal threshold and rules vs naive vs trained baselines. Live data from the FastAPI backend.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { pipeline } = usePipeline();

  const { data: m, isLoading, error } = useQuery<RealMetrics>({
    queryKey: ["metrics", pipeline],
    queryFn: () => fetchRealMetrics(pipeline),
    retry: false,
  });

  if (isLoading) {
    return (
      <AppShell title="Fraud operations overview" breadcrumb="/ metrics">
        <p className="p-6 text-sm text-muted-foreground">Loading real metrics from the backend…</p>
      </AppShell>
    );
  }

  if (error instanceof BackendNotReadyError) {
    return (
      <AppShell title="Fraud operations overview" breadcrumb="/ metrics">
        <div className="panel p-6">
          <h2 className="text-[13px] font-semibold text-review">No live data for this pipeline yet</h2>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{error.message}</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Fraud operations overview" breadcrumb="/ metrics">
        <div className="panel p-6">
          <h2 className="text-[13px] font-semibold text-review">Couldn't reach the backend</h2>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
            {(error as Error).message}. Is the FastAPI server running at the configured
            VITE_API_BASE_URL (defaults to http://localhost:8000)?
          </p>
        </div>
      </AppShell>
    );
  }

  if (!m) return null;

  const baselines = m.baseline_comparison ?? [];
  const curve = m.cost_curve?.curve ?? [];
  const maxCost = curve.length ? Math.max(...curve.map((p) => p.cost_inr)) : 0;
  const bestCost = curve.length ? Math.min(...curve.map((p) => p.cost_inr)) : 0;

  return (
    <AppShell title="Fraud operations overview" breadcrumb="/ metrics">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Model AUC" value={m.auc.toFixed(3)} sub="held-out test set, 4,000 txns" subTone="approve" delay={0} />
        <StatTile label="Recall @ cost-optimal" value={m.recall.toFixed(3)} sub={`threshold ${m.cost_optimal_threshold.toFixed(3)}`} subTone="approve" delay={50} />
        <StatTile label="Precision @ cost-optimal" value={m.precision.toFixed(3)} sub="low by design — see cost model" delay={100} />
        <StatTile
          label="Cost reduction vs default"
          value={`${(((m.default_threshold_cost_inr - m.cost_optimal_total_cost_inr) / m.default_threshold_cost_inr) * 100).toFixed(1)}%`}
          sub={`${formatInr(m.default_threshold_cost_inr)} → ${formatInr(m.cost_optimal_total_cost_inr)}`}
          tone="brand"
          subTone="approve"
          delay={150}
        />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <section className="panel animate-stage-in xl:col-span-3" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 pb-3 pt-4">
            <div>
              <h2 className="text-[13px] font-semibold">Rules vs naive vs trained model</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">ROC-AUC and recall, same held-out set, same cost model</p>
            </div>
            <span className="num text-[10px] text-muted-foreground">{m.held_out_test_set_size.toLocaleString()} txns</span>
          </div>
          <div className="p-4">
            {baselines.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">
                No baseline comparison yet — run scripts/baseline_comparison.py to generate one.
              </p>
            ) : (
              <div className="flex h-48 items-end gap-6 sm:gap-10">
                {baselines.map((b, i) => {
                  const trained = b.label.toLowerCase().includes("random forest");
                  return (
                    <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-36 w-full items-end justify-center gap-1.5">
                        <div
                          className="animate-grow-bar w-1/3 rounded-t-[4px] border border-line"
                          style={{
                            height: `${b.roc_auc * 100}%`,
                            animationDelay: `${250 + i * 90}ms`,
                            backgroundImage: trained ? "var(--gradient-brand)" : "linear-gradient(180deg, var(--panel-2), var(--muted))",
                            boxShadow: trained ? "var(--shadow-lift)" : "var(--shadow-flat)",
                          }}
                        />
                        <div
                          className="animate-grow-bar w-1/3 rounded-t-[4px] border border-line bg-review/25"
                          style={{ height: `${b.recall * 100}%`, animationDelay: `${300 + i * 90}ms` }}
                        />
                      </div>
                      <div className="num text-center text-[11px] leading-tight">
                        <span className={trained ? "text-brand" : "text-muted-foreground"}>{b.roc_auc.toFixed(3)}</span>
                        <span className="text-muted-foreground/60"> / </span>
                        <span className="text-review">{b.recall.toFixed(2)}</span>
                      </div>
                      <span className={`text-center text-[11px] ${trained ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                        {b.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="panel animate-stage-in xl:col-span-2" style={{ animationDelay: "250ms" }}>
          <div className="flex items-center justify-between border-b border-line px-4 pb-3 pt-4">
            <h2 className="text-[13px] font-semibold">Cost at cost-optimal threshold</h2>
            <span className="label-caps">real, sourced</span>
          </div>
          <div className="p-4">
            <p className="num text-3xl font-medium tracking-tight">{formatInr(m.cost_optimal_total_cost_inr)}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
              vs {formatInr(m.default_threshold_cost_inr)} at the untuned 0.5 default threshold —
              same model, only the operating point changed.
            </p>

            {curve.length > 0 && (
              <>
                <p className="label-caps mt-4">Cost by threshold (real sweep)</p>
                <div className="mt-2 space-y-1.5">
                  {curve.map((p, i) => {
                    const best = p.cost_inr === bestCost;
                    return (
                      <div key={p.threshold} className="num flex items-center gap-2 text-[11px]">
                        <span className="w-10 text-muted-foreground">{p.threshold.toFixed(2)}</span>
                        <span className="well h-2.5 flex-1 overflow-hidden p-0">
                          <span
                            className="animate-grow-row block h-full rounded-[3px]"
                            style={{
                              width: `${(p.cost_inr / maxCost) * 100}%`,
                              animationDelay: `${300 + i * 60}ms`,
                              backgroundImage: best ? "var(--gradient-brand)" : "linear-gradient(90deg, var(--muted), var(--secondary))",
                            }}
                          />
                        </span>
                        <span className={`w-20 text-right ${best ? "text-brand" : "text-muted-foreground"}`}>
                          {formatInr(p.cost_inr)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <p className="mt-4 text-[10px] text-muted-foreground">{m.cost_figures_source}</p>
          </div>
        </section>
      </div>

      <section className="panel animate-stage-in" style={{ animationDelay: "300ms" }}>
        <div className="border-b border-line px-4 pb-3 pt-4">
          <h2 className="text-[13px] font-semibold">Operating point</h2>
        </div>
        <dl className="grid grid-cols-2 divide-line md:grid-cols-4 md:divide-x">
          {[
            ["Model", m.model],
            ["Confusion matrix", m.confusion_matrix_at_optimal_threshold],
            ["Held-out test set", `${m.held_out_test_set_size.toLocaleString()} txns`],
            ["Threshold", m.cost_optimal_threshold.toFixed(3)],
          ].map(([k, v]) => (
            <div key={k} className="p-4">
              <dt className="label-caps">{k}</dt>
              <dd className="num mt-1.5 text-[13px] text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </AppShell>
  );
}
