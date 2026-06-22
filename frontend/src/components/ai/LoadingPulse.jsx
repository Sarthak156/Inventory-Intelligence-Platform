import { BrainCircuit } from "lucide-react";

export default function LoadingPulse() {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div className="relative">
        <BrainCircuit size={20} className="theme-cyan animate-pulse" />
        <div className="absolute inset-0 theme-cyan blur-md opacity-30 animate-ping" />
      </div>
      <div className="text-sm theme-muted">
        Analyzing operational telemetry<span className="animate-ellipsis">...</span>
      </div>
    </div>
  );
}