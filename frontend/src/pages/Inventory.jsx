import { useState } from "react";
import { BoxSelect, Database } from "lucide-react";
import { Link } from "react-router-dom";

const Inventory = () => {
  const [inventoryData] = useState([]);

  if (!inventoryData || inventoryData.length === 0) {
    return (
      <div className="h-full min-h-[80vh] flex flex-col items-center justify-center p-8 relative">
        <div className="max-w-md w-full theme-bg-card backdrop-blur-md rounded-3xl theme-card-shadow theme-border p-10 text-center transition-all">
          <div className="w-16 h-16 theme-cyan-bg theme-cyan rounded-2xl flex items-center justify-center mx-auto mb-6 theme-cyan-border shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <Database size={28} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-medium theme-text mb-2 tracking-tight">System Offline</h2>
          <p className="text-sm theme-muted mb-8 leading-relaxed">
            Enterprise spare parts inventory dataset has not been ingested. Link data sources to generate optimization telemetry.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 theme-button-neutral font-medium py-2.5 px-6 rounded-xl transition-colors text-sm"
          >
            <BoxSelect size={16} />
            Ingest Data
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-light theme-text tracking-tight">Inventory Optimization Matrix</h1>
    </div>
  );
};

export default Inventory;
