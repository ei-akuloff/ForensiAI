"use client";

import { StatsCard } from "@/components/stats-card";
import { UploadBox } from "@/components/upload-box";
import { CaseList } from "@/components/case-list";
import { useCases } from "@/components/case-context";
import { CaseFormData } from "@/components/case-creation-modal";
import { DecryptionData } from "@/components/decryption-modal";
import { FolderOpen, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { uploadUFDRFile, uploadEncryptedUFDRFile, generateSessionId } from "@/lib/backend-service";
import { useState } from "react";

export default function DashboardPage() {
  const { cases, addCase, updateCase } = useCases();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [decryptionData, setDecryptionData] = useState<DecryptionData | null>(null);

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
        
        let uploadResponse;
        
        // Check if it's an encrypted file
        if (uploadedFile.name.toLowerCase().endsWith('.ufdr.enc')) {
          // For encrypted files, use stored decryption data
          if (decryptionData) {
            uploadResponse = await uploadEncryptedUFDRFile(uploadedFile, sessionId, decryptionData.decryptionKey || "", decryptionData.hashValue);
          } else {
            throw new Error("Decryption data not found for encrypted file");
          }
        } else {
          // For regular UFDR files
          uploadResponse = await uploadUFDRFile(uploadedFile, sessionId);
        }
        
        // Update case with upload results
        const fileSizeMB = (uploadedFile.size / (1024 * 1024)).toFixed(2);
        const isEncrypted = uploadedFile.name.toLowerCase().endsWith('.ufdr.enc');
        const decryptionInfo = isEncrypted && decryptionData ? 
          `\nDecryption: ${decryptionData.decryptionKey ? 'Key provided' : 'No key'}, Hash: ${decryptionData.hashValue ? 'Verified' : 'Not provided'}` : '';
        
        updateCase(newCaseId, { 
          fileSize: `${fileSizeMB} MB`,
          fileName: uploadedFile.name,
          description: `${caseData.description}\n\nFile: ${uploadedFile.name}${decryptionInfo}\nProcessed ${uploadResponse.chunks} chunks successfully.\nSession ID: ${sessionId}`,
          status: "ongoing"
        });
        
        console.log("File uploaded successfully:", uploadResponse);
        
        // Store session ID for later use in chatbot
        localStorage.setItem(`case_${newCaseId}_session`, sessionId);
        
        // Show success message and redirect to case page
        alert(`UFDR file processed successfully! ${uploadResponse.chunks} chunks created. Redirecting to case page...`);
        
        // Redirect to case page after a short delay
        setTimeout(() => {
          window.location.href = `/cases/${newCaseId}`;
        }, 2000);
        
      } catch (error) {
        console.error("Upload failed:", error);
        updateCase(newCaseId, { 
          fileSize: "Upload failed",
          description: `${caseData.description}\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      } finally {
        setUploadedFile(null);
        setDecryptionData(null);
      }
    }
  };

  const handleDecryptionSuccess = async (decryptionData: DecryptionData) => {
    console.log("Decryption successful:", decryptionData);
    // Store decryption data for later use when case is created
    setDecryptionData(decryptionData);
  };

  const handleAddToExistingCase = async (caseId: string, file: File, decryptionData?: DecryptionData) => {
    try {
      const sessionId = generateSessionId(caseId);
      
      // Update case to show processing status
      updateCase(caseId, { fileSize: "Processing..." });
      
      let uploadResponse;
      
      // Check if it's an encrypted file
      if (file.name.toLowerCase().endsWith('.ufdr.enc')) {
        // For encrypted files, use stored decryption data
        if (decryptionData) {
          uploadResponse = await uploadEncryptedUFDRFile(file, sessionId, decryptionData.decryptionKey || "", decryptionData.hashValue);
        } else {
          throw new Error("Decryption data not found for encrypted file");
        }
      } else {
        // For regular UFDR files
        uploadResponse = await uploadUFDRFile(file, sessionId);
      }
      
      // Update case with upload results
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const isEncrypted = file.name.toLowerCase().endsWith('.ufdr.enc');
      const decryptionInfo = isEncrypted && decryptionData ? 
        `\nDecryption: ${decryptionData.decryptionKey ? 'Key provided' : 'No key'}, Hash: ${decryptionData.hashValue ? 'Verified' : 'Not provided'}` : '';
      
      // Get current case data
      const currentCase = getCaseById(caseId);
      const updatedDescription = currentCase ? 
        `${currentCase.description}\n\n--- Additional UFDR File ---\nFile: ${file.name}${decryptionInfo}\nProcessed ${uploadResponse.chunks} chunks successfully.\nSession ID: ${sessionId}` :
        `Additional UFDR file: ${file.name}${decryptionInfo}\nProcessed ${uploadResponse.chunks} chunks successfully.\nSession ID: ${sessionId}`;
      
      updateCase(caseId, { 
        fileSize: `${fileSizeMB} MB`,
        fileName: file.name,
        description: updatedDescription,
        status: "ongoing"
      });
      
      console.log("File added to existing case successfully:", uploadResponse);
      
      // Store session ID for later use in chatbot
      localStorage.setItem(`case_${caseId}_session`, sessionId);
      
      // Show success message
      alert(`UFDR file added to case successfully! ${uploadResponse.chunks} chunks created.`);
      
    } catch (error) {
      console.error("Upload failed:", error);
      updateCase(caseId, { 
        fileSize: "Upload failed",
        description: `Error adding file: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setUploadedFile(null);
      setDecryptionData(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-green-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900/50 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(34,197,94,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_40%,rgba(34,197,94,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(16,185,129,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_60%,rgba(16,185,129,0.1),transparent_50%)]"></div>
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                Welcome back! Here's an overview of your forensic analysis cases.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 animate-slide-up" style={{animationDelay: '0.1s'}}>
          <StatsCard
            title="Total Cases"
            value={stats.totalCases}
            icon={FolderOpen}
            description="All forensic cases managed"
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Ongoing Cases"
            value={stats.ongoingCases}
            icon={Clock}
            description="Currently under investigation"
            trend={{ value: 5, isPositive: true }}
          />
          <StatsCard
            title="Completed Cases"
            value={stats.completedCases}
            icon={CheckCircle}
            description="Successfully resolved"
            trend={{ value: 8, isPositive: true }}
          />
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-6">
            Upload Forensic Data
          </h2>
          
          <div className="max-w-2xl mx-auto">
            <UploadBox
              onFileUpload={handleFileUpload}
              onCaseCreated={handleCaseCreated}
              onAddToExistingCase={handleAddToExistingCase}
              onDecryptionSuccess={handleDecryptionSuccess}
            />
          </div>
        </div>

        {/* Past Cases Section */}
        <div>
          <CaseList />
        </div>
      </div>
    </div>
  );
}
