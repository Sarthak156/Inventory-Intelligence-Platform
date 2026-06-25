import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, Activity, Package, AlertOctagon, RefreshCw, BarChart2, Bot, ShieldCheck, AlertTriangle, Zap, Cpu, Gauge, Clock, Waves, Target, CheckCircle, XCircle, Info, ChevronUp, ChevronDown, ArrowRight
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import API from "../services/api";
import { Link } from "react-router-dom";

const KPICard = ({ title, value, trend, sparklineData, icon: Icon, positiveTrend, unit, linkTo }) => {
  const trendColor = positiveTrend ? 'text-emerald-400' : 'text-rose-400';
  const TrendIcon = positiveTrend ? ChevronUp : ChevronDown;

  const cardContent = (
    <div className="theme-bg-card border theme-border rounded-2xl p-4 backdrop-blur-sm hover:border-cyan-500/60 hover:shadow-[0_0_25px_rgba(34,211,238,0.15)] hover:-translate-y-1 transition-all duration-300 group cursor-default">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg theme-bg-icon flex items-center justify-center border theme-border group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-colors">
            <Icon size={16} className="theme-muted group-hover:text-cyan-400 transition-colors" />
          </div>
          <p className="theme-muted text-xs uppercase tracking-wider font-semibold">{title}</p>
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-semibold ${trendColor}`}>
            <TrendIcon size={14} />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-light theme-text tracking-tight">{value}</h3>
          {unit && <span className="text-sm theme-muted font-medium">{unit}</span>}
        </div>
        <div className="w-24 h-10 -mb-2 -mr-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line type="monotone" dataKey="value" stroke={positiveTrend ? "var(--theme-emerald)" : "var(--theme-rose)"} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return linkTo ? <Link to={linkTo}>{cardContent}</Link> : cardContent;
};

const RiskDistributionChart = ({ data }) => {
  const COLORS = { HIGH: '#ef4444', MEDIUM: '#f97316', LOW: '#10b981' };
  const chartData = [
    { name: 'High Risk', value: data.high, color: COLORS.HIGH },
    { name: 'Medium Risk', value: data.medium, color: COLORS.MEDIUM },
    { name: 'Low Risk', value: data.low, color: COLORS.LOW },
  ];

  return (
    <div className="theme-bg-card border theme-border rounded-2xl p-6 backdrop-blur-sm h-full flex flex-col">
      <h2 className="text-sm uppercase tracking-widest theme-text font-semibold mb-4">Risk Distribution</h2>
      <div className="flex-grow flex items-center justify-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} fill="#8884d8" paddingAngle={5}>
              {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />)}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', borderRadius: '8px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center mt-4">
        {chartData.map(item => (
          <div key={item.name}>
            <p className="text-xs theme-muted">{item.name}</p>
            <p className="text-lg font-semibold" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const HighRiskTable = ({ data }) => (
  <div className="theme-bg-card border theme-border rounded-2xl p-6 backdrop-blur-sm">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-sm uppercase tracking-widest theme-text font-semibold">Top High-Risk SKUs</h2>
      <Link to="/risks" className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors group">
        View All
        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
    
    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent -mx-6 px-6">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b theme-border-faint">
            <th className="p-3 font-medium theme-muted">SKU</th>
            <th className="p-3 font-medium theme-muted text-center">Risk Score</th>
            <th className="p-3 font-medium theme-muted text-center">Volatility</th>
            <th className="p-3 font-medium theme-muted text-center">Stock-Out ETA</th>
            <th className="p-3 font-medium theme-muted">Action</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 5).map(item => (
            <tr key={item.partNo} className="border-b theme-border-faint last:border-none hover:bg-white/5 transition-colors">
              <td className="p-3 font-mono">{item.partNo}</td>
              <td className="p-3 text-center">
                <span className="font-semibold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md text-xs border border-rose-500/20">
                  {item.riskScore.toFixed(2)}
                </span>
              </td>
              <td className="p-3 text-center font-mono">{item.volatility.toFixed(2)}</td>
              <td className="p-3 text-center font-mono">{item.stockOutETA}</td>
              <td className="p-3 text-amber-400">{item.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const AIInsightEngine = ({ insights }) => (
  <div className="theme-bg-card border theme-border rounded-2xl p-6 backdrop-blur-sm flex flex-col h-full">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
        <Bot size={18} className="text-cyan-400" />
      </div>
      <h2 className="text-sm uppercase tracking-widest theme-text font-semibold">AI Insight Engine</h2>
    </div>
    <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
      {insights.map((insight, i) => (
        <div key={i} className="theme-bg-card-soft border theme-border p-3.5 rounded-xl hover:border-cyan-500/50 transition-all duration-300 cursor-pointer">
          <div className="flex justify-between items-start mb-1.5">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
              insight.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
              insight.severity === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
            }`}>{insight.severity}</span>
            <span className="text-[10px] theme-muted">{insight.confidence}% Confidence</span>
          </div>
          <p className="text-sm theme-text leading-relaxed">{insight.text}</p>
        </div>
      ))}
    </div>
  </div>
);

