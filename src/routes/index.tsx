import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { StatTile } from "@/components/StatTile";
import { formatInr, getMetrics } from "@/lib/demo-data";
import { usePipeline } from "@/lib/pipeline-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fraud Ops Overview — Fraudline Console" },
      {
        name: "description",
        content:
          "Model performance overview for the Fraudline fraud detection pipeline: AUC, recall, cost-optimal threshold and rules vs naive vs trained baselines.",
      },
      { property: "og:title", content: "Fraud Ops Overview — Fraudline Console" },
      {
        property: "og:description",
        content: "AUC, recall, cost-optimal threshold and baseline comparison for the Fraudline fraud pipeline.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { pipeline } = usePipeline();
  const m = getMetrics(pipeline);
  const maxCost = Math.max(...m.costCurve.map((p) => p.cost));
  const bestCost = Math.min(...m.costCurve.map((p) => p.cost));

  return (
    <AppShell title="Fraud operations overview" breadcrumb="/ metrics">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Model AUC"
          value={m.auc.toFixed(3)}
          sub={`+${m.aucDelta.toFixed(3)} vs rules`}
          subTone="approve"
          delay={0}
        />
        <StatTile
          label="Recall @ thr"
          value={m.recall.toFixed(3)}
          sub={`+${m.recallDelta.toFixed(3)} · cost-optimal cut`}
          subTone="approve"
          delay={50}
        />
        <StatTile
          label="Optimal threshold"
          value={m.optimalThreshold.toFixed(2)}
          sub={`default ${m.defaultThreshold.toFixed(2)}`}
          delay={100}
        />
        <StatTile
          label="Cost saved (30d)"
          value={formatInr(m.costSaved)}
          sub="vs default threshold"
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
              <p className="mt-0.5 text-[11px] text-muted-foreground">AUC and recall at a fixed 5% FPR</p>
            </div>
            <span className="num text-[10px] text-muted-foreground">{m.trainedOn}</span>
          </div>
          <div className="p-4">
            <div className="flex h-48 items-end gap-6 sm:gap-10">
              {m.baselines.map((b, i) => {
                const trained = b.label === "Trained";
                return (
                  <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-36 w-full items-end justify-center gap-1.5">
                      <div
                        className="animate-grow-bar w-1/3 rounded-t-[4px] border border-line"
                        style={{
                          height: `${b.auc * 100}%`,
                          animationDelay: `${250 + i * 90}ms`,
                          backgroundImage: trained
                            ? "var(--gradient-brand)"
                            : "linear-gradient(180deg, var(--panel-2), var(--muted))",
                          boxShadow: trained ? "var(--shadow-lift)" : "var(--shadow-flat)",
                        }}
                      />
                      <div
                        className="animate-grow-bar w-1/3 rounded-t-[4px] border border-line bg-review/25"
                        style={{ height: `${b.recall * 100}%`, animationDelay: `${300 + i * 90}ms` }}
                      />
                    </div>
                    <div className="num text-center text-[11px] leading-tight">
                      <span className={trained ? "text-brand" : "text-muted-foreground"}>{b.auc.toFixed(3)}</span>
                      <span className="text-muted-foreground/60"> / </span>
                      <span className="text-review">{b.recall.toFixed(2)}</span>
                    </div>
                    <span className={`text-[11px] ${trained ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {b.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="num mt-4 flex items-center gap-4 border-t border-line pt-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-[2px]" style={{ backgroundImage: "var(--gradient-brand)" }} /> AUC
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-[2px] bg-review/50" /> Recall @ 5% FPR
              </span>
            </div>
          </div>
        </section>

        <section className="panel animate-stage-in xl:col-span-2" style={{ animationDelay: "250ms" }}>
          <div className="flex items-center justify-between border-b border-line px-4 pb-3 pt-4">
            <h2 className="text-[13px] font-semibold">Cost saved</h2>
            <span className="label-caps">ledger seal</span>
          </div>
          <div className="p-4">
            <p className="num text-3xl font-medium tracking-tight">{formatInr(m.costSaved)}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
              Recovered exposure from misrouted approvals versus the default {m.defaultThreshold.toFixed(2)} cut, net of
              added manual review cost.
            </p>

            <p className="label-caps mt-4">Net cost by threshold</p>
            <div className="mt-2 space-y-1.5">
              {m.costCurve.map((p, i) => {
                const best = p.cost === bestCost;
                return (
                  <div key={p.threshold} className="num flex items-center gap-2 text-[11px]">
                    <span className="w-8 text-muted-foreground">{p.threshold.toFixed(2)}</span>
                    <span className="well h-2.5 flex-1 overflow-hidden p-0">
                      <span
                        className="animate-grow-row block h-full rounded-[3px]"
                        style={{
                          width: `${(p.cost / maxCost) * 100}%`,
                          animationDelay: `${300 + i * 60}ms`,
                          backgroundImage: best
                            ? "var(--gradient-brand)"
                            : "linear-gradient(90deg, var(--muted), var(--secondary))",
                        }}
                      />
                    </span>
                    <span className={`w-16 text-right ${best ? "text-brand" : "text-muted-foreground"}`}>
                      {formatInr(p.cost)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="well mt-4 flex items-center justify-between p-3">
              <div>
                <p className="label-caps">Seal integrity</p>
                <p className="num mt-1 text-[12px] text-approve">SHA-256 · verified</p>
              </div>
              <span
                className="chip-brand size-7 rounded-full"
                style={{ transform: "perspective(160px) rotateX(18deg)" }}
              />
            </div>
          </div>
        </section>
      </div>

      <section className="panel animate-stage-in" style={{ animationDelay: "300ms" }}>
        <div className="border-b border-line px-4 pb-3 pt-4">
          <h2 className="text-[13px] font-semibold">Operating point</h2>
        </div>
        <dl className="grid grid-cols-2 divide-line md:grid-cols-4 md:divide-x">
          {[
            ["Precision", m.precision.toFixed(3)],
            ["False-positive rate", `${(m.falsePositiveRate * 100).toFixed(1)}%`],
            ["Model version", m.version],
            ["Training set", m.trainedOn],
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
