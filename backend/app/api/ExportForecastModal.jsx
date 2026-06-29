import { useState } from 'react';
import { X, Download, Package, Calendar, FileText, FileSpreadsheet, Loader2, AlertTriangle } from 'lucide-react';
import MultiSelectPartsDropdown from './MultiSelectPartsDropdown';
import API from '../../services/api';

const ExportForecastModal = ({ isOpen, onClose, allParts, currentPart }) => {
  const [partSelectionMode, setPartSelectionMode] = useState(currentPart && currentPart !== 'ALL_PARTS' ? 'specific' : 'all');
  const [selectedParts, setSelectedParts] = useState(currentPart && currentPart !== 'ALL_PARTS' ? [currentPart] : []);
  const [horizon, setHorizon] = useState(12);
  const [format, setFormat] = useState('xlsx');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    if (partSelectionMode === 'specific' && selectedParts.length === 0) {
      setError('Please select at least one part for a specific export.');
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const payload = {
        parts: partSelectionMode === 'all' ? ['ALL_PARTS'] : selectedParts,
        horizon: horizon,
        format: format,
      };

      const response = await API.post('/api/export-forecast', payload, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = `forecast_export.${format}`;
      if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch.length === 2)
              filename = filenameMatch[1];
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      onClose();

    } catch (err) {
      const errorData = await err.response?.data?.text();
      const errorJson = errorData ? JSON.parse(errorData) : {};
      setError(errorJson.detail || 'An unexpected error occurred during export.');
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="theme-app border theme-border rounded-2xl w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.4)] flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b theme-border">
          <h2 className="text-xl font-medium theme-text flex items-center gap-3">
            <Download size={20} className="theme-cyan" />
            Export Forecast Data
          </h2>
          <button onClick={onClose} className="p-2 theme-muted hover:theme-text hover:bg-white/5 rounded-lg transition-colors border theme-border">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Part Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold theme-text flex items-center gap-2"><Package size={16} /> Part Selection</label>
            <div className="grid grid-cols-2 gap-2 p-1 theme-bg-card-soft border theme-border rounded-xl">
              <button onClick={() => setPartSelectionMode('all')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${partSelectionMode === 'all' ? 'bg-cyan-500 text-black' : 'theme-muted hover:bg-white/5'}`}>All Parts</button>
              <button onClick={() => setPartSelectionMode('specific')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${partSelectionMode === 'specific' ? 'bg-cyan-500 text-black' : 'theme-muted hover:bg-white/5'}`}>Specific Parts</button>
            </div>
            {partSelectionMode === 'specific' && (
              <MultiSelectPartsDropdown allParts={allParts} selectedParts={selectedParts} setSelectedParts={setSelectedParts} />
            )}
          </div>

          {/* Forecast Horizon */}
          <div className="space-y-3">
            <label className="text-sm font-semibold theme-text flex items-center gap-2"><Calendar size={16} /> Forecast Horizon</label>
            <div className="grid grid-cols-4 gap-2 p-1 theme-bg-card-soft border theme-border rounded-xl">
              {[1, 3, 6, 12].map(h => (
                <button key={h} onClick={() => setHorizon(h)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${horizon === h ? 'bg-cyan-500 text-black' : 'theme-muted hover:bg-white/5'}`}>{h}M</button>
              ))}
            </div>
          </div>

          {/* Export Format */}
          <div className="space-y-3">
            <label className="text-sm font-semibold theme-text flex items-center gap-2"><FileText size={16} /> Export Format</label>
            <div className="grid grid-cols-2 gap-2 p-1 theme-bg-card-soft border theme-border rounded-xl">
              <button onClick={() => setFormat('xlsx')} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${format === 'xlsx' ? 'bg-cyan-500 text-black' : 'theme-muted hover:bg-white/5'}`}>
                <FileSpreadsheet size={16} /> Excel (.xlsx)
              </button>
              <button onClick={() => setFormat('csv')} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${format === 'csv' ? 'bg-cyan-500 text-black' : 'theme-muted hover:bg-white/5'}`}>
                <FileText size={16} /> CSV
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 text-sm bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Export Failed</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t theme-border theme-bg-card-soft flex justify-end">
          <button
            onClick={handleExport}
            disabled={isExporting || (partSelectionMode === 'specific' && selectedParts.length === 0)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 theme-button-cyan py-2.5 px-8 rounded-xl transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating Export...
              </>
            ) : (
              <>
                <Download size={16} />
                Generate Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportForecastModal;