import React, { useState, useCallback, useEffect } from 'react';
import ConfigurationPanel from './components/ConfigurationPanel';
import DataTable from './components/DataTable';
import FileUpload from './components/FileUpload';
import { ArticleData, DEFAULT_PROMPTS, SystemPrompts } from './types';
import { parseExcelFile } from './services/excelService';
import { generateContent } from './services/geminiService';
import { downloadAsWordDoc, downloadAsMarkdown } from './services/wordService';
import { downloadBatchAsZip } from './services/zipService';
import { Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'seo_generator_prompts';

function App() {
  const [prompts, setPrompts] = useState<SystemPrompts>(() => {
    try {
      const savedPrompts = localStorage.getItem(STORAGE_KEY);
      if (savedPrompts) {
        return JSON.parse(savedPrompts);
      }
    } catch (error) {
      console.warn('Failed to load prompts from local storage:', error);
    }
    return DEFAULT_PROMPTS;
  });
  
  const [rows, setRows] = useState<ArticleData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Save prompts to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  }, [prompts]);

  const handlePromptsSave = (newPrompts: SystemPrompts) => {
    setPrompts(newPrompts);
    setNotification({ type: 'success', message: 'System configuration saved.' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileUpload = async (file: File) => {
    try {
      const parsedRows = await parseExcelFile(file);
      setRows(parsedRows);
      setNotification({ type: 'success', message: `Successfully loaded ${parsedRows.length} rows from Excel.` });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ type: 'error', message: "Failed to parse Excel file. Please ensure it has the correct columns." });
    }
  };

  const processRow = useCallback(async (row: ArticleData, currentPrompts: SystemPrompts): Promise<ArticleData> => {
    let updatedRow = { ...row };

    try {
      // Step 1: Research
      updatedRow.status = 'researching';
      setRows(prev => prev.map(r => r.id === updatedRow.id ? updatedRow : r));
      
      const researchPrompt = currentPrompts.research
        .replace('{topic}', updatedRow.topic)
        .replace('{keywords}', updatedRow.keywords)
        .replace('{subScenario}', updatedRow.subScenario);
        
      const researchResult = await generateContent(researchPrompt);
      updatedRow.researchResult = researchResult;

      // Step 2: Writing
      updatedRow.status = 'writing';
      setRows(prev => prev.map(r => r.id === updatedRow.id ? updatedRow : r));

      const writingPrompt = currentPrompts.writing
        .replace('{outline}', updatedRow.outline)
        .replace('{researchResult}', researchResult);

      const draftContent = await generateContent(writingPrompt);
      updatedRow.draftContent = draftContent;

      // Step 3: Restructuring
      updatedRow.status = 'restructuring';
      setRows(prev => prev.map(r => r.id === updatedRow.id ? updatedRow : r));

      const restructuringPrompt = currentPrompts.restructuring
        .replace('{draftContent}', draftContent);

      const finalArticle = await generateContent(restructuringPrompt);
      updatedRow.finalArticle = finalArticle;
      
      // Complete
      updatedRow.status = 'completed';
      updatedRow.errorMessage = undefined;
      
    } catch (error) {
      updatedRow.status = 'error';
      updatedRow.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    return updatedRow;
  }, []);

  const handleGenerateRow = async (id: string) => {
    const rowIndex = rows.findIndex(r => r.id === id);
    if (rowIndex === -1) return;

    setIsProcessing(true);
    const rowToProcess = rows[rowIndex];
    
    const completedRow = await processRow(rowToProcess, prompts);
    
    setRows(prev => {
      const newRows = [...prev];
      newRows[rowIndex] = completedRow;
      return newRows;
    });
    setIsProcessing(false);
  };

  const handleGenerateBatch = async (ids: string[]) => {
    if (ids.length === 0) return;

    setIsProcessing(true);
    // Determine which rows to process: 
    // If they are explicitly selected, we process them unless they are already running? 
    // Usually we just want to run idle/error ones unless forced. 
    // For this implementation, let's filter the requested IDs for those not currently 'completed' 
    // to avoid accidental costs, unless we want to support force-regenerate batch.
    // However, existing "Generate All" filters for idle/error. Let's stick to that safety for batch too.
    const rowsToProcess = rows.filter(r => ids.includes(r.id) && (r.status === 'idle' || r.status === 'error'));

    if (rowsToProcess.length === 0) {
      setNotification({ type: 'success', message: "No pending items to generate in selection." });
      setTimeout(() => setNotification(null), 3000);
      setIsProcessing(false);
      return;
    }

    for (const row of rowsToProcess) {
      // Process one by one
      const completedRow = await processRow(row, prompts);
      setRows(prev => prev.map(r => r.id === completedRow.id ? completedRow : r));
    }
    setIsProcessing(false);
    setNotification({ type: 'success', message: `Batch generation of ${rowsToProcess.length} items completed.` });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDownload = (id: string, type: 'research' | 'draft' | 'final', format: 'docx' | 'md') => {
    const row = rows.find(r => r.id === id);
    if (!row) return;

    let content = "";
    let suffix = "";

    switch (type) {
        case 'research':
            content = row.researchResult || "";
            suffix = "_research";
            break;
        case 'draft':
            content = row.draftContent || "";
            suffix = "_draft";
            break;
        case 'final':
            content = row.finalArticle || "";
            // Final article usually doesn't need a suffix for the main deliverable, 
            // but to distinguish it from others if downloaded in same folder, we can keep it clean or add suffix.
            // Let's keep it clean for final as it's the main output.
            suffix = ""; 
            break;
    }

    if (!content) {
        setNotification({ type: 'error', message: "Content not available for this stage yet." });
        setTimeout(() => setNotification(null), 3000);
        return;
    }

    const title = `${row.topic}${suffix}`;

    if (format === 'docx') {
      downloadAsWordDoc(title, content);
    } else {
      downloadAsMarkdown(title, content);
    }
  };

  const handleDownloadBatch = (ids: string[], format: 'docx' | 'md') => {
    const rowsToDownload = rows.filter(r => ids.includes(r.id) && r.status === 'completed');
    if (rowsToDownload.length === 0) {
        setNotification({ type: 'error', message: "No completed articles to download in selection." });
        setTimeout(() => setNotification(null), 3000);
        return;
    }
    
    downloadBatchAsZip(rowsToDownload, format);
    setNotification({ type: 'success', message: `Prepared ${format.toUpperCase()} download for ${rowsToDownload.length} articles.` });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
               <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">SEO Article Generator</h1>
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            API Key Loaded (Env)
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-20 right-8 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-right fade-in duration-300 ${notification.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
          {notification.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar - Configuration */}
        <div className="lg:col-span-4 xl:col-span-3 h-[calc(100vh-8rem)] sticky top-24">
          <ConfigurationPanel 
            prompts={prompts} 
            onSave={handlePromptsSave} 
          />
        </div>

        {/* Right Content - Data & Actions */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6 h-full">
          
          {/* Upload Area (Only visible if no data) */}
          {rows.length === 0 && (
             <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                <div className="max-w-xl w-full">
                  <FileUpload onFileUpload={handleFileUpload} />
                  <div className="mt-8 text-center text-sm text-gray-400">
                    <p>AI-Powered Workflow: Research &rarr; Write &rarr; Restructure</p>
                  </div>
                </div>
             </div>
          )}

          {/* Data Table (Visible if data exists) */}
          {rows.length > 0 && (
            <div className="h-[calc(100vh-8rem)]">
              <DataTable 
                data={rows} 
                onGenerateRow={handleGenerateRow} 
                onGenerateBatch={handleGenerateBatch}
                onDownload={handleDownload}
                onDownloadBatch={handleDownloadBatch}
                isProcessing={isProcessing}
              />
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default App;