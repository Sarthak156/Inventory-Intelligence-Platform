import { useState, useEffect, useMemo } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle2, Loader2, X, LineChart as LineChartIcon, Activity, Flame, Search as SearchIcon, ArrowUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import API from "../services/api";

const Risks = () => {
  const [riskData, setRiskData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRisk, setSelectedRisk] = useState("ALL");
  const [selectedSku, setSelectedSku] = useState(null);
  const [skuDemandData, setSkuDemandData] = useState(null);
  const [loadingSku, setLoadingSku] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("ALL");
  const [sortConfig, setSortConfig] = useState({ key: 'RiskScore', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchRisks = async () => {
      try {
        const res = await API.get("/inventory-risk");
        setRiskData(res.data || []);
      } catch (err) {
        console.error("Failed to fetch risk data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRisks();
  }, []);

  const availableTags = useMemo(() => {
    const tags = new Set();
    riskData.forEach(d => {
      if (d.Reasons) {
        d.Reasons.forEach(t => tags.add(t));
      }
    });
    return Array.from(tags).sort();
  }, [riskData]);

  if (loading) {
    return (
      <div className="h-full min-h-[80vh] flex flex-col items-center justify-center p-8">
        <Loader2 size={36} className="theme-cyan animate-spin" />
      </div>
    );
  }

  const highRisk = riskData.filter(d => d.Risk === "HIGH");
  const medRisk = riskData.filter(d => d.Risk === "MEDIUM");
  const lowRisk = riskData.filter(d => d.Risk === "LOW");
  
  const filteredData = riskData.filter(d => {
    const matchesRisk = selectedRisk === "ALL" || d.Risk === selectedRisk;
    const matchesSearch = !searchTerm || String(d["Part No"]).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === "ALL" || (d.Reasons && d.Reasons.includes(selectedTag));
    return matchesRisk && matchesSearch && matchesTag;
  });
  
  const mostCritical = highRisk.length > 0 ? highRisk[0] : (riskData.length > 0 ? riskData[0] : null);
  
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortConfig.key) {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const pieData = [
    { name: "HIGH", value: highRisk.length, color: "#f43f5e", avgVol: highRisk.length > 0 ? (highRisk.reduce((acc, curr) => acc + curr.Volatility, 0) / highRisk.length).toFixed(2) : 0 },
    { name: "MEDIUM", value: medRisk.length, color: "#f59e0b", avgVol: medRisk.length > 0 ? (medRisk.reduce((acc, curr) => acc + curr.Volatility, 0) / medRisk.length).toFixed(2) : 0 },
    { name: "LOW", value: lowRisk.length, color: "#10b981", avgVol: lowRisk.length > 0 ? (lowRisk.reduce((acc, curr) => acc + curr.Volatility, 0) / lowRisk.length).toFixed(2) : 0 }
  ];

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

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-light theme-text tracking-tight">Risk Assessment</h1>
          <p className="text-sm theme-muted mt-1">Operational inventory risk classification based on volatility, sparsity, and forecast growth.</p>
        </div>
        {(selectedRisk !== "ALL" || selectedTag !== "ALL") && (
          <button onClick={() => { setSelectedRisk("ALL"); setSelectedTag("ALL"); setCurrentPage(1); }} className="text-xs theme-button-neutral px-4 py-2 rounded-lg font-medium transition-colors">
            Clear Filters
          </button>
        )}
      </div>

      {/* Most Critical Alert */}
      {mostCritical && (
        <div className="relative overflow-hidden rounded-2xl p-6 border border-rose-500/30 bg-gradient-to-r from-rose-500/10 to-transparent flex flex-col md:flex-row items-center gap-6 group hover:border-rose-500/50 transition-colors">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-rose-500/20 border border-rose-500/30 shrink-0 relative">
            <div className="absolute inset-0 rounded-full animate-ping bg-rose-500/20"></div>
            <Flame size={32} className="text-rose-500 relative z-10" />
          </div>
          <div className="flex-1">
            <p className="text-rose-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
              Most Critical Inventory Alert
            </p>
            <h3 className="text-2xl font-light text-white mb-2 cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => handleRowClick(mostCritical)}>
              Part No: {mostCritical["Part No"]}
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm theme-text">{mostCritical.Recommendation}</span>
              {mostCritical.Reasons?.map((r, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-300 font-semibold tracking-wider">
                  {r}
                </span>
              ))}
            </div>
          </div>
          <div className="text-center shrink-0">
            <p className="text-xs theme-muted uppercase tracking-wider mb-1">Risk Score</p>
            <p className="text-3xl font-light text-rose-400">{mostCritical.RiskScore}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => { setSelectedRisk(selectedRisk === "HIGH" ? "ALL" : "HIGH"); setCurrentPage(1); }}
          className={`theme-bg-card border ${selectedRisk === "HIGH" ? "theme-cyan-border shadow-[0_0_15px_rgba(34,211,238,0.15)]" : "theme-border"} rounded-2xl p-5 backdrop-blur-md group hover:theme-cyan-border transition-all duration-300 cursor-pointer`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-rose-500/20 bg-rose-500/10">
              <ShieldAlert size={18} className="text-rose-500" />
            </div>
          </div>
          <div>
            <p className="theme-muted text-xs uppercase tracking-wider font-semibold mb-1">High Risk Parts</p>
            <h3 className="text-3xl font-light theme-text tracking-tight">{highRisk.length}</h3>
          </div>
        </div>
        
        <div 
          onClick={() => { setSelectedRisk(selectedRisk === "MEDIUM" ? "ALL" : "MEDIUM"); setCurrentPage(1); }}
          className={`theme-bg-card border ${selectedRisk === "MEDIUM" ? "theme-cyan-border shadow-[0_0_15px_rgba(34,211,238,0.15)]" : "theme-border"} rounded-2xl p-5 backdrop-blur-md group hover:theme-cyan-border transition-all duration-300 cursor-pointer`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-amber-500/20 bg-amber-500/10">
              <AlertTriangle size={18} className="text-amber-500" />
            </div>
          </div>
          <div>
            <p className="theme-muted text-xs uppercase tracking-wider font-semibold mb-1">Medium Risk Parts</p>
            <h3 className="text-3xl font-light theme-text tracking-tight">{medRisk.length}</h3>
          </div>
        </div>

        <div 
          onClick={() => { setSelectedRisk(selectedRisk === "LOW" ? "ALL" : "LOW"); setCurrentPage(1); }}
          className={`theme-bg-card border ${selectedRisk === "LOW" ? "theme-cyan-border shadow-[0_0_15px_rgba(34,211,238,0.15)]" : "theme-border"} rounded-2xl p-5 backdrop-blur-md group hover:theme-cyan-border transition-all duration-300 cursor-pointer`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-emerald-500/20 bg-emerald-500/10">
              <CheckCircle2 size={18} className="text-emerald-500" />
            </div>
          </div>
          <div>
            <p className="theme-muted text-xs uppercase tracking-wider font-semibold mb-1">Low Risk Parts</p>
            <h3 className="text-3xl font-light theme-text tracking-tight">{lowRisk.length}</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Donut Chart */}
        <div className="theme-bg-card border theme-border rounded-2xl p-6 backdrop-blur-md flex flex-col min-h-[380px]">
          <div className="text-center w-full mb-2">
            <h2 className="text-sm uppercase tracking-widest theme-text font-semibold">Risk Distribution Summary</h2>
            <p className="text-[10px] theme-muted mt-1 uppercase tracking-wider">Click chart slices or legends to filter</p>
          </div>
        <div className="w-full my-4" style={{ height: 260, minWidth: 0 }}>
          {riskData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-sm theme-muted">
              No risk data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  onClick={(data) => { setSelectedRisk(selectedRisk === data.name ? "ALL" : data.name); setCurrentPage(1); }}
                  className="cursor-pointer outline-none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const total = pieData.reduce((acc, curr) => acc + curr.value, 0);
                      const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
                      return (
                        <div className="theme-bg-card border theme-border p-4 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.15)] backdrop-blur-md">
                          <p className="text-sm font-semibold mb-2" style={{ color: data.color }}>{data.name} RISK</p>
                          <div className="text-xs theme-muted flex flex-col gap-1.5">
                            <span className="flex justify-between gap-4">Count: <strong className="theme-text">{data.value}</strong></span>
                            <span className="flex justify-between gap-4">Share: <strong className="theme-text">{percent}%</strong></span>
                            <span className="flex justify-between gap-4">Avg Volatility: <strong className="theme-text">{data.avgVol}</strong></span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-4">
            {pieData.map(d => (
              <div 
                key={d.name}
                onClick={() => { setSelectedRisk(selectedRisk === d.name ? "ALL" : d.name); setCurrentPage(1); }}
                className={`flex items-center gap-3 theme-bg-card-soft border ${selectedRisk === d.name ? 'theme-cyan-border shadow-[0_0_10px_rgba(34,211,238,0.15)]' : 'theme-border'} px-5 py-2 rounded-xl cursor-pointer hover:theme-cyan-border transition-all`}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] theme-muted uppercase tracking-wider font-semibold">{d.name} Risk</span>
                  <span className="text-sm theme-text font-bold">{d.value.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Risk Table */}
        <div className="theme-bg-card border theme-border rounded-2xl backdrop-blur-md overflow-hidden flex flex-col">
          <div className="p-6 border-b theme-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-sm uppercase tracking-widest theme-text font-semibold">
                {selectedRisk === "ALL" ? "Operational Workspace" : `${selectedRisk} Risk Workspace`}
              </h2>
              <p className="text-xs theme-muted mt-1">
                Showing {sortedData.length} items
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-48">
                <select
                  value={selectedTag}
                  onChange={(e) => { setSelectedTag(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-4 pr-10 py-2 theme-bg-input border theme-border rounded-xl focus:outline-none focus:theme-cyan-border text-sm theme-text appearance-none cursor-pointer"
                >
                  <option value="ALL">All Tags</option>
                  {availableTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 theme-muted pointer-events-none" />
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
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="uppercase tracking-widest text-[10px] theme-bg-card-soft theme-muted border-b theme-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Part No</th>
                  <th className="px-6 py-4 font-semibold">Risk Level</th>
                  <th className="px-6 py-4 font-semibold">Tags</th>
                  <th 
                    className="px-6 py-4 font-semibold cursor-pointer hover:text-cyan-400 select-none group"
                    onClick={() => handleSort('Volatility')}
                  >
                    <div className="flex items-center gap-1">
                      Volatility
                      {sortConfig.key === 'Volatility' ? (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 font-semibold cursor-pointer hover:text-cyan-400 select-none group"
                    onClick={() => handleSort('RiskScore')}
                  >
                    <div className="flex items-center gap-1">
                      Score
                      {sortConfig.key === 'RiskScore' ? (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => handleRowClick(row)}
                    className="border-b theme-border last:border-0 hover:theme-cyan-bg transition-colors duration-200 cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium theme-text group-hover:text-cyan-400">{row["Part No"]}</td>
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
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {row.Reasons?.map((reason, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-semibold tracking-wider hover:shadow-[0_0_8px_rgba(34,211,238,0.4)] hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                            {reason}
                          </span>
                        ))}
                        {(!row.Reasons || row.Reasons.length === 0) && (
                          <span className="text-[9px] text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 theme-text">{row.Volatility}</td>
                    <td className="px-6 py-4 theme-text font-semibold">{row.RiskScore}</td>
                    <td className="px-6 py-4 theme-muted">{row.Recommendation}</td>
                  </tr>
                ))}
                {sortedData.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center theme-muted">No risk data available matching criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {sortedData.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t theme-border theme-bg-card-soft">
              <div className="text-sm theme-muted">
                Showing <span className="font-medium theme-text">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium theme-text">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> of <span className="font-medium theme-text">{sortedData.length}</span> items
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
        </div>
      </div>

      {/* Sku Details Modal Panel */}
      {selectedSku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="theme-bg-card border theme-border rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
             {/* Modal Header */}
             <div className="flex justify-between items-center p-6 border-b theme-border">
               <div>
                 <div className="flex items-center gap-3">
                   <h2 className="text-2xl font-light theme-text tracking-tight">{selectedSku["Part No"]}</h2>
                   <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider border ${
                     selectedSku.Risk === 'HIGH' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                     selectedSku.Risk === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                     'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                   }`}>
                     {selectedSku.Risk} RISK
                   </span>
                 </div>
                 <p className="text-sm theme-muted mt-1">{selectedSku.Recommendation}</p>
               </div>
               <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                   <span className="relative flex h-2 w-2">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                   </span>
                   <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">LIVE</span>
                 </div>
                 <button onClick={() => { setSelectedSku(null); setSkuDemandData(null); }} className="p-2 theme-muted hover:theme-text hover:bg-white/5 rounded-lg transition-colors border theme-border">
                   <X size={20} />
                 </button>
               </div>
             </div>
      
             {/* Modal Body */}
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
               
               {/* Tags Row */}
               {selectedSku.Reasons && selectedSku.Reasons.length > 0 && (
                 <div>
                   <p className="text-xs theme-muted uppercase tracking-wider mb-3">Risk Factors Identified</p>
                   <div className="flex flex-wrap gap-2">
                     {selectedSku.Reasons.map((r, i) => (
                       <span key={i} className="text-xs px-3 py-1.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 font-semibold tracking-wide flex items-center gap-1.5 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                         <AlertTriangle size={14} />
                         {r}
                       </span>
                     ))}
                   </div>
                 </div>
               )}
      
               {/* Chart Area */}
               <div>
                 <p className="text-xs theme-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                   <LineChartIcon size={14} className="theme-cyan" />
                   Historical vs AI Forecast Timeline
                 </p>
                 <div className="theme-bg-card-soft border theme-border rounded-xl p-4 h-72">
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
                          <Line type="monotone" dataKey="Demand" name="Historical Demand" stroke="var(--theme-cyan)" strokeWidth={3} dot={false} />
                          <Line type="monotone" dataKey="Forecast" name="AI Forecast" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="6 6" dot={false} />
                        </LineChart>
                     </ResponsiveContainer>
                   ) : (
                     <div className="h-full flex items-center justify-center text-sm theme-muted">No demand data available for visualization</div>
                   )}
                 </div>
                 
                 {skuDemandData && (
                   <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <div className="flex flex-wrap items-center gap-4 text-xs">
                       <span className="theme-muted">Model Status: <strong className="theme-text border theme-border px-2 py-1 rounded bg-white/5 ml-1">{skuDemandData.sku_state}</strong></span>
                       <span className="theme-muted flex items-center gap-2">
                         Confidence Level: 
                         <div className="flex items-center gap-2 ml-1">
                           <strong className={`border px-2 py-1 rounded ${
                             skuDemandData.confidence === 'HIGH' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                             skuDemandData.confidence === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                             skuDemandData.confidence === 'LOW' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                             'bg-gray-500/10 text-gray-400 border-gray-500/20'
                           }`}>{skuDemandData.confidence}</strong>
                           <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                             <div className={`h-full rounded-full transition-all duration-1000 ${skuDemandData.confidence === 'HIGH' ? 'bg-emerald-500' : skuDemandData.confidence === 'MEDIUM' ? 'bg-amber-500' : skuDemandData.confidence === 'LOW' ? 'bg-rose-500' : 'bg-gray-500'}`} style={{ width: `${skuDemandData.confidence_score || 0}%` }}></div>
                           </div>
                           <span className="text-[10px] theme-text font-bold">
                             {skuDemandData.confidence_score || 0}%
                           </span>
                         </div>
                       </span>
                     </div>
                     <div className="text-[10px] theme-muted flex items-center gap-2 uppercase tracking-wider font-semibold">
                       <Activity size={12} className="theme-cyan" />
                       Forecast Sync: Active • Updated just now
                     </div>
                   </div>
                 )}
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Risks;
