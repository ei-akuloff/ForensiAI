"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, Database, Eye, CheckCircle } from "lucide-react";
import { uploadUFDRFile, listUFDRContents, generateSessionId } from "@/lib/backend-service";

interface UFDRFile {
  name: string;
  type: string;
  size: number;
  path: string;
  directory: string;
}

interface UFDRUploadBoxProps {
  onUploadSuccess?: (sessionId: string, fileCount: number) => void;
  onUploadError?: (error: string) => void;
}

export function UFDRUploadBox({ onUploadSuccess, onUploadError }: UFDRUploadBoxProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedFiles, setExtractedFiles] = useState<UFDRFile[]>([]);
  const [error, setError] = useState<string>("");
  const [isListing, setIsListing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showContents, setShowContents] = useState(false);

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
    if (!file.name.toLowerCase().endsWith('.ufdr') && !file.name.toLowerCase().endsWith('.ufdr.enc')) {
      setError("Only UFDR (.ufdr) and encrypted UFDR (.ufdr.enc) files are allowed");
      return false;
    }

    // Check file size (optional - 500MB limit for UFDR files)
    if (file.size > 500 * 1024 * 1024) {
      setError("File size must be less than 500MB");
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
          setExtractedFiles([]);
          setShowContents(false);
        }
      }
    },
    []
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setUploadedFile(file);
        setExtractedFiles([]);
        setShowContents(false);
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setExtractedFiles([]);
    setShowContents(false);
    setError("");
  };

  const listContents = async () => {
    if (!uploadedFile) return;

    setIsListing(true);
    setError("");

    try {
      const response = await listUFDRContents(uploadedFile);
      setExtractedFiles(response.files);
      setShowContents(true);
      console.log("UFDR contents:", response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to list contents";
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsListing(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile) {
      setError("Please select a UFDR file to upload");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const sessionId = generateSessionId("ufdr_upload");
      const response = await uploadUFDRFile(uploadedFile, sessionId);

      console.log("UFDR upload successful:", response);
      onUploadSuccess?.(sessionId, extractedFiles.length || 0);
      
      // Clear uploaded file after successful upload
      setUploadedFile(null);
      setExtractedFiles([]);
      setShowContents(false);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case "calls":
        return "📞";
      case "contacts":
        return "👥";
      case "locations":
        return "📍";
      case "manifest":
        return "📋";
      case "whatsapp_chat":
        return "💬";
      case "telegram_chat":
        return "✈️";
      default:
        return "📄";
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case "calls":
        return "text-blue-600 bg-blue-100";
      case "contacts":
        return "text-green-600 bg-green-100";
      case "locations":
        return "text-red-600 bg-red-100";
      case "manifest":
        return "text-purple-600 bg-purple-100";
      case "whatsapp_chat":
        return "text-emerald-600 bg-emerald-100";
      case "telegram_chat":
        return "text-cyan-600 bg-cyan-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <Card className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 overflow-hidden">
      {/* Gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <CardContent className="relative p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Database className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-300">
              Upload UFDR File
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Upload forensic data archive containing JSON files
            </p>
          </div>

          {!uploadedFile ? (
            <div
              className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ${
                dragActive
                  ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 scale-[1.02]"
                  : "border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-gradient-to-br hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-900/10 dark:hover:to-teal-900/10"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="p-3 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full">
                  <Upload className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
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
                  className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                  onClick={() =>
                    document.getElementById("ufdr-file-upload")?.click()
                  }
                >
                  Select UFDR File
                </Button>

                <input
                  id="ufdr-file-upload"
                  type="file"
                  accept=".ufdr,.ufdr.enc"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info */}
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

              {/* Contents Preview */}
              {showContents && extractedFiles.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700/50">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-3">
                    Contents ({extractedFiles.length} files)
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {extractedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getFileTypeIcon(file.type)}</span>
                          <div>
                            <p className="text-xs font-medium text-gray-900 dark:text-slate-100">
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {file.directory && `${file.directory}/`}{file.type} • {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${getFileTypeColor(file.type)}`}>
                          {file.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!showContents ? (
                  <Button
                    onClick={listContents}
                    disabled={isListing}
                    variant="outline"
                    className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {isListing ? "Analyzing..." : "Preview Contents"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isUploading ? "Processing..." : `Upload & Process ${extractedFiles.length} Files`}
                  </Button>
                )}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {error}
            </p>
          )}

          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>UFDR files contain multiple JSON files including:</p>
            <p>Calls, Contacts, Locations, WhatsApp/Telegram chats</p>
            <p>Maximum file size: 500MB</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
