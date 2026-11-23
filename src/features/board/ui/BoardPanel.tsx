import { useMemo, useState } from "react";
import { Clock3, CheckCircle2, MousePointer2, TriangleAlert } from "lucide-react";
import { clueSet } from "../../../shared/clues";
import type { ClueRef, Puzzle, Session, Tool } from "../../../shared/types";
import { completion } from "../../../shared/document";
import type { LineAnalysis } from "../lib/lineAnalysis";
import { noteStatus } from "../model/notes";
import { BoardToolbar } from "./BoardToolbar";
import { Clue } from "./Clue";
export function BoardPanel({
  puzzle,
  session,
  analyses,
  computing,
  selection,
  onSelectClue,
  onMark,
  onUndo,
  onReset,
}: {
  puzzle: Puzzle;
  session: Session;
  analyses: LineAnalysis[] | null;
  computing: boolean;
  selection: ClueRef | null;
  onSelectClue: (ref: ClueRef | null) => void;
  onMark: (i: number, t: Tool) => void;
  onUndo: () => void;
  onReset: () => void;
}) {
  const [tool, setTool] = useState<Tool>("filled");
  const size = puzzle.size;
  const clues = clueSet(size, puzzle.solution);
  const satisfied = analyses?.filter((a) => a.satisfied).length ?? 0;
  const conflicts = analyses?.filter((a) => a.conflict).length ?? 0;
  const highlights = useMemo(() => {
    const map = new Map<number, string>();
    if (!analyses) return map;
    const add = (line: number, offset: number, cls: string) => {
      const index = line < size ? line * size + offset : offset * size + line - size;
      map.set(index, (map.get(index) ?? "") + cls);
    };
    if (selection) {
      const analysis = analyses[selection.line];
      const cls = selection.line < size ? " hl-row" : " hl-col";
      if (analysis && !analysis.conflict) {
        analysis.possible[selection.clueIndex]?.forEach((ok, offset) => {
          if (ok) add(selection.line, offset, cls);
        });
        analysis.certain[selection.clueIndex]?.forEach((ok, offset) => {
          if (ok) add(selection.line, offset, " hl-certain");
        });
      }
    }
    for (const note of session.notes) {
      const analysis = analyses[note.line];
      if (!analysis || noteStatus(note, analysis) !== "active") continue;
      const cls =
        note.kind === "candidate"
          ? " note-cand"
          : note.line < size
            ? " note-excl-row"
            : " note-excl-col";
      for (let offset = note.start; offset < note.end; offset++)
        add(note.line, offset, cls);
    }
    return map;
  }, [analyses, selection, session.notes, size]);
  const pick = (line: number) => (clueIndex: number) =>
    onSelectClue(
      selection && selection.line === line && selection.clueIndex === clueIndex
        ? null
        : { line, clueIndex },
    );
  return (
    <section className="board-panel panel">
      <div className="board-heading">
        <div>
          <span className="eyebrow">
            A LITTLE DISCOVERY · {puzzle.collection}
          </span>
          <h1>
            {session.solved ? puzzle.title : "一格一格，拼出惊喜"}
            <span className="level-tag">{puzzle.level}</span>
          </h1>
        </div>
        <div className="timer">
          <Clock3 size={15} />
          {Math.floor(session.seconds / 60)
            .toString()
            .padStart(2, "0")}
          :{(session.seconds % 60).toString().padStart(2, "0")}
        </div>
      </div>
      <BoardToolbar
        tool={tool}
        onTool={setTool}
        onUndo={onUndo}
        onReset={onReset}
        canUndo={session.moves.length > 0}
        disabled={session.solved}
      />
      <div className="board-stage">
        <div
          className="puzzle-grid"
          style={{
            gridTemplateColumns: `64px repeat(${puzzle.size}, var(--cell))`,
            gridTemplateRows: `64px repeat(${puzzle.size}, var(--cell))`,
          }}
        >
          <div className="grid-corner">
            <span>
              {puzzle.size}×{puzzle.size}
            </span>
            <small>NONOGRAM</small>
          </div>
          {clues.slice(puzzle.size).map((v, i) => (
            <Clue
              key={"c" + i}
              values={v}
              analysis={analyses ? analyses[puzzle.size + i] : null}
              selected={
                selection?.line === puzzle.size + i ? selection.clueIndex : null
              }
              onSelect={pick(puzzle.size + i)}
              vertical
            />
          ))}
          {Array.from({ length: puzzle.size }, (_, row) => (
            <div className="grid-row" key={row}>
              <Clue
                values={clues[row]}
                analysis={analyses ? analyses[row] : null}
                selected={
                  selection?.line === row ? selection.clueIndex : null
                }
                onSelect={pick(row)}
              />
              {Array.from({ length: puzzle.size }, (_, col) => {
                const i = row * puzzle.size + col;
                const mark = session.marks[i];
                return (
                  <button
                    key={col}
                    aria-label={`第${row + 1}行第${col + 1}列 ${mark === "filled" ? "已填" : mark === "cross" ? "标空" : "未知"}`}
                    className={`cell ${mark} ${(col + 1) % 5 === 0 ? "major-right" : ""} ${(row + 1) % 5 === 0 ? "major-bottom" : ""}${highlights.get(i) ?? ""}`}
                    disabled={session.solved}
                    onClick={() =>
                      onMark(i, session.marks[i] === tool ? "unknown" : tool)
                    }
                    onContextMenu={(e) => {
                      e.preventDefault();
                      onMark(i, mark === "cross" ? "unknown" : "cross");
                    }}
                  >
                    {mark === "cross" ? "×" : ""}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="board-footer">
        <span>
          <MousePointer2 size={14} /> 左键填涂 · 右键标空 · 点选数字看候选
        </span>
        <span>
          {conflicts > 0 && (
            <em className="conflict-flag">
              <TriangleAlert size={13} /> {conflicts} 条线没有合法排列
            </em>
          )}
          <span className="status-dot" />
          {computing
            ? "候选计算中…"
            : `${satisfied} / ${puzzle.size * 2} 条线已满足`}
        </span>
      </div>
      <div className="progress-caption">
        <span>
          {session.solved ? (
            <>
              <CheckCircle2 size={15} />
              图案已揭晓
            </>
          ) : (
            "每一小步，都离答案更近"
          )}
        </span>
        <strong>{completion(session)}% 已标记</strong>
      </div>
      <div className="progress-track">
        <span style={{ width: completion(session) + "%" }} />
      </div>
    </section>
  );
}
