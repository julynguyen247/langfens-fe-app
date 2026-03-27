"use client";

import { useState, useEffect, useCallback } from "react";
import { RoleplayScenario } from "@/types/speaking";

interface UseRoleplayScenariosReturn {
  scenarios: RoleplayScenario[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRoleplayScenarios(): UseRoleplayScenariosReturn {
  const [scenarios, setScenarios] = useState<RoleplayScenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScenarios = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/speaking/roleplay/scenarios");

      if (!response.ok) {
        throw new Error(`Failed to fetch scenarios: ${response.status}`);
      }

      const data = await response.json();
      setScenarios(data.scenarios || []);
    } catch (err) {
      console.error("[RoleplayScenarios] Fetch error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  return {
    scenarios,
    isLoading,
    error,
    refetch: fetchScenarios,
  };
}
