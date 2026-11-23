export { BoardPanel } from "./ui/BoardPanel";
export { applyMark, undoMark } from "./model/edits";
export {
  addNote,
  removeNote,
  noteStatus,
  sanitizeNotes,
  type NoteStatus,
} from "./model/notes";
export {
  analyzeLine,
  analyzeBoard,
  enumeratePlacements,
  clueLengths,
  type LineAnalysis,
  type Segment,
} from "./lib/lineAnalysis";
export { useLineAnalyses } from "./lib/useLineAnalyses";
