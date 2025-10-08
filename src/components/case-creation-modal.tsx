"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

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
  onCreateCase: (caseData: CaseFormData) => void;
  fileName: string;
}

export function CaseCreationModal({
  isOpen,
  onClose,
  onCreateCase,
  fileName
}: CaseCreationModalProps) {
  const [formData, setFormData] = useState<CaseFormData>({
    caseNo: "",
    leadInvestigator: "",
    caseTitle: "",
    department: "",
    priority: "Medium",
    caseType: "Other",
    description: "",
    fileName: fileName
  });

  const [errors, setErrors] = useState<Partial<CaseFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CaseFormData> = {};

    if (!formData.caseNo.trim()) {
      newErrors.caseNo = "Case number is required";
    }
    if (!formData.leadInvestigator.trim()) {
      newErrors.leadInvestigator = "Lead investigator is required";
    }
    if (!formData.caseTitle.trim()) {
      newErrors.caseTitle = "Case title is required";
    }
    if (!formData.department.trim()) {
      newErrors.department = "Department is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onCreateCase({ ...formData, fileName });
      onClose();
      // Reset form
      setFormData({
        caseNo: "",
        leadInvestigator: "",
        caseTitle: "",
        department: "",
        priority: "Medium",
        caseType: "Other",
        description: "",
        fileName: fileName
      });
      setErrors({});
    }
  };

  const handleChange = (field: keyof CaseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCancel = () => {
    onClose();
    // Reset form
    setFormData({
      caseNo: "",
      leadInvestigator: "",
      caseTitle: "",
      department: "",
      priority: "Medium",
      caseType: "Other",
      description: "",
      fileName: fileName
    });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-slate-800 shadow-xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold bg-gradient-to-r from-indigo-800 to-blue-500 bg-clip-text text-transparent">
            Create New Case
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Name Display */}
            <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Uploaded File
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {fileName}
              </p>
            </div>

            {/* Case Number */}
            <div className="space-y-2">
              <Label htmlFor="caseNo" className="text-sm font-medium">
                Case Number *
              </Label>
              <Input
                id="caseNo"
                type="text"
                value={formData.caseNo}
                onChange={(e) => handleChange("caseNo", e.target.value)}
                placeholder="e.g., 2024-001"
                className={errors.caseNo ? "border-red-500" : ""}
              />
              {errors.caseNo && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.caseNo}</p>
              )}
            </div>

            {/* Lead Investigator */}
            <div className="space-y-2">
              <Label htmlFor="leadInvestigator" className="text-sm font-medium">
                Lead Investigator *
              </Label>
              <Input
                id="leadInvestigator"
                type="text"
                value={formData.leadInvestigator}
                onChange={(e) => handleChange("leadInvestigator", e.target.value)}
                placeholder="e.g., Agent Smith"
                className={errors.leadInvestigator ? "border-red-500" : ""}
              />
              {errors.leadInvestigator && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.leadInvestigator}</p>
              )}
            </div>

            {/* Case Title */}
            <div className="space-y-2">
              <Label htmlFor="caseTitle" className="text-sm font-medium">
                Case Title *
              </Label>
              <Input
                id="caseTitle"
                type="text"
                value={formData.caseTitle}
                onChange={(e) => handleChange("caseTitle", e.target.value)}
                placeholder="e.g., Mobile Device Analysis"
                className={errors.caseTitle ? "border-red-500" : ""}
              />
              {errors.caseTitle && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.caseTitle}</p>
              )}
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department" className="text-sm font-medium">
                Department *
              </Label>
              <Input
                id="department"
                type="text"
                value={formData.department}
                onChange={(e) => handleChange("department", e.target.value)}
                placeholder="e.g., Cybercrime Unit"
                className={errors.department ? "border-red-500" : ""}
              />
              {errors.department && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.department}</p>
              )}
            </div>

            {/* Priority and Case Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium">
                  Priority
                </Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleChange("priority", e.target.value as CaseFormData["priority"])}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              {/* Case Type */}
              <div className="space-y-2">
                <Label htmlFor="caseType" className="text-sm font-medium">
                  Case Type
                </Label>
                <select
                  id="caseType"
                  value={formData.caseType}
                  onChange={(e) => handleChange("caseType", e.target.value as CaseFormData["caseType"])}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <Label htmlFor="description" className="text-sm font-medium">
                Description *
              </Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Provide a detailed description of the case..."
                rows={4}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                  errors.description ? "border-red-500" : "border-slate-300 dark:border-slate-600"
                }`}
              />
              {errors.description && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.description}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-6 bg-gradient-to-r from-indigo-800 to-blue-500 hover:from-indigo-900 hover:to-blue-600 text-white"
              >
                Create Case
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}