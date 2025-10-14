"use client";

import React from "react";
import { IndiaMap } from "@/components/india-map";

interface FindMyMapProps {
  sessionId: string;
  caseId: string;
}

export function FindMyMap({ sessionId, caseId }: FindMyMapProps) {
  return (
    <div className="w-full">
      <IndiaMap height="500px" />
    </div>
  );
}
