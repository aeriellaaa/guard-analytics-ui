interface StatTileProps {
  label: string;
  value: string;
  sub: string;
  tone?: "default" | "brand";
  subTone?: "muted" | "approve" | "review";
  delay?: number;
}

export function StatTile({ label, value, sub, tone = "default", subTone = "muted", delay = 0 }: StatTileProps) {
  const subClass =
    subTone === "approve" ? "text-approve" : subTone === "review" ? "text-review" : "text-muted-foreground";

  return (
    <div
      className={`animate-stage-in relative overflow-hidden p-4 ${
        tone === "brand" ? "panel-lift ring-2 ring-brand/25" : "panel"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {tone === "brand" && (
        <span
          className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full opacity-25 blur-xl"
          style={{ backgroundImage: "var(--gradient-brand)" }}
          aria-hidden
        />
      )}
      <p className={tone === "brand" ? "label-caps text-brand" : "label-caps"}>{label}</p>
      <p className="num mt-2 text-2xl font-medium tracking-tight text-foreground">{value}</p>
      <p className={`num mt-1 text-[11px] ${subClass}`}>{sub}</p>
    </div>
  );
}
