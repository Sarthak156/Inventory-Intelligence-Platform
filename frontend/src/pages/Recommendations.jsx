import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Activity, BrainCircuit, Gauge, Radar, Sparkles, Loader2, RefreshCw } from "lucide-react";
import API from "../services/api";
import useAIInsights, { AI_INSIGHT_STATES } from "../hooks/useAIInsights";
import ExecutiveBriefing from "../components/ai/ExecutiveBriefing";
import AIStatus from "../components/ai/AIStatus";
import RecommendationTable from "../components/recommendations/RecommendationTable";
import RecommendationModal from "../components/recommendations/RecommendationModal";

import { buildRecommendations } from "../utils/recommendationEngine";

const KpiCard = ({ label, value, icon: Icon, tone = "cyan" }) => {
  const tones = {
    cyan: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
    rose: "text-rose-400 border-rose-500/20 bg-rose-500/10",
    amber: "text-amber-400 border-amber-500/20 bg-amber-500/10",
    emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    violet: "text-violet-400 border-violet-500/20 bg-violet-500/10",
  };
  return <div className="theme-bg-card border theme-border rounded-2xl p-5 hover:theme-card-hover hover:-translate-y-1 transition-all duration-300"><div className={`w-10 h-10 rounded-lg border grid place-items-center mb-4 ${tones[tone]}`}><Icon size={18} /></div><p className="text-[10px] theme-muted uppercase tracking-widest font-bold">{label}</p><p className="text-3xl theme-text font-light mt-1">{value}</p></div>;
};

