import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { fetchRealAuditLog, type RealAuditEvent } from "@/lib/real-api";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log Viewer — Fraudline Console" },
      {
        name: "description",
        content:
          "Browse the append-only fraud decision audit log: every ingest, pattern-agent, scoring-agent, reviewer-agent and decision-router stage, read from the live backend.",
      },
    ],
  }),
  component: AuditLog,
});

const STAGES = ["all", "ingest", "pattern_agent", "scoring_agent", "reviewer_agent", "decision_router"] as const;

function summarize(e: RealAuditEvent): string {
  const d = e.data as Record<string, any>;
  switch (e.stage) {
    case "ingest":
      return "features extracted";
    case "pattern_agent":
      return `drift score ${d["drift"]?.drift_score ?? "?"}`;
    case "scoring_agent":
      return `score ${d["score"]?.score ?? "?"} · ${d["score"]?.evidence?.length ?? 0} evidence signals`;
    case "reviewer_agent":
      return `verdict: ${d["review"]?.verdict ?? "?"}`;
    case "decision_router":
      return `outcome: ${d["decision"]?.outcome ?? "?"}`;
    default:
      return "—";
  }
}

function AuditLog() {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<(typeof STAGES)[number]>("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: events, isLoading, error } = useQuery<RealAuditEvent[]>({
    queryKey: ["audit-log", query],
    queryFn: () => fetchRealAuditLog(query.trim() || undefined),
    retry: false,
  });

  const rows = useMemo(
    () => (events ?? []).filter((e) => (stage === "all" ? true : e.stage === stage)),
    [events, stage],
  );

  return (
    <AppShell title="Audit log viewer" breadcrumb="/ audit">
      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 pb-3 pt-4">
          <div>
            <h2 className="text-[13px] font-semibold">Append-only decision log</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {isLoading ? "loading…" : `${rows.length} of ${events?.length ?? 0} events`} · live from backend
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value.slice(0, 60))}
              placeholder="filter by exact transaction id"
              className="well num h-8 w-56 px-2.5 text-[11px] outline-none placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring/40"
            />
            <div className="well flex flex-wrap gap-0.5 p-0.5">
              {STAGES.map((s) => (
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

        {error && (
          <p className="p-4 text-[12px] text-block">
            {(error as Error).message}. Is the backend running?
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="num w-full min-w-[720px] text-[12px]">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="label-caps px-4 py-2 font-normal">Txn id</th>
                <th className="label-caps px-3 py-2 font-normal">Stage</th>
                <th className="label-caps px-3 py-2 font-normal">Actor</th>
                <th className="label-caps px-3 py-2 font-normal">Summary</th>
                <th className="label-caps px-4 py-2 text-right font-normal">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => (
                <>
                  <tr
                    key={i}
                    className="cursor-pointer border-b border-line/70 transition-colors hover:bg-panel-2"
                    onClick={() => setExpanded(expanded === i ? null : i)}
                  >
                    <td className="px-4 py-2 font-medium">{e.transaction_id}</td>
                    <td className="px-3 py-2 text-muted-foreground">{e.stage}</td>
                    <td className="px-3 py-2 text-muted-foreground">{e.actor}</td>
                    <td className="px-3 py-2 text-muted-foreground">{summarize(e)}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                  {expanded === i && (
                    <tr className="border-b border-line/70 bg-panel-2/60">
                      <td colSpan={5} className="px-4 py-3">
                        <pre className="max-h-72 overflow-auto text-[10px] leading-relaxed text-muted-foreground">
                          {JSON.stringify(e.data, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[12px] text-muted-foreground">
                    No events yet. Run a transaction through /transactions/ingest and
                    /transactions/&#123;id&#125;/process on the backend to populate this log.
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
