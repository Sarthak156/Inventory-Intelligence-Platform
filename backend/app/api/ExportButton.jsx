import { Download } from "lucide-react";

const ExportButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 theme-button-cyan py-2.5 px-5 rounded-xl transition-all text-sm font-medium"
    >
      <Download size={16} />
      Export Forecast
    </button>
  );
};

export default ExportButton;