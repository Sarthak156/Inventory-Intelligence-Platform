import { useState, useEffect } from "react";
import { BoxSelect, Database, Loader2, Search as SearchIcon, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import API from "../services/api";

const Inventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFetchingPage, setIsFetchingPage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [availableMonths, setAvailableMonths] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await API.get("/inventory/filters");
        setAvailableMonths(res.data.months || []);
        setAvailableYears(res.data.years || []);
      } catch (err) {
        console.error("Failed to fetch filters:", err);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchInventory = async () => {
      setIsFetchingPage(true);
      try {
        const response = await API.get(`/inventory?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}&month=${encodeURIComponent(selectedMonth)}&year=${encodeURIComponent(selectedYear)}`);
        setInventoryData(response.data.items || []);
        setTotalItems(response.data.total || 0);
        if (response.data.columns) {
          setColumns(response.data.columns);
        }
      } catch (error) {
        console.error("Failed to fetch inventory data:", error);
      } finally {
        setLoading(false);
        setIsFetchingPage(false);
      }
    };
    
    const timer = setTimeout(() => fetchInventory(), 300);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, selectedMonth, selectedYear]);

  if (loading) {
    return (
      <div className="h-full min-h-[80vh] flex flex-col items-center justify-center p-8">
        <Loader2 size={36} className="theme-cyan animate-spin" />
      </div>
    );
  }

  if (totalItems === 0 && !searchTerm) {
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

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light theme-text tracking-tight">Inventory Optimization Matrix</h1>
          <p className="text-sm theme-muted mt-1">Real-time telemetry and aggregated metrics for active spare parts.</p>
        </div>
        
        {/* Filters Area */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Month Slicer */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-4 pr-10 py-2 theme-bg-input border theme-border rounded-xl focus:outline-none focus:theme-cyan-border text-sm theme-text appearance-none cursor-pointer w-full md:w-36"
            >
              <option value="">All Months</option>
              {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 theme-muted pointer-events-none" />
          </div>

          {/* Year Slicer */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-4 pr-10 py-2 theme-bg-input border theme-border rounded-xl focus:outline-none focus:theme-cyan-border text-sm theme-text appearance-none cursor-pointer w-full md:w-32"
            >
              <option value="">All Years</option>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 theme-muted pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 theme-muted" />
            <input
              type="text"
              placeholder="Search specific part..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 theme-bg-input border theme-border rounded-xl focus:outline-none focus:theme-cyan-border text-sm theme-text w-full md:w-64"
            />
          </div>
        </div>
      </div>

      <div className="theme-bg-card border theme-border rounded-2xl backdrop-blur-md overflow-hidden theme-card-shadow relative">
        {isFetchingPage && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 size={24} className="theme-cyan animate-spin" />
          </div>
        )}
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
              {inventoryData.map((row, rowIndex) => (
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
        {inventoryData.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t theme-border theme-bg-card-soft">
            <div className="text-sm theme-muted">
              Showing <span className="font-medium theme-text">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium theme-text">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-medium theme-text">{totalItems}</span> entries
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
        
        {inventoryData.length === 0 && !isFetchingPage && (
          <div className="p-8 text-center theme-muted text-sm">
            No entries found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;