import { 
  TrendingUp, Activity, Package, AlertOctagon, RefreshCw, BarChart2, Bot
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar
} from "recharts";

const mockDemandData = [
  { name: 'Jan', demand: 4000, forecast: 4200 },
  { name: 'Feb', demand: 3000, forecast: 3100 },
  { name: 'Mar', demand: 5000, forecast: 4800 },
  { name: 'Apr', demand: 4500, forecast: 4600 },
  { name: 'May', demand: 6000, forecast: 5900 },
  { name: 'Jun', demand: 5500, forecast: 6100 },
];

const mockInventoryData = [
  { name: 'W1', value: 24000 },
  { name: 'W2', value: 22100 },
  { name: 'W3', value: 25000 },
  { name: 'W4', value: 21000 },
  { name: 'W5', value: 18000 },
];

const KPICard = ({ title, value, trend, isPositive, icon: Icon }) => (
  <div className="theme-bg-card border theme-border rounded-2xl p-5 backdrop-blur-md hover:theme-cyan-border hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all duration-300 group cursor-default">
    <div className="flex justify-between items-start mb-4">
      <div className="w-10 h-10 rounded-lg theme-bg-icon flex items-center justify-center border theme-border group-hover:theme-cyan-border transition-colors">
        <Icon size={18} className="theme-muted group-hover:text-cyan-500" />
      </div>
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
        {trend}
      </span>
    </div>
    <div>
      <p className="theme-muted text-xs uppercase tracking-wider font-semibold mb-1">{title}</p>
      <h3 className="text-3xl font-light theme-text tracking-tight">{value}</h3>
    </div>
  </div>
);

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-2">
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
        <KPICard title="Forecast Accuracy" value="94.2%" trend="+1.2%" isPositive={true} icon={Activity} />
        <KPICard title="Inventory Value" value="$12.4M" trend="-4.1%" isPositive={true} icon={Package} />
        <KPICard title="Stock-Out Risk" value="3.1%" trend="-0.8%" isPositive={true} icon={AlertOctagon} />
        <KPICard title="Service Level" value="98.5%" trend="+0.5%" isPositive={true} icon={TrendingUp} />
        <KPICard title="Inv Turnover" value="8.4x" trend="+1.1x" isPositive={true} icon={RefreshCw} />
        <KPICard title="Monthly Demand" value="28.5K" trend="+4.2%" isPositive={true} icon={BarChart2} />
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
                <Area type="monotone" dataKey="forecast" stroke="var(--theme-cyan)" strokeWidth={3} fillOpacity={1} fill="url(#colorForecast)" />
                <Area type="monotone" dataKey="demand" stroke="var(--theme-muted)" strokeWidth={2} fill="none" strokeDasharray="5 5" />
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
            <div className="theme-bg-card-soft border theme-border p-4 rounded-xl hover:theme-cyan-border transition-colors cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded border border-rose-500/20">High Risk</span>
                <span className="text-[10px] theme-muted">98% Confidence</span>
              </div>
              <h4 className="text-sm theme-text font-medium mb-1">Increase Safety Stock (SKU-892)</h4>
              <p className="text-xs theme-muted leading-relaxed">Demand volatility detected. Recommend adding 150 units to prevent stock-out.</p>
            </div>
            {/* Recommendation Card */}
            <div className="theme-bg-card-soft border theme-border p-4 rounded-xl hover:theme-cyan-border transition-colors cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20">Optimization</span>
                <span className="text-[10px] theme-muted">92% Confidence</span>
              </div>
              <h4 className="text-sm theme-text font-medium mb-1">Reduce Inventory Exposure</h4>
              <p className="text-xs theme-muted leading-relaxed">Excess stock identified for SKU-114. Suggest halting reorders for 60 days.</p>
            </div>
             {/* Recommendation Card */}
             <div className="theme-bg-card-soft border theme-border p-4 rounded-xl hover:theme-cyan-border transition-colors cursor-pointer">
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