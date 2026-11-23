import { clueSet } from "../../../shared/clues";
import type {
  NoteDraft,
  Puzzle,
  SegmentNote,
  Session,
} from "../../../shared/types";
import { clueLengths, type LineAnalysis } from "../lib/lineAnalysis";
export type NoteStatus = "active" | "confirmed" | "invalid";
const NOTE_LIMIT = 200;
const REASON_LIMIT = 120;
function validDraft(puzzle: Puzzle, draft: NoteDraft): boolean {
  const size = puzzle.size;
  if (!Number.isInteger(draft.line) || draft.line < 0 || draft.line >= size * 2)
    return false;
  if (!Number.isInteger(draft.clueIndex) || draft.clueIndex < 0) return false;
  const lens = clueLengths(clueSet(size, puzzle.solution)[draft.line]);
  if (draft.clueIndex >= lens.length) return false;
  if (
    !Number.isInteger(draft.start) ||
    !Number.isInteger(draft.end) ||
    draft.start < 0 ||
    draft.end > size ||
    draft.end - draft.start !== lens[draft.clueIndex]
  )
    return false;
  return draft.kind === "candidate" || draft.kind === "excluded";
}
export function addNote(
  session: Session,
  puzzle: Puzzle,
  draft: NoteDraft,
): Session {
  if (session.solved || !validDraft(puzzle, draft)) return session;
  const note: SegmentNote = {
    ...draft,
    reason: draft.reason.trim().slice(0, REASON_LIMIT),
    id: crypto.randomUUID(),
    version: session.marksVersion,
  };
  const notes = session.notes.filter(
    (n) =>
      !(
        n.line === note.line &&
        n.clueIndex === note.clueIndex &&
        n.start === note.start &&
        n.end === note.end &&
        n.kind === note.kind
      ),
  );
  return {
    ...session,
    notes: [...notes, note].slice(-NOTE_LIMIT),
    updatedAt: Date.now(),
  };
}
export function removeNote(session: Session, id: string): Session {
  if (!session.notes.some((n) => n.id === id)) return session;
  return {
    ...session,
    notes: session.notes.filter((n) => n.id !== id),
    updatedAt: Date.now(),
  };
}
export function noteStatus(
  note: SegmentNote,
  analysis: LineAnalysis,
): NoteStatus {
  const legal =
    analysis.segments[note.clueIndex]?.some(
      (s) => s.start === note.start && s.end === note.end,
    ) ?? false;
  if (note.kind === "candidate") return legal ? "active" : "invalid";
  if (analysis.conflict) return "active";
  if (!legal) return "confirmed";
  return analysis.certainStarts[note.clueIndex] === note.start
    ? "invalid"
    : "active";
}
export function sanitizeNotes(puzzle: Puzzle, raw: unknown): SegmentNote[] {
  if (!Array.isArray(raw)) return [];
  const notes: SegmentNote[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const note = item as SegmentNote;
    if (typeof note.id !== "string" || !note.id) continue;
    if (!Number.isFinite(note.version) || note.version < 0) continue;
    const draft: NoteDraft = {
      line: note.line,
      clueIndex: note.clueIndex,
      start: note.start,
      end: note.end,
      kind: note.kind,
      reason: typeof note.reason === "string" ? note.reason : "",
    };
    if (!validDraft(puzzle, draft)) continue;
    notes.push({
      ...draft,
      reason: draft.reason.slice(0, REASON_LIMIT),
      id: note.id,
      version: Math.floor(note.version),
    });
    if (notes.length >= NOTE_LIMIT) break;
  }
  return notes;
}
