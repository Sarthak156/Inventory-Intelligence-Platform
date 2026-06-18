import { useState, useEffect, useMemo } from "react";
import { BoxSelect, Database, Loader2, Search as SearchIcon, ChevronLeft, ChevronRight, Activity, AlertTriangle, TrendingUp, Zap, X, CheckCircle2, LineChart as LineChartIcon, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import API from "../services/api";

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

const Inventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [selectedConfidence, setSelectedConfidence] = useState("ALL");
  const [selectedForecastStatus, setSelectedForecastStatus] = useState("ALL");
  const [opMode, setOpMode] = useState("Balanced");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [selectedSku, setSelectedSku] = useState(null);
  const [skuDemandData, setSkuDemandData] = useState(null);
  const [loadingSku, setLoadingSku] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/inventory-risk");
        setInventoryData(res.data || []);
      } catch (error) {
        console.error("Failed to fetch inventory data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return inventoryData.filter(d => {
      const matchesSearch = !searchTerm || d["Part No"].toLowerCase().includes(searchTerm.toLowerCase());
      let matchesFilter = true;
      if (selectedFilter === "HIGH RISK") matchesFilter = d.Risk === "HIGH";
      else if (selectedFilter === "SPARSE") matchesFilter = d.State === "Sparse";
      else if (selectedFilter === "SURGING") matchesFilter = d.State === "Surging";
      else if (selectedFilter === "STABLE") matchesFilter = d.State === "Stable";
      else if (selectedFilter === "ACTIVE") matchesFilter = d.State !== "Dormant";
      
      const matchesConfidence = selectedConfidence === "ALL" || d.Confidence === selectedConfidence;
      const matchesForecastStatus = selectedForecastStatus === "ALL" || d.ForecastStatus === selectedForecastStatus;
      
      return matchesSearch && matchesFilter && matchesConfidence && matchesForecastStatus;
    });
  }, [inventoryData, searchTerm, selectedFilter, selectedConfidence, selectedForecastStatus]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activeSkus = inventoryData.filter(d => d.State !== "Dormant").length;
  const criticalAlerts = inventoryData.filter(d => d.Risk === "HIGH").length;
  const sparseCount = inventoryData.filter(d => d.State === "Sparse").length;
  const sparsePercent = inventoryData.length ? Math.round((sparseCount / inventoryData.length) * 100) : 0;
  const volatileCount = inventoryData.filter(d => d.Volatility > 1).length;

  const { demandAcceleration, optimizationReadiness, fallbackCoverage } = useMemo(() => {
    if (!inventoryData || inventoryData.length === 0) {
        return { demandAcceleration: 0, optimizationReadiness: 0, fallbackCoverage: 0 };
    }

    // Demand Acceleration: Average forecast growth across all items
    const totalGrowth = inventoryData.reduce((acc, item) => acc + item.ForecastGrowth, 0);
    const avgGrowth = inventoryData.length > 0 ? totalGrowth / inventoryData.length : 1.0;
    const demandAcceleration = (avgGrowth - 1) * 100;

    // Optimization Readiness: % of SKUs that are not dormant and have a forecast
    const readySkus = inventoryData.filter(d => d.State !== 'Dormant' && d.ForecastStatus !== 'NO_FORECAST' && d.ForecastStatus !== 'LOW_CONFIDENCE').length;
    const optimizationReadiness = inventoryData.length > 0 ? (readySkus / inventoryData.length) * 100 : 0;

    // Fallback Coverage: % of sparse items using a fallback
    const sparseItems = inventoryData.filter(d => d.State === 'Sparse');
    const sparseWithFallback = sparseItems.filter(d => d.ForecastStatus.includes('FALLBACK')).length;
    const fallbackCoverage = sparseItems.length > 0 ? (sparseWithFallback / sparseItems.length) * 100 : 0;

    return { 
        demandAcceleration, 
        optimizationReadiness,
        fallbackCoverage
    };
  }, [inventoryData]);

  const handleRowClick = async (sku) => {
    setSelectedSku(sku);
    setLoadingSku(true);
    try {
      const res = await API.get(`/monthly-demand/${encodeURIComponent(sku["Part No"])}`);
      setSkuDemandData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSku(false);
    }
  };

  // Dynamic Recommendation Engine based on Operational Mode
  const getDynamicRecommendation = (row, mode) => {
    const base = row.Recommendation; // "Increase Safety Stock", "Monitor Demand Closely", "Maintain Current Levels"
    
    if (mode === "Conservative") {
      if (base === "Increase Safety Stock") return "Expedite Restock (Critical)";
      if (base === "Monitor Demand Closely") return "Increase Buffer Stock";
      if (base === "Maintain Current Levels") return "Monitor Demand Closely";
      return "Expedite Restock (Critical)";
    }
    
    if (mode === "Aggressive") {
      if (base === "Increase Safety Stock") return "Monitor Demand Closely";
      if (base === "Monitor Demand Closely") return "Reduce Safety Stock";
      if (base === "Maintain Current Levels") return "Draw Down Inventory";
      return "Reduce Safety Stock";
    }
    
    return base; // Balanced default
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col gap-6 w-full animate-in fade-in duration-500">
        <div className="flex justify-between items-end gap-4 mb-2">
           <div className="space-y-3 w-1/3"><div className="h-8 w-3/4 bg-gray-500/10 rounded-lg animate-pulse"></div><div className="h-4 w-1/2 bg-gray-500/10 rounded-lg animate-pulse"></div></div>
           <div className="h-10 w-64 bg-gray-500/10 rounded-xl animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-500/10 rounded-2xl animate-pulse border border-gray-500/5"></div>)}
        </div>
        <div className="h-32 bg-gray-500/10 rounded-2xl animate-pulse border border-gray-500/5"></div>
        <div className="h-96 bg-gray-500/10 rounded-2xl animate-pulse border border-gray-500/5"></div>
      </div>
    );
  }

  if (inventoryData.length === 0 && !searchTerm) {
    return (
      <div className="h-full min-h-[80vh] flex flex-col items-center justify-center p-8 relative">
        <div className="max-w-md w-full theme-bg-card backdrop-blur-md rounded-3xl theme-card-shadow border theme-border p-10 text-center transition-all">
          <div className="w-16 h-16 theme-bg-icon theme-cyan rounded-2xl flex items-center justify-center mx-auto mb-6 border theme-border">
            <Database size={28} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-medium theme-text mb-2 tracking-tight">System Offline</h2>
          <p className="text-sm theme-muted mb-8 leading-relaxed">
            Enterprise spare parts inventory dataset has not been ingested. Link data sources to generate optimization telemetry.
          </p>
          <Link 
            to="/upload"
            className="inline-flex items-center gap-2 theme-button-cyan py-2.5 px-6 rounded-xl transition-all text-sm font-medium"
          >
            <BoxSelect size={16} />
            Ingest Data
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <h1 className="text-3xl font-light theme-text tracking-tight flex items-center gap-3">
            Inventory Command Center
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Monitoring
            </span>
          </h1>
          <p className="text-sm theme-muted mt-1">Real-time optimization telemetry and active command operations.</p>
        </div>
        
        <div className="flex items-center gap-2 theme-bg-card border theme-border p-1 rounded-xl">
          {["Conservative", "Balanced", "Aggressive"].map(mode => (
            <button
              key={mode}
              onClick={() => setOpMode(mode)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${opMode === mode ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'theme-muted hover:text-cyan-400'}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="theme-bg-card border theme-border rounded-2xl p-5 backdrop-blur-md group hover:border-cyan-500/60 hover:shadow-[0_0_25px_rgba(34,211,238,0.15)] hover:-translate-y-1 transition-all duration-500 cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-cyan-500/20 bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
              <BoxSelect size={18} className="text-cyan-500" />
            </div>
          </div>
          <div>
            <p className="theme-muted text-xs uppercase tracking-wider font-semibold mb-1">Active SKUs</p>
            <h3 className="text-3xl font-light theme-text tracking-tight"><AnimatedCounter value={activeSkus} format={true} /></h3>
          </div>
        </div>

        <div className="theme-bg-card border border-rose-500/30 rounded-2xl p-5 backdrop-blur-md group hover:border-rose-500/60 hover:shadow-[0_0_25px_rgba(244,63,94,0.15)] hover:-translate-y-1 transition-all duration-500 cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-rose-500/20 bg-rose-500/10 group-hover:bg-rose-500/20 transition-colors">
              <AlertTriangle size={18} className="text-rose-500" />
            </div>
          </div>
          <div>
            <p className="theme-muted text-xs uppercase tracking-wider font-semibold mb-1 text-rose-400">Critical Alerts</p>
            <h3 className="text-3xl font-light text-rose-500 tracking-tight"><AnimatedCounter value={criticalAlerts} format={true} /></h3>
          </div>
        </div>

        <div className="theme-bg-card border theme-border rounded-2xl p-5 backdrop-blur-md group hover:border-emerald-500/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition-all duration-500 cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-emerald-500/20 bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
              <TrendingUp size={18} className="text-emerald-500" />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">VS LAST 3M</span>
          </div>
          <div>
            <p className="theme-muted text-xs uppercase tracking-wider font-semibold mb-1">Demand Acceleration</p>
            <h3 className="text-3xl font-light theme-text tracking-tight"><AnimatedCounter value={demandAcceleration} prefix={demandAcceleration >= 0 ? '+' : ''} suffix="%" decimals={1} /></h3>
          </div>
        </div>

        <div className="theme-bg-card border theme-border rounded-2xl p-5 backdrop-blur-md group hover:border-cyan-500/60 hover:shadow-[0_0_25px_rgba(34,211,238,0.15)] hover:-translate-y-1 transition-all duration-500 cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-cyan-500/20 bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
              <Activity size={18} className="text-cyan-500" />
            </div>
          </div>
          <div>
            <p className="theme-muted text-xs uppercase tracking-wider font-semibold mb-1">Optimization Readiness</p>
            <h3 className="text-3xl font-light theme-text tracking-tight"><AnimatedCounter value={optimizationReadiness} suffix="%" decimals={0} /></h3>
          </div>
        </div>
      </div>

      {/* AI Insights Panel */}
      <div className="theme-bg-card border theme-border rounded-2xl p-6 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-4">
          <Zap size={18} className="text-cyan-400" />
          <h2 className="text-sm uppercase tracking-widest theme-text font-semibold">AI Operations Insights</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <p className="text-xs text-amber-500 font-semibold mb-1 uppercase tracking-wide">Volatility Alert</p>
            <p className="text-sm theme-text"><AnimatedCounter value={volatileCount} /> SKUs show increasing volatility this quarter.</p>
          </div>
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4">
            <p className="text-xs text-cyan-500 font-semibold mb-1 uppercase tracking-wide">Inventory Profile</p>
            <p className="text-sm theme-text">Sparse-demand parts account for <AnimatedCounter value={sparsePercent} suffix="%" /> of monitored inventory.</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-xs text-emerald-500 font-semibold mb-1 uppercase tracking-wide">System Optimization</p>
            <p className="text-sm theme-text">Fallback strategies applied to <AnimatedCounter value={fallbackCoverage} suffix="%" /> of sparse SKUs to improve stability.</p>
          </div>
        </div>
      </div>

      {/* Operational Workspace */}
      <div className="theme-bg-card border theme-border rounded-2xl backdrop-blur-md overflow-hidden flex flex-col">
        <div className="p-6 border-b theme-border flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h2 className="text-sm uppercase tracking-widest theme-text font-semibold">Operational Workspace</h2>
              <p className="text-xs theme-muted mt-1">Showing {filteredData.length} active parts</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-36">
                  <select
                    value={selectedConfidence}
                    onChange={(e) => { setSelectedConfidence(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-3 pr-8 py-2 theme-bg-input border theme-border rounded-xl focus:outline-none focus:theme-cyan-border text-xs theme-text appearance-none cursor-pointer"
                  >
                    <option value="ALL">All Confidence</option>
                    <option value="HIGH">High Confidence</option>
                    <option value="MEDIUM">Med Confidence</option>
                    <option value="LOW">Low Confidence</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 theme-muted pointer-events-none" />
                </div>
                <div className="relative w-full sm:w-40">
                  <select
                    value={selectedForecastStatus}
                    onChange={(e) => { setSelectedForecastStatus(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-3 pr-8 py-2 theme-bg-input border theme-border rounded-xl focus:outline-none focus:theme-cyan-border text-xs theme-text appearance-none cursor-pointer"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PART_LEVEL">Part Level</option>
                    <option value="HALB_FALLBACK">HALB Fallback</option>
                    <option value="GLOBAL_FALLBACK">Global Fallback</option>
                    <option value="LOW_CONFIDENCE">Low Confidence</option>
                    <option value="NO_FORECAST">No Forecast</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 theme-muted pointer-events-none" />
                </div>
              </div>
              <div className="relative w-full sm:w-64">
                <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 theme-muted" />
                <input
                  type="text"
                  placeholder="Search Part No..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-10 pr-4 py-2 theme-bg-input border theme-border rounded-xl focus:outline-none focus:theme-cyan-border text-sm theme-text"
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {["ALL", "HIGH RISK", "SPARSE", "SURGING", "STABLE", "ACTIVE"].map(f => (
              <button
                key={f}
                onClick={() => { setSelectedFilter(f); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all duration-300 ${
                  selectedFilter === f 
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                  : 'bg-transparent text-gray-400 border-gray-600/50 hover:border-cyan-500/30 hover:text-cyan-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="uppercase tracking-widest text-[10px] theme-bg-card-soft theme-muted border-b theme-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Part No</th>
                <th className="px-6 py-4 font-semibold">Risk Level</th>
                <th className="px-6 py-4 font-semibold">State & Trend</th>
                <th className="px-6 py-4 font-semibold">Telemetry (Vol / Spar)</th>
                <th className="px-6 py-4 font-semibold">Forecast Status</th>
                <th className="px-6 py-4 font-semibold">AI Action</th>
                <th className="px-6 py-4 font-semibold">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => handleRowClick(row)}
                  className="border-b theme-border last:border-0 hover:bg-cyan-500/5 hover:shadow-[inset_0_0_20px_rgba(34,211,238,0.05)] transition-all duration-500 cursor-pointer group animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                  style={{ animationDelay: `${idx * 30}ms`, animationDuration: '500ms' }}
                >
                  <td className="px-6 py-4 font-medium theme-text group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.6)] transition-all duration-300">{row["Part No"]}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider border ${
                      row.Risk === 'HIGH' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                      row.Risk === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                      {row.Risk}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold tracking-wider uppercase ${
                        row.State === 'Surging' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        row.State === 'Volatile' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        row.State === 'Stable' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        row.State === 'Sparse' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {row.State}
                      </span>
                      {row.DemandTrend === 'UP' && <TrendingUp size={14} className="text-emerald-500" />}
                      {row.DemandTrend === 'DOWN' && <TrendingUp size={14} className="text-rose-500 rotate-180" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 theme-text">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs">V: <span className={row.Volatility > 1 ? 'text-amber-400 font-bold' : ''}>{row.Volatility}</span></span>
                      <span className="text-xs text-gray-400">S: <span className={row.Sparsity > 0.7 ? 'text-blue-400 font-bold' : ''}>{row.Sparsity}</span></span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] theme-muted uppercase tracking-wider font-semibold border theme-border bg-white/5 px-2 py-1 rounded">
                      {row.ForecastStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs theme-text font-medium transition-all duration-300">{getDynamicRecommendation(row, opMode)}</span>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider border ${
                       row.Confidence === 'HIGH' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                       row.Confidence === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                       'bg-rose-500/10 text-rose-500 border-rose-500/20'
                     }`}>
                       {row.Confidence}
                     </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t theme-border theme-bg-card-soft">
            <div className="text-sm theme-muted">
              Showing <span className="font-medium theme-text">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium theme-text">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="font-medium theme-text">{filteredData.length}</span> items
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg theme-button-neutral disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 rounded-lg theme-button-neutral disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
        
        {filteredData.length === 0 && (
          <div className="p-8 text-center theme-muted text-sm">
            No parts found matching criteria
          </div>
        )}
      </div>

      {/* Sku Details Drawer */}
      {selectedSku && (
       <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-500">
         <div className="theme-app border theme-border rounded-2xl w-full max-w-4xl shadow-[0_0_50px_rgba(0,0,0,0.4)] flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-[0.98] slide-in-from-bottom-6 duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b theme-border gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-light theme-text tracking-tight">{selectedSku["Part No"]}</h2>
                  <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider border ${
                    selectedSku.Risk === 'HIGH' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                    selectedSku.Risk === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  }`}>
                    {selectedSku.Risk} RISK
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold tracking-wider uppercase ${
                    selectedSku.State === 'Surging' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    selectedSku.State === 'Volatile' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    selectedSku.State === 'Stable' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    selectedSku.State === 'Sparse' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  }`}>
                    {selectedSku.State}
                  </span>
                </div>
              </div>
              <button onClick={() => { setSelectedSku(null); setSkuDemandData(null); }} className="p-2 theme-muted hover:theme-text hover:bg-white/5 rounded-lg transition-colors border theme-border">
                <X size={20} />
              </button>
            </div>
     
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="theme-bg-card-soft p-5 rounded-xl border theme-border">
                   <p className="text-xs theme-muted uppercase tracking-wider mb-1">Volatility Score</p>
                   <p className="text-2xl theme-text font-semibold">{selectedSku.Volatility}</p>
                 </div>
                 <div className="theme-bg-card-soft p-5 rounded-xl border theme-border">
                   <p className="text-xs theme-muted uppercase tracking-wider mb-1">Sparsity Ratio</p>
                   <p className="text-2xl theme-text font-semibold">{selectedSku.Sparsity}</p>
                 </div>
                 <div className="theme-bg-card-soft p-5 rounded-xl border theme-border">
                   <p className="text-xs theme-muted uppercase tracking-wider mb-1">Forecast Growth Multiplier</p>
                   <p className="text-2xl theme-text font-semibold">{selectedSku.ForecastGrowth}</p>
                 </div>
              </div>

              {/* Recommendation Engine */}
              <div className="theme-bg-card border theme-cyan-border shadow-[0_0_15px_rgba(34,211,238,0.1)] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2 mb-2 uppercase tracking-widest">
                  <Zap size={16} className="text-cyan-400" /> AI Optimization Engine
                </h3>
                <p className="text-sm theme-text font-medium mb-1">Recommendation: <span className="theme-text font-light transition-all duration-300">{getDynamicRecommendation(selectedSku, opMode)}</span></p>
                <p className="text-xs theme-muted leading-relaxed">
                  Reasoning: {selectedSku.State === 'Stable' ? 'Demand remains stable with low volatility and high forecast confidence.' : 
                              selectedSku.State === 'Volatile' ? 'High standard deviation detected in recent periods. Buffer stock increase advised.' :
                              selectedSku.State === 'Surging' ? 'Forecast growth is accelerating rapidly. Immediate restock recommended.' :
                              selectedSku.State === 'Sparse' ? 'Intermittent demand profile detected. Utilizing fallback category baselines.' :
                              'SKU is largely dormant. Review lifecycle status.'}
                </p>
              </div>

              {/* Tags Row */}
              {selectedSku.Reasons && selectedSku.Reasons.length > 0 && (
                <div>
                  <p className="text-xs theme-muted uppercase tracking-wider mb-3">Risk & Operational Factors</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSku.Reasons.map((r, i) => (
                      <span key={i} className="text-xs px-3 py-1.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 font-semibold tracking-wide flex items-center gap-1.5 hover:text-rose-300 hover:shadow-[0_0_15px_rgba(244,63,94,0.6)] hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                        <AlertTriangle size={14} />
                        {r}
                      </span>
                    ))}
                    {selectedSku.State === 'Stable' && (
                      <span className="text-xs px-3 py-1.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold tracking-wide flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> STABLE SKU
                      </span>
                    )}
                  </div>
                </div>
              )}
     
              {/* Chart Area */}
              <div>
                <p className="text-xs theme-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <LineChartIcon size={14} className="theme-cyan" />
                  Historical vs AI Forecast Timeline
                </p>
                <div className="theme-bg-card-soft border theme-border rounded-xl p-4 h-64">
                  {loadingSku ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 size={24} className="theme-cyan animate-spin" />
                    </div>
                  ) : skuDemandData && skuDemandData.items && skuDemandData.items.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={skuDemandData.items} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                         <XAxis dataKey="Month" stroke="var(--theme-muted)" fontSize={10} tickLine={false} axisLine={false} />
                         <YAxis domain={[0, dataMax => Math.max(10, Math.ceil(dataMax * 1.2))]} stroke="var(--theme-muted)" fontSize={10} tickLine={false} axisLine={false} />
                         <RechartsTooltip 
                           contentStyle={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', borderRadius: '8px' }}
                           itemStyle={{ color: 'var(--theme-text)' }}
                           labelStyle={{ color: 'var(--theme-cyan)', marginBottom: '4px' }}
                         />
                         <Line type="monotone" dataKey="Demand" name="Historical Demand" stroke="var(--theme-cyan)" strokeWidth={3} dot={false} animationDuration={2000} animationEasing="ease-out" />
                         <Line type="monotone" dataKey="Forecast" name="AI Forecast" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="6 6" dot={false} animationDuration={2000} animationEasing="ease-out" />
                       </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm theme-muted">No demand data available for visualization</div>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t theme-border theme-bg-card-soft flex flex-wrap items-center justify-between gap-4 text-[10px] uppercase tracking-wider font-semibold theme-muted">
               <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                 <span className="flex items-center gap-2">Model Status: <span className="text-emerald-400">ACTIVE</span></span>
                 <span className="flex items-center gap-2">Forecast Confidence: <span className={selectedSku.Confidence === 'HIGH' ? 'text-emerald-400' : selectedSku.Confidence === 'MEDIUM' ? 'text-amber-400' : 'text-rose-400'}>{selectedSku.Confidence}</span></span>
                 <span className="flex items-center gap-2">Optimization Engine: <span className="text-cyan-400">ONLINE</span></span>
               </div>
               <div className="flex items-center gap-2 text-cyan-500">
                 <span className="relative flex h-1.5 w-1.5">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                 </span>
                 Live Sync
               </div>
            </div>
         </div>
       </div>
      )}

    </div>
  );
};

export default Inventory;