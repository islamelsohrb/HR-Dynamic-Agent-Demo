import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, RefreshCw, ChevronDown, ChevronUp, FileText, Database } from 'lucide-react';
import { IngestionStatus, FileSchema } from '../types';

interface IngestionCardProps {
  status: IngestionStatus;
  onUpload: (file: File) => void;
  progress: number;
  errorMessage?: string;
  indexVersion: number;
}

export const IngestionCard: React.FC<IngestionCardProps> = ({
  status,
  onUpload,
  progress,
  errorMessage,
  indexVersion
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const renderStatusIcon = () => {
    switch (status) {
      case IngestionStatus.COMPLETED:
        return <CheckCircle className="text-green-500 w-10 h-10" />;
      case IngestionStatus.FAILED:
        return <AlertCircle className="text-red-500 w-10 h-10" />;
      case IngestionStatus.IDLE:
        return <UploadCloud className="text-indigo-500 w-10 h-10" />;
      default:
        return <Loader2 className="text-indigo-500 w-10 h-10 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case IngestionStatus.VALIDATING: return "Validating file format...";
      case IngestionStatus.PARSING: return "Parsing content structures...";
      case IngestionStatus.CHUNKING: return "Splitting into token chunks...";
      case IngestionStatus.EMBEDDING: return "Generating embeddings (Gemini)...";
      case IngestionStatus.INDEXING: return "Updating Vector Store...";
      case IngestionStatus.COMPLETED: return "Ingestion Complete";
      case IngestionStatus.FAILED: return "Ingestion Failed";
      default: return "Ready to upload";
    }
  };

  const isProcessing = status !== IngestionStatus.IDLE && status !== IngestionStatus.COMPLETED && status !== IngestionStatus.FAILED;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Data Ingestion Pipeline</h2>
            <p className="text-slate-500 mt-1 text-sm">Upload HR datasets (CSV, JSON) to update the knowledge base.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <Database size={14} className="text-indigo-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Index v{indexVersion}</span>
          </div>
        </div>

        {/* Upload Container */}
        <div 
          onClick={() => !isProcessing ? fileInputRef.current?.click() : null}
          className={`
            relative w-full max-w-2xl mx-auto border-2 border-dashed rounded-xl p-8 md:p-10 
            flex flex-col items-center justify-center text-center transition-all duration-200
            ${isProcessing 
              ? 'border-slate-200 bg-slate-50 cursor-wait' 
              : 'border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer group'
            }
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".csv,.json,.txt"
            disabled={isProcessing}
          />
          
          <div className={`mb-4 p-4 bg-white rounded-full shadow-sm ring-1 ring-slate-100 ${!isProcessing && 'group-hover:scale-110 transition-transform'}`}>
             {renderStatusIcon()}
          </div>
          
          <h3 className="text-base font-semibold text-slate-900 mb-1">
             {status === IngestionStatus.IDLE || status === IngestionStatus.COMPLETED || status === IngestionStatus.FAILED
              ? "Click to upload file" 
              : "Processing Data..."}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
             {status === IngestionStatus.IDLE || status === IngestionStatus.COMPLETED || status === IngestionStatus.FAILED
               ? "Supported formats: .csv, .json (max 10MB)"
               : "Please wait while we process your document."}
          </p>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="w-full max-w-sm mt-6">
                <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                  <span>{getStatusText()}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-100 flex items-center gap-2">
                <AlertCircle size={16} />
                {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface SchemaCardProps {
  schema: FileSchema | undefined;
}

export const SchemaCard: React.FC<SchemaCardProps> = ({ schema }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!schema) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-50 transition-colors text-left group focus:outline-none"
      >
        <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
               <FileText size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Schema Detected</span>
              <span className="text-sm font-semibold text-slate-800">{schema.fileName}</span>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
              {schema.rowCount.toLocaleString()} rows
            </span>
            <div className="text-slate-400 group-hover:text-indigo-600 transition-colors">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
        </div>
      </button>
      
      {isExpanded && (
        <div className="border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
          <div className="max-h-[320px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                     <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Column Name</th>
                     <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Inferred Type</th>
                     <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Sample Value</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 text-sm">
                  {schema.columns.map((col, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3 font-mono text-slate-700 font-medium text-xs">{col.name}</td>
                          <td className="px-6 py-3">
                            <span className={`
                              inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                              ${col.type === 'number' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}
                            `}>
                              {col.type}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-slate-500 truncate max-w-[200px]" title={String(col.example)}>
                            {String(col.example)}
                          </td>
                      </tr>
                  ))}
               </tbody>
            </table>
          </div>
          <div className="bg-slate-50 px-6 py-2 border-t border-slate-200 text-[10px] text-center text-slate-400 font-medium">
             Showing schema for index version {schema.fileName ? 'Current' : 'Latest'}
          </div>
        </div>
      )}
    </div>
  );
};