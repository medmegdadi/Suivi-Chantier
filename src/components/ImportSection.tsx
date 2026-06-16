import React, { useState, useRef } from "react";
import { UploadCloud, Loader2, FileText, CheckCircle2, X, Database, FileCheck } from "lucide-react";

interface ImportSectionProps {
  onAnalyze: (payload: { file?: File; text?: string, isBim?: boolean }) => Promise<void>;
  isLoading: boolean;
}

export function ImportSection({ onAnalyze, isLoading }: ImportSectionProps) {
  const [importMode, setImportMode] = useState<"BIM" | "DALUX">("BIM");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyzeClick = () => {
    if (!file) return;
    onAnalyze({ file, isBim: importMode === "BIM" });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-8">
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 space-x-6">
        <button 
           className={`pb-3 font-medium text-sm flex items-center space-x-2 border-b-2 transition-colors ${importMode === 'BIM' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
           onClick={() => { setImportMode('BIM'); clearFile(); }}
        >
           <Database size={18} />
           <span>1. Base BIM (Revit)</span>
        </button>
        <button 
           className={`pb-3 font-medium text-sm flex items-center space-x-2 border-b-2 transition-colors ${importMode === 'DALUX' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
           onClick={() => { setImportMode('DALUX'); clearFile(); }}
        >
           <FileCheck size={18} />
           <span>2. Rapport Dalux</span>
        </button>
      </div>

      <div className="flex items-center space-x-3 mb-4">
        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
          <UploadCloud size={20} />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          {importMode === "BIM" ? "Importer les locaux (BIM)" : "Importer un rapport Dalux"}
        </h2>
      </div>
      
      <p className="text-sm text-gray-500 mb-4">
        {importMode === "BIM" 
          ? "Glissez-déposez le fichier d'export Dynamo/Revit (Excel/CSV) contenant tous les locaux du projet. Le système créera la base de locaux par défaut."
          : "Glissez-déposez le fichier d'inspection Dalux (PDF, DOCX, XLSX). Le système détectera l'avancement et les correspondra aux locaux BIM."
        }
      </p>

      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          }`}
        >
          <UploadCloud size={32} className={`mb-3 ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
          <p className="text-sm font-medium text-gray-900 mb-1">
            Cliquez pour sélectionner ou glissez un fichier ici
          </p>
          <p className="text-xs text-gray-500">
            {importMode === "BIM" ? "XLSX, XLS ou CSV" : "PDF, DOCX, XLSX ou TXT supportés"}
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept={importMode === "BIM" ? ".xlsx,.xls,.csv" : ".pdf,.doc,.docx,.xls,.xlsx,.txt"}
            disabled={isLoading}
          />
        </div>
      ) : (
        <div className="w-full p-4 border border-blue-200 bg-blue-50 rounded-xl flex flex-col items-center justify-center relative">
           <button 
             onClick={(e) => { e.stopPropagation(); clearFile(); }} 
             className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
             title="Retirer le fichier"
           >
             <X size={20} />
           </button>
           <FileText size={32} className="text-blue-600 mb-2" />
           <p className="text-sm font-semibold text-blue-900 flex items-center">
             <CheckCircle2 size={16} className="text-green-500 mr-2" />
             {file.name}
           </p>
           <p className="text-xs text-blue-600/70 mt-1">
             Prêt à être importé ({(file.size / 1024).toFixed(1)} KB)
           </p>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <button
          onClick={handleAnalyzeClick}
          disabled={!file || isLoading}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>{importMode === "BIM" ? "Importation BIM..." : "Analyse Dalux..."}</span>
            </>
          ) : (
            <span>{importMode === "BIM" ? "Créer la base BIM" : "Mapper les rapports"}</span>
          )}
        </button>
      </div>
    </div>
  );
}
