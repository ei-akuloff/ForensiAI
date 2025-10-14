"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  User,
  FileText,
  HardDrive,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface CaseData {
  id: string;
  name: string;
  dateOpened: string;
  status: "ongoing" | "completed";
  description?: string;
  fileSize?: string;
  fileName?: string;
  investigator?: string;
  leadInvestigator?: string;
  department?: string;
  caseType?: string;
  priority?: string;
  location?: string;
}

interface CaseOverviewProps {
  caseData: CaseData;
}

export function CaseOverview({ caseData }: CaseOverviewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-gradient-to-r from-red-100 to-red-200 text-red-700 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-400 border border-red-200 dark:border-red-800/50";
      case "medium":
        return "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 dark:from-yellow-900/30 dark:to-yellow-800/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50";
      case "low":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-matrix-surface/30 text-matrix-text-muted border border-matrix-border";
    }
  };

  const getStatusIcon = (status: string) => {
    return status === "completed" ? CheckCircle2 : Clock;
  };

  const StatusIcon = getStatusIcon(caseData.status);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="relative">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-matrix-cyan to-matrix-emerald rounded-2xl flex items-center justify-center shadow-lg shadow-matrix-cyan/30 matrix-glow-cyan">
            <FileText className="w-6 h-6 text-matrix-bg" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2 font-orbitron tracking-wide">
              CASE OVERVIEW
            </h1>
            <p className="matrix-text-muted text-lg font-space-mono">
              COMPREHENSIVE FORENSIC ANALYSIS DETAILS AND EVIDENCE SUMMARY
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Case Information */}
        <Card className="group matrix-panel matrix-hover animate-slide-up">
          
          <CardHeader className="relative matrix-header">
            <CardTitle className="flex items-center space-x-3 matrix-text-primary">
              <div className="w-10 h-10 bg-gradient-to-br from-matrix-cyan/20 to-matrix-emerald/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 matrix-glow-cyan">
                <FileText className="h-5 w-5 text-matrix-cyan" />
              </div>
              <span className="text-xl font-semibold font-orbitron tracking-wide">CASE INFORMATION</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-matrix-surface/50 rounded-xl p-4 border border-matrix-border">
                <label className="text-sm font-semibold matrix-text-muted uppercase tracking-wider font-space-mono">
                  Case ID
                </label>
                <p className="text-lg font-mono matrix-text-primary mt-1 font-semibold font-space-mono">
                  {caseData.id}
                </p>
              </div>
              <div className="bg-matrix-surface/50 rounded-xl p-4 border border-matrix-border">
                <label className="text-sm font-semibold matrix-text-muted uppercase tracking-wider font-space-mono">
                  Status
                </label>
                <div className="flex items-center space-x-3 mt-2">
                  <StatusIcon className="h-5 w-5 text-matrix-cyan" />
                  <Badge className="bg-matrix-emerald/20 text-matrix-emerald border border-matrix-emerald/50 font-space-mono">
                    {caseData.status === "completed" ? "COMPLETED" : "ONGOING"}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium matrix-text-muted font-space-mono uppercase tracking-wider">
                Case Name
              </label>
              <p className="matrix-text-primary font-space-mono">
                {caseData.name}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium matrix-text-muted font-space-mono uppercase tracking-wider">
                Description
              </label>
              <p className="matrix-text-primary font-space-mono">
                {caseData.description || "No description available"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-matrix-cyan" />
                <div>
                  <label className="text-sm font-medium matrix-text-muted font-space-mono uppercase tracking-wider">
                    Date Opened
                  </label>
                  <p className="matrix-text-primary text-sm font-space-mono">
                    {formatDate(caseData.dateOpened)}
                  </p>
                </div>
              </div>
              {caseData.priority && (
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-matrix-cyan" />
                  <div>
                    <label className="text-sm font-medium matrix-text-muted font-space-mono uppercase tracking-wider">
                      Priority
                    </label>
                    <div className="mt-1">
                      <Badge className={getPriorityColor(caseData.priority)}>
                        {caseData.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Evidence Details */}
        <Card className="matrix-panel matrix-hover animate-slide-up">
          <CardHeader className="matrix-header">
            <CardTitle className="flex items-center space-x-2 matrix-text-primary">
              <HardDrive className="h-5 w-5 text-matrix-cyan" />
              <span className="font-orbitron tracking-wide">EVIDENCE DETAILS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium matrix-text-muted font-space-mono uppercase tracking-wider">
                File Name
              </label>
              <p className="matrix-text-primary font-mono text-sm font-space-mono">
                {caseData.fileName || "evidence_file.ufdr"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium matrix-text-muted font-space-mono uppercase tracking-wider">
                File Size
              </label>
              <p className="matrix-text-primary font-space-mono">
                {caseData.fileSize || "N/A"}
              </p>
            </div>

            {(caseData.leadInvestigator || caseData.investigator) && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-matrix-cyan" />
                <div>
                  <label className="text-sm font-medium matrix-text-muted font-space-mono uppercase tracking-wider">
                    Lead Investigator
                  </label>
                  <p className="matrix-text-primary font-space-mono">
                    {caseData.leadInvestigator || caseData.investigator}
                  </p>
                </div>
              </div>
            )}

            {caseData.department && (
              <div>
                <label className="text-sm font-medium matrix-text-muted font-space-mono uppercase tracking-wider">
                  Department
                </label>
                <p className="matrix-text-primary font-space-mono">
                  {caseData.department}
                </p>
              </div>
            )}

            {caseData.caseType && (
              <div>
                <label className="text-sm font-medium matrix-text-muted font-space-mono uppercase tracking-wider">
                  Case Type
                </label>
                <p className="matrix-text-primary font-space-mono">
                  {caseData.caseType}
                </p>
              </div>
            )}

            {caseData.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-matrix-cyan" />
                <div>
                  <label className="text-sm font-medium matrix-text-muted font-space-mono uppercase tracking-wider">
                    Location
                  </label>
                  <p className="matrix-text-primary font-space-mono">
                    {caseData.location}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="matrix-panel matrix-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium matrix-text-muted font-space-mono uppercase tracking-wider">
                  Files Analyzed
                </p>
                <p className="text-2xl font-bold matrix-text-primary font-orbitron">
                  1,247
                </p>
              </div>
              <FileText className="h-8 w-8 text-matrix-cyan matrix-glow" />
            </div>
          </CardContent>
        </Card>

        <Card className="matrix-panel matrix-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium matrix-text-muted font-space-mono uppercase tracking-wider">
                  Evidence Found
                </p>
                <p className="text-2xl font-bold matrix-text-primary font-orbitron">
                  89
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-matrix-emerald matrix-glow" />
            </div>
          </CardContent>
        </Card>

        <Card className="matrix-panel matrix-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium matrix-text-muted font-space-mono uppercase tracking-wider">
                  Processing Time
                </p>
                <p className="text-2xl font-bold matrix-text-primary font-orbitron">
                  4.2h
                </p>
              </div>
              <Clock className="h-8 w-8 text-matrix-cyan matrix-glow" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
