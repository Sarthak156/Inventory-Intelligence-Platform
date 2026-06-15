import { UploadCloud, FileSpreadsheet, CheckCircle2 } from "lucide-react";

export default function Upload() {
  return (
    <div className="max-w-4xl mx-auto mt-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-light theme-text tracking-tight mb-2">Data Ingestion Center</h1>
        <p className="theme-muted">Securely upload historical consumption datasets to train your AI models.</p>
      </div>

      <div className="relative group cursor-pointer">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>

        <div className="relative theme-bg-card backdrop-blur-xl border-2 border-dashed theme-border hover:theme-cyan-border rounded-3xl p-16 flex flex-col items-center justify-center text-center transition-all duration-300">
          <div className="w-20 h-20 theme-bg-icon rounded-full flex items-center justify-center mb-6 theme-border group-hover:theme-cyan-border group-hover:scale-110 transition-all duration-500">
            <UploadCloud size={36} className="theme-cyan" />
          </div>

          <h3 className="text-xl font-medium theme-text mb-3">Drag & Drop Datasets</h3>
          <p className="theme-muted mb-8 max-w-sm text-sm leading-relaxed">
            Support for Excel, CSV, and JSON structures. Data validation engines will run automatically upon upload.
          </p>

          <button className="theme-button-cyan px-8 py-3 rounded-xl font-medium tracking-wide transition-all duration-300 text-sm">
            Select Files
          </button>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="theme-bg-card-soft theme-border rounded-xl p-5">
          <CheckCircle2 size={20} className="theme-emerald mb-3" />
          <h4 className="theme-text font-medium mb-1 text-sm">Automated Scrubbing</h4>
          <p className="theme-muted text-xs">Null values and duplicates are automatically flagged and resolved.</p>
        </div>
        <div className="theme-bg-card-soft theme-border rounded-xl p-5">
          <FileSpreadsheet size={20} className="theme-cyan mb-3" />
          <h4 className="theme-text font-medium mb-1 text-sm">Format Recognition</h4>
          <p className="theme-muted text-xs">Dynamic column mapping for Part IDs, Dates, and Consumption quantities.</p>
        </div>
        <div className="theme-bg-card-soft theme-border rounded-xl p-5">
          <CheckCircle2 size={20} className="theme-emerald mb-3" />
          <h4 className="theme-text font-medium mb-1 text-sm">Secure Encryption</h4>
          <p className="theme-muted text-xs">End-to-end AES-256 encryption during dataset transfer.</p>
        </div>
      </div>
    </div>
  );
}
