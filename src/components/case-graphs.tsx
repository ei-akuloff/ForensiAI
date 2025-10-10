"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  FileText,
  Clock,
  Database,
  MessageSquare,
} from "lucide-react";
import { ForensicGraphs } from "@/components/forensic/forensic-graphs";

interface CaseGraphsProps {
  caseId: string;
}

export function CaseGraphs({ caseId }: CaseGraphsProps) {
  const [activeTab, setActiveTab] = useState<"case" | "forensic">("case");
  const sessionId = `case_${caseId}_session`;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="relative">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Case Analytics
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              Advanced visual analysis and statistical insights from forensic
              data
            </p>
          </div>
        </div>

        {/* Analytics Type Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeTab === "case" ? "default" : "outline"}
            onClick={() => setActiveTab("case")}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Case Analytics
          </Button>
          <Button
            variant={activeTab === "forensic" ? "default" : "outline"}
            onClick={() => setActiveTab("forensic")}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Communication Analytics
          </Button>
        </div>
      </div>

      {/* Render Forensic Graphs if selected */}
      {activeTab === "forensic" && (
        <ForensicGraphs sessionId={sessionId} caseId={caseId} />
      )}

      {/* Original Case Analytics */}
      {activeTab === "case" && (
        <>
          {/* Main Graph Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* File Type Distribution */}
            <Card className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 animate-slide-up">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

              <CardHeader className="relative">
                <CardTitle className="flex items-center space-x-3 text-gray-900 dark:text-slate-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <PieChart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-xl font-semibold">
                    File Type Distribution
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-center justify-center h-80 bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-700/30 dark:to-slate-800/30 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-800/50 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 transition-colors duration-300">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <PieChart className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-semibold text-lg mb-2">
                      Interactive Pie Chart
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                      Visual breakdown of file types discovered during forensic
                      analysis
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Images
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      42%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Documents
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      28%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Videos
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      20%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Others
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      10%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline Graph */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100">
                  <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Case Activity Over Time</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                  <div className="text-center">
                    <Activity className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                      Line Chart Placeholder
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                      Processing activity timeline visualization
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">
                    Jan 15
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Peak: 14:30
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Jan 15
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Evidence Sources */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100">
                  <Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Evidence Sources</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-48 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                  <div className="text-center">
                    <BarChart3 className="h-10 w-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                      Bar Chart
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      Source distribution
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Photos
                    </span>
                    <span className="font-medium text-gray-900 dark:text-slate-100">
                      534
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Messages
                    </span>
                    <span className="font-medium text-gray-900 dark:text-slate-100">
                      267
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Contacts
                    </span>
                    <span className="font-medium text-gray-900 dark:text-slate-100">
                      89
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Processing Metrics */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Processing Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-48 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                  <div className="text-center">
                    <TrendingUp className="h-10 w-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                      Performance Graph
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      Processing efficiency
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Avg Speed
                    </span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      98.5%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Accuracy
                    </span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      99.2%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Completion
                    </span>
                    <span className="font-medium text-teal-600 dark:text-teal-400">
                      100%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Size Analysis */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100">
                  <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>File Size Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-48 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                  <div className="text-center">
                    <FileText className="h-10 w-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                      Size Distribution
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      File size breakdown
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      &lt; 1MB
                    </span>
                    <span className="font-medium text-gray-900 dark:text-slate-100">
                      1,089
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      1-10MB
                    </span>
                    <span className="font-medium text-gray-900 dark:text-slate-100">
                      234
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      &gt; 10MB
                    </span>
                    <span className="font-medium text-gray-900 dark:text-slate-100">
                      45
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <BarChart3 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                  Analysis Summary
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    1,247
                  </p>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400">
                    Total Files
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    2.3GB
                  </p>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400">
                    Data Processed
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    89
                  </p>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400">
                    Evidence Items
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    99.2%
                  </p>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400">
                    Accuracy Rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
