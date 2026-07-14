import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface TeamResult {
  nickname: string | null;
  resultType: string;
  completedAt: string;
}

export function useSubmitQuizResult() {
  return {
    mutate: async (input: any, options?: { onSuccess?: () => void }) => {
      const data = input?.data ?? input;

      const { error } = await supabase.from("quiz_results").insert({
        team_code: data.teamId || "default",
        nickname: data.nickname || null,
        result_type: data.resultType,
      });

      if (error) {
        alert(`Supabase chyba: ${error.message}`);
        console.error("Supabase insert error:", error);
        return;
      }

      options?.onSuccess?.();
    },
    data: null,
  };
}

export function useGetQuizStats() {
  return {
    data: null,
    isLoading: false,
  };
}

export function useGetTeamResults(teamId: string) {
  const [results, setResults] = useState<TeamResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataUpdatedAt, setDataUpdatedAt] = useState(0);

  const loadResults = async () => {
    if (!teamId) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from("quiz_results")
      .select("*")
      .eq("team_code", teamId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase load error:", error);
    } else {
      setResults(
        (data ?? []).map((row) => ({
          nickname: row.nickname,
          resultType: row.result_type,
          completedAt: row.created_at,
        }))
      );
      setDataUpdatedAt(Date.now());
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void loadResults();
  }, [teamId]);

  return {
    data: { results },
    isLoading,
    dataUpdatedAt,
    refetch: loadResults,
  };
}

export const getGetQuizStatsQueryKey = () => ["quiz-stats"];

export const getGetTeamResultsQueryKey = (teamId: string) => [
  "team-results",
  teamId,
];
