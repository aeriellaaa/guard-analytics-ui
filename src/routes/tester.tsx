import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DecisionBadge } from "@/components/DecisionBadge";
import { TXN_PRESETS, formatInr, getMetrics } from "@/lib/demo-data";
import { usePipeline } from "@/lib/pipeline-context";

export const Route = createFileRoute("/tester")({
  head: () => ({
    meta: [
      { title: "Live Transaction Tester — Fraudline Console" },
      {
        name: "description",
        content:
          "Submit a transaction and watch it flow through Agent 1, 2, 3 and the Decision Router with live SHAP evidence and reviewer reasoning.",
      },
      { property: "og:title", content: "Live Transaction Tester — Fraudline Console" },
      {
        property: "og:description",
        content: "Watch a transaction resolve through the agent pipeline with SHAP evidence and reviewer reasoning.",
      },
    ],
  }),
  component: Tester,
});

function Tester() {
  const { pipeline } = usePipeline();
  const m = getMetrics(pipeline);
  const [presetId, setPresetId] = useState(TXN_PRESETS[0]!.id);
  const [runId, setRunId] = useState(0);
  const [completed, setCompleted] = useState(0);

  const preset = TXN_PRESETS.find((p) => p.id === presetId)!;
  const resolved = completed >= preset.stages.length;

  useEffect(() => {
    setCompleted(0);
    const timers = preset.stages.map((_, i) =>
      setTimeout(() => setCompleted(i + 1), 420 * (i + 1)),
    );
    return () => timers.forEach(clearTimeout);
  }, [presetId, runId, preset.stages]);

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
            onClick={() => setRunId((r) => r + 1)}
            className="chip-brand rounded-md px-3 py-1.5 text-[12px] font-medium"
          >
            Re-run scoring
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 p-4 md:grid-cols-3">
          {TXN_PRESETS.map((p) => {
            const active = p.id === presetId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPresetId(p.id)}
                className={`rounded-md border p-3 text-left transition-colors ${
                  active
                    ? "border-brand/40 bg-brand-soft/50"
                    : "border-line bg-panel-2 hover:border-brand/25"
                }`}
              >
                <p className="num text-[12px] font-medium">{p.id}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{p.label}</p>
                <p className="num mt-2 text-[12px]">{formatInr(p.amount)}</p>
              </button>
            );
          })}
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line px-4 py-3 md:grid-cols-5">
          {[
            ["Customer", preset.customer],
            ["Category", preset.merchantCategory],
            ["Device age", `${preset.deviceAgeDays}d`],
            ["Geo distance", `${preset.geoDistanceKm.toLocaleString("en-IN")} km`],
            ["Velocity 1h", `${preset.velocity1h} txn`],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="label-caps">{k}</dt>
              <dd className="num mt-1 text-[12px]">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <section className="panel xl:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 pb-3 pt-4">
            <h2 className="text-[13px] font-semibold">Agent pipeline</h2>
            <span className="num text-[10px] text-muted-foreground">
              Agent 1 → Agent 2 → Agent 3 → Decision Router
            </span>
          </div>
          <div className="p-4">
            {preset.stages.map((stage, i) => {
              const done = i < completed;
              const isRouter = stage.id === "router";
              const ringTone = !done
                ? "border-line bg-panel-2"
                : isRouter
                  ? preset.decision === "block"
                    ? "border-block/50 bg-block/10"
                    : preset.decision === "review"
                      ? "border-review/50 bg-review/10"
                      : "border-approve/50 bg-approve/10"
                  : "border-approve/50 bg-approve/10";
              const dotTone = !done
                ? "bg-muted-foreground/30"
                : isRouter
                  ? preset.decision === "block"
                    ? "bg-block"
                    : preset.decision === "review"
                      ? "bg-review"
                      : "bg-approve"
                  : "bg-approve";

              return (
                <div key={stage.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`grid size-6 shrink-0 place-items-center rounded-full border ${ringTone}`}>
                      <span className={`size-1.5 rounded-full ${dotTone}`} />
                    </span>
                    {i < preset.stages.length - 1 && <span className="w-px flex-1 bg-line" />}
                  </div>
                  <div className={`min-w-0 flex-1 pb-4 ${done ? "animate-stage-in" : "opacity-45"}`}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-[12px] font-medium">{stage.name}</p>
                      <span className="num text-[11px] text-muted-foreground">
                        {done ? `${stage.latencyMs}ms` : "waiting"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{stage.detail}</p>
                    {done && stage.score !== null && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="well h-1.5 flex-1 overflow-hidden p-0">
                          <span
                            className="animate-grow-row block h-full rounded-[3px]"
                            style={{
                              width: `${stage.score * 100}%`,
                              backgroundImage: "var(--gradient-brand)",
                            }}
                          />
                        </span>
                        <span className="num w-10 text-right text-[11px]">{stage.score.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="well mt-1 flex flex-wrap items-center justify-between gap-2 p-3">
              <div>
                <p className="label-caps">Router verdict</p>
                <p className="mt-1 flex items-center gap-2 text-[13px] font-medium">
                  {resolved ? <DecisionBadge decision={preset.decision} /> : <span className="num text-[11px] text-muted-foreground">scoring…</span>}
                </p>
              </div>
              <div className="num text-right text-[11px] text-muted-foreground">
                <p>confidence {resolved ? preset.confidence.toFixed(2) : "—"}</p>
                <p>threshold {m.optimalThreshold.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="panel xl:col-span-2">
          <div className="border-b border-line px-4 pb-3 pt-4">
            <h2 className="text-[13px] font-semibold">SHAP evidence</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Signed contribution to the fraud score</p>
          </div>
          <div className="space-y-2 p-4">
            {preset.shap.map((f, i) => {
              const positive = f.value > 0;
              return (
                <div key={f.feature} className={completed >= 3 ? "animate-stage-in" : "opacity-40"} style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="num flex justify-between text-[11px]">
                    <span className="text-muted-foreground">{f.feature}</span>
                    <span className={positive ? "text-block" : "text-approve"}>
                      {positive ? "+" : "−"}
                      {Math.abs(f.value).toFixed(2)}
                    </span>
                  </div>
                  <div className="well mt-1 h-1.5 overflow-hidden p-0">
                    <span
                      className="block h-full rounded-[3px]"
                      style={{
                        width: `${Math.min(Math.abs(f.value) * 260, 100)}%`,
                        backgroundColor: positive ? "var(--block)" : "var(--approve)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-line px-4 py-4">
            <p className="label-caps">Reviewer agent</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
              {resolved ? preset.reviewerReasoning : "Awaiting Agent 3 output before drafting a rationale…"}
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
