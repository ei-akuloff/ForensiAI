"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X } from "lucide-react";
import { CaseCreationModal, CaseFormData } from "./case-creation-modal";
import { DecryptionModal, DecryptionData } from "./decryption-modal";
import { CaseSelectionModal } from "./case-selection-modal";

interface UploadBoxProps {
  onFileUpload?: (file: File) => void;
  onCaseCreated?: (caseData: CaseFormData) => void;
  onAddToExistingCase?: (caseId: string, file: File, decryptionData?: DecryptionData) => void;
  onDecryptionSuccess?: (data: DecryptionData) => void;
}

export function UploadBox({ onFileUpload, onCaseCreated, onAddToExistingCase, onDecryptionSuccess }: UploadBoxProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showDecryptionModal, setShowDecryptionModal] = useState(false);
  const [showCaseSelectionModal, setShowCaseSelectionModal] = useState(false);
  const [caseData, setCaseData] = useState<CaseFormData | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    
    // Check if file ends with .ufdr or .ufdr.enc
    const isValidUFDR = fileName.endsWith('.ufdr');
    const isValidEncryptedUFDR = fileName.endsWith('.ufdr.enc');
    
    if (!isValidUFDR && !isValidEncryptedUFDR) {
      setError("Only UFDR (.ufdr) and encrypted UFDR (.ufdr.enc) files are allowed");
      return false;
    }

    // Check file size (optional - 100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      setError("File size must be less than 100MB");
      return false;
    }

    setError("");
    return true;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (validateFile(file)) {
          setUploadedFile(file);
          onFileUpload?.(file);
          // Check if it's an encrypted file
          if (file.name.toLowerCase().endsWith('.ufdr.enc')) {
            // For encrypted files, show decryption modal first
            setShowDecryptionModal(true);
          } else {
            // For regular .ufdr files, show case selection modal
            setShowCaseSelectionModal(true);
          }
        }
      }
    },
    [onFileUpload]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (validateFile(file)) {
          setUploadedFile(file);
          onFileUpload?.(file);
          // Check if it's an encrypted file
          if (file.name.toLowerCase().endsWith('.ufdr.enc')) {
            // For encrypted files, show decryption modal first
            setShowDecryptionModal(true);
          } else {
            // For regular .ufdr files, show case selection modal
            setShowCaseSelectionModal(true);
          }
        }
      }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setError("");
  };

  const handleCaseCreated = (formData: CaseFormData) => {
    setCaseData(formData);
    setShowCaseModal(false);
    // Do NOT open decryption modal here; decryption (if needed) happens before case creation
    onCaseCreated?.(formData);
  };

  const handleDecryptionSuccess = (decryptionData: DecryptionData) => {
    // Store decryption data for later use
    onDecryptionSuccess?.(decryptionData);
    setShowDecryptionModal(false);
    // After successful decryption, show case selection modal
    setShowCaseSelectionModal(true);
  };

  const handleModalClose = () => {
    setShowCaseModal(false);
    // Don't remove the file when modal is cancelled, just close the modal
  };

  const handleDecryptionModalClose = () => {
    setShowDecryptionModal(false);
  };

  const handleCaseSelectionClose = () => {
    setShowCaseSelectionModal(false);
  };

  const handleSelectExistingCase = (caseId: string) => {
    setShowCaseSelectionModal(false);
    if (uploadedFile) {
      onAddToExistingCase?.(caseId, uploadedFile);
    }
  };

  const handleCreateNewCase = () => {
    setShowCaseSelectionModal(false);
    setShowCaseModal(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="group matrix-panel matrix-hover relative overflow-hidden">
      {/* Matrix scanning line animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent transform -skew-x-12 animate-matrix-scan"></div>
      
      {/* Cyber grid overlay */}
      <div className="absolute inset-0 opacity-15" style={{
        backgroundImage: 'linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)',
        backgroundSize: '30px 30px'
      }}></div>
      
      <CardContent className="relative z-10 p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-matrix-cyan/20 to-matrix-emerald/20 rounded-2xl flex items-center justify-center group-hover:scale-110 matrix-glow-cyan transition-all duration-300">
              <Upload className="w-8 h-8 text-matrix-cyan animate-pulse" />
            </div>
            <h3 className="text-xl font-bold matrix-text-primary font-orbitron tracking-wide uppercase group-hover:text-matrix-emerald transition-colors duration-300">
              Upload UFDR File
            </h3>
            <p className="text-sm matrix-text-muted font-space-mono">
              DRAG AND DROP YOUR FORENSIC DATA FILE OR CLICK TO BROWSE
            </p>
          </div>

          {!uploadedFile ? (
            <div
              className={`matrix-upload-zone relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ${
                dragActive
                  ? "border-matrix-cyan bg-gradient-to-br from-matrix-cyan/10 to-matrix-emerald/10 scale-[1.02] matrix-glow-cyan"
                  : "border-matrix-border hover:border-matrix-cyan hover:bg-gradient-to-br hover:from-matrix-cyan/5 hover:to-matrix-emerald/5"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="p-3 bg-gradient-to-r from-matrix-cyan/20 to-matrix-emerald/20 rounded-full matrix-glow-cyan">
                  <Upload className="h-8 w-8 text-matrix-cyan animate-pulse" />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium matrix-text-primary font-space-mono">
                    DRAG AND DROP YOUR UFDR FILE HERE
                  </p>
                  <p className="text-xs matrix-text-muted font-space-mono">
                    OR CLICK TO BROWSE
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="matrix-button border-matrix-cyan text-matrix-cyan hover:bg-matrix-cyan/10 font-space-mono"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                >
                  SELECT FILE
                </Button>

                <input
                  id="file-upload"
                  type="file"
                  accept=".ufdr,.ufdr.enc"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="matrix-file-display border border-matrix-border rounded-lg p-4 bg-matrix-surface/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-matrix-emerald/20 rounded-lg matrix-glow-green">
                    <FileText className="h-5 w-5 text-matrix-emerald" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium matrix-text-primary font-space-mono">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs matrix-text-muted font-space-mono">
                      {formatFileSize(uploadedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeFile}
                  className="h-8 w-8 p-0 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-500/20 border border-red-500/50 p-3 rounded font-space-mono matrix-glow-red">
              {error}
            </p>
          )}

          <p className="text-xs matrix-text-muted font-space-mono">
            ONLY UFDR (.ufdr) AND ENCRYPTED UFDR (.ufdr.enc) FILES ARE ALLOWED
          </p>
        </div>
      </CardContent>

      {/* Case Creation Modal */}
      <CaseCreationModal
        isOpen={showCaseModal}
        onClose={handleModalClose}
        onSubmit={handleCaseCreated}
        fileName={uploadedFile?.name || ""}
      />

      {/* Decryption Modal */}
      <DecryptionModal
        isOpen={showDecryptionModal}
        onClose={handleDecryptionModalClose}
        onDecryptionSuccess={handleDecryptionSuccess}
        fileName={uploadedFile?.name || ""}
      />

      {/* Case Selection Modal */}
      <CaseSelectionModal
        isOpen={showCaseSelectionModal}
        onClose={handleCaseSelectionClose}
        onSelectCase={handleSelectExistingCase}
        onCreateNew={handleCreateNewCase}
        fileName={uploadedFile?.name || ""}
      />
    </Card>
  );
}
