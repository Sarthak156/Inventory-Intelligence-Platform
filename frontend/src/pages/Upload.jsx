import { useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";

import API from "../services/api";
import { useContext } from "react";

import {
  DataContext
} from "../context/DataContext";



export default function Upload() {

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const {
  datasetPreview,
  setDatasetPreview
} = useContext(DataContext);

  const handleUpload = async () => {


    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {

      const response = await API.post(
        "/upload",
        formData
      );

      setDatasetPreview(response.data);

    } catch (error) {
      console.error(error);

    } finally {
      setLoading(false);
    }


  };

  return (<div className="max-w-6xl mx-auto mt-10">

    ```
    <div className="mb-8 text-center">
      <h1 className="text-3xl font-light theme-text tracking-tight mb-2">
        Data Ingestion Center
      </h1>

      <p className="theme-muted">
        Securely upload historical consumption datasets
        to train your AI forecasting engines.
      </p>
    </div>

    <div className="relative group">

      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>

      <div className="relative theme-bg-card backdrop-blur-xl border-2 border-dashed theme-border hover:theme-cyan-border rounded-3xl p-16 flex flex-col items-center justify-center text-center transition-all duration-300">

        <div className="w-20 h-20 theme-bg-icon rounded-full flex items-center justify-center mb-6 theme-border group-hover:theme-cyan-border group-hover:scale-110 transition-all duration-500">

          <UploadCloud
            size={36}
            className="theme-cyan"
          />

        </div>

        <h3 className="text-xl font-medium theme-text mb-3">
          Drag & Drop Datasets
        </h3>

        <p className="theme-muted mb-8 max-w-sm text-sm leading-relaxed">
          Upload Excel or CSV demand datasets.
          AI preprocessing pipelines will validate and transform the data automatically.
        </p>

        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          id="dataset-upload"
          onChange={(e) =>
            setFile(e.target.files[0])
          }
        />

        <label
          htmlFor="dataset-upload"
          className="theme-button-cyan px-8 py-3 rounded-xl font-medium tracking-wide transition-all duration-300 text-sm cursor-pointer"
        >
          Select Dataset
        </label>

        {file && (
          <div className="mt-6 flex items-center gap-3 text-sm theme-text">

            <FileSpreadsheet
              size={18}
              className="theme-cyan"
            />

            <span>{file.name}</span>

          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="mt-6 bg-cyan-500 hover:bg-cyan-400 transition-all duration-300 text-black font-semibold px-8 py-3 rounded-xl disabled:opacity-50"
        >

          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2
                size={18}
                className="animate-spin"
              />
              Processing...
            </div>
          ) : (
            "Start AI Processing"
          )}

        </button>

      </div>
    </div>

    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">

      <div className="theme-bg-card-soft theme-border rounded-xl p-5">

        <CheckCircle2
          size={20}
          className="theme-emerald mb-3"
        />

        <h4 className="theme-text font-medium mb-1 text-sm">
          Automated Scrubbing
        </h4>

        <p className="theme-muted text-xs">
          Sparse demand patterns and null values
          are intelligently handled during preprocessing.
        </p>

      </div>

      <div className="theme-bg-card-soft theme-border rounded-xl p-5">

        <FileSpreadsheet
          size={20}
          className="theme-cyan mb-3"
        />

        <h4 className="theme-text font-medium mb-1 text-sm">
          Time-Series Recognition
        </h4>

        <p className="theme-muted text-xs">
          Monthly demand columns are automatically transformed into forecasting-ready structures.
        </p>

      </div>

      <div className="theme-bg-card-soft theme-border rounded-xl p-5">

        <AlertCircle
          size={20}
          className="text-orange-400 mb-3"
        />

        <h4 className="theme-text font-medium mb-1 text-sm">
          AI Validation Engine
        </h4>

        <p className="theme-muted text-xs">
          Detects missing months, inconsistent formats,
          and sparse inventory behavior automatically.
        </p>

      </div>

    </div>

    {datasetPreview && (

      <div className="mt-12 theme-bg-card rounded-3xl p-8 border theme-border">

        <h2 className="text-2xl mb-6 theme-text">
          Dataset Intelligence Preview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">

          <div className="theme-bg-card-soft rounded-xl p-5">
            <p className="theme-muted text-sm mb-2">
              Total Rows
            </p>

            <h3 className="text-3xl theme-text font-semibold">
              {datasetPreview.total_rows}
            </h3>
          </div>

          <div className="theme-bg-card-soft rounded-xl p-5">
            <p className="theme-muted text-sm mb-2">
              Total Columns
            </p>

            <h3 className="text-3xl theme-text font-semibold">
              {datasetPreview.columns.length}
            </h3>
          </div>
          <div className="theme-bg-card-soft rounded-xl p-5">

            <p className="theme-muted text-sm mb-2">
              Total Parts
            </p>

            <h3 className="text-3xl theme-text font-semibold">
              {datasetPreview.total_parts}
            </h3>

          </div>

          <div className="theme-bg-card-soft rounded-xl p-5">

            <p className="theme-muted text-sm mb-2">
              Total Demand
            </p>

            <h3 className="text-3xl theme-text font-semibold">
              {datasetPreview.total_demand.toLocaleString()}
            </h3>

          </div>

          <div className="theme-bg-card-soft rounded-xl p-5">
            <p className="theme-muted text-sm mb-2">
              Forecast Status
            </p>

            <h3 className="text-emerald-400 text-2xl font-semibold">
              Ready
            </h3>
          </div>

        </div>

        <div className="overflow-auto rounded-xl border theme-border p-4 max-h-[400px]">

          <pre className="text-xs theme-muted">
            {JSON.stringify(
              datasetPreview.sample_data,
              null,
              2
            )}
          </pre>

        </div>

      </div>

    )}

  </div>

  );
}
