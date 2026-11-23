import { useState } from "react";
import {
  Lightbulb,
  Pin,
  Ban,
  Trash2,
  CircleCheck,
  CircleOff,
  Hourglass,
} from "lucide-react";
import type {
  ClueRef,
  NoteDraft,
  Puzzle,
  SegmentNote,
  Session,
} from "../../../shared/types";
import {
  clueLengths,
  type LineAnalysis,
  type Segment,
} from "../../board/lib/lineAnalysis";
import { noteStatus, type NoteStatus } from "../../board/model/notes";
const REASON_PRESETS = ["与已填格冲突", "剩余空间不够", "与另一方向矛盾", "先记下这个推测"];
function lineLabel(line: number, size: number): string {
  return line < size ? `第 ${line + 1} 行` : `第 ${line - size + 1} 列`;
}
const STATUS_LABEL: Record<NoteStatus, string> = {
  active: "有效",
  confirmed: "已证实",
  invalid: "已失效",
};
function NoteItem({
  note,
  size,
  status,
  onDrop,
}: {
  note: SegmentNote;
  size: number;
  status: NoteStatus | null;
  onDrop: (id: string) => void;
}) {
  return (
    <li className={`note-item ${status ?? "checking"}`}>
      <div className="note-head">
        <span className={`note-kind ${note.kind}`}>
          {note.kind === "candidate" ? <Pin size={11} /> : <Ban size={11} />}
          {note.kind === "candidate" ? "候选" : "排除"}
        </span>
        <span className="note-where">
          {lineLabel(note.line, size)} · 第 {note.start + 1}–{note.end} 格
        </span>
        <em className={`note-status ${status ?? ""}`}>
          {status === null ? "核对中…" : STATUS_LABEL[status]}
        </em>
        <button
          aria-label="删除这条笔记"
          title="删除这条笔记"
          onClick={() => onDrop(note.id)}
        >
          <Trash2 size={13} />
        </button>
      </div>
      {note.reason && <p className="note-reason">{note.reason}</p>}
    </li>
  );
}
export function ReasoningPanel({
  puzzle,
  session,
  selection,
  analyses,
  computing,
  onPin,
  onDrop,
}: {
  puzzle: Puzzle;
  session: Session;
  selection: ClueRef | null;
  analyses: LineAnalysis[] | null;
  computing: boolean;
  onPin: (note: NoteDraft) => void;
  onDrop: (id: string) => void;
}) {
  const [excluding, setExcluding] = useState<Segment | null>(null);
  const [reason, setReason] = useState("");
  const size = puzzle.size;
  const analysis = selection && analyses ? analyses[selection.line] : null;
  const clueValue = selection
    ? clueLengths(analysis?.clue ?? [])[selection.clueIndex]
    : undefined;
  const segments = selection && analysis ? analysis.segments[selection.clueIndex] : null;
  const certainStart = selection && analysis ? analysis.certainStarts[selection.clueIndex] : null;
  const pinned = new Set(
    session.notes
      .filter((n) => selection && n.line === selection.line && n.clueIndex === selection.clueIndex)
      .map((n) => `${n.kind}:${n.start}`),
  );
  const pin = (segment: Segment, kind: "candidate" | "excluded", text: string) => {
    if (!selection) return;
    onPin({
      line: selection.line,
      clueIndex: selection.clueIndex,
      start: segment.start,
      end: segment.end,
      kind,
      reason: text,
    });
  };
  const confirmExclude = () => {
    if (!excluding) return;
    pin(excluding, "excluded", reason.trim() || REASON_PRESETS[3]);
    setExcluding(null);
    setReason("");
  };
  const sortedNotes = [...session.notes].sort(
    (a, b) => a.line - b.line || a.clueIndex - b.clueIndex || a.start - b.start,
  );
  return (
    <section className="panel reasoning">
      <span className="eyebrow">REASONING NOTES</span>
      <h2>
        <Lightbulb size={16} />
        候选与推理
      </h2>
      {!selection && (
        <p className="muted">
          点选任意一个线索数字，查看它在当前标记下所有仍合法的放置范围；相同数字也能分清各自的位置。
        </p>
      )}
      {selection && computing && (
        <p className="reasoning-state">
          <Hourglass size={14} /> 候选计算中…
        </p>
      )}
      {selection && !computing && analysis?.conflict && (
        <p className="reasoning-state conflict">
          这条线在当前标记下没有任何合法排列，最近的标记可能需要修正。
        </p>
      )}
      {selection && !computing && analysis && !analysis.conflict && segments && (
        <>
          <p className="reasoning-title">
            {lineLabel(selection.line, size)} · 数字 {clueValue}
            <em>
              {certainStart !== null
                ? "所有合法解释都指向同一位置，已确定"
                : `${analysis.placements.length} 种合法排列，${segments.length} 段候选`}
            </em>
          </p>
          <ul className="segment-list">
            {segments.map((seg) => {
              const certain = certainStart === seg.start;
              return (
                <li key={seg.start} className={certain ? "certain" : ""}>
                  <span>
                    第 {seg.start + 1}–{seg.end} 格
                  </span>
                  {certain && (
                    <em className="seg-certain">
                      <CircleCheck size={12} /> 已确定
                    </em>
                  )}
                  {!session.solved && (
                    <span className="seg-actions">
                      <button
                        disabled={pinned.has(`candidate:${seg.start}`)}
                        onClick={() => pin(seg, "candidate", "")}
                      >
                        <Pin size={12} />
                        {pinned.has(`candidate:${seg.start}`) ? "已记录" : "记为候选"}
                      </button>
                      <button
                        disabled={pinned.has(`excluded:${seg.start}`)}
                        onClick={() => {
                          setExcluding(seg);
                          setReason("");
                        }}
                      >
                        <Ban size={12} />
                        {pinned.has(`excluded:${seg.start}`) ? "已排除" : "排除"}
                      </button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {excluding && (
            <div className="exclude-form">
              <p>
                <CircleOff size={13} /> 排除第 {excluding.start + 1}–{excluding.end} 格的理由
              </p>
              <div className="reason-chips">
                {REASON_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    className={reason === preset ? "active" : ""}
                    onClick={() => setReason(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                value={reason}
                maxLength={120}
                placeholder="写下你的排除理由…"
                onChange={(e) => setReason(e.target.value)}
              />
              <div className="exclude-actions">
                <button onClick={() => setExcluding(null)}>取消</button>
                <button className="primary" onClick={confirmExclude}>
                  记录排除
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {sortedNotes.length > 0 && (
        <>
          <h3 className="note-list-title">推理笔记 · {sortedNotes.length}</h3>
          <ul className="note-list">
            {sortedNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                size={size}
                status={
                  analyses ? noteStatus(note, analyses[note.line]) : null
                }
                onDrop={onDrop}
              />
            ))}
          </ul>
        </>
      )}
      <small className="reasoning-hint">
        笔记只是你的推理记录：标记变化后结论会重新核对，失效的推测不会被当成真实填涂。
      </small>
    </section>
  );
}
