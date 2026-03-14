import React, { useState, useEffect } from 'react';
import { ArticleData, ProcessingStatus } from '../types';
import { Play, CheckCircle, AlertCircle, Loader2, FileDown, Sparkles, RefreshCw, FileCode, Square, CheckSquare, BookOpen, FileText } from 'lucide-react';

interface DataTableProps {
  data: ArticleData[];
  onGenerateRow: (id: string) => void;
  onGenerateBatch: (ids: string[]) => void;
  onDownload: (id: string, type: 'research' | 'draft' | 'final', format: 'docx' | 'md') => void;
  onDownloadBatch: (ids: string[], format: 'docx' | 'md') => void;
  isProcessing: boolean;
}

const StatusBadge: React.FC<{ status: ProcessingStatus }> = ({ status }) => {
  switch (status) {
    case 'researching':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Loader2 className="w-3 h-3 animate-spin" /> Researching</span>;
    case 'writing':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><Loader2 className="w-3 h-3 animate-spin" /> Writing</span>;
    case 'restructuring':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><Loader2 className="w-3 h-3 animate-spin" /> Restructuring</span>;
    case 'completed':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3" /> Done</span>;
    case 'error':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertCircle className="w-3 h-3" /> Error</span>;
    default:
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Idle</span>;
  }
};

