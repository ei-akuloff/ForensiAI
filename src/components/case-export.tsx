"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  Image,
  Database,
  Archive,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileJson,
  Printer,
  Share2,
} from "lucide-react";

interface CaseData {
  id: string;
  name: string;
  status: string;
  fileName?: string;
}

interface CaseExportProps {
  caseData: CaseData;
}

interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: any;
  format: string;
  size: string;
  type: "report" | "data" | "evidence" | "summary";
  available: boolean;
}

const exportOptions: ExportOption[] = [
  {
    id: "full-report",
    title: "Complete Forensic Report",
    description:
      "Comprehensive analysis report with all findings, evidence, and conclusions",
    icon: FileText,
    format: "PDF",
    size: "2.4 MB",
    type: "report",
    available: true,
  },
  {
    id: "evidence-package",
    title: "Evidence Package",
    description:
      "All recovered files, photos, and digital evidence in organized folders",
    icon: Archive,
    format: "ZIP",
    size: "1.8 GB",
    type: "evidence",
    available: true,
  },
  {
    id: "timeline-data",
    title: "Timeline Data",
    description:
      "Chronological activity data in spreadsheet format for further analysis",
    icon: FileSpreadsheet,
    format: "XLSX",
    size: "156 KB",
    type: "data",
    available: true,
  },
  {
    id: "location-data",
    title: "Location Data",
    description: "GPS coordinates, location timeline, and mapping data",
    icon: Database,
    format: "JSON",
    size: "89 KB",
    type: "data",
    available: true,
  },
  {
    id: "recovered-images",
    title: "Recovered Images",
    description:
      "All photos and images found during analysis, including deleted files",
    icon: Image,
    format: "ZIP",
    size: "245 MB",
    type: "evidence",
    available: true,
  },
  {
    id: "summary-report",
    title: "Executive Summary",
    description: "High-level summary report for stakeholders and legal teams",
    icon: FileText,
    format: "PDF",
    size: "512 KB",
    type: "summary",
    available: true,
  },
  {
    id: "raw-data",
    title: "Raw Analysis Data",
    description: "Unprocessed forensic data and logs for technical review",
    icon: FileJson,
    format: "JSON",
    size: "45 MB",
    type: "data",
    available: false,
  },
  {
    id: "chain-custody",
    title: "Chain of Custody",
    description: "Legal documentation tracking evidence handling and analysis",
    icon: CheckCircle2,
    format: "PDF",
    size: "234 KB",
    type: "report",
    available: false,
  },
];

const getTypeColor = (type: ExportOption["type"]) => {
  switch (type) {
    case "report":
      return "bg-blue-500/20 text-blue-400 border border-blue-500/50";
    case "evidence":
      return "bg-matrix-emerald/20 text-matrix-emerald border border-matrix-emerald/50";
    case "data":
      return "bg-purple-500/20 text-purple-400 border border-purple-500/50";
    case "summary":
      return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50";
    default:
      return "bg-matrix-surface/50 text-matrix-text-muted border border-matrix-border";
  }
};

const getTypeIcon = (type: ExportOption["type"]) => {
  switch (type) {
    case "report":
      return FileText;
    case "evidence":
      return Archive;
    case "data":
      return Database;
    case "summary":
      return FileSpreadsheet;
    default:
      return Download;
  }
};

