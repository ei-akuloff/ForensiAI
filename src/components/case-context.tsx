"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
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
  deleteCase: (id: string) => Promise<void>;
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
    if (typeof window !== "undefined") {
      const shouldClearOldData = !localStorage.getItem("forensiai_initialized");
      if (shouldClearOldData) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem("forensiai_initialized", "true");
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
      dateOpened: new Date().toISOString().split("T")[0],
      status: "ongoing",
      description: caseData.description,
      fileSize: "Processing...",
      leadInvestigator: caseData.leadInvestigator,
      department: caseData.department,
      priority: caseData.priority,
      caseType: caseData.caseType,
      fileName: caseData.fileName,
    };

    setCases((prevCases) => [newCase, ...prevCases]);

    // Save to MongoDB backend
    if (isClient) {
      import("@/lib/backend-service")
        .then(({ createCase, createSession, generateSessionId }) => {
          // Get current user from localStorage
          const userStr = localStorage.getItem("user");
          const user = userStr ? JSON.parse(userStr) : null;
          const userId = user?.user_id || "default_user";

          createCase(
            `${caseData.caseTitle} - Case #${caseData.caseNo}`,
            caseData.caseNo,
            caseData.description,
            caseData.priority?.toLowerCase() || "medium",
            userId
          )
            .then((response) => {
              console.log("Case created in MongoDB:", response);
              // Store MongoDB case_id for this local case
              localStorage.setItem(
                `case_${newId}_mongodb_id`,
                response.case.case_id
              );

              // Create a session for this case
              const sessionId = generateSessionId(newId);
              return createSession(sessionId, response.case.case_id, userId);
            })
            .then((sessionResponse) => {
              console.log("Session created in MongoDB:", sessionResponse);
            })
            .catch((error) => {
              console.error("Error saving case to MongoDB:", error);
            });
        })
        .catch((error) => {
          console.error("Error importing backend-service:", error);
        });
    }

    return newId;
  };

  const getCaseById = (id: string): Case | undefined => {
    return cases.find((caseItem) => caseItem.id === id);
  };

  const updateCase = (id: string, updates: Partial<Case>): void => {
    setCases((prevCases) =>
      prevCases.map((caseItem) =>
        caseItem.id === id ? { ...caseItem, ...updates } : caseItem
      )
    );
  };

  const deleteCase = async (id: string): Promise<void> => {
    // Get MongoDB case_id before deleting from localStorage
    const mongodbCaseId = localStorage.getItem(`case_${id}_mongodb_id`);

    // Delete from MongoDB backend if exists
    if (mongodbCaseId && isClient) {
      try {
        const { deleteCase: deleteCaseAPI } = await import(
          "@/lib/backend-service"
        );
        await deleteCaseAPI(mongodbCaseId);
        console.log(`Case ${mongodbCaseId} deleted from MongoDB`);
      } catch (error) {
        console.error("Error deleting case from MongoDB:", error);
        // Continue with local deletion even if MongoDB deletion fails
      }
    }

    // Remove from local state
    setCases((prevCases) => prevCases.filter((c) => c.id !== id));

    // Clean up localStorage entries for this case
    if (isClient) {
      try {
        localStorage.removeItem(`case_${id}_mongodb_id`);
        localStorage.removeItem(`case_${id}_session`);
      } catch (error) {
        console.error("Error cleaning up localStorage:", error);
      }
    }
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
    deleteCase,
    clearAllCases,
  };

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}

export function useCases() {
  const context = useContext(CaseContext);
  if (context === undefined) {
    throw new Error("useCases must be used within a CaseProvider");
  }
  return context;
}
