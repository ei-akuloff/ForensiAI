"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CaseFormData } from "./case-creation-modal";

export interface Case {
  id: string;
  name: string;
  dateOpened: string;
  status: "ongoing" | "completed";
  description?: string;
  fileSize?: string;
  leadInvestigator?: string;
  department?: string;
  priority?: string;
  caseType?: string;
  fileName?: string;
}

interface CaseContextType {
  cases: Case[];
  addCase: (caseData: CaseFormData) => string;
  getCaseById: (id: string) => Case | undefined;
  updateCase: (id: string, updates: Partial<Case>) => void;
  clearAllCases: () => void;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

// Default cases for demo purposes - cleared for clean start
const defaultCases: Case[] = [];

const STORAGE_KEY = "forensiai_cases";

export function CaseProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<Case[]>(defaultCases);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side to prevent hydration errors
  useEffect(() => {
    setIsClient(true);
    
    // One-time check for clearing old data (can be removed after first run)
    if (typeof window !== 'undefined') {
      const shouldClearOldData = !localStorage.getItem('forensiai_initialized');
      if (shouldClearOldData) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem('forensiai_initialized', 'true');
      }
    }
  }, []);

  // Load cases from localStorage only on client side
  useEffect(() => {
    if (!isClient) return;
    
    try {
      const storedCases = localStorage.getItem(STORAGE_KEY);
      if (storedCases) {
        const parsedCases = JSON.parse(storedCases);
        if (Array.isArray(parsedCases) && parsedCases.length > 0) {
          setCases(parsedCases);
        }
      }
    } catch (error) {
      console.error("Error loading cases from localStorage:", error);
    }
  }, [isClient]);

  // Save cases to localStorage whenever cases change (client-side only)
  useEffect(() => {
    if (!isClient) return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    } catch (error) {
      console.error("Error saving cases to localStorage:", error);
    }
  }, [cases, isClient]);

  const addCase = (caseData: CaseFormData): string => {
    const newId = Date.now().toString();
    const newCase: Case = {
      id: newId,
      name: `${caseData.caseTitle} - Case #${caseData.caseNo}`,
      dateOpened: new Date().toISOString().split('T')[0],
      status: "ongoing",
      description: caseData.description,
      fileSize: "Processing...",
      leadInvestigator: caseData.leadInvestigator,
      department: caseData.department,
      priority: caseData.priority,
      caseType: caseData.caseType,
      fileName: caseData.fileName,
    };

    setCases(prevCases => [newCase, ...prevCases]);
    return newId;
  };

  const getCaseById = (id: string): Case | undefined => {
    return cases.find(caseItem => caseItem.id === id);
  };

  const updateCase = (id: string, updates: Partial<Case>): void => {
    setCases(prevCases =>
      prevCases.map(caseItem =>
        caseItem.id === id ? { ...caseItem, ...updates } : caseItem
      )
    );
  };

  const clearAllCases = (): void => {
    setCases([]);
    // Also clear from localStorage
    if (isClient) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error("Error clearing cases from localStorage:", error);
      }
    }
  };

  const value: CaseContextType = {
    cases,
    addCase,
    getCaseById,
    updateCase,
    clearAllCases,
  };

  return (
    <CaseContext.Provider value={value}>
      {children}
    </CaseContext.Provider>
  );
}

export function useCases() {
  const context = useContext(CaseContext);
  if (context === undefined) {
    throw new Error("useCases must be used within a CaseProvider");
  }
  return context;
}