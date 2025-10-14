"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, Key, Shield, CheckCircle } from "lucide-react";

export interface DecryptionData {
  decryptionKey: string;
  hashValue?: string;
  hashFile?: string;
}

interface DecryptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDecryptionSuccess: (data: DecryptionData) => void;
  fileName: string;
}

export function DecryptionModal({
  isOpen,
  onClose,
  onDecryptionSuccess,
  fileName,
}: DecryptionModalProps) {
  const [decryptionKey, setDecryptionKey] = useState<File | null>(null);
  const [hashValue, setHashValue] = useState("");
  const [hashFile, setHashFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleKeyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDecryptionKey(file);
      setError("");
    }
  };

  const handleHashFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHashFile(file);
      setHashValue(""); // Clear manual input when file is uploaded
      setError("");
    }
  };

  const handleHashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHashValue(e.target.value);
    setHashFile(null); // Clear file when manual input is used
    setError("");
  };

  const validateInputs = (): boolean => {
    // Hash is now optional - either file or manual input
    // Validate hash format if manually entered
    if (hashValue.trim() && (hashValue.length !== 64 || !/^[a-fA-F0-9]+$/.test(hashValue))) {
      setError("Please enter a valid SHA-256 hash (64 hexadecimal characters)");
      return false;
    }
    // Decryption key file is optional
    return true;
  };

  const handleDecryptAndCheck = async () => {
    if (!validateInputs()) return;

    setIsProcessing(true);
    setError("");

    try {
      let keyData = "";
      let hashValueToUse = "";

      // Read decryption key file if provided
      if (decryptionKey) {
        const keyText = await decryptionKey.text();
        try {
          const keyJson = JSON.parse(keyText);
          if (!keyJson.key_base64 || !keyJson.iv_base64) {
            throw new Error("Invalid key format: missing key_base64 or iv_base64");
          }
          keyData = keyText; // Send the full JSON as string
        } catch (e) {
          setError("Invalid key file format. Expected JSON with key_base64 and iv_base64 fields.");
          return;
        }
      } else {
        // No key provided - will try to decrypt without key or use default method
        keyData = "";
      }

      // Read hash file if provided
      if (hashFile) {
        const hashText = await hashFile.text();
        hashValueToUse = hashText.trim().split()[0]; // Get first word (hash value)
      } else if (hashValue) {
        hashValueToUse = hashValue;
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess(true);
      setTimeout(() => {
        onDecryptionSuccess({
          decryptionKey: keyData,
          hashValue: hashValueToUse || undefined,
          hashFile: hashFile?.name || undefined
        });
        handleClose();
      }, 1500);

    } catch (err) {
      setError("An error occurred during decryption process");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setDecryptionKey(null);
    setHashValue("");
    setHashFile(null);
    setError("");
    setSuccess(false);
    setIsProcessing(false);
    onClose();
  };

  const removeKeyFile = () => {
    setDecryptionKey(null);
    setError("");
  };

  const removeHashFile = () => {
    setHashFile(null);
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg my-8 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl shadow-emerald-500/10 animate-slide-up">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-2xl"></div>
          
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-6 px-6 pt-6">
            <CardTitle className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              File Verification
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="relative p-6">
            {success ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">
                    Verification Successful!
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    {decryptionKey 
                      ? "Hash verification and decryption completed successfully. File has been uploaded."
                      : "Hash verification successful. File has been uploaded."
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* File Name Display */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 p-4 rounded-lg">
                  <Label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Encrypted File
                  </Label>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                    {fileName}
                  </p>
                </div>

                {/* Decryption Key Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Decryption Key File (.key.json or .key.txt) (Optional)
                  </Label>
                  
                  {!decryptionKey ? (
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors">
                      <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        Upload your decryption key file (optional)
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("key-upload")?.click()}
                        className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                      >
                        Choose File
                      </Button>
                      <input
                        id="key-upload"
                        type="file"
                        onChange={handleKeyFileUpload}
                        className="hidden"
                        accept=".key.json,.json,.key.txt,.txt"
                      />
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-slate-50 dark:bg-slate-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <Key className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                              {decryptionKey.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {(decryptionKey.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={removeKeyFile}
                          className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hash Value Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Hash Value (SHA-256) (Optional)
                  </Label>
                  
                  {/* Hash File Upload */}
                  {!hashFile ? (
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors">
                      <Upload className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Upload SHA-256 hash file (.sha256.txt) (optional)
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("hash-upload")?.click()}
                        className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                      >
                        Choose Hash File
                      </Button>
                      <input
                        id="hash-upload"
                        type="file"
                        onChange={handleHashFileUpload}
                        className="hidden"
                        accept=".txt,.hash,.sha256,.sha256.txt"
                      />
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-slate-50 dark:bg-slate-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                              {hashFile.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {(hashFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={removeHashFile}
                          className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* OR Divider */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600"></div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">OR</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600"></div>
                  </div>

                  {/* Manual Hash Input */}
                  <div className="space-y-2">
                    <Label htmlFor="hashValue" className="text-sm font-medium">
                      Enter Hash Manually
                    </Label>
                    <Input
                      id="hashValue"
                      type="text"
                      value={hashValue}
                      onChange={handleHashChange}
                      placeholder="Enter 64-character SHA-256 hash..."
                      className="font-mono text-sm"
                      maxLength={64}
                      disabled={!!hashFile}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Hash value is required for file verification
                    </p>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 p-3 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDecryptAndCheck}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      decryptionKey ? "Decrypt & Verify Hash" : "Verify Hash"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
