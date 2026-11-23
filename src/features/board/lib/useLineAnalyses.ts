import { useEffect, useRef, useState } from "react";
import type { Mark, Puzzle } from "../../../shared/types";
import {
  analyzeBoard,
  type AnalysisCache,
  type LineAnalysis,
} from "./lineAnalysis";
export function useLineAnalyses(
  puzzle: Puzzle,
  marks: Mark[],
  version: number,
): { analyses: LineAnalysis[] | null; computing: boolean } {
  const cache = useRef<AnalysisCache>(new Map());
  const [ready, setReady] = useState<{
    puzzleId: string;
    version: number;
    analyses: LineAnalysis[];
  }>({ puzzleId: "", version: -1, analyses: [] });
  useEffect(() => {
    const analyses = analyzeBoard(puzzle, marks, cache.current);
    setReady({ puzzleId: puzzle.id, version, analyses });
  }, [puzzle, marks, version]);
  const computing = ready.puzzleId !== puzzle.id || ready.version !== version;
  return { analyses: computing ? null : ready.analyses, computing };
}
