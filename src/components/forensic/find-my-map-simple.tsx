"use client";

import React from "react";
import { IndiaMap } from "@/components/india-map";

interface FindMyMapProps {
  sessionId: string;
  caseId: string;
}

export function FindMyMap({ sessionId, caseId }: FindMyMapProps) {
  // Simply show just the India map without any additional cards or data
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <IndiaMap height="500px" />
      </div>
    </div>
  );
}