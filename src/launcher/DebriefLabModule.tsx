import { useState, useCallback } from "react";
import { loadPrepData, savePrepData, type StarQuestionItem } from "./PrepStudioModule";
import { showToast } from "../stores/toastStore";
import type { MeetingSummary } from "../lib/types";
import {
  Sparkles,
  Plus,
  BookmarkPlus,
  Mail,
  Copy,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
} from "lucide-react";

interface DebriefRow {
  id: string;
  question: string;
  rawAnswer: string;
  nativeRewrite: string;
  rationale: string;
  addedToMistakes: boolean;
}

const DEFAULT_DEBRIEF_ROWS: DebriefRow[] = [
  {
    id: "debrief_1",
    question:
      "Tell me about a time you had to resolve a high-severity latency issue in production.",
    rawAnswer:
      "Um, so basically our audio pipeline was super slow and users complained that transcripts took like 15 seconds. I looked at the logs and saw the 1-second chunking was padding to 30 seconds every time, so I changed the chunk size to 3.5s and switched the model, and it got a lot faster.",
    nativeRewrite:
      "When our real-time transcription pipeline hit a 16.5-second CPU bottleneck, I traced the root cause to 1-second slices triggering redundant 30-second encoder padding. I re-architected the dual-pass window to 3.5s chunks and deployed an int8 quantized model, cutting end-to-end latency by 78% (down to <3.0s).",
    rationale:
      "去除了 'um / so basically / like' 口头禅；将模糊的 'got a lot faster' 升级为精确的 '78% 延迟下降 (<3.0s)'，凸显根因定位能力。",
    addedToMistakes: false,
  },
  {
    id: "debrief_2",
    question:
      "How do you handle low-quality or noisy input data across heterogeneous client hardware?",
    rawAnswer:
      "At first I tried adding an automatic gain boost multiplying weak signals by 4x, uh, but then I noticed it clipped the audio and made the background noise worse, so I rolled it back and used per-channel normalization instead.",
    nativeRewrite:
      "Instead of relying on naive gain boosting—which our ablation tests showed introduced 17 clipping artifacts and amplified floor noise—I implemented per-channel Cepstral Mean and Variance Normalization (CMVN), making recognition 100% invariant to microphone gain across client devices.",
    rationale:
      "把“试错回滚”包装成极具说服力的“严谨消融实验（Ablation Study）+ 理论级特征归一化（CMVN）”高管级叙事。",
    addedToMistakes: false,
  },
];

interface DebriefLabModuleProps {
  recentMeetings: MeetingSummary[];
  onSelectMeeting: (id: string) => void;
  onJumpToPrepMistakes: () => void;
}

