import { useState, useEffect, useMemo, useRef } from "react";
import { 
  TrendingUp, 
  LineChart as LineChartIcon, 
  Loader2, 
  Activity, 
  BarChart2, 
  CheckCircle2,
  Package,
  Search as SearchIcon,
  ChevronDown,
  AlertCircle,
  AlertTriangle,
  Info,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import API from "../services/api";
import useAIInsights from "../hooks/useAIInsights";
import AIInsightPanel from "../components/ai/AIInsightPanel";

const formatCompact = (num) => {
  if (num === null || num === undefined) return "0";
  const rounded = Math.round(num);
  if (rounded >= 1000000) return (rounded / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (rounded >= 1000) return (rounded / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return rounded.toLocaleString();
};

const AnimatedCounter = ({ value, prefix = "", suffix = "", decimals = 0, format = false }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const end = parseFloat(value) || 0;
    let startTime = null;
    const duration = 1500;
    let animationFrame;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setCount(end * easeProgress);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value]);

  const displayValue = format ? Math.round(count).toLocaleString() : count.toFixed(decimals);
  return <>{prefix}{displayValue}{suffix}</>;
};

const KPICard = ({ title, value, subtitle, icon: Icon, isGood, badgeColor }) => {
  let colorClass = isGood ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
  let hoverClass = 'hover:border-cyan-500/60 hover:shadow-[0_0_25px_rgba(34,211,238,0.15)]';
  
  if (badgeColor === 'amber') { colorClass = 'bg-amber-500/10 text-amber-500 border-amber-500/20'; hoverClass = 'hover:border-amber-500/60 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]'; }
  if (badgeColor === 'rose') { colorClass = 'bg-rose-500/10 text-rose-500 border-rose-500/20'; hoverClass = 'hover:border-rose-500/60 hover:shadow-[0_0_25px_rgba(244,63,94,0.15)]'; }
  if (badgeColor === 'emerald') { colorClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'; hoverClass = 'hover:border-emerald-500/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]'; }
  if (badgeColor === 'gray') { colorClass = 'bg-gray-500/10 text-gray-400 border-gray-500/20'; hoverClass = 'hover:border-gray-500/60 hover:shadow-[0_0_25px_rgba(107,114,128,0.15)]'; }

  return (
    <div className={`theme-bg-card border theme-border rounded-2xl p-5 backdrop-blur-md ${hoverClass} hover:-translate-y-1 transition-all duration-500 group cursor-default`}>
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-lg theme-bg-icon flex items-center justify-center border theme-border group-hover:bg-white/5 transition-colors">
          <Icon size={18} className="theme-muted group-hover:text-cyan-400 transition-colors" />
        </div>
        {subtitle && (
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wider border ${colorClass}`}>
            {subtitle}
          </span>
        )}
      </div>
      <div>
        <p className="theme-muted text-xs uppercase tracking-wider font-semibold mb-1">{title}</p>
        <h3 className="text-3xl font-light theme-text tracking-tight">{value}</h3>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="theme-bg-card border theme-border p-4 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.15)] backdrop-blur-md min-w-[200px]">
        <p className="text-sm font-medium text-cyan-400 mb-3">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-6 mb-1.5">
            <span className="text-xs theme-muted flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              {entry.name}
            </span>
            <span className="text-sm font-semibold theme-text">
              {entry.value != null ? Math.round(entry.value).toLocaleString() : '0'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PartSelector = ({ parts, selectedPart, setSelectedPart }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectorRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredParts = useMemo(() => 
    parts.filter(part => 
      String(part).toLowerCase().includes(searchTerm.toLowerCase())
    ), [parts, searchTerm]);

  const handleSelect = (part) => {
    setSelectedPart(part);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative w-full md:w-72" ref={selectorRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left theme-bg-card-soft border theme-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 theme-text transition-all"
      >
        <span className="flex items-center gap-2 overflow-hidden">
          <Package size={16} className="theme-cyan flex-shrink-0" />
          <span className="font-medium truncate">{selectedPart}</span>
        </span>
        <ChevronDown size={18} className={`theme-muted transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 top-full mt-2 w-full theme-bg-card border theme-border rounded-xl shadow-lg backdrop-blur-md overflow-hidden animate-in fade-in-5 slide-in-from-top-2 duration-300">
          <div className="p-2">
            <div className="relative">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 theme-muted" />
              <input
                type="text"
                placeholder="Search part number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 theme-bg-input border theme-border rounded-lg focus:outline-none focus:theme-cyan-border text-sm theme-text"
                autoFocus
              />
            </div>
          </div>
          <ul className="max-h-60 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            <li 
              onClick={() => handleSelect("ALL_PARTS")}
              className="px-3 py-2 text-sm theme-text rounded-md cursor-pointer hover:bg-cyan-500 hover:text-black font-medium"
            >
              ALL_PARTS (Aggregated)
            </li>
            {filteredParts.slice(0, 100).map(part => (
              <li 
                key={part}
                onClick={() => handleSelect(part)}
                className="px-3 py-2 text-sm theme-text rounded-md cursor-pointer hover:bg-cyan-500 hover:text-black"
              >
                {part}
              </li>
            ))}
            {filteredParts.length > 100 && (
              <li className="px-3 py-2 text-xs theme-muted text-center italic">
                Showing 100 of {filteredParts.length} parts. Type to search...
              </li>
            )}
            {filteredParts.length === 0 && searchTerm && (
              <li className="px-3 py-2 text-sm theme-muted text-center">No parts found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const Forecast = () => {
  const [fullData, setFullData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ 
    totalDemand: 0, 
    highestMonth: "-", 
    readiness: "0%",
    forecast1M: 0,
    forecast3M: 0,
    forecast6M: 0,
    forecast12M: 0
  });
  const [forecastSource, setForecastSource] = useState("GLOBAL_AGGREGATED");
  const [skuState, setSkuState] = useState("GLOBAL");
  const [confidence, setConfidence] = useState("HIGH");
  const [sparsity, setSparsity] = useState(0);
  const [confidenceScore, setConfidenceScore] = useState(0);

  const [parts, setParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState("ALL_PARTS");
  const [selectedHorizon, setSelectedHorizon] = useState('3M');
  const [activePartsCount, setActivePartsCount] = useState(0);
  const [isFetchingPart, setIsFetchingPart] = useState(false);
  const horizons = ['1M', '3M', '6M', '12M'];
  
  const processDemandData = (dataObj) => {
    const demandData = Array.isArray(dataObj) ? dataObj : (dataObj.items || []);
    setForecastSource(dataObj.source || "GLOBAL_AGGREGATED");
    setSkuState(dataObj.sku_state || "GLOBAL");
    setConfidence(dataObj.confidence || "HIGH");
    setSparsity(dataObj.sparsity || 0);
    setConfidenceScore(dataObj.confidence_score || (dataObj.confidence === 'HIGH' ? 95 : dataObj.confidence === 'MEDIUM' ? 65 : dataObj.confidence === 'LOW' ? 35 : 0));
    setFullData(demandData);
    if (demandData.length > 0) {
      const historicalData = demandData.filter(d => !d.Is_Future);
      const futureData = demandData.filter(d => d.Is_Future);
      
      let historicalKpis = { totalDemand: 0, highestMonth: "-", readiness: "0%", last3M: 0 };
      if (historicalData.length > 0) {
        const total = historicalData.reduce((sum, item) => sum + (item.Demand || 0), 0);
        const highest = historicalData.reduce((max, item) => (item.Demand || 0) > (max.Demand || 0) ? item : max, historicalData[0]);
        const last3M = historicalData.slice(-3).reduce((sum, item) => sum + (item.Demand || 0), 0);
        historicalKpis = {
          totalDemand: total,
          highestMonth: highest.Month,
          readiness: historicalData.length >= 12 ? "98%" : Math.min(100, Math.max(10, historicalData.length * 8)) + "%",
          last3M
        };
      }

      const sumForecast = (months) => futureData.slice(0, months).reduce((sum, item) => sum + (item.Forecast || 0), 0);

      const f1M = sumForecast(1);
      const f3M = sumForecast(3);
      const f6M = sumForecast(6);
      const f12M = sumForecast(12);

      let projTrend3M = 0;
      if (historicalKpis.last3M > 0) {
        projTrend3M = ((f3M - historicalKpis.last3M) / historicalKpis.last3M) * 100;
      }

      setKpis({
        ...historicalKpis,
        forecast1M: f1M,
        forecast3M: f3M,
        forecast6M: f6M,
        forecast12M: f12M,
        projTrend3M: projTrend3M,
      });
    } else {
      setKpis({
        totalDemand: 0, highestMonth: "-", readiness: "0%",
        forecast1M: 0, forecast3M: 0, forecast6M: 0, forecast12M: 0, projTrend3M: 0
      });
    }
  };

  const isInitialMount = useRef(true);

  useEffect(() => {
    const fetchInitialAndDemand = async () => {
      setIsFetchingPart(true);
      try {
        if (isInitialMount.current) {
          isInitialMount.current = false;
          const [demandRes, partsRes] = await Promise.all([
            API.get("/monthly-demand"),
            API.get("/parts")
          ]);
          
          const fetchedParts = partsRes.data || [];
          setParts(fetchedParts);
          setActivePartsCount(fetchedParts.length);
          processDemandData(demandRes.data || {});
          setLoading(false);
        } else {
          const url = selectedPart === "ALL_PARTS" 
            ? "/monthly-demand" 
            : `/monthly-demand/${encodeURIComponent(selectedPart)}`;
          const demandRes = await API.get(url);
          processDemandData(demandRes.data || {});
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsFetchingPart(false);
      }
    };
    fetchInitialAndDemand();
  }, [selectedPart]);

  const chartData = useMemo(() => {
    if (!fullData || fullData.length === 0) return [];
    const historical = fullData.filter(d => !d.Is_Future);
    const future = fullData.filter(d => d.Is_Future);
    const months = parseInt(selectedHorizon);
    return [...historical, ...future.slice(0, months)];
  }, [fullData, selectedHorizon]);

  const forecastMetrics = useMemo(() => ({
    scope: selectedPart === "ALL_PARTS" ? "aggregate forecast" : "SKU forecast",
    partNo: selectedPart === "ALL_PARTS" ? null : selectedPart,
    demandState: skuState,
    sparsity,
    forecastGrowth: 1 + (kpis.projTrend3M || 0) / 100,
    demandGrowthPercent: kpis.projTrend3M || 0,
    confidence,
    confidenceScore,
    forecastSource,
    totalSkus: selectedPart === "ALL_PARTS" ? activePartsCount : 0,
  }), [selectedPart, skuState, sparsity, kpis.projTrend3M, confidence, confidenceScore, forecastSource, activePartsCount]);
  const { insight: forecastInsight, loading: forecastAiLoading } = useAIInsights(forecastMetrics, fullData.length > 0);

  const generateInsights = useMemo(() => {
    if (!fullData || fullData.length === 0) return [];
    const insights = [];
    
    // Model Selection / Fallback Strategy
    if (forecastSource.includes('FALLBACK')) {
      insights.push({
        title: 'Fallback Strategy Active',
        text: `Insufficient historical density to generate a robust part-level forecast. Falling back to ${forecastSource === 'HALB_FALLBACK' ? 'category-level (HALB)' : 'global'} baseline trends to estimate future demand.`,
        type: 'warning'
      });
    } else if (forecastSource === 'PART_LEVEL') {
      insights.push({
        title: 'High-Fidelity Model Selected',
        text: 'Sufficient data density detected. Granular SKU-level statistical forecasting models have been applied.',
        type: 'success'
      });
    } else if (forecastSource === 'NO_FORECAST') {
      insights.push({
        title: 'No Forecast Generated',
        text: 'This part lacks the necessary historical consumption to produce a mathematical forecast.',
        type: 'alert'
      });
    } else if (forecastSource === 'GLOBAL_AGGREGATED') {
      insights.push({
        title: 'Global Aggregation Active',
        text: 'Viewing the macro-level demand forecast across all inventory parts combined.',
        type: 'info'
      });
    }
    
    // Trend Summary
    if (kpis.projTrend3M > 15) {
      insights.push({
        title: 'Significant Demand Surge Expected',
        text: `The AI model projects a ${kpis.projTrend3M.toFixed(1)}% increase in demand over the next 3 months compared to recent history. Recommend reviewing safety stock immediately.`,
        type: 'warning'
      });
    } else if (kpis.projTrend3M < -15) {
      insights.push({
        title: 'Demand Contraction Predicted',
        text: `Forecast indicates a ${Math.abs(kpis.projTrend3M).toFixed(1)}% drop in upcoming 3-month demand. Avoid over-ordering to prevent capital tie-up.`,
        type: 'info'
      });
    } else if (skuState === 'ACTIVE' || skuState === 'GLOBAL') {
      insights.push({
        title: 'Stable Demand Trajectory',
        text: 'Upcoming consumption is expected to remain relatively flat and consistent with historical baselines.',
        type: 'success'
      });
    }

    // SKU State Info
    if (skuState === 'SPARSE') {
      insights.push({
        title: 'Intermittent Demand Profile',
        text: 'This item exhibits highly irregular consumption. The forecast incorporates stochastic spike smoothing to account for sudden future orders.',
        type: 'info'
      });
    } else if (skuState === 'DORMANT') {
      insights.push({
        title: 'Dormant Inventory Flag',
        text: 'Item has been mostly inactive. Consider performing a lifecycle review or obsolescence check.',
        type: 'alert'
      });
    }

    return insights;
  }, [fullData, forecastSource, kpis.projTrend3M, skuState]);

  const sourceMap = {
    'PART_LEVEL': { label: 'SKU Direct', color: 'emerald', isGood: true },
    'HALB_FALLBACK': { label: 'HALB Fallback', color: 'amber', isGood: false },
    'GLOBAL_FALLBACK': { label: 'Global Fallback', color: 'rose', isGood: false },
    'GLOBAL_AGGREGATED': { label: 'Aggregated', color: 'cyan', isGood: true },
    'LOW_CONFIDENCE': { label: 'Low Confidence', color: 'rose', isGood: false },
    'NO_FORECAST': { label: 'No Forecast', color: 'gray', isGood: false }
  };
  const sourceInfo = sourceMap[forecastSource] || { label: 'Unknown', color: 'cyan', isGood: false };

  if (loading) {
    return (
      <div className="p-8 flex flex-col gap-6 w-full animate-in fade-in duration-500">
        <div className="flex justify-between items-start gap-4 mb-2">
           <div className="space-y-3 w-1/3"><div className="h-8 w-3/4 bg-gray-500/10 rounded-lg animate-pulse"></div><div className="h-4 w-1/2 bg-gray-500/10 rounded-lg animate-pulse"></div></div>
           <div className="h-10 w-72 bg-gray-500/10 rounded-xl animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-gray-500/10 rounded-2xl animate-pulse border border-gray-500/5"></div>)}
        </div>
        <div className="h-[400px] bg-gray-500/10 rounded-2xl animate-pulse border border-gray-500/5"></div>
        <div className="h-64 bg-gray-500/10 rounded-2xl animate-pulse border border-gray-500/5"></div>
      </div>
    );
  }

  if (!fullData || fullData.length === 0) {
    return (
      <div className="h-full min-h-[80vh] flex flex-col items-center justify-center p-8 relative">
        <div className="max-w-md w-full theme-bg-card backdrop-blur-md rounded-3xl theme-card-shadow border theme-border p-10 text-center transition-all">
          <div className="w-16 h-16 theme-bg-icon theme-cyan rounded-2xl flex items-center justify-center mx-auto mb-6 border theme-border">
            <LineChartIcon size={28} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-medium theme-text mb-2 tracking-tight">Demand Forecast Pending</h2>
          <p className="text-sm theme-muted mb-8 leading-relaxed">
            Neural network demand predictions require historical consumption baselines. Please ingest your datasets to initialize models.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 theme-button-cyan py-2.5 px-6 rounded-xl transition-all text-sm font-medium"
          >
            <TrendingUp size={16} />
            Configure Forecast
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-light theme-text tracking-tight">Demand Forecast Analytics</h1>
          <p className="text-sm theme-muted mt-1 max-w-lg">
            {selectedPart === 'ALL_PARTS'
              ? 'AI-driven predictive demand modeling across all active inventory parts.'
              : `Forecasting demand for Part No: ${selectedPart}`
            }
          </p>
        </div>
        <PartSelector parts={parts} selectedPart={selectedPart} setSelectedPart={setSelectedPart} />
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Aggregated Demand" value={formatCompact(kpis.totalDemand)} icon={BarChart2} subtitle="Historical" badgeColor="gray" isGood={false} />
        <KPICard title="Forecast Confidence" value={`${confidenceScore}%`} icon={CheckCircle2} subtitle={sourceInfo.label} badgeColor={sourceInfo.color} isGood={sourceInfo.isGood} />
        <KPICard title="Active Inventory Parts" value={<AnimatedCounter value={activePartsCount} format={true} />} icon={Activity} subtitle={`${((1 - sparsity) * 100).toFixed(0)}% Density`} badgeColor="cyan" />
        <KPICard title="3M Demand Trend" value={kpis.projTrend3M > 0 ? `+${kpis.projTrend3M.toFixed(1)}%` : `${(kpis.projTrend3M || 0).toFixed(1)}%`} icon={TrendingUp} subtitle="vs Last 3M" badgeColor={kpis.projTrend3M >= 0 ? 'emerald' : 'amber'} isGood={kpis.projTrend3M >= 0} />
        <KPICard title="1M Projected Demand" value={formatCompact(kpis.forecast1M)} icon={LineChartIcon} subtitle="Short-Term" badgeColor="gray" isGood={false} />
        <KPICard title="3M Projected Demand" value={formatCompact(kpis.forecast3M)} icon={LineChartIcon} subtitle="Mid-Term" badgeColor="gray" isGood={false} />
        <KPICard title="6M Projected Demand" value={formatCompact(kpis.forecast6M)} icon={LineChartIcon} subtitle="Long-Term" badgeColor="gray" isGood={false} />
        <KPICard title="12M Projected Demand" value={formatCompact(kpis.forecast12M)} icon={LineChartIcon} subtitle="Strategic" badgeColor="gray" isGood={false} />
      </div>

      <AIInsightPanel insight={forecastInsight} loading={forecastAiLoading} title="Forecast Intelligence Analysis" />

      {/* FORECAST CHART */}
      <div className="theme-bg-card border theme-border rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl theme-text flex items-center gap-2">
              Demand Forecast 
              {isFetchingPart && !loading && <Loader2 size={16} className="animate-spin text-cyan-500" />}
            </h2>
            {!isFetchingPart && skuState && (
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold uppercase tracking-wider ${
                  skuState === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                  skuState === 'SPARSE' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  skuState === 'DORMANT' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                  skuState === 'INACTIVE' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                  'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
                }`}>
                  STATE: {skuState}
                </span>
                
                <span className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold uppercase tracking-wider ${
                  confidence === 'HIGH' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                  confidence === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  confidence === 'LOW' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                  'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}>
                  {confidence} CONFIDENCE
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 theme-bg-card-soft p-1 rounded-xl border theme-border w-full md:w-auto">
            {horizons.map(h => (
              <button 
                key={h}
                onClick={() => setSelectedHorizon(h)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 w-full md:w-auto ${
                  selectedHorizon === h 
                  ? 'bg-cyan-500 text-black shadow-sm' 
                  : 'text-cyan-200 hover:bg-white/10'
                }`}
              >
                {h} Forecast
              </button>
            ))}
          </div>
        </div>
        
        {!isFetchingPart && skuState === 'INACTIVE' && (
          <div className="mb-6 p-4 rounded-xl border border-gray-500/30 bg-gray-500/10 flex items-start gap-3">
            <AlertCircle className="text-gray-400 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-gray-300">This SKU has no historical consumption activity. Forecast generation has been disabled to maintain operational realism.</p>
          </div>
        )}
        
        {!isFetchingPart && skuState === 'DORMANT' && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-3">
            <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-rose-300">Low confidence forecast due to highly dormant historical demand. Operational review is recommended.</p>
          </div>
        )}
        
        <div className="w-full" style={{ minWidth: 0, height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="Month"
                stroke="var(--theme-muted)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis stroke="var(--theme-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", marginTop: "10px" }} />
              <Line
                type="monotone"
                dataKey="Demand"
                name="Historical Demand"
                stroke="var(--theme-cyan)"
                strokeWidth={3}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Forecast"
                name="Forecast"
                stroke="#8b5cf6"
                strokeWidth={3}
                strokeDasharray="6 6"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI INSIGHTS */}
      <div className="theme-bg-card border theme-border rounded-2xl p-6 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Zap size={20} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl theme-text">Forecast Signals</h2>
            <p className="theme-muted text-sm mt-0.5">Deterministic model selection and trajectory telemetry.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {generateInsights.map((insight, idx) => {
            const isWarning = insight.type === 'warning';
            const isAlert = insight.type === 'alert';
            const isSuccess = insight.type === 'success';
            const isInfo = insight.type === 'info';
            
            return (
              <div key={idx} className={`p-5 rounded-xl border flex flex-col gap-2 ${
                isWarning ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40' : 
                isAlert ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40' :
                isSuccess ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40' :
                'bg-cyan-500/5 border-cyan-500/20 hover:border-cyan-500/40'
              } transition-colors duration-300`}>
                <div className="flex items-center gap-2 mb-1">
                  {isWarning && <AlertTriangle size={16} className="text-amber-500" />}
                  {isAlert && <AlertCircle size={16} className="text-rose-500" />}
                  {isSuccess && <CheckCircle2 size={16} className="text-emerald-500" />}
                  {isInfo && <Info size={16} className="text-cyan-500" />}
                  <h3 className={`text-sm font-semibold tracking-wide uppercase ${
                    isWarning ? 'text-amber-500' : 
                    isAlert ? 'text-rose-500' :
                    isSuccess ? 'text-emerald-500' :
                    'text-cyan-500'
                  }`}>
                    {insight.title}
                  </h3>
                </div>
                <p className="text-sm theme-text leading-relaxed opacity-90">{insight.text}</p>
              </div>
            );
          })}
          {generateInsights.length === 0 && (
             <p className="theme-muted text-sm italic py-4">No significant insights detected for this horizon.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Forecast;
