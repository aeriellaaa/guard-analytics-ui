import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DecisionBadge } from "@/components/DecisionBadge";
import { AUDIT_EVENTS, formatInr } from "@/lib/demo-data";
import { usePipeline } from "@/lib/pipeline-context";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log Viewer — Fraudline Console" },
      {
        name: "description",
        content:
          "Browse the append-only fraud decision audit log, filtered by transaction and pipeline stage with hash-sealed entries.",
      },
      { property: "og:title", content: "Audit Log Viewer — Fraudline Console" },
      {
        property: "og:description",
        content: "Append-only decision log with hash-sealed entries for every pipeline stage.",
      },
    ],
  }),
  component: AuditLog,
});

function AuditLog() {
  const { pipeline } = usePipeline();
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<string>("all");

  const stages = ["all", "agent-1", "agent-2", "agent-3", "router"];

  const rows = useMemo(
    () =>
      AUDIT_EVENTS.filter((e) => e.pipeline === pipeline)
        .filter((e) => (stage === "all" ? true : e.stage === stage))
        .filter((e) => e.txnId.toLowerCase().includes(query.trim().toLowerCase())),
    [pipeline, stage, query],
  );

  return (
    <AppShell title="Audit log viewer" breadcrumb="/ audit">
      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 pb-3 pt-4">
          <div>
            <h2 className="text-[13px] font-semibold">Append-only decision log</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {rows.length} of {AUDIT_EVENTS.filter((e) => e.pipeline === pipeline).length} events · hash-chained
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value.slice(0, 40))}
              placeholder="filter by txn id"
              className="well num h-8 w-40 px-2.5 text-[11px] outline-none placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring/40"
            />
            <div className="well flex gap-0.5 p-0.5">
              {stages.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStage(s)}
                  className={`num rounded-[5px] px-2 py-1 text-[10px] transition-colors ${
                    stage === s ? "chip-brand" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="num w-full min-w-[720px] text-[12px]">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="label-caps px-4 py-2 font-normal">Event</th>
                <th className="label-caps px-3 py-2 font-normal">Txn id</th>
                <th className="label-caps px-3 py-2 text-right font-normal">Amount</th>
                <th className="label-caps px-3 py-2 font-normal">Stage</th>
                <th className="label-caps px-3 py-2 font-normal">Decision</th>
                <th className="label-caps px-3 py-2 font-normal">Seal</th>
                <th className="label-caps px-4 py-2 text-right font-normal">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-b border-line/70 transition-colors hover:bg-panel-2">
                  <td className="px-4 py-2 text-muted-foreground">{e.id}</td>
                  <td className="px-3 py-2 font-medium">{e.txnId}</td>
                  <td className="px-3 py-2 text-right">{formatInr(e.amount)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{e.stage}</td>
                  <td className="px-3 py-2">
                    <DecisionBadge decision={e.decision} />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{e.hash}</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">{e.ts}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[12px] text-muted-foreground">
                    No events match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
