import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DecisionBadge } from "@/components/DecisionBadge";
import { CUSTOMERS, formatInr } from "@/lib/demo-data";

export const Route = createFileRoute("/entities")({
  head: () => ({
    meta: [
      { title: "Entity Drift Monitor — Fraudline Console" },
      {
        name: "description",
        content:
          "Run the entity-drift check against real customer histories and see which profile has deviated from its established spend envelope.",
      },
      { property: "og:title", content: "Entity Drift Monitor — Fraudline Console" },
      {
        property: "og:description",
        content: "Per-customer drift scoring against established spend envelopes, with one deliberately elevated entity.",
      },
    ],
  }),
  component: Entities,
});

function Entities() {
  const [selectedId, setSelectedId] = useState(CUSTOMERS[0].id);
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const customer = CUSTOMERS.find((c) => c.id === selectedId)!;

  useEffect(() => setState("idle"), [selectedId]);

  useEffect(() => {
    if (state !== "running") return;
    const t = setTimeout(() => setState("done"), 1100);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <AppShell title="Entity drift monitor" breadcrumb="/ drift">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <section className="panel xl:col-span-2">
          <div className="border-b border-line px-4 pb-3 pt-4">
            <h2 className="text-[13px] font-semibold">Customers</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {CUSTOMERS.length} live entities · {CUSTOMERS.filter((c) => c.flagged).length} flagged
            </p>
          </div>
          <ul className="divide-y divide-line/70">
            {CUSTOMERS.map((c) => {
              const active = c.id === selectedId;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`grid w-full grid-cols-[1fr_auto] items-center gap-2 px-4 py-2.5 text-left transition-colors ${
                      active ? "bg-brand-soft/45" : "hover:bg-panel-2"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="num flex items-center gap-1.5 truncate text-[12px] font-medium">
                        {c.id}
                        {c.flagged && <span className="size-1.5 rounded-full bg-block" />}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {c.name} · {c.city}
                      </p>
                    </div>
                    <span className={`num text-[11px] ${c.flagged ? "text-block" : "text-muted-foreground"}`}>
                      {c.driftScore.toFixed(2)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="space-y-4 xl:col-span-3">
          <section className="panel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 pb-3 pt-4">
              <div>
                <h2 className="text-[13px] font-semibold">{customer.name}</h2>
                <p className="num mt-0.5 text-[11px] text-muted-foreground">
                  {customer.id} · {customer.txnCount} txns · median {formatInr(customer.medianTicket)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setState("running")}
                className="chip-brand rounded-md px-3 py-1.5 text-[12px] font-medium"
              >
                {state === "running" ? "Checking…" : "Run drift check"}
              </button>
            </div>
            <div className="p-4">
              <div className="well h-2 overflow-hidden p-0">
                <span
                  className="animate-grow-row block h-full rounded-[3px]"
                  key={`${customer.id}-${state}`}
                  style={{
                    width: state === "idle" ? "0%" : `${customer.driftScore * 100}%`,
                    backgroundImage: customer.flagged
                      ? "linear-gradient(90deg, var(--review), var(--block))"
                      : "var(--gradient-brand)",
                  }}
                />
              </div>
              <div className="num mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>0.00 stable</span>
                <span>threshold 0.80</span>
                <span>1.00 severe</span>
              </div>

              {state === "done" && (
                <div
                  className={`animate-stage-in mt-4 rounded-md border p-3 ${
                    customer.flagged ? "border-block/40 bg-block/8" : "border-approve/40 bg-approve/8"
                  }`}
                >
                  <p className="label-caps">{customer.flagged ? "Drift flagged" : "Within envelope"}</p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                    {customer.flagged
                      ? `Drift score ${customer.driftScore.toFixed(2)} exceeds the 0.80 gate. Ticket size has moved 6.2x above the profile median across three days, concentrated in a merchant category with no prior history. Escalating this entity for manual profile re-baselining.`
                      : `Drift score ${customer.driftScore.toFixed(2)} sits below the 0.80 gate. Ticket distribution, categories and cadence all remain consistent with the trailing 90-day profile.`}
                  </p>
                </div>
              )}
              {state === "idle" && (
                <p className="mt-4 text-[12px] text-muted-foreground">
                  Run the check to score this entity against its trailing 90-day spend envelope.
                </p>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="border-b border-line px-4 pb-3 pt-4">
              <h2 className="text-[13px] font-semibold">Transaction history</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="num w-full min-w-[520px] text-[12px]">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="label-caps px-4 py-2 font-normal">Txn id</th>
                    <th className="label-caps px-3 py-2 font-normal">Date</th>
                    <th className="label-caps px-3 py-2 text-right font-normal">Amount</th>
                    <th className="label-caps px-3 py-2 font-normal">Category</th>
                    <th className="label-caps px-4 py-2 font-normal">Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.history.map((h) => (
                    <tr key={h.id} className="border-b border-line/70 hover:bg-panel-2">
                      <td className="px-4 py-2 font-medium">{h.id}</td>
                      <td className="px-3 py-2 text-muted-foreground">{h.date}</td>
                      <td className="px-3 py-2 text-right">{formatInr(h.amount)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{h.category}</td>
                      <td className="px-4 py-2">
                        <DecisionBadge decision={h.decision} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
