import { useState, useEffect, useMemo, useRef } from "react";
import {
  TrendingUp, Package, AlertOctagon, ShieldCheck, AlertTriangle, Clock, Waves, Target, CheckCircle, XCircle, Info, ArrowRight, RefreshCw, Calendar, Flame, ArrowUp, ArrowDown, Bot
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import API from "../services/api";
import { Link } from "react-router-dom";

const KPICard = ({ title, value, trend, trendContext, sparklineData, icon: Icon, color, unit, linkTo, badge }) => {
  const trendIsPositive = trend && !String(trend).startsWith('-');
  const trendColor = trendIsPositive ? 'text-emerald-400' : 'text-rose-400';
  const TrendIcon = trendIsPositive ? ArrowUp : ArrowDown;
  const colorMap = {
    purple: { icon: 'text-violet-400', spark: '#8b5cf6' },
    red: { icon: 'text-rose-400', spark: 'var(--theme-rose)' },
    yellow: { icon: 'text-amber-400', spark: 'var(--theme-amber)' },
    green: { icon: 'text-emerald-400', spark: 'var(--theme-emerald)' },
    blue: { icon: 'text-cyan-400', spark: 'var(--theme-cyan)' },
  };
  const cardColor = colorMap[color] || colorMap.blue;

  const cardContent = (
    <div className="theme-bg-card border theme-border rounded-2xl p-4 backdrop-blur-sm hover:border-cyan-500/60 hover:shadow-[0_0_25px_rgba(34,211,238,0.15)] hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg bg-${color}-500/10 flex items-center justify-center border border-${color}-500/20 shrink-0`}>
            <Icon size={16} className={cardColor.icon} />
          </div>
          <p className="theme-muted text-xs uppercase tracking-wider font-semibold truncate">{title}</p>
        </div>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            badge === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
            badge === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>{badge}</span>
        )}
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-light theme-text tracking-tight">{value}</h3>
            {unit && <span className="text-sm theme-muted font-medium">{unit}</span>}
          </div>
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <TrendIcon size={12} className={trendColor} />
              <span className={`text-xs font-semibold ${trendColor}`}>{String(trend).replace(/^[+-]/, '')}</span>
              <span className="text-xs theme-subtle ml-1">{trendContext}</span>
            </div>
          )}
        </div>
        <div className="w-28 h-12 -mb-2 -mr-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line type="natural" dataKey="value" stroke={cardColor.spark} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return linkTo ? <Link to={linkTo}>{cardContent}</Link> : cardContent;
};

