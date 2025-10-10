"use client";

import { RelationshipMap } from "./relationship-map";

interface CaseMapProps {
  caseId: string;
}

export function CaseMap({ caseId }: CaseMapProps) {
  return <RelationshipMap caseId={caseId} />;
}
