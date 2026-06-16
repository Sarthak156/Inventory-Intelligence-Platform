import { useState, useEffect } from "react";
import { TrendingUp, LineChart as LineChartIcon, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import API from "../services/api";

const Forecast = () => {
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDemand = async () => {
      try {
        const response = await API.get("/monthly-demand");
        setForecastData(response.data || []);
      } catch (error) {
        console.error("Failed to fetch forecast data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDemand();
  }, []);

  if (loading) {
    return (
      <div className="h-full min-h-[80vh] flex flex-col items-center justify-center p-8">
        <Loader2 size={36} className="theme-cyan animate-spin" />
      </div>
    );
  }

  if (!forecastData || forecastData.length === 0) {
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
    <div className="p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-light theme-text tracking-tight">Demand Forecast Analytics</h1>
        <p className="text-sm theme-muted mt-1">AI-driven predictive demand modeling across all active inventory parts.</p>
      </div>

      <div className="theme-bg-card border theme-border rounded-2xl p-6 backdrop-blur-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm uppercase tracking-widest theme-text font-semibold">Monthly Aggregated Demand</h2>
        </div>
        <div className="w-full" style={{ height: 400, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} />
              <XAxis dataKey="Month" stroke="var(--theme-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--theme-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--theme-bg)', borderColor: 'var(--theme-border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--theme-text)' }}
              />
              <Line 
                type="monotone" 
                dataKey="Demand" 
                stroke="var(--theme-cyan)" 
                strokeWidth={3} 
                dot={{ r: 4, fill: "var(--theme-bg)", stroke: "var(--theme-cyan)", strokeWidth: 2 }} 
                activeDot={{ r: 6, fill: "var(--theme-cyan)" }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Forecast;