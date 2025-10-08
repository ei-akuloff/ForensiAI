"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X } from "lucide-react";
import { CaseCreationModal, CaseFormData } from "./case-creation-modal";

interface UploadBoxProps {
  onFileUpload?: (file: File) => void;
  onCaseCreated?: (caseData: CaseFormData) => void;
}

export function UploadBox({ onFileUpload, onCaseCreated }: UploadBoxProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [showCaseModal, setShowCaseModal] = useState(false);

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
    const validExtensions = [".ufdr"];
    const fileExtension = file.name
      .toLowerCase()
      .slice(file.name.lastIndexOf("."));

    if (!validExtensions.includes(fileExtension)) {
      setError("Only UFDR (.ufdr) files are allowed");
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
          // Open case creation modal for .ufdr files
          setShowCaseModal(true);
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
        // Open case creation modal for .ufdr files
        setShowCaseModal(true);
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setError("");
  };

  const handleCaseCreated = (caseData: CaseFormData) => {
    onCaseCreated?.(caseData);
    setShowCaseModal(false);
  };

  const handleModalClose = () => {
    setShowCaseModal(false);
    // Don't remove the file when modal is cancelled, just close the modal
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Upload UFDR File
          </h3>

          {!uploadedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                dragActive
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="p-3 bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-full">
                  <Upload className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    Drag and drop your UFDR file here
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    or click to browse
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                >
                  Select File
                </Button>

                <input
                  id="file-upload"
                  type="file"
                  accept=".ufdr"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatFileSize(uploadedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeFile}
                  className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {error}
            </p>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Only UFDR (.ufdr) files are allowed
          </p>
        </div>
      </CardContent>

      {/* Case Creation Modal */}
      <CaseCreationModal
        isOpen={showCaseModal}
        onClose={handleModalClose}
        onCreateCase={handleCaseCreated}
        fileName={uploadedFile?.name || ""}
      />
    </Card>
  );
}