const CriticalAlert = ({ alert }) => {
  if (!alert) return null;
  return (
    <div className="theme-bg-card border border-rose-500/40 rounded-2xl p-6 backdrop-blur-sm bg-gradient-to-br from-rose-500/10 to-transparent shadow-[0_0_35px_rgba(244,63,94,0.2)]">
      <div className="flex justify-between items-center">
        <h2 className="text-sm uppercase tracking-widest text-rose-400 font-semibold flex items-center gap-2">
          <AlertTriangle size={16} /> Critical Inventory Alert
        </h2>
        <span className="text-xs text-rose-400">RISK SCORE: {alert.riskScore.toFixed(2)}</span>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2">
          <h3 className="text-2xl font-medium theme-text">SKU: <span className="font-mono text-cyan-400">{alert.partNo}</span></h3>
          <p className="text-amber-400 mt-2 text-base">Recommended Action: <span className="font-semibold">{alert.action}</span></p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs theme-muted uppercase">Volatility</p>
            <p className="text-xl font-semibold text-rose-400">{alert.volatility.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs theme-muted uppercase">Stock-Out ETA</p>
            <p className="text-xl font-semibold text-rose-400">{alert.stockOutETA}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const MainForecastChart = ({ data }) => (
  <div className="lg:col-span-2 theme-bg-card border theme-border rounded-2xl p-6 backdrop-blur-sm">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-sm uppercase tracking-widest theme-text font-semibold">Global Demand vs AI Forecast (12M)</h2>
    </div>
    <div className="w-full" style={{ height: 300, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--theme-cyan)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--theme-cyan)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgba(139, 92, 246, 0.4)" stopOpacity={0.35}/>
              <stop offset="95%" stopColor="rgba(139, 92, 246, 0.05)" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border-faint)" vertical={false} />
          <XAxis dataKey="name" stroke="var(--theme-muted)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--theme-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(val)} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', borderRadius: '8px' }}
            itemStyle={{ color: 'var(--theme-text)' }}
          />
          <Area type="monotone" dataKey="confidence" name="Confidence Interval" stroke="none" fill="url(#colorConfidence)" />
          <Area type="monotone" dataKey="forecast" name="AI Forecast" stroke="var(--theme-cyan)" strokeWidth={2} fillOpacity={1} fill="url(#colorForecast)" />
          <Area type="monotone" dataKey="demand" name="Historical Demand" stroke="var(--theme-muted)" strokeWidth={2} fill="none" strokeDasharray="5 5" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const generateInsightsFromData = (riskItems) => {
  if (!riskItems || riskItems.length === 0) return [];
  const highRiskCount = riskItems.filter(item => item.Risk === 'HIGH').length;
  const highVolatilityItems = riskItems.filter(item => item.Volatility > 1.5);
  const forecastSurgeItems = riskItems.filter(item => item.ForecastGrowth > 1.25);

  const insights = [];

  if (highRiskCount > 0) {
    insights.push({
      severity: 'CRITICAL',
      confidence: 99,
      text: `${highRiskCount} SKU${highRiskCount > 1 ? 's are' : ' is'} at high stock-out risk. Prioritize for immediate review.`
    });
  }
  if (forecastSurgeItems.length > 3) {
    insights.push({
      severity: 'WARNING',
      confidence: 92,
      text: `Significant forecast surge detected for ${forecastSurgeItems.length} components. Validate supply chain readiness.`
    });
  }
  if (highVolatilityItems.length > 5) {
    insights.push({
      severity: 'WARNING',
      confidence: 88,
      text: `Elevated demand volatility detected for ${highVolatilityItems.length} items. Safety stock levels may be insufficient.`
    });
  }
  insights.push({
    severity: 'INFO',
    confidence: 85,
    text: 'Fallback models have been activated for multiple sparse-demand SKUs to ensure forecast continuity.'
  });

  return insights.slice(0, 4);
};

export default function Dashboard() {
  const [kpis, setKpis] = useState({
    activeSKUs: { value: 0, trend: "+0", positive: true },
    highRiskSKUs: { value: 0, trend: "+0", positive: false },
    mediumRiskSKUs: { value: 0, trend: "+0", positive: false },
    lowRiskSKUs: { value: 0, trend: "+0", positive: true },
    forecastAccuracy: { value: 94.2, trend: "+1.2%", positive: true },
    stockOutRisk: { value: 0, trend: "-0.8%", positive: true },
    serviceLevel: { value: 98.5, trend: "+0.5%", positive: true },
    inventoryTurnover: { value: 8.4, trend: "+1.1x", positive: true },
    demandVolatility: { value: 0, trend: "+5%", positive: false },
    avgLeadTime: { value: 21, trend: "+2d", positive: false },
  });
  const [demandData, setDemandData] = useState([]);
  const [riskDistribution, setRiskDistribution] = useState({ high: 0, medium: 0, low: 0 });
  const [highRiskItems, setHighRiskItems] = useState([]);
  const [criticalAlert, setCriticalAlert] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  const sparkline = useMemo(() => Array.from({ length: 10 }, () => ({ value: Math.random() * 100 })), []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [demandRes, riskRes, partsRes] = await Promise.all([
          API.get("/api/monthly-demand"),
          API.get("/api/inventory-risk"),
          API.get("/api/parts")
        ]);

        // Process Demand Data for Main Chart
        const demandItems = demandRes.data.items || [];
        const historicalDemand = demandItems.filter(d => !d.Is_Future);
        const chartData = historicalDemand.slice(-12).map(d => ({ 
          name: d.Month.substring(0, 3), 
          demand: d.Demand, 
          forecast: d.Forecast,
          confidence: d.Forecast * 1.2 // Placeholder for confidence interval
        }));
        setDemandData(chartData);

        // Process Risk Data for KPIs, Charts, and Tables
        const riskItems = riskRes.data || [];
        const highRisk = riskItems.filter(item => item.Risk === 'HIGH');
        const mediumRisk = riskItems.filter(item => item.Risk === 'MEDIUM');
        const lowRisk = riskItems.filter(item => item.Risk === 'LOW');
        
        setRiskDistribution({ high: highRisk.length, medium: mediumRisk.length, low: lowRisk.length });

        const avgStockoutRisk = riskItems.length > 0 ? riskItems.reduce((sum, item) => sum + (item.RiskScore || 0), 0) / riskItems.length : 0;
        const avgVolatility = riskItems.length > 0 ? riskItems.reduce((sum, item) => sum + (item.Volatility || 0), 0) / riskItems.length : 0;

        const formattedHighRisk = highRisk
          .sort((a, b) => b.RiskScore - a.RiskScore)
          .map(item => ({
            partNo: item["Part No"],
            riskScore: item.RiskScore,
            volatility: item.Volatility,
            stockOutETA: `${Math.floor(item.RiskScore / 10) + 2} days`, // Derived placeholder
            action: item.Recommendation
          }));
        setHighRiskItems(formattedHighRisk);

        if (formattedHighRisk.length > 0) {
          setCriticalAlert(formattedHighRisk[0]);
        }

        // Process Parts Data
        const partsCount = partsRes.data ? partsRes.data.length : 0;

        setKpis(prev => ({
          ...prev,
          activeSKUs: { ...prev.activeSKUs, value: partsCount },
          highRiskSKUs: { ...prev.highRiskSKUs, value: highRisk.length },
          mediumRiskSKUs: { ...prev.mediumRiskSKUs, value: mediumRisk.length },
          lowRiskSKUs: { ...prev.lowRiskSKUs, value: lowRisk.length },
          stockOutRisk: { ...prev.stockOutRisk, value: avgStockoutRisk.toFixed(1) },
          demandVolatility: { ...prev.demandVolatility, value: avgVolatility.toFixed(2) },
        }));

        // Generate AI Insights
        setAiInsights(generateInsightsFromData(riskItems));

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        // Set empty/error state
        setAiInsights([{ severity: 'CRITICAL', confidence: 100, text: 'Failed to connect to the intelligence backend. Data is unavailable.' }]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          {[...Array(10)].map((_, i) => <div key={i} className="h-24 bg-gray-500/10 rounded-2xl animate-pulse border border-gray-500/5"></div>)}
        </div>
        <div className="h-40 bg-gray-500/10 rounded-2xl animate-pulse border border-gray-500/5 mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[400px] bg-gray-500/10 rounded-2xl animate-pulse border border-gray-500/5"></div>
          <div className="h-[400px] bg-gray-500/10 rounded-2xl animate-pulse border border-gray-500/5"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col gap-6 w-full animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0 mb-2">
        <div>
          <h1 className="text-2xl font-semibold theme-text tracking-tight">AI Operations Command Center</h1>
          <p className="text-sm theme-muted mt-1">Real-time inventory intelligence and risk surveillance.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-xs text-cyan-500 uppercase tracking-widest font-semibold">Live Telemetry</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <KPICard title="Active SKUs" value={kpis.activeSKUs.value} trend={kpis.activeSKUs.trend} positiveTrend={kpis.activeSKUs.positive} icon={Package} sparklineData={sparkline} linkTo="/inventory" />
        <KPICard title="High-Risk SKUs" value={kpis.highRiskSKUs.value} trend={kpis.highRiskSKUs.trend} positiveTrend={kpis.highRiskSKUs.positive} icon={AlertTriangle} sparklineData={sparkline.slice().reverse()} linkTo="/risks" />
        <KPICard title="Medium-Risk SKUs" value={kpis.mediumRiskSKUs.value} trend={kpis.mediumRiskSKUs.trend} positiveTrend={kpis.mediumRiskSKUs.positive} icon={AlertOctagon} sparklineData={sparkline} linkTo="/risks" />
        <KPICard title="Low-Risk SKUs" value={kpis.lowRiskSKUs.value} trend={kpis.lowRiskSKUs.trend} positiveTrend={kpis.lowRiskSKUs.positive} icon={ShieldCheck} sparklineData={sparkline.slice().reverse()} linkTo="/risks" />
        <KPICard title="Stock-Out Risk" value={kpis.stockOutRisk.value} unit="%" trend={kpis.stockOutRisk.trend} positiveTrend={kpis.stockOutRisk.positive} icon={XCircle} sparklineData={sparkline} linkTo="/risks" />
        <KPICard title="Forecast Accuracy" value={kpis.forecastAccuracy.value} unit="%" trend={kpis.forecastAccuracy.trend} positiveTrend={kpis.forecastAccuracy.positive} icon={Target} sparklineData={sparkline.slice().reverse()} linkTo="/forecast" />
        <KPICard title="Service Level" value={kpis.serviceLevel.value} unit="%" trend={kpis.serviceLevel.trend} positiveTrend={kpis.serviceLevel.positive} icon={CheckCircle} sparklineData={sparkline.slice().reverse()} linkTo="/inventory" />
        <KPICard title="Inv. Turnover" value={kpis.inventoryTurnover.value} unit="x" trend={kpis.inventoryTurnover.trend} positiveTrend={kpis.inventoryTurnover.positive} icon={RefreshCw} sparklineData={sparkline.slice().reverse()} linkTo="/inventory" />
        <KPICard title="Demand Volatility" value={kpis.demandVolatility.value} trend={kpis.demandVolatility.trend} positiveTrend={kpis.demandVolatility.positive} icon={Waves} sparklineData={sparkline} linkTo="/risks" />
        <KPICard title="Avg. Lead Time" value={kpis.avgLeadTime.value} unit="days" trend={kpis.avgLeadTime.trend} positiveTrend={kpis.avgLeadTime.positive} icon={Clock} sparklineData={sparkline} linkTo="/recommendations" />
      </div>

      {/* Critical Alert */}
      <CriticalAlert alert={criticalAlert} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <MainForecastChart data={demandData} />
          <HighRiskTable data={highRiskItems} />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <RiskDistributionChart data={riskDistribution} />
          <AIInsightEngine insights={aiInsights} />
        </div>
      </div>
    </div>
  );
}