export default function Recommendations() {
  const [riskData, setRiskData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysisTime, setAnalysisTime] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const [chartTelemetry, setChartTelemetry] = useState({ partNo: null, data: [] });

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/api/inventory-risk");
      setRiskData(response.data || []);
      setAnalysisTime(new Date());
    } catch (error) {
      console.error("Recommendation telemetry unavailable:", error);
      setRiskData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    API.get("/api/inventory-risk")
      .then(response => { if (active) { setRiskData(response.data || []); setAnalysisTime(new Date()); } })
      .catch(error => { console.error("Recommendation telemetry unavailable:", error); if (active) setRiskData([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!selected) return () => { active = false; };
    API.get(`/api/monthly-demand/${encodeURIComponent(selected.partNo)}`)
      .then(response => { if (active) setChartTelemetry({ partNo: selected.partNo, data: response.data?.items || [] }); })
      .catch(error => { console.info("Recommendation timeline unavailable:", error.message); if (active) setChartTelemetry({ partNo: selected.partNo, data: [] }); });
    return () => { active = false; };
  }, [selected]);

  const recommendations = useMemo(() => {
    if (!riskData.length) return [];
    return buildRecommendations(riskData, analysisTime);
  }, [riskData, analysisTime]);

  const metrics = useMemo(() => {
    const highRiskCount = riskData.filter(item => item.Risk === "HIGH").length;
    const sparseCount = riskData.filter(item => item.Sparsity > 0.5).length;
    const volatileCount = riskData.filter(item => item.Volatility > 1).length;
    const warningCount = riskData.filter(item => item.ForecastGrowth > 1.15 || item.ForecastGrowth < 0.85).length;
    const monitoringCount = riskData.filter(item => item.Confidence !== "HIGH" || item.Risk !== "LOW").length;
    const averageConfidence = riskData.length ? Math.round(riskData.reduce((sum, item) => sum + (item.Confidence === "HIGH" ? 91 : item.Confidence === "MEDIUM" ? 74 : 52), 0) / riskData.length) : 0;
    const averageGrowth = riskData.length ? (riskData.reduce((sum, item) => sum + item.ForecastGrowth, 0) / riskData.length - 1) * 100 : 0;
    return { scope: "AI recommendations center", totalSkus: riskData.length, highRiskCount, sparseCount, volatileCount, warningCount, monitoringCount, averageConfidence, demandGrowthPercent: averageGrowth, optimizationReadiness: averageConfidence };
  }, [riskData]);

  const executiveMetrics = useMemo(() => ({
    ...metrics,
    scope: "executive",
  }), [metrics]);

  const { insight: briefing, loading: aiLoading } = useAIInsights(executiveMetrics, riskData.length > 0, AI_INSIGHT_STATES.SELECTED);
  const { insight: selectedInsight, loading: selectedAiLoading } = useAIInsights(selected?.metrics || {}, Boolean(selected), AI_INSIGHT_STATES.SELECTED);
  
  const chartLoading = Boolean(selected && chartTelemetry.partNo !== selected.partNo);

  const handleCardClick = useCallback((item) => {
    setSelected(item);
  }, []);

  if (loading) return <div className="min-h-[60vh] grid place-items-center"><div className="text-center"><Loader2 size={30} className="theme-cyan animate-spin mx-auto" /><p className="theme-muted text-sm mt-3 uppercase tracking-widest">Synchronizing recommendation engine</p></div></div>;

  return <div className="flex flex-col gap-6 animate-in fade-in duration-500">
    <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
      <div>
        <p className="text-[10px] theme-cyan uppercase tracking-[0.22em] font-bold mb-2">Strategic Operations System</p>
        <h1 className="text-3xl font-light theme-text tracking-tight">AI Recommendations Center</h1>
        <p className="text-sm theme-muted mt-1">AI-generated operational insights, strategic inventory actions, and forecasting intelligence.</p>
      </div>
      <button onClick={loadRecommendations} className="theme-button-neutral rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2">
        <RefreshCw size={14} />Reanalyze Telemetry
      </button>
    </header>

    <section className="relative overflow-hidden theme-bg-card border theme-cyan-border rounded-2xl p-1 shadow-[0_0_30px_rgba(34,211,238,0.07)]">
      <div className="absolute w-64 h-64 bg-cyan-500/5 blur-3xl -right-20 -top-20 pointer-events-none" />
      <ExecutiveBriefing insight={briefing} loading={aiLoading} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px border-t theme-border theme-bg-card-soft">
        <div className="p-4"><p className="text-[9px] theme-muted tracking-widest uppercase mb-2">Live AI Status</p><AIStatus source={briefing.source} loading={aiLoading} compact /></div>
        <div className="p-4 sm:border-l theme-border"><p className="text-[9px] theme-muted tracking-widest uppercase">Last Analysis Time</p><p className="text-xs theme-text font-semibold mt-2">{analysisTime.toLocaleString()}</p></div>
        <div className="p-4 sm:border-l theme-border"><p className="text-[9px] theme-muted tracking-widest uppercase">AI Engine Mode</p><p className={`text-xs font-bold mt-2 ${briefing.source === "gemini" ? "text-cyan-400" : "text-amber-400"}`}>{briefing.source === "gemini" ? "ENHANCED" : "FALLBACK MODE"}</p></div>
      </div>
    </section>

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
      <KpiCard label="High Risk SKUs" value={metrics.highRiskCount} icon={AlertTriangle} tone="rose" />
      <KpiCard label="Forecast Warnings" value={metrics.warningCount} icon={Activity} tone="amber" />
      <KpiCard label="Sparse Demand Items" value={metrics.sparseCount} icon={Radar} tone="violet" />
      <KpiCard label="AI Confidence Score" value={`${metrics.averageConfidence}%`} icon={Gauge} tone="emerald" />
      <KpiCard label="Active Recommendations" value={recommendations.length} icon={Sparkles} />
      <KpiCard label="Monitoring Alerts" value={metrics.monitoringCount} icon={BrainCircuit} tone="amber" />
    </div>

    <section className="space-y-4">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm theme-text uppercase tracking-widest font-semibold">Strategic Recommendations Feed</h2>
          <p className="text-xs theme-muted mt-1">Prioritized actions derived from current operational telemetry.</p>
        </div>
      </div>
      
      {recommendations.length === 0 ? (
        <div className="theme-bg-card border theme-border rounded-2xl p-10 text-center theme-muted text-sm">
          No active recommendations in this category.
        </div>
      ) : (
        <RecommendationTable
          items={recommendations}
          onRowClick={handleCardClick}
        />
      )}
    </section>

    <footer className="theme-bg-card-soft border theme-border rounded-xl px-5 py-3 flex flex-wrap justify-between gap-3 text-[9px] uppercase tracking-[0.15em] font-bold theme-muted">
      <span>Forecast Engine: <b className="text-emerald-400">Active</b></span>
      <span>Intelligence Layer: <b className="text-cyan-400">Online</b></span>
      <span>Fallback Systems: <b className={briefing.source === "fallback" ? "text-amber-400" : "text-emerald-400"}>{briefing.source === "fallback" ? "Active" : "Standby"}</b></span>
      <span>Recommendation Engine: <b className="text-cyan-400">Synchronized</b></span>
    </footer>

    <RecommendationModal
      recommendation={selected}
      insight={selectedInsight}
      loading={selectedAiLoading}
      chartData={chartTelemetry.data}
      chartLoading={chartLoading}
      onClose={() => setSelected(null)}
      source={briefing?.source ?? "fallback"}
    />
  </div>;
}
