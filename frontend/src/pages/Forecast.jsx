import { useState } from "react";
import { TrendingUp, LineChart } from "lucide-react";
import { Link } from "react-router-dom";

const Forecast = () => {
  const [forecastData] = useState([]);

  if (!forecastData || forecastData.length === 0) {
    return (
      <div className="h-full min-h-[80vh] flex flex-col items-center justify-center p-8 relative">
        <div className="max-w-md w-full theme-bg-card backdrop-blur-md rounded-3xl theme-card-shadow theme-border p-10 text-center transition-all">
          <div className="w-16 h-16 theme-cyan-bg theme-cyan rounded-2xl flex items-center justify-center mx-auto mb-6 theme-cyan-border shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <LineChart size={28} strokeWidth={1.5} />
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
    <div className="p-8">
      <h1 className="text-3xl font-light theme-text tracking-tight">Demand Forecast Analytics</h1>
    </div>
  );
};

export default Forecast;
