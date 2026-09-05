import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import {
  fetchRealDemoCustomers,
  runRealEntityDriftDemo,
  type RealDemoCustomer,
  type EntityDriftResponse,
} from "@/lib/real-api";

export const Route = createFileRoute("/entities")({
  head: () => ({
    meta: [
      { title: "Entity Drift Monitor — Fraudline Console" },
      {
        name: "description",
        content:
          "Run the entity-drift check against real Razorpay test-mode customer histories and see which profile has deviated from its established spend envelope.",
      },
    ],
  }),
  component: Entities,
});

function Entities() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<EntityDriftResponse | null>(null);

  const { data: customers, isLoading, error } = useQuery<RealDemoCustomer[]>({
    queryKey: ["demo-customers"],
    queryFn: fetchRealDemoCustomers,
    retry: false,
  });

  const runDrift = useMutation({
    mutationFn: (customerId: string) => runRealEntityDriftDemo(customerId),
    onSuccess: (data) => setResult(data),
  });

  const active = customers?.find((c) => c.real_razorpay_customer_id === selectedId) ?? customers?.[0];
  const activeId = active?.real_razorpay_customer_id;

  if (isLoading) {
    return (
      <AppShell title="Entity drift monitor" breadcrumb="/ drift">
        <p className="p-6 text-sm text-muted-foreground">Loading real Razorpay customer data…</p>
      </AppShell>
    );
  }

  if (error || !customers) {
    return (
      <AppShell title="Entity drift monitor" breadcrumb="/ drift">
        <div className="panel p-6">
          <h2 className="text-[13px] font-semibold text-review">Couldn't load customer data</h2>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
            {(error as Error)?.message ?? "No data returned."} Have you run
            scripts/generate_razorpay_data.py and scripts/build_entity_demo_data.py on the backend?
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Entity drift monitor" breadcrumb="/ drift">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <section className="panel xl:col-span-2">
          <div className="border-b border-line px-4 pb-3 pt-4">
            <h2 className="text-[13px] font-semibold">Customers</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {customers.length} real Razorpay test-mode entities
            </p>
          </div>
          <ul className="divide-y divide-line/70">
            {customers.map((c) => {
              const isActive = c.real_razorpay_customer_id === activeId;
              return (
                <li key={c.real_razorpay_customer_id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(c.real_razorpay_customer_id);
                      setResult(null);
                    }}
                    className={`grid w-full grid-cols-[1fr_auto] items-center gap-2 px-4 py-2.5 text-left transition-colors ${
                      isActive ? "bg-brand-soft/45" : "hover:bg-panel-2"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="num truncate text-[12px] font-medium">{c.real_razorpay_customer_id}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{c.real_razorpay_customer_name}</p>
                    </div>
                    <span className="num text-[11px] text-muted-foreground">{c.transaction_count} txns</span>
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
                <h2 className="text-[13px] font-semibold">{active?.real_razorpay_customer_name}</h2>
                <p className="num mt-0.5 text-[11px] text-muted-foreground">
                  {activeId} · {active?.transaction_count} real Razorpay transactions
                </p>
              </div>
              <button
                type="button"
                disabled={!activeId || runDrift.isPending}
                onClick={() => activeId && runDrift.mutate(activeId)}
                className="chip-brand rounded-md px-3 py-1.5 text-[12px] font-medium disabled:opacity-50"
              >
                {runDrift.isPending ? "Checking…" : "Run drift check"}
              </button>
            </div>

            <div className="p-4">
              {runDrift.isError && (
                <p className="text-[12px] text-block">
                  {(runDrift.error as Error).message}
                </p>
              )}

              {result && result.real_razorpay_customer_id === activeId ? (
                <>
                  <div className="well h-2 overflow-hidden p-0">
                    <span
                      className="animate-grow-row block h-full rounded-[3px]"
                      style={{
                        width: `${result.drift_result.drift_score * 100}%`,
                        backgroundImage:
                          result.drift_result.drift_score > 0
                            ? "linear-gradient(90deg, var(--review), var(--block))"
                            : "var(--gradient-brand)",
                      }}
                    />
                  </div>
                  <div className="num mt-2 flex justify-between text-[10px] text-muted-foreground">
                    <span>0.00 stable</span>
                    <span>1.00 max drift</span>
                  </div>

                  <div
                    className={`animate-stage-in mt-4 rounded-md border p-3 ${
                      result.drift_result.drift_score > 0
                        ? "border-block/40 bg-block/8"
                        : "border-approve/40 bg-approve/8"
                    }`}
                  >
                    <p className="label-caps">
                      {result.drift_result.drift_score > 0 ? "Drift detected" : "Within envelope"}
                    </p>
                    <p className="num mt-1.5 text-[13px] font-medium">
                      score {result.drift_result.drift_score.toFixed(2)} · latest txn{" "}
                      {result.latest_transaction_id} · vs {result.history_size} prior transactions
                    </p>
                    {result.drift_result.drift_signals.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {result.drift_result.drift_signals.map((s, i) => (
                          <li key={i} className="text-[12px] leading-relaxed text-muted-foreground">
                            • {s}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                        No tracked signal exceeded this entity's own historical baseline.
                      </p>
                    )}
                    <p className="mt-3 text-[10px] italic text-muted-foreground">
                      {result.drift_result.framing_note}
                    </p>
                  </div>

                  <p className="mt-3 text-[10px] text-muted-foreground">{result.note}</p>
                </>
              ) : (
                <p className="text-[12px] text-muted-foreground">
                  Run the check to compare this customer's most recent real Razorpay transaction
                  against their own transaction history (Agent 1, entity-drift mode).
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
