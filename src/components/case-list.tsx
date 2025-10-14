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
import { Search, Eye, Download, Calendar, File, Trash2 } from "lucide-react";
import CaseDecrypt from "./case-decrypt";
import { ClientWrapper } from "@/components/client-wrapper";
import { useCases, Case } from "./case-context";

interface CaseListProps {
  cases?: Case[];
}

export function CaseList({ cases: propCases }: CaseListProps) {
  const { cases: contextCases, deleteCase } = useCases();
  const cases = propCases || contextCases;
  const [searchTerm, setSearchTerm] = useState("");
  const [showDecryptFor, setShowDecryptFor] = useState<string | null>(null);
  const [deletingCaseId, setDeletingCaseId] = useState<string | null>(null);

  const handleDeleteCase = async (caseId: string, caseName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${caseName}"? This will permanently delete all forensic data from MongoDB.`
      )
    ) {
      return;
    }

    setDeletingCaseId(caseId);
    try {
      await deleteCase(caseId);
      alert("Case deleted successfully");
    } catch (error) {
      console.error("Error deleting case:", error);
      alert(
        `Failed to delete case: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setDeletingCaseId(null);
    }
  };

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
      ? "bg-matrix-emerald/20 text-matrix-emerald border border-matrix-emerald/50"
      : "bg-matrix-cyan/20 text-matrix-cyan border border-matrix-cyan/50";
  };

  return (
    <ClientWrapper>
      <Card
        className="matrix-panel group backdrop-blur-sm shadow-2xl hover:shadow-matrix-cyan/20 transition-all duration-300 animate-slide-up border-matrix-border"
        style={{ animationDelay: "0.2s" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-matrix-cyan/5 to-matrix-emerald/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

        <CardHeader className="relative matrix-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-matrix-cyan/20 to-matrix-emerald/20 rounded-xl flex items-center justify-center matrix-glow-cyan">
                <File className="w-5 h-5 text-matrix-cyan" />
              </div>
              <CardTitle className="text-2xl font-bold matrix-text-primary group-hover:text-matrix-emerald transition-colors duration-300 font-orbitron tracking-wide">
                [[ CASE HISTORY ]]
              </CardTitle>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-matrix-text-muted h-5 w-5" />
              <Input
                placeholder="Search cases by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="matrix-input pl-12 h-12 bg-matrix-surface/60 backdrop-blur-sm border-2 border-matrix-border focus:border-matrix-cyan transition-all duration-300 font-space-mono"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          {filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-matrix-surface to-matrix-panel rounded-2xl flex items-center justify-center mx-auto mb-6 matrix-glow-cyan">
                <File className="h-10 w-10 text-matrix-text-muted" />
              </div>
              <h3 className="text-lg font-semibold matrix-text-primary mb-2 font-orbitron">
                {searchTerm ? "[[ NO MATCHES FOUND ]]" : "[[ NO CASES YET ]]"}
              </h3>
              <p className="matrix-text-muted max-w-md mx-auto font-space-mono text-sm">
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
                    <TableRow className="border-matrix-border">
                      <TableHead className="matrix-text-muted font-space-mono uppercase tracking-wider text-xs">
                        Case Name
                      </TableHead>
                      <TableHead className="matrix-text-muted font-space-mono uppercase tracking-wider text-xs">
                        Date Opened
                      </TableHead>
                      <TableHead className="matrix-text-muted font-space-mono uppercase tracking-wider text-xs">
                        Status
                      </TableHead>
                      <TableHead className="matrix-text-muted font-space-mono uppercase tracking-wider text-xs">
                        File Size
                      </TableHead>
                      <TableHead className="matrix-text-muted font-space-mono uppercase tracking-wider text-xs">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCases.map((caseItem) => (
                      <TableRow
                        key={caseItem.id}
                        className="border-matrix-border hover:bg-matrix-surface/30 hover:matrix-glow-cyan transition-all duration-300"
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium matrix-text-primary font-space-mono">
                              {caseItem.name}
                            </p>
                            {caseItem.description && (
                              <p className="text-sm matrix-text-muted mt-1 font-space-mono">
                                {caseItem.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="matrix-text-muted">
                          <div className="flex items-center space-x-2 font-space-mono">
                            <Calendar className="h-4 w-4 text-matrix-cyan" />
                            <span>{formatDate(caseItem.dateOpened)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-matrix-emerald/20 text-matrix-emerald border border-matrix-emerald/50 font-space-mono">
                            {caseItem.status === "completed"
                              ? "COMPLETED"
                              : "ONGOING"}
                          </Badge>
                        </TableCell>
                        <TableCell className="matrix-text-muted font-space-mono">
                          {caseItem.fileSize}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Link href={`/cases/${caseItem.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 matrix-button text-xs font-space-mono"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                VIEW
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 border-matrix-border text-matrix-text-muted hover:bg-matrix-surface/30 hover:border-matrix-cyan hover:text-matrix-cyan font-space-mono text-xs"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              EXPORT
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-xs matrix-text-muted hover:matrix-text-primary font-space-mono"
                              onClick={() => setShowDecryptFor(caseItem.id)}
                            >
                              DECRYPT
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-400 font-space-mono text-xs"
                              onClick={() =>
                                handleDeleteCase(caseItem.id, caseItem.name)
                              }
                              disabled={deletingCaseId === caseItem.id}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              {deletingCaseId === caseItem.id
                                ? "DELETING..."
                                : "DELETE"}
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
                    className="matrix-card matrix-hover bg-matrix-surface/50 border-matrix-border"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium matrix-text-primary text-sm font-space-mono">
                              {caseItem.name}
                            </h4>
                            {caseItem.description && (
                              <p className="text-xs matrix-text-muted mt-1 font-space-mono">
                                {caseItem.description}
                              </p>
                            )}
                          </div>
                          <Badge className="bg-matrix-emerald/20 text-matrix-emerald border border-matrix-emerald/50 text-xs font-space-mono">
                            {caseItem.status === "completed"
                              ? "COMPLETED"
                              : "ONGOING"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-xs matrix-text-muted font-space-mono">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-matrix-cyan" />
                            <span>{formatDate(caseItem.dateOpened)}</span>
                          </div>
                          <span>{caseItem.fileSize}</span>
                        </div>

                        <div className="flex flex-col space-y-2">
                          <div className="flex space-x-2">
                            <Link
                              href={`/cases/${caseItem.id}`}
                              className="flex-1"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-8 text-xs matrix-button font-space-mono"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                VIEW
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 text-xs border-matrix-border text-matrix-text-muted hover:bg-matrix-surface/30 hover:border-matrix-cyan hover:text-matrix-cyan font-space-mono"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              EXPORT
                            </Button>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 h-8 text-xs matrix-text-muted hover:matrix-text-primary font-space-mono"
                              onClick={() => setShowDecryptFor(caseItem.id)}
                            >
                              DECRYPT
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 text-xs border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-400 font-space-mono"
                              onClick={() =>
                                handleDeleteCase(caseItem.id, caseItem.name)
                              }
                              disabled={deletingCaseId === caseItem.id}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              {deletingCaseId === caseItem.id
                                ? "DELETING..."
                                : "DELETE"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {showDecryptFor && (
                <div className="matrix-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                  <div className="matrix-modal w-full max-w-2xl bg-matrix-surface/95 border-2 border-matrix-cyan/50 rounded shadow-2xl shadow-matrix-cyan/20 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold matrix-text-primary font-orbitron tracking-wide">
                        [[ DECRYPT FILE FOR CASE {showDecryptFor} ]]
                      </h3>
                      <button
                        className="matrix-text-muted hover:matrix-text-primary font-space-mono"
                        onClick={() => setShowDecryptFor(null)}
                      >
                        CLOSE
                      </button>
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
