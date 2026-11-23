export type Mark = "unknown" | "filled" | "cross";
export type Tool = "filled" | "cross" | "unknown";
export interface Puzzle {
  id: string;
  title: string;
  collection: string;
  level: "入门" | "进阶" | "挑战";
  size: number;
  solution: number[];
  color: string;
}
export interface Move {
  index: number;
  before: Mark;
  after: Mark;
}
export type NoteKind = "candidate" | "excluded";
export interface ClueRef {
  line: number;
  clueIndex: number;
}
export interface NoteDraft extends ClueRef {
  start: number;
  end: number;
  kind: NoteKind;
  reason: string;
}
export interface SegmentNote extends NoteDraft {
  id: string;
  version: number;
}
export interface Session {
  puzzleId: string;
  marks: Mark[];
  moves: Move[];
  notes: SegmentNote[];
  marksVersion: number;
  hints: number;
  checks: number;
  seconds: number;
  solved: boolean;
  updatedAt: number;
}
export interface SolveRecord {
  id: string;
  puzzleId: string;
  seconds: number;
  hints: number;
  checks: number;
  finishedAt: number;
}
export interface GameDocument {
  version: 1;
  activeId: string;
  sessions: Record<string, Session>;
  records: SolveRecord[];
}
export type GameAction =
  | { type: "open"; id: string }
  | { type: "mark"; index: number; mark: Mark }
  | { type: "undo" }
  | { type: "hint"; index: number; mark: Mark }
  | { type: "check" }
  | { type: "tick" }
  | { type: "note"; note: NoteDraft }
  | { type: "dropNote"; id: string }
  | { type: "reset" };
