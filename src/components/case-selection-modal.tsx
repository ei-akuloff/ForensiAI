"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FolderOpen } from "lucide-react";
import { useCases } from "@/components/case-context";

interface CaseSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCase: (caseId: string) => void;
  onCreateNew: () => void;
  fileName: string;
}

export function CaseSelectionModal({
  isOpen,
  onClose,
  onSelectCase,
  onCreateNew,
  fileName,
}: CaseSelectionModalProps) {
  const { cases } = useCases();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");

  // Filter cases based on search term
  const filteredCases = cases.filter(caseItem =>
    caseItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (caseItem.leadInvestigator && caseItem.leadInvestigator.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (caseItem.department && caseItem.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectCase = () => {
    if (selectedCaseId) {
      onSelectCase(selectedCaseId);
    }
  };

  const handleCreateNew = () => {
    onCreateNew();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'text-emerald-400 border-emerald-500/50';
      case 'active':
      case 'in progress':
        return 'text-cyan-400 border-cyan-500/50';
      case 'pending':
        return 'text-yellow-400 border-yellow-500/50';
      default:
        return 'text-matrix-text-muted border-matrix-border';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'text-red-400 border-red-500/50';
      case 'high':
        return 'text-orange-400 border-orange-500/50';
      case 'medium':
        return 'text-yellow-400 border-yellow-500/50';
      case 'low':
        return 'text-green-400 border-green-500/50';
      default:
        return 'text-matrix-text-muted border-matrix-border';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl my-8 matrix-glass border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 animate-matrix-slide-up backdrop-blur-xl relative overflow-hidden">
          {/* Matrix scanning line animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent transform -skew-x-12 animate-matrix-scan"></div>
          
          {/* Cyber grid overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
          
          <div className="relative z-10">
            <div className="flex flex-row items-center justify-between space-y-0 pb-6 px-6 pt-6 border-b border-cyan-500/20">
              <div>
                <h2 className="text-xl font-bold text-cyan-400 font-mono tracking-wider uppercase">
                  Case Database Selection
                </h2>
                <div className="text-xs text-emerald-400/70 font-mono mt-1">
                  FILE: {fileName}
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-10 w-10 p-0 text-cyan-400 hover:text-red-400 hover:bg-red-500/10 border border-cyan-500/30 hover:border-red-500/50 rounded bg-black/40 transition-all duration-300 font-mono text-lg"
              >
                ×
              </button>
            </div>
            
            <div className="relative p-6">
              {/* Search and Create New */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400/60 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search cases..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="matrix-input pl-10"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreateNew}
                  className="matrix-button px-4 py-2 font-mono uppercase tracking-wider whitespace-nowrap flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create New Case
                </button>
              </div>

              {/* Cases List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredCases.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="h-12 w-12 text-cyan-400/60 mx-auto mb-4" />
                    <p className="text-cyan-400 font-mono">
                      {cases.length === 0 ? "NO_CASES_FOUND" : "NO_MATCHING_CASES"}
                    </p>
                    <p className="text-emerald-400/60 text-sm font-mono mt-2">
                      CREATE_NEW_CASE_TO_CONTINUE
                    </p>
                  </div>
                ) : (
                  filteredCases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className={`matrix-card cursor-pointer transition-all duration-300 hover:border-cyan-400/50 hover:shadow-cyan-500/20 ${
                        selectedCaseId === caseItem.id ? 'border-cyan-400 shadow-cyan-500/30' : ''
                      }`}
                      onClick={() => setSelectedCaseId(caseItem.id)}
                    >
                      <div className="flex items-center justify-between p-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-mono text-cyan-400 font-bold truncate">
                              {caseItem.name}
                            </h3>
                            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30">
                              #{caseItem.id}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`text-xs font-mono px-2 py-1 rounded border ${getStatusColor(caseItem.status)}`}>
                              {caseItem.status?.toUpperCase() || 'UNKNOWN'}
                            </span>
                            {caseItem.priority && (
                              <span className={`text-xs font-mono px-2 py-1 rounded border ${getPriorityColor(caseItem.priority)}`}>
                                {caseItem.priority.toUpperCase()}
                              </span>
                            )}
                          </div>
                          
                          <div className="text-xs text-emerald-400/70 font-mono">
                            INVESTIGATOR: {caseItem.leadInvestigator?.toUpperCase() || 'UNASSIGNED'}
                          </div>
                          <div className="text-xs text-cyan-400/60 font-mono">
                            OPENED: {formatDate(caseItem.dateOpened)}
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedCaseId === caseItem.id 
                              ? 'bg-cyan-400 border-cyan-400' 
                              : 'border-cyan-400/50'
                          }`}>
                            {selectedCaseId === caseItem.id && (
                              <div className="w-full h-full bg-cyan-400 rounded-full animate-pulse"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-cyan-500/20">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-matrix-surface/60 border border-matrix-border text-matrix-text-muted hover:text-matrix-cyan hover:border-matrix-cyan font-mono uppercase tracking-wider transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSelectCase}
                  disabled={!selectedCaseId}
                  className="px-6 py-2 matrix-button font-mono uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Case
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}