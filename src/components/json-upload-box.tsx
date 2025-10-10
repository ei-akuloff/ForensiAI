"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, Database } from "lucide-react";
import { uploadSingleJsonFile, uploadMultipleJsonFiles, generateSessionId } from "@/lib/backend-service";

interface JsonUploadBoxProps {
  onUploadSuccess?: (sessionId: string, fileCount: number) => void;
  onUploadError?: (error: string) => void;
}

export function JsonUploadBox({ onUploadSuccess, onUploadError }: JsonUploadBoxProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFiles = (files: FileList | File[]): File[] => {
    const validFiles: File[] = [];
    const validExtensions = [".json"];
    const maxSize = 100 * 1024 * 1024; // 100MB

    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      const fileExtension = file.name
        .toLowerCase()
        .slice(file.name.lastIndexOf("."));

      if (!validExtensions.includes(fileExtension)) {
        setError(`File ${file.name} is not a valid JSON file`);
        return [];
      }

      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Maximum size is 100MB`);
        return [];
      }

      validFiles.push(file);
    }

    setError("");
    return validFiles;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const validFiles = validateFiles(e.dataTransfer.files);
        if (validFiles.length > 0) {
          setUploadedFiles(validFiles);
        }
      }
    },
    []
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = validateFiles(e.target.files);
      if (validFiles.length > 0) {
        setUploadedFiles(validFiles);
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    if (newFiles.length === 0) {
      setError("");
    }
  };

  const removeAllFiles = () => {
    setUploadedFiles([]);
    setError("");
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      setError("Please select at least one file to upload");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const sessionId = generateSessionId("json_upload");
      
      let response;
      if (uploadedFiles.length === 1) {
        // Single file upload
        response = await uploadSingleJsonFile(uploadedFiles[0], sessionId);
      } else {
        // Multiple file upload
        response = await uploadMultipleJsonFiles(uploadedFiles, sessionId);
      }

      console.log("Upload successful:", response);
      onUploadSuccess?.(response.session_id, uploadedFiles.length);
      
      // Clear uploaded files after successful upload
      setUploadedFiles([]);
      
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

  const getFileTypeLabel = (filename: string): string => {
    const name = filename.toLowerCase();
    if (name.includes("call")) return "Call Records";
    if (name.includes("contact")) return "Contacts";
    if (name.includes("location")) return "Location Data";
    if (name.includes("manifest")) return "Manifest";
    if (name.includes("wa_chat") || name.includes("whatsapp")) return "WhatsApp Chat";
    if (name.includes("tg_chat") || name.includes("telegram")) return "Telegram Chat";
    return "JSON Data";
  };

  return (
    <Card className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
      {/* Gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <CardContent className="relative p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300">
              Upload Forensic Data
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Upload JSON files (calls, contacts, locations, chats)
            </p>
          </div>

          {uploadedFiles.length === 0 ? (
            <div
              className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ${
                dragActive
                  ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 scale-[1.02]"
                  : "border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full">
                  <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    Drag and drop your JSON files here
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    or click to browse (multiple files supported)
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                  onClick={() =>
                    document.getElementById("json-file-upload")?.click()
                  }
                >
                  Select Files
                </Button>

                <input
                  id="json-file-upload"
                  type="file"
                  accept=".json"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  Selected Files ({uploadedFiles.length})
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeAllFiles}
                  className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Clear All
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-slate-50 dark:bg-slate-700/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {getFileTypeLabel(file.name)} • {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUploading ? "Uploading..." : `Upload ${uploadedFiles.length} File${uploadedFiles.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {error}
            </p>
          )}

          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>Supported: calls.json, contacts.json, locations.json, manifest.json</p>
            <p>WhatsApp chats (WA_Chat_*.json), Telegram chats (TG_Chat_*.json)</p>
            <p>Maximum file size: 100MB per file</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
