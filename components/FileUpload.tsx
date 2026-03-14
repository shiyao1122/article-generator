import React, { useRef } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-colors cursor-pointer group"
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".xlsx, .xls" 
        className="hidden" 
      />
      
      <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Upload className="w-6 h-6 text-indigo-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Upload Excel File</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm">
        Drag and drop your .xlsx file here, or click to browse. 
        <br/>
        <span className="text-xs text-gray-400 mt-2 block flex items-center justify-center gap-1">
           <FileSpreadsheet className="w-3 h-3" /> Required columns: Scenarios, Sub-scenarios, Topic, Keywords, Outline
        </span>
      </p>
    </div>
  );
};

export default FileUpload;