export function DebriefLabModule({
  recentMeetings,
  onSelectMeeting,
  onJumpToPrepMistakes,
}: DebriefLabModuleProps) {
  const [rows, setRows] = useState<DebriefRow[]>(() => {
    try {
      const saved = localStorage.getItem("ic_debrief_rows_v1");
      return saved ? JSON.parse(saved) : DEFAULT_DEBRIEF_ROWS;
    } catch {
      return DEFAULT_DEBRIEF_ROWS;
    }
  });

  const [newQ, setNewQ] = useState("");
  const [newRaw, setNewRaw] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);

  const persistRows = useCallback((next: DebriefRow[]) => {
    setRows(next);
    try {
      localStorage.setItem("ic_debrief_rows_v1", JSON.stringify(next));
    } catch (e) {
      console.error("[DebriefLab] Failed to save rows:", e);
    }
  }, []);

  // Automatically convert a raw spoken answer into a native STAR upgrade row
  const handleAddDebriefRow = useCallback(() => {
    if (!newQ.trim() || !newRaw.trim()) return;
    const cleaned = newRaw
      .replace(/\b(um|uh|like|you know|basically|actually)\b,?\s*/gi, "")
      .trim();
    const row: DebriefRow = {
      id: `debrief_${Date.now()}`,
      question: newQ.trim(),
      rawAnswer: newRaw.trim(),
      nativeRewrite: `In this scenario, I focused on measurable execution: ${cleaned} As a result, we improved reliability and delivered ahead of SLA targets.`,
      rationale:
        "自动剔除口头禅填充词，补齐第一人称主动动词与量化 Result 收尾结构。",
      addedToMistakes: false,
    };
    persistRows([row, ...rows]);
    setNewQ("");
    setNewRaw("");
    showToast("已生成四栏找茬对照卡片！", "success");
  }, [newQ, newRaw, rows, persistRows]);

  // Send a weak question + its native rewrite directly into Module 1's Mistake Book!
  const handlePushToMistakeBook = useCallback(
    (row: DebriefRow) => {
      const prep = loadPrepData();
      const mistakeItem: StarQuestionItem = {
        id: `q_mistake_${Date.now()}`,
        category: "mistake_book",
        question: `[错题重练] ${row.question}`,
        situation: "From post-interview debrief review",
        task: "Deliver a crisp, filler-free STAR response with hard metrics",
        action: row.nativeRewrite,
        result: "Target: <90s delivery with 0 filler words and concrete % impact",
        opener: row.nativeRewrite.split(".")[0] + ".",
        bullets: [
          `Core Problem: ${row.question.slice(0, 55)}`,
          `Upgraded Pitch: ${row.nativeRewrite.slice(0, 65)}`,
          `Key Fix: ${row.rationale.slice(0, 60)}`,
        ],
        keywords: "STAR Upgrade · Zero Fillers · Quantified Metric",
        practicedCount: 0,
      };
      savePrepData({
        ...prep,
        questions: [mistakeItem, ...prep.questions],
      });
      persistRows(
        rows.map((r) => (r.id === row.id ? { ...r, addedToMistakes: true } : r))
      );
      showToast("已将该题与满分改写压入「Module 1 错题本」！", "success");
    },
    [rows, persistRows]
  );

  const thankYouEmailText =
    `Subject: Thank You — ${loadPrepData().roleTitle} Interview\n\n` +
    `Hi [Interviewer Name],\n\n` +
    `Thank you so much for taking the time to speak with me today about the ${loadPrepData().roleTitle} role at ${loadPrepData().company}. ` +
    `I really enjoyed our conversation, especially diving into ${rows[0]?.question.slice(0, 60) ?? "system architecture and performance optimization"}...\n\n` +
    `Our discussion reinforced my excitement about contributing my experience in low-latency pipelines and high-reliability engineering to your team.\n\n` +
    `Best regards,\n[Your Name]`;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 py-4 space-y-4">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/30 bg-card/40 p-3">
        <div>
          <h2 className="text-sm font-bold text-foreground">
            🎬 面后手术刀复盘室 (大家来找茬四栏对比 + 录音回听 + 错题回流)
          </h2>
          <p className="text-meta text-muted-foreground">
            逐句对比「面试真题 vs 你的原话漏洞 vs 母语级满分改写」，一键把薄弱题压回 Module 1 错题本重练
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmailModal((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5" />
            一键生成 Thank-You Email
          </button>
          <button
            onClick={onJumpToPrepMistakes}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/90 cursor-pointer"
          >
            去 Module 1 重刷错题本 →
          </button>
        </div>
      </div>

      {/* Optional Thank-You Email Draft Box */}
      {showEmailModal && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary">
              ✉️ 自动定制的面试后跟进邮件 (Thank-You Note)
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(thankYouEmailText);
                showToast("已复制 Thank-You Email 到剪贴板！", "success");
              }}
              className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-meta font-semibold text-white cursor-pointer"
            >
              <Copy className="h-3 w-3" />
              复制邮件
            </button>
          </div>
          <pre className="whitespace-pre-wrap rounded-lg bg-background/80 p-3 text-xs text-foreground font-sans">
            {thankYouEmailText}
          </pre>
        </div>
      )}

      {/* Quick Recording & Session Selector Bar */}
      {recentMeetings.length > 0 && (
        <div className="rounded-xl border border-border/30 bg-card/30 p-3">
          <div className="text-meta font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            🎧 最近面试录音与逐字稿档案（点击直接调出底部声波播放器回听）：
          </div>
          <div className="flex flex-wrap gap-2">
            {recentMeetings.slice(0, 5).map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectMeeting(m.id)}
                className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/50 hover:bg-primary/10 transition-all cursor-pointer"
              >
                <PlayCircle className="h-3.5 w-3.5 text-primary" />
                <span>{m.title}</span>
                <span className="text-meta text-muted-foreground">
                  ({Math.round(m.duration_seconds ?? 0)}s)
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Add New Question & Raw Answer for Spot-the-Difference Upgrade */}
      <div className="rounded-xl border border-border/30 bg-card/30 p-3.5 space-y-2">
        <div className="text-xs font-bold text-foreground">
          ➕ 新增一题进行「找茬式」母语级改写诊断：
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <input
            type="text"
            value={newQ}
            onChange={(e) => setNewQ(e.target.value)}
            placeholder="输入面试官问的真题..."
            className="md:col-span-4 rounded-lg border border-border/30 bg-background/60 px-2.5 py-1.5 text-xs text-foreground"
          />
          <input
            type="text"
            value={newRaw}
            onChange={(e) => setNewRaw(e.target.value)}
            placeholder="粘贴你当时的回答原话（哪怕有 um/uh 或语法不顺）..."
            className="md:col-span-6 rounded-lg border border-border/30 bg-background/60 px-2.5 py-1.5 text-xs text-foreground"
          />
          <button
            onClick={handleAddDebriefRow}
            className="md:col-span-2 flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/90 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            生成找茬对比
          </button>
        </div>
      </div>

      {/* 4-Column Spot-the-Difference Comparison Table */}
      <div className="overflow-x-auto rounded-xl border border-border/30 bg-card/30">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border/30 bg-secondary/40 text-meta font-bold uppercase text-foreground">
              <th className="p-3 w-[22%]">模块 / 面试真题 (Question)</th>
              <th className="p-3 w-[27%] text-destructive">
                🔴 你的原话与痛点 (Before)
              </th>
              <th className="p-3 w-[29%] text-success">
                🟢 母语级高分改写 (After)
              </th>
              <th className="p-3 w-[22%]">💡 差异解析 & 错题本</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {rows.map((row) => (
              <tr key={row.id} className="align-top hover:bg-accent/10">
                <td className="p-3 font-semibold text-foreground">
                  {row.question}
                </td>
                <td className="p-3 text-muted-foreground leading-relaxed">
                  <div className="flex items-start gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive mt-0.5" />
                    <span>{row.rawAnswer}</span>
                  </div>
                </td>
                <td className="p-3 text-foreground leading-relaxed font-medium">
                  <div className="flex items-start gap-1">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-success mt-0.5" />
                    <span>{row.nativeRewrite}</span>
                  </div>
                </td>
                <td className="p-3 space-y-2">
                  <p className="text-meta text-muted-foreground leading-snug">
                    {row.rationale}
                  </p>
                  <button
                    onClick={() => handlePushToMistakeBook(row)}
                    disabled={row.addedToMistakes}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-meta font-semibold transition-all cursor-pointer ${
                      row.addedToMistakes
                        ? "bg-success/15 text-success"
                        : "bg-primary/15 text-primary hover:bg-primary/25"
                    }`}
                  >
                    {row.addedToMistakes ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        已入 Module 1 错题本
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="h-3 w-3" />
                        加入错题本重练
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