export function CaseExport({ caseData }: CaseExportProps) {
  const handleDownload = (option: ExportOption) => {
    if (!option.available) return;

    // Simulate download - in real app, this would trigger actual download
    console.log(`Downloading ${option.title} for case ${caseData.id}`);

    // Show download started notification
    alert(
      `Download started: ${option.title} (${option.format}, ${option.size})`
    );
  };

  const handleBulkDownload = () => {
    const availableOptions = exportOptions.filter((opt) => opt.available);
    console.log(
      `Bulk downloading ${availableOptions.length} files for case ${caseData.id}`
    );
    alert(
      `Bulk download started: ${availableOptions.length} files will be packaged together`
    );
  };

  const handlePrint = () => {
    console.log(`Printing summary for case ${caseData.id}`);
    alert("Print dialog would open for the case summary report");
  };

  const handleShare = () => {
    console.log(`Sharing case ${caseData.id}`);
    alert("Share options would open (email, secure link, etc.)");
  };

  const availableCount = exportOptions.filter((opt) => opt.available).length;
  const totalSize = exportOptions
    .filter((opt) => opt.available)
    .reduce((total, opt) => {
      const size = parseFloat(opt.size.replace(/[^\d.]/g, ""));
      const unit = opt.size.includes("GB")
        ? 1024
        : opt.size.includes("KB")
        ? 0.001
        : 1;
      return total + size * unit;
    }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold matrix-text-primary mb-2 font-orbitron tracking-wide">
          [[ EXPORT & DOWNLOAD ]]
        </h1>
        <p className="matrix-text-muted font-space-mono">
          DOWNLOAD REPORTS, EVIDENCE PACKAGES, AND ANALYSIS DATA FOR CASE{" "}
          {caseData.id}.
        </p>
      </div>

      {/* Export Summary */}
      <Card className="matrix-panel border-matrix-cyan/50 shadow-2xl shadow-matrix-cyan/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Download className="h-6 w-6 text-matrix-cyan animate-pulse" />
              <div>
                <h3 className="text-lg font-semibold matrix-text-primary font-orbitron">
                  [[ READY FOR EXPORT ]]
                </h3>
                <p className="text-sm matrix-text-muted font-space-mono">
                  {availableCount} FILES AVAILABLE • TOTAL SIZE: ~
                  {totalSize.toFixed(1)} GB
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="border-matrix-border text-matrix-text-muted hover:bg-matrix-surface/30 hover:border-matrix-cyan hover:text-matrix-cyan font-space-mono text-xs uppercase tracking-wider"
              >
                <Printer className="h-4 w-4 mr-2" />
                PRINT
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="border-matrix-border text-matrix-text-muted hover:bg-matrix-surface/30 hover:border-matrix-cyan hover:text-matrix-cyan font-space-mono text-xs uppercase tracking-wider"
              >
                <Share2 className="h-4 w-4 mr-2" />
                SHARE
              </Button>
              <Button
                onClick={handleBulkDownload}
                className="matrix-button font-space-mono text-xs uppercase tracking-wider"
              >
                <Download className="h-4 w-4 mr-2" />
                DOWNLOAD ALL
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exportOptions.map((option) => {
          const OptionIcon = option.icon;
          const TypeIcon = getTypeIcon(option.type);

          return (
            <Card
              key={option.id}
              className={`matrix-card matrix-hover border-matrix-border shadow-lg transition-all duration-200 ${
                option.available
                  ? "hover:shadow-xl hover:border-matrix-cyan matrix-glow-cyan"
                  : "opacity-60"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        option.available
                          ? "bg-matrix-cyan/20 matrix-glow-cyan"
                          : "bg-matrix-surface/50"
                      }`}
                    >
                      <OptionIcon
                        className={`h-5 w-5 ${
                          option.available
                            ? "text-matrix-cyan"
                            : "text-matrix-text-muted"
                        }`}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg matrix-text-primary font-space-mono">
                        {option.title}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getTypeColor(option.type)}>
                          {option.type}
                        </Badge>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {option.format} • {option.size}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {option.available ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {option.description}
                </p>
                <Button
                  onClick={() => handleDownload(option)}
                  disabled={!option.available}
                  className={`w-full ${
                    option.available
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {option.available ? "Download" : "Processing..."}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Export Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="matrix-panel">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-matrix-cyan/20 rounded-lg flex items-center justify-center mx-auto mb-2 border border-matrix-cyan/30 matrix-glow-cyan">
              <FileText className="h-6 w-6 text-matrix-cyan" />
            </div>
            <p className="text-sm font-medium matrix-text-muted font-['Orbitron'] tracking-wider uppercase">
              [Reports]
            </p>
            <p className="text-xl font-bold matrix-text-primary font-mono">
              {
                exportOptions.filter(
                  (opt) => opt.type === "report" && opt.available
                ).length
              }
            </p>
          </CardContent>
        </Card>

        <Card className="matrix-panel">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-matrix-emerald/20 rounded-lg flex items-center justify-center mx-auto mb-2 border border-matrix-emerald/30 matrix-glow-emerald">
              <Archive className="h-6 w-6 text-matrix-emerald" />
            </div>
            <p className="text-sm font-medium matrix-text-muted font-['Orbitron'] tracking-wider uppercase">
              [Evidence]
            </p>
            <p className="text-xl font-bold matrix-text-primary font-mono">
              {
                exportOptions.filter(
                  (opt) => opt.type === "evidence" && opt.available
                ).length
              }
            </p>
          </CardContent>
        </Card>

        <Card className="matrix-panel">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2 border border-purple-500/30 matrix-glow-purple">
              <Database className="h-6 w-6 text-purple-400" />
            </div>
            <p className="text-sm font-medium matrix-text-muted font-['Orbitron'] tracking-wider uppercase">
              [Data Files]
            </p>
            <p className="text-xl font-bold matrix-text-primary font-mono">
              {
                exportOptions.filter(
                  (opt) => opt.type === "data" && opt.available
                ).length
              }
            </p>
          </CardContent>
        </Card>

        <Card className="matrix-panel">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-2 border border-yellow-500/30 matrix-glow-yellow">
              <FileSpreadsheet className="h-6 w-6 text-yellow-500" />
            </div>
            <p className="text-sm font-medium matrix-text-muted font-['Orbitron'] tracking-wider uppercase">
              [Summaries]
            </p>
            <p className="text-xl font-bold matrix-text-primary font-mono">
              {
                exportOptions.filter(
                  (opt) => opt.type === "summary" && opt.available
                ).length
              }
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
