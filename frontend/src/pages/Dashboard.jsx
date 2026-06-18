import { useState, useEffect } from "react";
import { 
  TrendingUp, Activity, Package, AlertOctagon, RefreshCw, BarChart2, Bot
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const mockDemandData = [
  { name: 'Jan', demand: 4000, forecast: 4200 },
  { name: 'Feb', demand: 3000, forecast: 3100 },
  { name: 'Mar', demand: 5000, forecast: 4800 },
  { name: 'Apr', demand: 4500, forecast: 4600 },
  { name: 'May', demand: 6000, forecast: 5900 },
  { name: 'Jun', demand: 5500, forecast: 6100 },
];

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

const KPICard = ({ title, value, prefix = "", suffix = "", decimals = 0, format = false, trend, isPositive, icon: Icon }) => (
  <div className="theme-bg-card border theme-border rounded-2xl p-5 backdrop-blur-md hover:border-cyan-500/60 hover:shadow-[0_0_25px_rgba(34,211,238,0.15)] hover:-translate-y-1 transition-all duration-500 group cursor-default">
    <div className="flex justify-between items-start mb-4">
      <div className="w-10 h-10 rounded-lg theme-bg-icon flex items-center justify-center border theme-border group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-colors">
        <Icon size={18} className="theme-muted group-hover:text-cyan-400 transition-colors" />
      </div>
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
        {trend}
      </span>
    </div>
    <div>
      <p className="theme-muted text-xs uppercase tracking-wider font-semibold mb-1">{title}</p>
      <h3 className="text-3xl font-light theme-text tracking-tight">
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} format={format} />
      </h3>
    </div>
  </div>
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex flex-col gap-6 w-full animate-in fade-in duration-500">
        <div className="flex justify-between items-end gap-4 mb-2">
           <div className="space-y-3 w-1/3"><div className="h-8 w-3/4 bg-gray-500/10 rounded-lg animate-pulse"></div><div className="h-4 w-1/2 bg-gray-500/10 rounded-lg animate-pulse"></div></div>
           <div className="h-6 w-32 bg-gray-500/10 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
           {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-gray-500/10 rounded-2xl animate-pulse border border-gray-500/5"></div>)}
        </div>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0 mb-4 sm:mb-2">
        <div>
          <h1 className="text-2xl font-semibold theme-text tracking-tight">Executive Intelligence</h1>
          <p className="text-sm theme-muted mt-1">Real-time supply chain command center.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-xs text-cyan-500 uppercase tracking-widest font-semibold">Live System Active</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Forecast Accuracy" value={94.2} decimals={1} suffix="%" trend="+1.2%" isPositive={true} icon={Activity} />
        <KPICard title="Inventory Value" value={12.4} decimals={1} prefix="$" suffix="M" trend="-4.1%" isPositive={true} icon={Package} />
        <KPICard title="Stock-Out Risk" value={3.1} decimals={1} suffix="%" trend="-0.8%" isPositive={true} icon={AlertOctagon} />
        <KPICard title="Service Level" value={98.5} decimals={1} suffix="%" trend="+0.5%" isPositive={true} icon={TrendingUp} />
        <KPICard title="Inv Turnover" value={8.4} decimals={1} suffix="x" trend="+1.1x" isPositive={true} icon={RefreshCw} />
        <KPICard title="Monthly Demand" value={28.5} decimals={1} suffix="K" trend="+4.2%" isPositive={true} icon={BarChart2} />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demand Forecast Chart */}
        <div className="lg:col-span-2 theme-bg-card border theme-border rounded-2xl p-6 backdrop-blur-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm uppercase tracking-widest theme-text font-semibold">Demand vs AI Forecast</h2>
          </div>
          <div className="w-full" style={{ height: 300, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockDemandData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--theme-cyan)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--theme-cyan)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--theme-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--theme-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--theme-text)' }}
                />
                <Area type="monotone" dataKey="forecast" stroke="var(--theme-cyan)" strokeWidth={3} fillOpacity={1} fill="url(#colorForecast)" animationDuration={2000} animationEasing="ease-out" />
                <Area type="monotone" dataKey="demand" stroke="var(--theme-muted)" strokeWidth={2} fill="none" strokeDasharray="5 5" animationDuration={2000} animationEasing="ease-out" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Recommendations Panel */}
        <div className="theme-bg-card border theme-border rounded-2xl p-6 backdrop-blur-md flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm uppercase tracking-widest theme-text font-semibold flex items-center gap-2">
              <Bot size={16} className="theme-cyan" /> Insight Engine
            </h2>
          </div>
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-hide">
            {/* Recommendation Card */}
            <div className="theme-bg-card-soft border theme-border p-4 rounded-xl hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded border border-rose-500/20">High Risk</span>
                <span className="text-[10px] theme-muted">98% Confidence</span>
              </div>
              <h4 className="text-sm theme-text font-medium mb-1">Increase Safety Stock (SKU-892)</h4>
              <p className="text-xs theme-muted leading-relaxed">Demand volatility detected. Recommend adding 150 units to prevent stock-out.</p>
            </div>
            {/* Recommendation Card */}
            <div className="theme-bg-card-soft border theme-border p-4 rounded-xl hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20">Optimization</span>
                <span className="text-[10px] theme-muted">92% Confidence</span>
              </div>
              <h4 className="text-sm theme-text font-medium mb-1">Reduce Inventory Exposure</h4>
              <p className="text-xs theme-muted leading-relaxed">Excess stock identified for SKU-114. Suggest halting reorders for 60 days.</p>
            </div>
             {/* Recommendation Card */}
             <div className="theme-bg-card-soft border theme-border p-4 rounded-xl hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20">Review</span>
                <span className="text-[10px] theme-muted">85% Confidence</span>
              </div>
              <h4 className="text-sm theme-text font-medium mb-1">Update Inventory Policy</h4>
              <p className="text-xs theme-muted leading-relaxed">Lead times for European suppliers have increased by 14 days.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}