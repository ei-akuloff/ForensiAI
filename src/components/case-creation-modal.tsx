"use client";

import { useState } from "react";

export interface CaseFormData {
  caseNo: string;
  leadInvestigator: string;
  caseTitle: string;
  department: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  caseType: "Mobile Device" | "Computer Forensics" | "Network Analysis" | "Digital Evidence" | "Cloud Storage" | "Other";
  description: string;
  fileName: string;
}

interface CaseCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CaseFormData) => void;
  fileName: string;
}

export function CaseCreationModal({ isOpen, onClose, onSubmit, fileName }: CaseCreationModalProps) {
  const [formData, setFormData] = useState<CaseFormData>({
    caseNo: "",
    leadInvestigator: "",
    caseTitle: fileName.includes('.ufdr.enc') ? 'Encrypted UFDR Analysis' : 'UFDR Forensic Analysis',
    department: "Digital Forensics",
    priority: "Medium",
    caseType: "Mobile Device",
    description: fileName.includes('.ufdr.enc') ? 
      `Forensic analysis of encrypted UFDR file: ${fileName}` : 
      `Forensic analysis of UFDR file: ${fileName}`,
    fileName: fileName
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CaseFormData, string>>>({});

  const handleChange = (field: keyof CaseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof CaseFormData, string>> = {};
    
    if (!formData.caseNo.trim()) newErrors.caseNo = "Case number is required";
    if (!formData.leadInvestigator.trim()) newErrors.leadInvestigator = "Lead investigator is required";
    if (!formData.caseTitle.trim()) newErrors.caseTitle = "Case title is required";
    if (!formData.department.trim()) newErrors.department = "Department is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      handleCancel();
    }
  };

  const handleCancel = () => {
    onClose();
    // Reset form with pre-filled values
    setFormData({
      caseNo: "",
      leadInvestigator: "",
      caseTitle: fileName.includes('.ufdr.enc') ? 'Encrypted UFDR Analysis' : 'UFDR Forensic Analysis',
      department: "Digital Forensics",
      priority: "Medium",
      caseType: "Mobile Device",
      description: fileName.includes('.ufdr.enc') ? 
        `Forensic analysis of encrypted UFDR file: ${fileName}` : 
        `Forensic analysis of UFDR file: ${fileName}`,
      fileName: fileName
    });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="matrix-modal-overlay fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="matrix-modal matrix-form-visible w-full max-w-2xl my-8 matrix-glass border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/30 animate-matrix-slide-up backdrop-blur-xl relative overflow-hidden">
          {/* Matrix scanning line animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent transform -skew-x-12 animate-matrix-scan"></div>
          
          {/* Cyber grid overlay */}
          <div className="absolute inset-0 opacity-15" style={{
            backgroundImage: 'linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
          
          <div className="relative z-10">
            <div className="flex flex-row items-center justify-between space-y-0 pb-6 px-6 pt-6 border-b border-cyan-500/20">
              <div>
                <h2 className="text-xl font-bold text-cyan-400 font-mono tracking-wider uppercase">
                  [[ Create New Case ]]
                </h2>
                <div className="text-xs text-emerald-400/70 font-mono mt-1">
                  FORENSIC_PROTOCOL_INITIALIZED
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="h-10 w-10 p-0 text-cyan-400 hover:text-red-400 hover:bg-red-500/10 border border-cyan-500/30 hover:border-red-500/50 rounded bg-black/40 transition-all duration-300 font-mono text-lg"
              >
                ×
              </button>
            </div>

            <div className="relative p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Name Display */}
                <div className="matrix-card border-emerald-500/30 p-4">
                  <div className="text-sm font-mono text-emerald-400 uppercase tracking-wide">
                    [[ Uploaded File ]]
                  </div>
                  <div className="text-sm text-cyan-400 mt-2 font-mono bg-black/40 p-2 rounded border border-cyan-500/20">
                    {fileName}
                  </div>
                </div>

                {/* Case Number */}
                <div className="space-y-2">
                  <label htmlFor="caseNo" className="text-sm font-mono text-cyan-400 uppercase tracking-wider">
                    [[ Case Number * ]]
                  </label>
                  <input
                    id="caseNo"
                    type="text"
                    value={formData.caseNo}
                    onChange={(e) => handleChange("caseNo", e.target.value)}
                    placeholder="e.g., 2024-001"
                    className={`matrix-input ${errors.caseNo ? "border-red-500 shadow-red-500/20" : ""}`}
                  />
                  {errors.caseNo && (
                    <p className="text-sm text-red-400 font-mono">{errors.caseNo}</p>
                  )}
                </div>

                {/* Lead Investigator */}
                <div className="space-y-2">
                  <label htmlFor="leadInvestigator" className="text-sm font-mono text-cyan-400 uppercase tracking-wider">
                    [[ Lead Investigator * ]]
                  </label>
                  <input
                    id="leadInvestigator"
                    type="text"
                    value={formData.leadInvestigator}
                    onChange={(e) => handleChange("leadInvestigator", e.target.value)}
                    placeholder="e.g., Agent Smith"
                    className={`matrix-input ${errors.leadInvestigator ? "border-red-500 shadow-red-500/20" : ""}`}
                  />
                  {errors.leadInvestigator && (
                    <p className="text-sm text-red-400 font-mono">{errors.leadInvestigator}</p>
                  )}
                </div>

                {/* Case Title */}
                <div className="space-y-2">
                  <label htmlFor="caseTitle" className="text-sm font-mono text-cyan-400 uppercase tracking-wider">
                    [[ Case Title * ]]
                  </label>
                  <input
                    id="caseTitle"
                    type="text"
                    value={formData.caseTitle}
                    onChange={(e) => handleChange("caseTitle", e.target.value)}
                    placeholder="e.g., Mobile Device Analysis"
                    className={`matrix-input ${errors.caseTitle ? "border-red-500 shadow-red-500/20" : ""}`}
                  />
                  {errors.caseTitle && (
                    <p className="text-sm text-red-400 font-mono">{errors.caseTitle}</p>
                  )}
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <label htmlFor="department" className="text-sm font-mono text-cyan-400 uppercase tracking-wider">
                    [[ Department * ]]
                  </label>
                  <input
                    id="department"
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleChange("department", e.target.value)}
                    placeholder="e.g., Cybercrime Unit"
                    className={`matrix-input ${errors.department ? "border-red-500 shadow-red-500/20" : ""}`}
                  />
                  {errors.department && (
                    <p className="text-sm text-red-400 font-mono">{errors.department}</p>
                  )}
                </div>

                {/* Priority and Case Type Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Priority */}
                  <div className="space-y-2">
                    <label htmlFor="priority" className="text-sm font-mono text-cyan-400 uppercase tracking-wider">
                      [[ Priority ]]
                    </label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => handleChange("priority", e.target.value as CaseFormData["priority"])}
                      className="matrix-select"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  {/* Case Type */}
                  <div className="space-y-2">
                    <label htmlFor="caseType" className="text-sm font-mono text-cyan-400 uppercase tracking-wider">
                      [[ Case Type ]]
                    </label>
                    <select
                      id="caseType"
                      value={formData.caseType}
                      onChange={(e) => handleChange("caseType", e.target.value as CaseFormData["caseType"])}
                      className="matrix-select"
                    >
                      <option value="Mobile Device">Mobile Device</option>
                      <option value="Computer Forensics">Computer Forensics</option>
                      <option value="Network Analysis">Network Analysis</option>
                      <option value="Digital Evidence">Digital Evidence</option>
                      <option value="Cloud Storage">Cloud Storage</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-mono text-cyan-400 uppercase tracking-wider">
                    [[ Description * ]]
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Provide a detailed description of the case..."
                    rows={4}
                    className={`matrix-textarea ${
                      errors.description ? "border-red-500 shadow-red-500/20" : ""
                    }`}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-400 font-mono">{errors.description}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-cyan-500/20">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2 bg-black/60 border border-gray-500/50 text-gray-300 hover:text-white hover:border-gray-300 font-mono uppercase tracking-wider transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 matrix-button font-mono uppercase tracking-wider"
                  >
                    Create Case
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
