import type { LineAnalysis } from "../lib/lineAnalysis";
export function Clue({
  values,
  analysis,
  vertical,
  selected,
  onSelect,
}: {
  values: number[];
  analysis: LineAnalysis | null;
  vertical?: boolean;
  selected?: number | null;
  onSelect?: (clueIndex: number) => void;
}) {
  const empty = values.length === 1 && values[0] === 0;
  const state = !analysis
    ? "computing"
    : analysis.conflict
      ? "conflict"
      : analysis.satisfied
        ? "done"
        : "";
  return (
    <div
      className={`clue ${vertical ? "vertical" : ""} ${state} ${selected != null ? "active-line" : ""}`}
      aria-label={
        values.join("、") +
        (!analysis
          ? " 候选计算中"
          : analysis.conflict
            ? " 没有合法排列"
            : analysis.satisfied
              ? " 已满足"
              : "")
      }
    >
      {values.map((v, i) =>
        empty || !onSelect ? (
          <span key={i}>{v}</span>
        ) : (
          <button
            key={i}
            type="button"
            className={`clue-num ${analysis && analysis.certainStarts[i] !== null ? "certain" : ""} ${selected === i ? "selected" : ""}`}
            aria-pressed={selected === i}
            aria-label={`数字 ${v}${analysis && analysis.certainStarts[i] !== null ? "，位置已确定" : ""}，点选查看合法范围`}
            onClick={() => onSelect(i)}
          >
            {v}
          </button>
        ),
      )}
    </div>
  );
}
