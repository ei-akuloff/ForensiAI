"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    caseItem.caseNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caseItem.leadInvestigator.toLowerCase().includes(searchTerm.toLowerCase())
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
    switch (status) {
      case "ongoing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <Card className="w-full max-w-4xl bg-white dark:bg-slate-800 border-white/20 dark:border-slate-700/50 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Add UFDR File to Case
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Choose an existing case to add <span className="font-mono text-emerald-600 dark:text-emerald-400">{fileName}</span> to, or create a new case
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search cases by name, case number, or investigator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Cases List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredCases.length > 0 ? (
                filteredCases.map((caseItem) => (
                  <div
                    key={caseItem.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedCaseId === caseItem.id
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    }`}
                    onClick={() => setSelectedCaseId(caseItem.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <FolderOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                              {caseItem.name}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {caseItem.leadInvestigator} • {formatDate(caseItem.dateOpened)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center space-x-2">
                          <Badge className={getStatusColor(caseItem.status)}>
                            {caseItem.status}
                          </Badge>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {caseItem.fileSize}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          {caseItem.priority}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {caseItem.department}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No cases found matching your search</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-slate-200 dark:border-slate-600">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleCreateNew}
                variant="outline"
                className="flex-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Case
              </Button>
              
              <Button
                onClick={handleSelectCase}
                disabled={!selectedCaseId}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Add to Selected Case
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