const DataTable: React.FC<DataTableProps> = ({ data, onGenerateRow, onGenerateBatch, onDownload, onDownloadBatch, isProcessing }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Clear selection if data changes drastically (optional, but safer)
  useEffect(() => {
    // We keep selection unless ids disappear from data
    setSelectedIds(prev => {
      const newSet = new Set<string>();
      data.forEach(row => {
        if (prev.has(row.id)) newSet.add(row.id);
      });
      return newSet;
    });
  }, [data.length]);

  if (data.length === 0) {
    return null;
  }

  const handleToggleAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(r => r.id)));
    }
  };

  const handleToggleRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectedCount = selectedIds.size;
  const isAllSelected = data.length > 0 && selectedCount === data.length;

  // Actions
  const handleBatchGenerate = () => {
    if (selectedCount > 0) {
      onGenerateBatch(Array.from(selectedIds));
    } else {
      // If nothing selected, assume all pending
      const pendingIds = data.filter(d => d.status === 'idle' || d.status === 'error').map(d => d.id);
      onGenerateBatch(pendingIds);
    }
  };

  const handleBatchDownload = (format: 'docx' | 'md') => {
    if (selectedCount > 0) {
      const completedSelected = data.filter(d => selectedIds.has(d.id) && d.status === 'completed').map(d => d.id);
      onDownloadBatch(completedSelected, format);
    } else {
      const allCompleted = data.filter(d => d.status === 'completed').map(d => d.id);
      onDownloadBatch(allCompleted, format);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center gap-4 flex-wrap">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mr-auto">
          <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
          Article Data ({data.length} items)
        </h2>
        
        <div className="flex gap-2">
          {/* Download Button Group */}
          <div className="flex items-center shadow-sm rounded-lg overflow-hidden border border-gray-300">
            <div className="px-3 py-2 bg-gray-50 border-r border-gray-300 text-sm text-gray-600 flex items-center gap-2 select-none">
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">{selectedCount > 0 ? 'Selected' : 'All'}</span>
            </div>
            <button
              onClick={() => handleBatchDownload('docx')}
              disabled={isProcessing}
              className="px-3 py-2 bg-white hover:bg-gray-50 text-sm font-medium text-blue-600 border-r border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download DOCX"
            >
              DOCX
            </button>
            <button
              onClick={() => handleBatchDownload('md')}
              disabled={isProcessing}
              className="px-3 py-2 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download Markdown"
            >
              MD
            </button>
          </div>

          <button
            onClick={handleBatchGenerate}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {selectedCount > 0 ? `Generate Selected (${selectedCount})` : `Generate All Pending`}
          </button>
        </div>
      </div>
      
      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 font-medium sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-4 w-12 text-center">
                 <button onClick={handleToggleAll} className="flex items-center justify-center text-gray-500 hover:text-indigo-600">
                    {isAllSelected ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                 </button>
              </th>
              <th className="p-4 w-1/4">Topic</th>
              <th className="p-4 w-1/6">Scenario</th>
              <th className="p-4 w-1/4 hidden md:table-cell">Outline Preview</th>
              <th className="p-4 w-24">Status</th>
              <th className="p-4 w-auto text-right min-w-[200px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row) => {
              const isSelected = selectedIds.has(row.id);
              return (
                <tr key={row.id} className={`transition-colors group ${isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-gray-50'}`}>
                  <td className="p-4 text-center">
                    <button onClick={() => handleToggleRow(row.id)} className="flex items-center justify-center text-gray-400 hover:text-indigo-600">
                      {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                    </button>
                  </td>
                  <td className="p-4 font-medium text-gray-900">
                    <div className="line-clamp-2">{row.topic}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-1 font-normal">{row.keywords}</div>
                  </td>
                  <td className="p-4 text-gray-600">
                    <div className="line-clamp-1">{row.scenario}</div>
                    <div className="text-xs text-gray-400 mt-1 line-clamp-1">{row.subScenario}</div>
                  </td>
                  <td className="p-4 text-gray-500 hidden md:table-cell">
                     <div className="line-clamp-2 italic">{row.outline}</div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col gap-1">
                      <div><StatusBadge status={row.status} /></div>
                      {row.status === 'error' && row.errorMessage && (
                        <div className="text-xs text-red-500 leading-tight break-words max-w-[12rem]" title={row.errorMessage}>
                          {row.errorMessage}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      
                      {/* Intermediate Artifacts Downloads */}
                      <div className="flex items-center gap-1 mr-2 pr-2 border-r border-gray-200">
                        {row.researchResult ? (
                          <button
                            onClick={() => onDownload(row.id, 'research', 'md')}
                            className="p-1.5 text-blue-600 hover:bg-white hover:shadow-sm rounded-md transition-all"
                            title="Download Research (MD)"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                        ) : <div className="w-7"></div>}
                        
                        {row.draftContent ? (
                          <button
                            onClick={() => onDownload(row.id, 'draft', 'md')}
                            className="p-1.5 text-purple-600 hover:bg-white hover:shadow-sm rounded-md transition-all"
                            title="Download Draft (MD)"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        ) : <div className="w-7"></div>}
                      </div>

                      {/* Final Article Actions */}
                      {row.status === 'completed' ? (
                        <>
                          <div className="flex bg-gray-100 rounded-lg p-0.5">
                            <button
                              onClick={() => onDownload(row.id, 'final', 'docx')}
                              className="p-1.5 text-blue-600 hover:bg-white hover:shadow-sm rounded-md transition-all"
                              title="Download Final (DOCX)"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDownload(row.id, 'final', 'md')}
                              className="p-1.5 text-gray-700 hover:bg-white hover:shadow-sm rounded-md transition-all"
                              title="Download Final (MD)"
                            >
                              <FileCode className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            onClick={() => onGenerateRow(row.id)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Regenerate Article"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onGenerateRow(row.id)}
                          disabled={row.status !== 'idle' && row.status !== 'error'}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 disabled:text-gray-300 rounded-lg transition-colors"
                          title={row.status === 'error' ? "Retry Generation" : "Generate Single Article"}
                        >
                           {row.status === 'error' ? <RefreshCw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t border-gray-100 bg-gray-50 text-xs text-center text-gray-400">
        Showing {data.length} entries {selectedCount > 0 && `(${selectedCount} selected)`}
      </div>
    </div>
  );
};

// Helper icon component used above
function FileSpreadsheet({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M8 13h2" />
      <path d="M14 13h2" />
      <path d="M8 17h2" />
      <path d="M14 17h2" />
    </svg>
  );
}

export default DataTable;