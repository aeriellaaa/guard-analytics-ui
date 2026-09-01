import type { Decision } from "@/lib/demo-data";
import { decisionLabel } from "@/lib/demo-data";

const tone: Record<Decision | "pending", string> = {
  approve: "text-approve",
  review: "text-review",
  block: "text-block",
  pending: "text-muted-foreground",
};

const dot: Record<Decision | "pending", string> = {
  approve: "bg-approve",
  review: "bg-review",
  block: "bg-block",
  pending: "bg-muted-foreground/50",
};

export function DecisionBadge({ decision }: { decision: Decision | "pending" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 num text-[11px] ${tone[decision]}`}>
      <span className={`size-1.5 rounded-full ${dot[decision]}`} />
      {decisionLabel(decision)}
    </span>
  );
}
