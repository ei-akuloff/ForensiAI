"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Eye, Download, Calendar, File } from "lucide-react";
import CaseDecrypt from "./case-decrypt";
import { ClientWrapper } from "@/components/client-wrapper";
import { useCases, Case } from "./case-context";

interface CaseListProps {
  cases?: Case[];
}

export function CaseList({ cases: propCases }: CaseListProps) {
  const { cases: contextCases } = useCases();
  const cases = propCases || contextCases;
  const [searchTerm, setSearchTerm] = useState("");
  const [showDecryptFor, setShowDecryptFor] = useState<string | null>(null);

  const filteredCases = cases.filter(
    (caseItem) =>
      caseItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadgeVariant = (status: Case["status"]) => {
    return status === "completed" ? "default" : "secondary";
  };

  const getStatusColor = (status: Case["status"]) => {
    return status === "completed"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  };

  return (
    <ClientWrapper>
      <Card className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up" style={{animationDelay: '0.2s'}}>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
        
        <CardHeader className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl flex items-center justify-center">
                <File className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-300">
                Case History
              </CardTitle>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 h-5 w-5" />
              <Input
                placeholder="Search cases by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-2 border-white/20 dark:border-slate-600/50 focus:border-emerald-400 dark:focus:border-emerald-500 transition-all duration-300"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          {filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <File className="h-10 w-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {searchTerm ? "No matches found" : "No cases yet"}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {searchTerm
                  ? "Try adjusting your search terms or check the spelling."
                  : "Start by uploading your first UFDR file to create a case."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-700">
                      <TableHead className="text-slate-600 dark:text-slate-400">
                        Case Name
                      </TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">
                        Date Opened
                      </TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">
                        Status
                      </TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">
                        File Size
                      </TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCases.map((caseItem) => (
                      <TableRow
                        key={caseItem.id}
                        className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-slate-100">
                              {caseItem.name}
                            </p>
                            {caseItem.description && (
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {caseItem.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(caseItem.dateOpened)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(caseItem.status)}>
                            {caseItem.status === "completed"
                              ? "Completed"
                              : "Ongoing"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {caseItem.fileSize}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Link href={`/cases/${caseItem.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Export
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-xs text-slate-400 hover:text-slate-200"
                              onClick={() => setShowDecryptFor(caseItem.id)}
                            >
                              Decrypt
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredCases.map((caseItem) => (
                  <Card
                    key={caseItem.id}
                    className="bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-slate-100 text-sm">
                              {caseItem.name}
                            </h4>
                            {caseItem.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {caseItem.description}
                              </p>
                            )}
                          </div>
                          <Badge
                            className={`${getStatusColor(
                              caseItem.status
                            )} text-xs`}
                          >
                            {caseItem.status === "completed"
                              ? "Completed"
                              : "Ongoing"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(caseItem.dateOpened)}</span>
                          </div>
                          <span>{caseItem.fileSize}</span>
                        </div>

                        <div className="flex space-x-2">
                          <Link
                            href={`/cases/${caseItem.id}`}
                            className="flex-1"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full h-8 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Export
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-8 text-xs text-slate-400 hover:text-slate-200"
                            onClick={() => setShowDecryptFor(caseItem.id)}
                          >
                            Decrypt
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {showDecryptFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded shadow-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">Analyst: Decrypt file for case {showDecryptFor}</h3>
                      <button className="text-slate-500" onClick={() => setShowDecryptFor(null)}>Close</button>
                    </div>
                    <CaseDecrypt />
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </ClientWrapper>
  );
}
