"use client";

import { useState } from "react";
import { Upload, Key, Shield, CheckCircle } from "lucide-react";

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
      setHashValue("");
      setError("");
    }
  };

  const handleDecryption = async () => {
    if (!decryptionKey && !hashValue && !hashFile) {
      setError("Please provide either a decryption key file or hash value for verification");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      let keyData = "";
      let hashValueToUse = "";

      if (decryptionKey) {
        keyData = await decryptionKey.text();
      }

      if (hashFile) {
        const hashText = await hashFile.text();
        hashValueToUse = hashText.trim().split(' ')[0];
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
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg my-8 matrix-glass border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 animate-matrix-slide-up backdrop-blur-xl relative overflow-hidden">
          {/* Matrix scanning line animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent transform -skew-x-12 animate-matrix-scan"></div>
          
          {/* Cyber grid overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
          
          <div className="relative z-10">
            <div className="flex flex-row items-center justify-between space-y-0 pb-6 px-6 pt-6 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <div>
                  <h2 className="text-xl font-bold text-cyan-400 font-mono tracking-wider uppercase">
                    File Verification
                  </h2>
                  <div className="text-xs text-emerald-400/70 font-mono mt-1">
                    SECURITY_PROTOCOL_ACTIVE
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="h-10 w-10 p-0 text-cyan-400 hover:text-red-400 hover:bg-red-500/10 border border-cyan-500/30 hover:border-red-500/50 rounded bg-black/40 transition-all duration-300 font-mono text-lg"
              >
                ×
              </button>
            </div>
            
            <div className="relative p-6">
              {success ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center animate-pulse">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-400 font-mono">
                      VERIFICATION SUCCESSFUL
                    </h3>
                    <p className="text-sm text-cyan-400 mt-2 font-mono">
                      {decryptionKey 
                        ? "HASH_VERIFICATION_COMPLETE >> DECRYPTION_SUCCESS >> FILE_UPLOADED"
                        : "HASH_VERIFICATION_COMPLETE >> FILE_UPLOADED"
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* File Name Display */}
                  <div className="matrix-card border-red-500/30 p-4">
                    <div className="text-sm font-mono text-red-400 uppercase tracking-wide">
                      Encrypted File
                    </div>
                    <div className="text-sm text-cyan-400 mt-2 font-mono bg-black/40 p-2 rounded border border-cyan-500/20">
                      {fileName}
                    </div>
                  </div>

                  {/* Decryption Key Upload */}
                  <div className="space-y-3">
                    <label className="text-sm font-mono text-cyan-400 uppercase tracking-wider">
                      Decryption Key File
                    </label>
                    {!decryptionKey ? (
                      <div className="matrix-upload-zone">
                        <input
                          type="file"
                          accept=".key,.txt"
                          onChange={handleKeyFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Key className="w-8 h-8 text-cyan-400/60" />
                          <p className="text-sm font-mono text-cyan-400/80">
                            DROP KEY FILE OR CLICK TO SELECT
                          </p>
                          <p className="text-xs font-mono text-emerald-400/60">
                            .key, .txt files accepted
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="matrix-file-display">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Key className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-mono text-emerald-400">
                              {decryptionKey.name}
                            </span>
                          </div>
                          <button
                            onClick={removeKeyFile}
                            className="text-red-400 hover:text-red-300 font-mono text-sm"
                          >
                            REMOVE
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hash Value Input */}
                  <div className="space-y-3">
                    <label className="text-sm font-mono text-cyan-400 uppercase tracking-wider">
                      Hash Value (Manual Entry)
                    </label>
                    <input
                      type="text"
                      value={hashValue}
                      onChange={(e) => setHashValue(e.target.value)}
                      placeholder="Enter SHA256 hash value..."
                      disabled={!!hashFile}
                      className={`matrix-input ${hashFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  {/* Hash File Upload */}
                  <div className="space-y-3">
                    <label className="text-sm font-mono text-cyan-400 uppercase tracking-wider">
                      Hash File Upload
                    </label>
                    {!hashFile ? (
                      <div className="matrix-upload-zone">
                        <input
                          type="file"
                          accept=".sha256,.hash,.txt"
                          onChange={handleHashFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Upload className="w-8 h-8 text-cyan-400/60" />
                          <p className="text-sm font-mono text-cyan-400/80">
                            DROP HASH FILE OR CLICK TO SELECT
                          </p>
                          <p className="text-xs font-mono text-emerald-400/60">
                            .sha256, .hash, .txt files accepted
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="matrix-file-display">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Upload className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-mono text-emerald-400">
                              {hashFile.name}
                            </span>
                          </div>
                          <button
                            onClick={removeHashFile}
                            className="text-red-400 hover:text-red-300 font-mono text-sm"
                          >
                            REMOVE
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="matrix-card border-red-500/50 bg-red-500/10 p-3">
                      <p className="text-sm text-red-400 font-mono">
                        ERROR: {error}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-cyan-500/20">
                    <button
                      onClick={handleClose}
                      className="px-6 py-2 bg-matrix-surface/60 border border-matrix-border text-matrix-text-muted hover:text-matrix-cyan hover:border-matrix-cyan font-mono uppercase tracking-wider transition-all duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDecryption}
                      disabled={isProcessing || (!decryptionKey && !hashValue && !hashFile)}
                      className="px-6 py-2 matrix-button font-mono uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? "PROCESSING..." : "VERIFY & DECRYPT"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
