"use client";

import { useState } from "react";
import { RelationshipMap } from "./relationship-map";
import { FindMyMap } from "./forensic/find-my-map-simple";
import { Button } from "@/components/ui/button";
import { Users, MapPin } from "lucide-react";

interface CaseMapProps {
  caseId: string;
}

export function CaseMap({ caseId }: CaseMapProps) {
  const [activeTab, setActiveTab] = useState<"relationship" | "location">(
    "relationship"
  );
  const sessionId = `case_${caseId}_session`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Tabs */}
      <div className="relative">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Map Analysis
            </h1>
            <p className="text-matrix-text-muted text-lg font-['Space_Mono']">
              Visual analysis of relationships and location data
            </p>
          </div>
        </div>

        {/* Map Type Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeTab === "relationship" ? "default" : "outline"}
            onClick={() => setActiveTab("relationship")}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Relationship Map
          </Button>
          <Button
            variant={activeTab === "location" ? "default" : "outline"}
            onClick={() => setActiveTab("location")}
            className="flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            Location Map
          </Button>
        </div>
      </div>

      {/* Render based on active tab */}
      {activeTab === "relationship" && <RelationshipMap caseId={caseId} />}
      {activeTab === "location" && (
        <FindMyMap sessionId={sessionId} caseId={caseId} />
      )}
    </div>
  );
}
