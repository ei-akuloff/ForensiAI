"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { CaseOverview } from "@/components/case-overview";
import { CaseTimeline } from "@/components/case-timeline";
import { CaseFiles } from "@/components/case-files";
import { CaseMap } from "@/components/case-map";
import { CaseChatbot } from "@/components/case-chatbot";
import { CaseExport } from "@/components/case-export";
import { ClientWrapper } from "@/components/client-wrapper";
import { useCases } from "@/components/case-context";

type SidebarItem =
  | "overview"
  | "timeline"
  | "files"
  | "map"
  | "chatbot"
  | "export";

export default function CaseDetailsPage() {
  const params = useParams();
  const caseId = params.id as string;
  const [activeSection, setActiveSection] = useState<SidebarItem>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { getCaseById } = useCases();
  const caseData = getCaseById(caseId);

  // Fallback case data if case not found (for backward compatibility)
  const fallbackCaseData = {
    id: caseId,
    name: `Case #2024-${caseId.padStart(3, "0")}`,
    dateOpened: "2024-01-15",
    status: "completed" as const,
    description: "iPhone 14 Pro data extraction and analysis",
    fileSize: "2.3 GB",
    fileName: "evidence_mobile_device.ufdr",
    leadInvestigator: "Agent Smith",
    priority: "High",
    department: "Cybercrime Unit",
    caseType: "Mobile Device",
  };

  const displayCaseData = caseData || fallbackCaseData;

  const renderMainContent = () => {
    switch (activeSection) {
      case "overview":
        return <CaseOverview caseData={displayCaseData} />;
      case "timeline":
        return <CaseTimeline caseId={caseId} />;
      case "files":
        return <CaseFiles caseId={caseId} />;
      case "map":
        return <CaseMap caseId={caseId} />;
      case "chatbot":
        return <CaseChatbot caseId={caseId} />;
      case "export":
        return <CaseExport caseData={displayCaseData} />;
      default:
        return <CaseOverview caseData={displayCaseData} />;
    }
  };

  return (
    <ClientWrapper>
      <div className="min-h-screen bg-matrix-bg relative overflow-hidden">
        {/* Matrix Background Elements */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'matrixPulse 30s linear infinite'
        }}></div>
        
        {/* Floating scan lines */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-matrix-cyan to-transparent animate-matrix-scan opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-matrix-emerald to-transparent animate-matrix-scan opacity-40" style={{animationDelay: '2s'}}></div>

        <div
          className="relative z-10 flex"
          style={{ height: "calc(100vh - 64px)" }}
        >
          {/* Sidebar - Desktop */}
          <div className="hidden lg:block">
            <Sidebar
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              caseData={displayCaseData}
            />
          </div>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 z-50 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="w-80 h-full" onClick={(e) => e.stopPropagation()}>
                <Sidebar
                  activeSection={activeSection}
                  setActiveSection={setActiveSection}
                  caseData={displayCaseData}
                  onItemClick={() => setSidebarOpen(false)}
                />
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile Header */}
            <div className="lg:hidden matrix-header border-b border-matrix-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold matrix-text-primary font-orbitron tracking-wide">
                    {displayCaseData.name}
                  </h1>
                  <p className="text-sm matrix-text-muted capitalize font-space-mono">
                    {activeSection}
                  </p>
                </div>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-lg bg-matrix-surface/50 border border-matrix-border text-matrix-text-muted hover:text-matrix-cyan transition-colors duration-300"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-6">
              {renderMainContent()}
            </div>
          </div>
        </div>
      </div>
    </ClientWrapper>
  );
}
