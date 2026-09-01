import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PIPELINES, getMetrics } from "@/lib/demo-data";
import { usePipeline } from "@/lib/pipeline-context";

const NAV = [
  { to: "/", label: "Overview" },
  { to: "/tester", label: "Transaction tester" },
  { to: "/audit", label: "Audit log" },
  { to: "/entities", label: "Entity drift" },
] as const;

export function AppShell({
  title,
  breadcrumb,
  children,
}: {
  title: string;
  breadcrumb: string;
  children: ReactNode;
}) {
  const { pipeline, setPipeline } = usePipeline();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const metrics = getMetrics(pipeline);

  return (
    <div className="flex min-h-screen">
      <aside
        className="hidden w-60 shrink-0 flex-col border-r border-line lg:flex"
        style={{ backgroundImage: "var(--gradient-rail)" }}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
          <div
            className="chip-brand grid size-8 place-items-center rounded-md"
            style={{ transform: "perspective(220px) rotateX(12deg) rotateY(-14deg)" }}
          >
            <span className="num text-[11px] font-semibold">FX</span>
          </div>
          <div className="leading-none">
            <p className="font-display text-[13px] font-semibold">Fraudline</p>
            <p className="label-caps mt-1">Ops console {metrics.version}</p>
          </div>
        </div>

        <div className="border-b border-line px-4 py-4">
          <p className="label-caps mb-2">Active pipeline</p>
          <div className="well grid grid-cols-2 gap-1 p-1">
            {PIPELINES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPipeline(p.id)}
                className={`rounded-[5px] py-1.5 text-[11px] font-medium transition-colors ${
                  pipeline === p.id
                    ? "chip-brand"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            {PIPELINES.find((p) => p.id === pipeline)?.blurb}
          </p>
        </div>

        <nav className="space-y-0.5 px-3 py-4 text-[13px]">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`block rounded-md px-3 py-2 transition-colors ${
                  active
                    ? "bg-brand-soft/70 font-medium text-foreground ring-1 ring-brand/25"
                    : "text-muted-foreground hover:bg-panel-2 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-line px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="chip-brand grid size-7 place-items-center rounded-full num text-[10px]">MO</span>
            <div className="leading-tight">
              <p className="text-[12px] font-medium">M. Okafor</p>
              <p className="num text-[10px] text-muted-foreground">L2 · Shift B</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex h-14 items-center justify-between gap-4 border-b border-line bg-panel/70 px-4 backdrop-blur-sm md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="truncate text-[15px] font-semibold">{title}</h1>
            <span className="num hidden text-[10px] text-muted-foreground sm:inline">{breadcrumb}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-approve" />
              <span className="size-1.5 rounded-full bg-review" />
              <span className="size-1.5 rounded-full bg-block" />
              <span className="num text-[10px] text-muted-foreground">LIVE</span>
            </span>
            <span className="num hidden text-[11px] text-muted-foreground md:inline">2026-09-01 · 09:42 UTC</span>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-line bg-panel/50 px-4 py-2 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[12px] ${
                pathname === item.to
                  ? "bg-brand-soft/70 font-medium text-foreground ring-1 ring-brand/25"
                  : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="space-y-4 px-4 py-5 md:px-6 md:py-6">{children}</main>

        <footer className="border-t border-line px-4 py-3 md:px-6">
          <div className="num flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
            <span>Fraudline fraud-ops · internal</span>
            <span>
              pipeline {pipeline} · append-only · {metrics.trainedOn}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
