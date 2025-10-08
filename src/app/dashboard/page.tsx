"use client";

import { StatsCard } from "@/components/stats-card";
import { UploadBox } from "@/components/upload-box";
import { CaseList } from "@/components/case-list";
import { useCases } from "@/components/case-context";
import { CaseFormData } from "@/components/case-creation-modal";
import { FolderOpen, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { uploadUFDRFile, generateSessionId } from "@/lib/backend-service";
import { useState } from "react";

export default function DashboardPage() {
  const { cases, addCase, updateCase } = useCases();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Calculate stats from actual cases
  const stats = {
    totalCases: cases.length,
    ongoingCases: cases.filter(c => c.status === "ongoing").length,
    completedCases: cases.filter(c => c.status === "completed").length,
  };

  const handleFileUpload = async (file: File) => {
    // Store the file for later upload when case is created
    setUploadedFile(file);
  };

  const handleCaseCreated = async (caseData: CaseFormData) => {
    const newCaseId = addCase(caseData);
    
    // Upload the file to the backend if one was selected
    if (uploadedFile) {
      try {
        const sessionId = generateSessionId(newCaseId);
        
        // Update case to show processing status
        updateCase(newCaseId, { fileSize: "Processing..." });
        
        const uploadResponse = await uploadUFDRFile(uploadedFile, sessionId);
        
        // Update case with upload results
        const fileSizeMB = (uploadedFile.size / (1024 * 1024)).toFixed(2);
        updateCase(newCaseId, { 
          fileSize: `${fileSizeMB} MB`,
          description: `${caseData.description}\n\nProcessed ${uploadResponse.chunks} chunks successfully.`
        });
        
        console.log("File uploaded successfully:", uploadResponse);
        
        // Store session ID for later use in chatbot
        localStorage.setItem(`case_${newCaseId}_session`, sessionId);
        
      } catch (error) {
        console.error("Upload failed:", error);
        updateCase(newCaseId, { 
          fileSize: "Upload failed",
          description: `${caseData.description}\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      } finally {
        setUploadedFile(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-800 to-blue-500 bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Welcome back! Here's an overview of your forensic analysis cases.
          </p>
        </div>

        {/* Stats Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Cases"
            value={stats.totalCases}
            icon={FolderOpen}
            description="All forensic cases"
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Ongoing Cases"
            value={stats.ongoingCases}
            icon={Clock}
            description="Currently active"
            trend={{ value: 5, isPositive: true }}
          />
          <StatsCard
            title="Completed Cases"
            value={stats.completedCases}
            icon={CheckCircle}
            description="Successfully closed"
            trend={{ value: 8, isPositive: true }}
          />
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
            New Analysis
          </h2>
          <UploadBox onFileUpload={handleFileUpload} onCaseCreated={handleCaseCreated} />
        </div>

        {/* Past Cases Section */}
        <div>
          <CaseList />
        </div>
      </div>
    </div>
  );
}
