import { useState, useEffect } from "react";
import { BoxSelect, Database, Loader2, Search as SearchIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import API from "../services/api";

const Inventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await API.get("/inventory");
        setInventoryData(response.data || []);
      } catch (error) {
        console.error("Failed to fetch inventory data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="h-full min-h-[80vh] flex flex-col items-center justify-center p-8">
        <Loader2 size={36} className="theme-cyan animate-spin" />
      </div>
    );
  }

  if (!inventoryData || inventoryData.length === 0) {
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

  const filteredData = inventoryData.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Dynamically extract columns from the JSON keys
  const columns = Object.keys(inventoryData[0]);

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light theme-text tracking-tight">Inventory Optimization Matrix</h1>
          <p className="text-sm theme-muted mt-1">Real-time telemetry and aggregated metrics for active spare parts.</p>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 theme-muted" />
          <input
            type="text"
            placeholder="Search specific part..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 theme-bg-input border theme-border rounded-xl focus:outline-none focus:theme-cyan-border text-sm theme-text w-full md:w-64"
          />
        </div>
      </div>

      <div className="theme-bg-card border theme-border rounded-2xl backdrop-blur-md overflow-hidden theme-card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="uppercase tracking-widest text-[10px] theme-bg-card-soft theme-muted border-b theme-border">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-6 py-4 font-semibold">{col.replace(/_/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b theme-border last:border-b-0 hover:theme-cyan-bg transition-colors duration-200 theme-text">
                  {columns.map((col) => (
                    <td key={col} className="px-6 py-4">{row[col] === null ? '-' : String(row[col])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {filteredData.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t theme-border theme-bg-card-soft">
            <div className="text-sm theme-muted">
              Showing <span className="font-medium theme-text">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium theme-text">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="font-medium theme-text">{filteredData.length}</span> entries
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
            No entries found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;