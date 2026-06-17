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
  ChevronDown
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

const formatCompact = (num) => {
  if (num === null || num === undefined) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
};

const KPICard = ({ title, value, subtitle, icon: Icon, isGood }) => (
  <div className="theme-bg-card border theme-border rounded-2xl p-5 backdrop-blur-md hover:theme-cyan-border hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className="w-10 h-10 rounded-lg theme-bg-icon flex items-center justify-center border theme-border group-hover:theme-cyan-border transition-colors">
        <Icon size={18} className="theme-muted group-hover:text-cyan-500" />
      </div>
      {subtitle && (
        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wider ${isGood ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'}`}>
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
              {entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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

  const [parts, setParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState("ALL_PARTS");
  const [selectedHorizon, setSelectedHorizon] = useState('3M');
  const [activePartsCount, setActivePartsCount] = useState(0);
  const [isFetchingPart, setIsFetchingPart] = useState(false);
  const horizons = ['1M', '3M', '6M', '12M'];
  
  const processDemandData = (demandData) => {
    setFullData(demandData);
    if (demandData.length > 0) {
      const historicalData = demandData.filter(d => !d.Is_Future);
      const futureData = demandData.filter(d => d.Is_Future);
      
      let historicalKpis = { totalDemand: 0, highestMonth: "-", readiness: "0%" };
      if (historicalData.length > 0) {
        const total = historicalData.reduce((sum, item) => sum + (item.Demand || 0), 0);
        const highest = historicalData.reduce((max, item) => (item.Demand || 0) > (max.Demand || 0) ? item : max, historicalData[0]);
        historicalKpis = {
          totalDemand: total,
          highestMonth: highest.Month,
          readiness: historicalData.length >= 12 ? "98%" : Math.min(100, Math.max(10, historicalData.length * 8)) + "%",
        };
      }

      const sumForecast = (months) => futureData.slice(0, months).reduce((sum, item) => sum + (item.Forecast || 0), 0);

      setKpis({
        ...historicalKpis,
        forecast1M: sumForecast(1),
        forecast3M: sumForecast(3),
        forecast6M: sumForecast(6),
        forecast12M: sumForecast(12),
      });
    } else {
      setKpis({
        totalDemand: 0, highestMonth: "-", readiness: "0%",
        forecast1M: 0, forecast3M: 0, forecast6M: 0, forecast12M: 0
      });
    }
  };

  useEffect(() => {
    const fetchInitialAndDemand = async () => {
      setIsFetchingPart(true);
      try {
        if (parts.length === 0) {
          const [demandRes, partsRes] = await Promise.all([
            API.get("/monthly-demand"),
            API.get("/parts")
          ]);
          
          const fetchedParts = partsRes.data || [];
          setParts(fetchedParts);
          setActivePartsCount(fetchedParts.length);
          processDemandData(demandRes.data || []);
          setLoading(false);
        } else {
          const url = selectedPart === "ALL_PARTS" 
            ? "/monthly-demand" 
            : `/monthly-demand/${encodeURIComponent(selectedPart)}`;
          const demandRes = await API.get(url);
          processDemandData(demandRes.data || []);
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

  if (loading) {
    return (
      <div className="h-full min-h-[80vh] flex flex-col items-center justify-center p-8">
        <Loader2 size={36} className="theme-cyan animate-spin" />
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
    <div className="p-8 space-y-8">
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
        <KPICard title="Total Aggregated Demand" value={formatCompact(kpis.totalDemand)} icon={BarChart2} subtitle="Historical" isGood={false} />
        <KPICard title="Highest Demand Month" value={kpis.highestMonth} icon={TrendingUp} subtitle="Peak" isGood={false} />
        <KPICard title="Active Inventory Parts" value={activePartsCount.toLocaleString()} icon={Activity} />
        <KPICard title="Forecast Readiness" value={kpis.readiness} icon={CheckCircle2} subtitle="Optimal" isGood={true} />
        <KPICard title="1M Projected Demand" value={formatCompact(kpis.forecast1M)} icon={LineChartIcon} subtitle="Forecast" isGood={false} />
        <KPICard title="3M Projected Demand" value={formatCompact(kpis.forecast3M)} icon={LineChartIcon} subtitle="Forecast" isGood={false} />
        <KPICard title="6M Projected Demand" value={formatCompact(kpis.forecast6M)} icon={LineChartIcon} subtitle="Forecast" isGood={false} />
        <KPICard title="12M Projected Demand" value={formatCompact(kpis.forecast12M)} icon={LineChartIcon} subtitle="Forecast" isGood={false} />
      </div>

      {/* FORECAST CHART */}
      <div className="theme-bg-card border theme-border rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl theme-text flex items-center gap-3">
            Demand Forecast 
            {isFetchingPart && !loading && <Loader2 size={16} className="animate-spin text-cyan-500" />}
          </h2>
          <div className="flex items-center gap-1 theme-bg-card-soft p-1 rounded-xl border theme-border">
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
        <h2 className="text-xl theme-text mb-6">
          AI Insights
        </h2>
        <p className="theme-muted text-sm">Actionable intelligence will appear here.</p>
      </div>
    </div>
  );
};

export default Forecast;