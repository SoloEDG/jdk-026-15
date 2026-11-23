import { clueSet, runs } from "../../../shared/clues";
import type { Mark, Puzzle } from "../../../shared/types";
export interface Segment {
  start: number;
  end: number;
}
export interface LineAnalysis {
  clue: number[];
  placements: number[][];
  segments: Segment[][];
  certainStarts: (number | null)[];
  possible: boolean[][];
  certain: boolean[][];
  cellClues: number[][];
  conflict: boolean;
  satisfied: boolean;
}
export function clueLengths(clue: number[]): number[] {
  return clue.length === 1 && clue[0] === 0 ? [] : clue;
}
export function enumeratePlacements(
  size: number,
  clue: number[],
  marks: Mark[],
): number[][] {
  const lens = clueLengths(clue);
  if (lens.length === 0)
    return marks.some((m) => m === "filled") ? [] : [[]];
  const placements: number[][] = [];
  const starts = new Array(lens.length).fill(0);
  const suffix = new Array(lens.length + 1).fill(0);
  for (let k = lens.length - 1; k >= 0; k--)
    suffix[k] = suffix[k + 1] + lens[k];
  const gapClear = (from: number, to: number) => {
    for (let i = from; i < to; i++) if (marks[i] === "filled") return false;
    return true;
  };
  const runFits = (start: number, len: number) => {
    for (let i = start; i < start + len; i++)
      if (marks[i] === "cross") return false;
    return true;
  };
  const place = (k: number): void => {
    if (k === lens.length) {
      if (gapClear(starts[lens.length - 1] + lens[lens.length - 1], size))
        placements.push([...starts]);
      return;
    }
    const prevEnd = k === 0 ? 0 : starts[k - 1] + lens[k - 1];
    const minSpace = suffix[k + 1] + (lens.length - 1 - k);
    for (
      let start = prevEnd + (k === 0 ? 0 : 1);
      start + lens[k] + minSpace <= size;
      start++
    ) {
      if (!gapClear(prevEnd, start)) break;
      if (!runFits(start, lens[k])) continue;
      starts[k] = start;
      place(k + 1);
    }
  };
  place(0);
  return placements;
}
export function analyzeLine(
  size: number,
  clue: number[],
  marks: Mark[],
): LineAnalysis {
  const lens = clueLengths(clue);
  const placements = enumeratePlacements(size, clue, marks);
  const segments = lens.map((len, k) => {
    const seen = new Set<number>();
    const list: Segment[] = [];
    for (const placement of placements) {
      const start = placement[k];
      if (seen.has(start)) continue;
      seen.add(start);
      list.push({ start, end: start + len });
    }
    return list.sort((a, b) => a.start - b.start);
  });
  const certainStarts = lens.map((_, k) => {
    if (placements.length === 0) return null;
    const first = placements[0][k];
    return placements.every((p) => p[k] === first) ? first : null;
  });
  const possible = lens.map((len, k) => {
    const cells = Array(size).fill(false);
    for (const placement of placements)
      for (let i = placement[k]; i < placement[k] + len; i++) cells[i] = true;
    return cells;
  });
  const certain = lens.map((len, k) => {
    const cells = Array(size).fill(false);
    if (placements.length === 0) return cells;
    for (let i = 0; i < size; i++)
      cells[i] = placements.every(
        (p) => i >= p[k] && i < p[k] + len,
      );
    return cells;
  });
  const cellClues = Array.from({ length: size }, (_, i) =>
    lens.flatMap((_, k) => (possible[k][i] ? [k] : [])),
  );
  const satisfied =
    JSON.stringify(runs(marks.map((m) => (m === "filled" ? 1 : 0)))) ===
    JSON.stringify(clue);
  return {
    clue,
    placements,
    segments,
    certainStarts,
    possible,
    certain,
    cellClues,
    conflict: placements.length === 0,
    satisfied,
  };
}
export function lineMarks(puzzle: Puzzle, marks: Mark[], line: number): Mark[] {
  const n = puzzle.size;
  return Array.from({ length: n }, (_, i) =>
    marks[line < n ? line * n + i : i * n + line - n],
  );
}
export type AnalysisCache = Map<number, { sig: string; analysis: LineAnalysis }>;
export function analyzeBoard(
  puzzle: Puzzle,
  marks: Mark[],
  cache?: AnalysisCache,
): LineAnalysis[] {
  return clueSet(puzzle.size, puzzle.solution).map((clue, line) => {
    const current = lineMarks(puzzle, marks, line);
    const sig = clue.join(",") + "|" + current.join();
    const hit = cache?.get(line);
    if (hit && hit.sig === sig) return hit.analysis;
    const analysis = analyzeLine(puzzle.size, clue, current);
    cache?.set(line, { sig, analysis });
    return analysis;
  });
}