const RiskDistributionChart = ({ data }) => {
  const COLORS = { HIGH: 'var(--theme-rose)', MEDIUM: 'var(--theme-amber)', LOW: 'var(--theme-emerald)' };
  const total = data.high + data.medium + data.low;
  const chartData = [
    { name: 'High', value: data.high, color: COLORS.HIGH, percent: total > 0 ? (data.high / total * 100).toFixed(0) : 0 },
    { name: 'Medium', value: data.medium, color: COLORS.MEDIUM, percent: total > 0 ? (data.medium / total * 100).toFixed(0) : 0 },
    { name: 'Low', value: data.low, color: COLORS.LOW, percent: total > 0 ? (data.low / total * 100).toFixed(0) : 0 },
  ];

  return (
    <div className="theme-bg-card border theme-border rounded-2xl p-6 backdrop-blur-sm h-full flex flex-col">
      <h2 className="text-sm uppercase tracking-widest theme-text font-semibold mb-2">Risk Distribution</h2>
      <div className="flex-grow flex items-center justify-center relative">
        <div className="absolute text-center">
          <p className="text-3xl font-light theme-text">{total}</p>
          <p className="text-xs theme-muted uppercase tracking-wider">Total SKUs</p>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} stroke="none">
              {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />)}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', borderRadius: '8px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center mt-2">
        {chartData.map(item => (
          <div key={item.name}>
            <p className="text-xs theme-muted">{item.name} Risk</p>
            <p className="text-lg font-semibold" style={{ color: item.color }}>{item.percent}%</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const HighRiskTable = ({ data = [] }) => (
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
            <th className="p-3 font-medium theme-muted">SKU / Part Name</th>
            <th className="p-3 font-medium theme-muted">Risk Score</th>
            <th className="p-3 font-medium theme-muted">Volatility</th>
            <th className="p-3 font-medium theme-muted">Stock-Out ETA</th>
            <th className="p-3 font-medium theme-muted text-center">Lead Time Impact</th>
            <th className="p-3 font-medium theme-muted"></th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 5).map(item => (
            <tr key={item.partNo} className="border-b theme-border-faint last:border-none hover:bg-white/5 transition-colors">
              <td className="p-3">
                <div className="font-mono theme-text">{item.partNo}</div>
                <div className="text-xs theme-subtle">{item.partName || 'N/A'}</div>
              </td>
              <td className="p-3">
                <span className="font-semibold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md text-xs border border-rose-500/20">
                  {item.riskScore.toFixed(2)}
                </span>
              </td>
              <td className="p-3 font-mono">{item.volatility.toFixed(2)}</td>
              <td className="p-3 font-mono text-amber-400">{item.stockOutETA}</td>
              <td className="p-3 text-center">
                <span className="font-semibold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md text-xs border border-rose-500/20 whitespace-nowrap">
                  High (+{item.leadTimeImpact}d)
                </span>
              </td>
              <td className="p-3 text-right">
                <button className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md px-3 py-1.5 font-semibold hover:bg-amber-500/20 transition-colors">Increase Safety Stock</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const AIInsightEngine = ({ insights = [] }) => (
  <div className="theme-bg-card border theme-border rounded-2xl p-6 backdrop-blur-sm flex flex-col h-full">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
        <Bot size={18} className="text-cyan-400" />
      </div>
      <h2 className="text-sm uppercase tracking-widest theme-text font-semibold">AI Insight Engine</h2>
    </div>
    <div className="flex-1 flex flex-col gap-3 overflow-y-auto -mr-3 pr-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
      {insights.map((insight, i) => (
        <div key={i} className="theme-bg-card-soft border theme-border p-3.5 rounded-xl hover:border-cyan-500/50 transition-all duration-300 cursor-pointer">
          <div className="flex justify-between items-start mb-1.5">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded border flex items-center gap-1.5 ${
              insight.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
              insight.severity === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              insight.severity === 'OPTIMIZATION' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
              'bg-sky-500/10 text-sky-400 border-sky-500/20'
            }`}><Info size={12} /> {insight.severity}</span>
          </div>
          <div className="flex justify-between items-end gap-2">
            <p className="text-sm theme-text leading-relaxed">{insight.text}</p>
            <div className="text-right shrink-0">
              <span className="text-lg font-semibold text-emerald-400">{insight.confidence}</span>
              <p className="text-[10px] theme-muted -mt-1">Confidence</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CriticalAlert = ({ alert }) => {
  if (!alert) return null;
  return (
    <div className="theme-bg-card border border-rose-500/40 rounded-2xl p-6 backdrop-blur-sm bg-gradient-to-br from-rose-500/10 to-transparent shadow-[0_0_35px_rgba(244,63,94,0.2)] grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="flex items-center gap-6 lg:col-span-2 group">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-rose-500/20 border border-rose-500/30 shrink-0 relative">
          <div className="absolute inset-0 rounded-full animate-ping bg-rose-500/20"></div>
          <Flame size={32} className="text-rose-500 relative z-10" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-medium theme-text">
            SKU: {alert.partNo} <span className="theme-muted font-normal">• {alert.partName || 'N/A'}</span>
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mt-1">
            <span className="text-rose-400">Risk Level: <strong className="font-semibold">{alert.riskLevel}</strong></span>
            <span className="theme-muted">Volatility: <strong className="font-semibold theme-text">{alert.volatility.toFixed(2)}</strong></span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {alert.tags.map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-300 font-semibold tracking-wider">{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
        <div>
          <p className="text-xs theme-muted uppercase tracking-wider">Recommended Action</p>
          <p className="text-base font-bold text-amber-400 mt-1">{alert.action.replace('Immediately', '')}</p>
          <p className="text-xs theme-subtle mt-1">{alert.actionDetail}</p>
        </div>
        <Link to="/risks" className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors group mt-3 self-end">
          View All Alerts
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

const RiskTrendChart = ({ data }) => (
  <div className="theme-bg-card border theme-border rounded-2xl p-6 backdrop-blur-sm h-full flex flex-col">
    <h2 className="text-sm uppercase tracking-widest theme-text font-semibold mb-4">Risk Trend (Last 7 Days)</h2>
    <div className="flex-grow -mx-2 -mb-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--theme-rose)" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="var(--theme-rose)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Tooltip contentStyle={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', borderRadius: '8px' }} itemStyle={{color: 'var(--theme-rose)'}} labelStyle={{color: 'var(--theme-muted)'}} />
          <Area type="monotone" dataKey="value" name="High-Risk SKUs" stroke="var(--theme-rose)" strokeWidth={2} fill="url(#colorRisk)" dot={{ stroke: 'var(--theme-rose)', strokeWidth: 2, fill: 'var(--theme-bg-card)' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const InventoryHealth = ({ data }) => (
  <div className="theme-bg-card border theme-border rounded-2xl p-6 backdrop-blur-sm h-full flex flex-col">
    <h2 className="text-sm uppercase tracking-widest theme-text font-semibold mb-4">Inventory Health</h2>
    <div className="space-y-4">
      {data.map(item => (
        <div key={item.name}>
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-sm theme-text font-medium">{item.name}</span>
            <span className="text-xs theme-muted">{item.count} SKUs</span>
          </div>
          <div className="w-full bg-gray-500/10 rounded-full h-2.5 relative overflow-hidden border theme-border">
            <div className="h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: item.color }}></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ForecastSummary = ({ data, confidence }) => (
  <div className="theme-bg-card border theme-border rounded-2xl p-6 backdrop-blur-sm h-full flex flex-col">
    <h2 className="text-sm uppercase tracking-widest theme-text font-semibold mb-4">Forecast Summary</h2>
    <div className="flex-grow space-y-3">
      {data.map(item => (
        <div key={item.horizon} className="flex justify-between items-center theme-bg-card-soft p-3 rounded-lg border theme-border">
          <span className="text-sm theme-muted">{item.horizon} Projected Demand</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold theme-text">{item.value}</span>
            {item.trend > 0 ? <ArrowUp size={14} className="text-emerald-400" /> : <ArrowDown size={14} className="text-rose-400" />}
          </div>
        </div>
      ))}
    </div>
    <div className="mt-4">
      <p className="text-xs theme-muted mb-1">Model Confidence</p>
      <div className="w-full bg-gray-500/10 rounded-full h-2 relative overflow-hidden border theme-border">
        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${confidence}%` }}></div>
      </div>
    </div>
  </div>
);

const MainForecastChart = ({ data, selectedHorizon, setSelectedHorizon, chartData }) => (
  <div className="lg:col-span-2 theme-bg-card border theme-border rounded-2xl p-6 backdrop-blur-sm">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-sm uppercase tracking-widest theme-text font-semibold">Global Demand vs AI Forecast</h2>
      <div className="flex items-center gap-1 theme-bg-card-soft p-1 rounded-xl border theme-border w-full sm:w-auto">
        {['1M', '3M', '6M', '12M'].map(h => (
          <button
            key={h}
            onClick={() => setSelectedHorizon(h)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
              selectedHorizon === h ? 'bg-cyan-500 text-black shadow-sm' : 'text-cyan-200 hover:bg-white/10'
            }`}
          >
            {h}
          </button>
        ))}
      </div>
    </div>
    <div className="w-full h-[300px] min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            contentStyle={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', borderRadius: '12px', padding: '12px' }}
            itemStyle={{ color: 'var(--theme-text)' }}
            labelStyle={{ color: 'var(--theme-cyan)', marginBottom: '8px', fontWeight: '600' }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
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
    activeSKUs: { value: '0', trend: "+0", context: "vs last 7 days" },
    highRiskSKUs: { value: '0', trend: "+0", context: "vs last 7 days" },
    mediumRiskSKUs: { value: '0', trend: "+0", context: "vs last 7 days" },
    lowRiskSKUs: { value: '0', trend: "+0", context: "vs last 7 days" },
    forecastAccuracy: { value: '0', trend: "+0%", context: "vs last 7 days" },
    stockOutRisk: { value: '0', trend: "-0%", context: "vs last 7 days" },
    serviceLevel: { value: '0', trend: "+0%", context: "vs last 7 days" },
    inventoryTurnover: { value: '0', trend: "+0x", context: "vs last 7 days" },
    demandVolatility: { value: '0', trend: "+0%", context: "vs last 7 days" },
    avgLeadTime: { value: '0', trend: "+0d", context: "vs last 7 days" },
  });
  const [demandData, setDemandData] = useState([]);
  const [riskDistribution, setRiskDistribution] = useState({ high: 0, medium: 0, low: 0 });
  const [highRiskItems, setHighRiskItems] = useState([]);
  const [criticalAlert, setCriticalAlert] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHorizon, setSelectedHorizon] = useState('12M');

  const sparkline = useMemo(() => Array.from({ length: 12 }, () => ({ value: Math.random() * 100 })), []);
  const riskTrendData = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ name: `Day ${i+1}`, value: Math.floor(Math.random() * 20) + 10 })), []);
  const inventoryHealthData = useMemo(() => ([
    { name: 'Healthy', count: 1203, percent: 60, color: 'var(--theme-emerald)' },
    { name: 'Monitor', count: 450, percent: 22.5, color: 'var(--theme-cyan)' },
    { name: 'At Risk', count: 250, percent: 12.5, color: 'var(--theme-amber)' },
    { name: 'Critical', count: 97, percent: 5, color: 'var(--theme-rose)' },
  ]), []);
  const forecastSummaryData = useMemo(() => ([
    { horizon: '1M', value: '1.2M', trend: 1 },
    { horizon: '3M', value: '3.5M', trend: 1 },
    { horizon: '6M', value: '6.8M', trend: -1 },
    { horizon: '12M', value: '13.1M', trend: 1 },
  ]), []);

  const fullDemandData = useRef([]);

  const chartData = useMemo(() => {
    if (!fullDemandData.current || fullDemandData.current.length === 0) return [];
    const horizonMonths = parseInt(selectedHorizon);
    const historicalData = fullDemandData.current.filter(d => !d.Is_Future);
    const futureData = fullDemandData.current.filter(d => d.Is_Future);
    
    const chartPoints = [...historicalData.slice(-12), ...futureData.slice(0, horizonMonths)];

    return chartPoints.map(d => ({
      name: d.Month.substring(0, 3),
      demand: d.Demand,
      forecast: d.Forecast,
      confidence: d.Forecast ? [d.Forecast * 0.8, d.Forecast * 1.2] : [null, null]
    }));
  }, [selectedHorizon, fullDemandData.current]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [demandRes, riskRes, partsRes] = await Promise.all([
          API.get("/api/monthly-demand/ALL_PARTS"),
          API.get("/api/inventory-risk"),
          API.get("/api/parts") // Assuming this returns a list of part objects with names
        ]);

        // Process Demand Data for Main Chart
        fullDemandData.current = demandRes.data.items || [];
        setDemandData(fullDemandData.current); // Trigger re-render
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
            partName: item["Part Name"] || "N/A", // Placeholder
            riskScore: item.RiskScore,
            volatility: item.Volatility,
            stockOutETA: `${Math.floor(item.RiskScore / 10) + 2} days`, // Derived placeholder
            leadTimeImpact: Math.floor(item.Volatility * 3) + 4, // Derived
            action: item.Recommendation,
            riskLevel: item.Risk,
            tags: item.Reasons || [],
            actionDetail: `Add ${Math.ceil(item.Volatility * 50)} units to prevent stock-out.`
          }));
        setHighRiskItems(formattedHighRisk);

        if (formattedHighRisk.length > 0) {
          // Add more details to the critical alert object
          const mostCritical = formattedHighRisk[0];
          if (!mostCritical.tags.includes('HIGH VOLATILITY')) mostCritical.tags.unshift('HIGH VOLATILITY');
          if (!mostCritical.tags.includes('FORECAST SURGE')) mostCritical.tags.push('FORECAST SURGE');
          mostCritical.tags = mostCritical.tags.slice(0, 4);
          setCriticalAlert(formattedHighRisk[0]);
        }

        // Process Parts Data
        const partsCount = partsRes.data ? partsRes.data.length : 0;

        setKpis(prev => ({
          ...prev,
          activeSKUs: { value: partsCount.toLocaleString(), trend: "+12", context: "vs last 7 days" },
          highRiskSKUs: { value: highRisk.length, trend: "+3", context: "vs last 7 days" },
          mediumRiskSKUs: { value: mediumRisk.length, trend: "-5", context: "vs last 7 days" },
          lowRiskSKUs: { value: lowRisk.length, trend: "+14", context: "vs last 7 days" },
          stockOutRisk: { value: avgStockoutRisk.toFixed(1), trend: "-0.8%", context: "vs last 30 days" },
          demandVolatility: { value: avgVolatility.toFixed(2), trend: "+5%", context: "vs last 30 days" },
          forecastAccuracy: { value: '94.2', trend: "+1.2%", context: "vs last model" },
        }));

        // Generate AI Insights
        setAiInsights(generateInsightsFromData(riskItems));

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setHighRiskItems([]);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-gray-500/10 rounded-2xl animate-pulse border border-gray-500/5"></div>)}
        </div>
        <div className="h-44 bg-gray-500/10 rounded-2xl animate-pulse border border-gray-500/5 mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[380px] bg-gray-500/10 rounded-2xl animate-pulse border border-gray-500/5"></div>
          <div className="h-[400px] bg-gray-500/10 rounded-2xl animate-pulse border border-gray-500/5"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col gap-6 w-full animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="mb-2">
        <div>
          <h1 className="text-3xl font-light theme-text tracking-tight">AI Operations Command Center</h1>
          <p className="text-sm theme-muted mt-1">Real-time inventory intelligence and risk surveillance.</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <KPICard title="High-Risk SKUs" value={kpis.highRiskSKUs.value} trend={kpis.highRiskSKUs.trend} trendContext={kpis.highRiskSKUs.context} icon={AlertTriangle} color="red" badge="High" sparklineData={sparkline} linkTo="/risks" />
        <KPICard title="Medium-Risk SKUs" value={kpis.mediumRiskSKUs.value} trend={kpis.mediumRiskSKUs.trend} trendContext={kpis.mediumRiskSKUs.context} icon={AlertOctagon} color="yellow" badge="Medium" sparklineData={sparkline.slice().reverse()} linkTo="/risks" />
        <KPICard title="Low-Risk SKUs" value={kpis.lowRiskSKUs.value} trend={kpis.lowRiskSKUs.trend} trendContext={kpis.lowRiskSKUs.context} icon={ShieldCheck} color="green" badge="Low" sparklineData={sparkline} linkTo="/risks" />
        <KPICard title="Active SKUs" value={kpis.activeSKUs.value} trend={kpis.activeSKUs.trend} trendContext={kpis.activeSKUs.context} icon={Package} color="blue" sparklineData={sparkline.slice().reverse()} linkTo="/inventory" />
        <KPICard title="Stock-Out Risk" value={kpis.stockOutRisk.value} unit="%" trend={kpis.stockOutRisk.trend} trendContext={kpis.stockOutRisk.context} icon={XCircle} color="red" sparklineData={sparkline} linkTo="/risks" />
        <KPICard title="Demand Volatility" value={kpis.demandVolatility.value} trend={kpis.demandVolatility.trend} trendContext={kpis.demandVolatility.context} icon={Waves} color="purple" sparklineData={sparkline.slice().reverse()} linkTo="/risks" />
        <KPICard title="Forecast Accuracy" value={kpis.forecastAccuracy.value} unit="%" trend={kpis.forecastAccuracy.trend} trendContext={kpis.forecastAccuracy.context} icon={Target} color="green" sparklineData={sparkline} linkTo="/forecast" />
        <KPICard title="Avg. Lead Time" value="21" unit="days" trend="+2d" trendContext="vs last 30 days" icon={Clock} color="yellow" sparklineData={sparkline.slice().reverse()} linkTo="/recommendations" />
      </div>

      {/* Critical Alert */}
      <CriticalAlert alert={criticalAlert} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MainForecastChart
          data={demandData}
          selectedHorizon={selectedHorizon}
          setSelectedHorizon={setSelectedHorizon}
          chartData={chartData}
        />
        <AIInsightEngine insights={aiInsights} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HighRiskTable data={highRiskItems} />
        </div>
        <RiskDistributionChart data={riskDistribution} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <InventoryHealth data={inventoryHealthData} />
        </div>
        <ForecastSummary data={forecastSummaryData} confidence={92} />
        <RiskTrendChart data={riskTrendData} />
      </div>
    </div>
  );
}