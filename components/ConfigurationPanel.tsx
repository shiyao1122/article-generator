import React, { useState, useEffect } from 'react';
import { SystemPrompts } from '../types';
import { Settings, FileText, Edit3, RefreshCw, Save } from 'lucide-react';

interface ConfigurationPanelProps {
  prompts: SystemPrompts;
  onSave: (prompts: SystemPrompts) => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ prompts, onSave }) => {
  const [localPrompts, setLocalPrompts] = useState<SystemPrompts>(prompts);
  const [isDirty, setIsDirty] = useState(false);

  // Sync with parent when parent changes (e.g. initial load or external reset)
  useEffect(() => {
    setLocalPrompts(prompts);
    setIsDirty(false);
  }, [prompts]);

  const handleChange = (key: keyof SystemPrompts, value: string) => {
    setLocalPrompts(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleApply = () => {
    onSave(localPrompts);
    // isDirty will be automatically reset via the useEffect once parent updates props
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-gray-800">System Configuration</h2>
        </div>
        {isDirty && (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                Unsaved
            </span>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Step 1 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
            Research Prompt
            <FileText className="w-4 h-4 text-gray-400" />
          </div>
          <textarea
            className="w-full h-32 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-gray-50 focus:bg-white transition-colors"
            value={localPrompts.research}
            onChange={(e) => handleChange('research', e.target.value)}
            placeholder="Enter instructions for the research phase..."
          />
          <p className="text-xs text-gray-500">Available variables: {'{topic}, {keywords}, {subScenario}'}</p>
        </div>

        {/* Step 2 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">2</div>
            Writing Prompt
            <Edit3 className="w-4 h-4 text-gray-400" />
          </div>
          <textarea
            className="w-full h-32 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none bg-gray-50 focus:bg-white transition-colors"
            value={localPrompts.writing}
            onChange={(e) => handleChange('writing', e.target.value)}
            placeholder="Enter instructions for the writing phase..."
          />
          <p className="text-xs text-gray-500">Available variables: {'{outline}, {researchResult}'}</p>
        </div>

        {/* Step 3 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">3</div>
            Restructuring Prompt
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </div>
          <textarea
            className="w-full h-32 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none bg-gray-50 focus:bg-white transition-colors"
            value={localPrompts.restructuring}
            onChange={(e) => handleChange('restructuring', e.target.value)}
            placeholder="Enter instructions for the restructuring phase..."
          />
          <p className="text-xs text-gray-500">Available variables: {'{draftContent}'}</p>
        </div>

      </div>

      {/* Footer with Apply Button */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <button
            onClick={handleApply}
            disabled={!isDirty}
            className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-all duration-200 ${
                isDirty 
                ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
        >
            <Save className="w-4 h-4" />
            {isDirty ? 'Apply Changes' : 'Saved'}
        </button>
      </div>
    </div>
  );
};

export default ConfigurationPanel;