import { createContext, useContext, useState, type ReactNode } from "react";
import type { PipelineId } from "./demo-data";

interface PipelineCtx {
  pipeline: PipelineId;
  setPipeline: (id: PipelineId) => void;
}

const Ctx = createContext<PipelineCtx>({ pipeline: "original", setPipeline: () => {} });

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [pipeline, setPipeline] = useState<PipelineId>("original");
  return <Ctx.Provider value={{ pipeline, setPipeline }}>{children}</Ctx.Provider>;
}

export function usePipeline() {
  return useContext(Ctx);
}
