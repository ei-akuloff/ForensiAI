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
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "low":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400";
    }
  };

  const getStatusIcon = (status: string) => {
    return status === "completed" ? CheckCircle2 : Clock;
  };

  const StatusIcon = getStatusIcon(caseData.status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
          Case Overview
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Detailed information about this forensic analysis case.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Case Information */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Case Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Case ID
                </label>
                <p className="text-gray-900 dark:text-slate-100 font-mono">
                  {caseData.id}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Status
                </label>
                <div className="flex items-center space-x-2 mt-1">
                  <StatusIcon className="h-4 w-4 text-slate-500" />
                  <Badge
                    className={
                      caseData.status === "completed"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }
                  >
                    {caseData.status === "completed" ? "Completed" : "Ongoing"}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Case Name
              </label>
              <p className="text-gray-900 dark:text-slate-100">
                {caseData.name}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Description
              </label>
              <p className="text-gray-900 dark:text-slate-100">
                {caseData.description || "No description available"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Date Opened
                  </label>
                  <p className="text-gray-900 dark:text-slate-100 text-sm">
                    {formatDate(caseData.dateOpened)}
                  </p>
                </div>
              </div>
              {caseData.priority && (
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
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
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100">
              <HardDrive className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Evidence Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                File Name
              </label>
              <p className="text-gray-900 dark:text-slate-100 font-mono text-sm">
                {caseData.fileName || "evidence_file.ufdr"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                File Size
              </label>
              <p className="text-gray-900 dark:text-slate-100">
                {caseData.fileSize || "N/A"}
              </p>
            </div>

            {(caseData.leadInvestigator || caseData.investigator) && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Lead Investigator
                  </label>
                  <p className="text-gray-900 dark:text-slate-100">
                    {caseData.leadInvestigator || caseData.investigator}
                  </p>
                </div>
              </div>
            )}

            {caseData.department && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Department
                </label>
                <p className="text-gray-900 dark:text-slate-100">
                  {caseData.department}
                </p>
              </div>
            )}

            {caseData.caseType && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Case Type
                </label>
                <p className="text-gray-900 dark:text-slate-100">
                  {caseData.caseType}
                </p>
              </div>
            )}

            {caseData.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Location
                  </label>
                  <p className="text-gray-900 dark:text-slate-100">
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
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Files Analyzed
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  1,247
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Evidence Found
                </p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  89
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Processing Time
                </p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  4.2h
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500 dark:text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
