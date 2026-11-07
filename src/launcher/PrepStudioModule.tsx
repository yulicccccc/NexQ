import { useState, useEffect, useMemo, useCallback } from "react";
import { useAIActionsStore } from "../stores/aiActionsStore";
import { showToast } from "../stores/toastStore";
import {
  Target,
  BookOpen,
  Mic,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Sparkles,
  Play,
  RotateCcw,
  RefreshCw,
  Trash2,
  Award,
  Clock,
} from "lucide-react";

export interface StarQuestionItem {
  id: string;
  category: "behavioral" | "technical" | "jd_custom" | "mistake_book";
  question: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  opener: string;
  bullets: [string, string, string];
  keywords: string;
  practicedCount: number;
}

export interface PrepProfileData {
  company: string;
  roleTitle: string;
  resumeText: string;
  jdText: string;
  questions: StarQuestionItem[];
}

const STORAGE_KEY = "ic_prep_studio_v1";

const DEFAULT_PREP_DATA: PrepProfileData = {
  company: "Target Tech Corp",
  roleTitle: "Senior Software / Data Engineer",
  resumeText:
    "5+ years building distributed backend services, Python/Rust/React pipelines, automated data workflows, and cloud deployments. Reduced processing latency by 45% and improved system reliability to 99.95%.",
  jdText:
    "Looking for a Senior Engineer experienced in distributed systems, Python, Rust, TypeScript, cloud architecture, cross-functional leadership, latency optimization, and high-reliability production services.",
  questions: [
    {
      id: "q_default_1",
      category: "behavioral",
      question:
        "Tell me about a time you diagnosed a critical production bottleneck under tight deadlines.",
      situation:
        "During peak load, our core data pipeline experienced a 4x latency spike threatening SLA compliance.",
      task: "I needed to isolate the root cause and restore sub-3-second P95 latency within 24 hours without downtime.",
      action:
        "Profiled the audio/data worker queue, eliminated redundant 1-second chunk padding, and deployed a batched async streaming pipeline.",
      result:
        "Cut P95 processing latency by 62% (from 8.2s to 3.1s) and achieved 99.98% uptime across 10k+ daily sessions.",
      opener:
        "In my previous role, I led the emergency root-cause fix for a critical pipeline bottleneck that cut P95 latency by 62%.",
      bullets: [
        "Context: Core pipeline hit 8.2s latency spike during peak traffic.",
        "Action: Profiled worker thread locks & replaced 1s unbatched calls with streaming chunks.",
        "Impact: Reduced P95 latency by 62% (to 3.1s) with zero SLA breaches.",
      ],
      keywords: "62% Latency Reduction · Async Streaming · 99.98% Uptime",
      practicedCount: 2,
    },
    {
      id: "q_default_2",
      category: "technical",
      question:
        "How do you design a low-latency real-time streaming system that balances accuracy and CPU overhead?",
      situation:
        "Client desktop devices lacked dedicated GPUs, causing heavy transformer models to stall real-time inference.",
      task: "Design a hybrid dual-pass architecture keeping first-token hint latency under 3 seconds.",
      action:
        "Combined per-channel normalized feature extraction, 3.5-second fast speculative chunks, and 3-bullet constrained LLM output.",
      result:
        "Reduced CPU utilization by 55% while maintaining >92% recognition accuracy on standard laptop hardware.",
      opener:
        "I approach low-latency streaming by decoupling fast speculative capture from heavy background refinement.",
      bullets: [
        "Architecture: Dual-pass pipeline (3.5s fast chunk + pause-triggered finalizing).",
        "Optimization: Per-feature CMVN normalization + int8 quantized runtime.",
        "Outcome: 55% lower CPU load and <3.0s P50 end-to-end response time.",
      ],
      keywords: "Dual-Pass Pipeline · Int8 Quantization · P50 < 3.0s",
      practicedCount: 1,
    },
  ],
};

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "your", "will", "have",
  "are", "you", "our", "work", "team", "role", "looking", "experience", "experienced",
  "able", "about", "into", "across", "using", "build", "building", "strong", "years",
]);

const FILLER_WORDS = [
  "um",
  "uh",
  "like",
  "you know",
  "basically",
  "actually",
  "literally",
  "sort of",
  "kind of",
];

export function loadPrepData(): PrepProfileData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREP_DATA;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREP_DATA,
      ...parsed,
      questions: Array.isArray(parsed.questions)
        ? parsed.questions
        : DEFAULT_PREP_DATA.questions,
    };
  } catch {
    return DEFAULT_PREP_DATA;
  }
}

export function savePrepData(data: PrepProfileData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("[PrepStudio] Failed to save prep data:", e);
  }
}

interface PrepStudioModuleProps {
  onStartLiveMock: () => void;
}

export function PrepStudioModule({ onStartLiveMock }: PrepStudioModuleProps) {
  const [prepData, setPrepData] = useState<PrepProfileData>(() => loadPrepData());
  const [subTab, setSubTab] = useState<"analyzer" | "star_bank" | "mock_coach">(
    "analyzer"
  );
  const [selectedQId, setSelectedQId] = useState<string>(
    () => loadPrepData().questions[0]?.id ?? ""
  );
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | StarQuestionItem["category"]
  >("all");
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionCat, setNewQuestionCat] =
    useState<StarQuestionItem["category"]>("behavioral");

  // Mock Coach state
  const [persona, setPersona] = useState<"hr" | "tech_lead" | "bar_raiser">(
    "tech_lead"
  );
  const [practiceTranscript, setPracticeTranscript] = useState(
    "In my last project, um, we faced a critical latency spike where response times hit 8 seconds. I was responsible for diagnosing the bottleneck within 24 hours. Basically, I profiled the worker threads, replaced the 1-second unbatched calls with a 3.5-second streaming pipeline, and, uh, reduced P95 latency by 62% while keeping uptime at 99.98%."
  );
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [timerRunning, setTimerRunning] = useState(false);

  const setCustomInstructions = useAIActionsStore((s) => s.setCustomInstructions);

  useEffect(() => {
    savePrepData(prepData);
  }, [prepData]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  // ── 1. Resume vs. JD Keyword & Competency Gap Analysis ──
  const jdAnalysis = useMemo(() => {
    const extractTokens = (text: string) =>
      Array.from(
        new Set(
          text
            .toLowerCase()
            .replace(/[^a-z0-9+#.-]/g, " ")
            .split(/\s+/)
            .filter((w) => w.length >= 4 && !STOP_WORDS.has(w))
        )
      );

    const jdTokens = extractTokens(prepData.jdText);
    const resumeLower = prepData.resumeText.toLowerCase();

    const matched: string[] = [];
    const missing: string[] = [];

    for (const token of jdTokens) {
      if (resumeLower.includes(token)) {
        matched.push(token);
      } else {
        missing.push(token);
      }
    }

    const score =
      jdTokens.length > 0
        ? Math.round((matched.length / jdTokens.length) * 100)
        : 100;

    return {
      score,
      matched: matched.slice(0, 18),
      missing: missing.slice(0, 12),
    };
  }, [prepData.jdText, prepData.resumeText]);

  // ── Sync Resume + JD + STAR Cheat Cards into Live CoPilot AI Context ──
  const handleSyncToLiveCopilot = useCallback(() => {
    const starCardsSummary = prepData.questions
      .slice(0, 8)
      .map(
        (q, i) =>
          `[Q${i + 1}: ${q.question}] -> Opener: ${q.opener} | Bullets: ${q.bullets.join(" ; ")} | Metrics/Keywords: ${q.keywords}`
      )
      .join("\n");

    const composedContext =
      `[CANDIDATE TARGET ROLE]: ${prepData.roleTitle} @ ${prepData.company}\n` +
      `[CANDIDATE RESUME HIGHLIGHTS]: ${prepData.resumeText.slice(0, 600)}\n` +
      `[TARGET JD KEYWORDS]: ${prepData.jdText.slice(0, 400)}\n` +
      `[VERIFIED STAR CHEAT CARDS]:\n${starCardsSummary}\n` +
      `Always ground your 3-Bullet hints and metrics strictly in the candidate's real stories above.`;

    setCustomInstructions(composedContext);
    showToast("已将简历、JD 与 STAR 题库小抄同步至面中提词引擎！", "success");
  }, [prepData, setCustomInstructions]);

  // ── Auto-Generate Tailored Questions from Missing/Matched JD Keywords ──
  const handleGenerateJdQuestions = useCallback(() => {
    const topMissing = jdAnalysis.missing.slice(0, 2);
    const topMatched = jdAnalysis.matched.slice(0, 2);
    const generated: StarQuestionItem[] = [];

    if (topMatched.length > 0) {
      generated.push({
        id: `q_jd_${Date.now()}_1`,
        category: "jd_custom",
        question: `[${prepData.company} 定制深挖] Can you walk me through a complex project where you applied ${topMatched.join(" & ")} to deliver measurable impact?`,
        situation: `In my role supporting ${prepData.roleTitle} initiatives, we needed to scale ${topMatched[0]} under strict production SLAs.`,
        task: `My goal was to architect a reliable solution and improve key performance metrics.`,
        action: `Designed and executed the ${topMatched.join(" + ")} workflow with automated verification.`,
        result: `Improved throughput by 40%+ and eliminated manual bottlenecks.`,
        opener: `I'd love to share how I leveraged ${topMatched.join(" and ")} to drive a 40% efficiency gain.`,
        bullets: [
          `Context: Scaled ${topMatched[0]} pipeline for high-reliability production use.`,
          `Action: Built automated architecture combining ${topMatched.join(" & ")}.`,
          `Result: Delivered 40%+ speedup and zero production regressions.`,
        ],
        keywords: `${topMatched.join(" · ")} · 40% Improvement`,
        practicedCount: 0,
      });
    }

    if (topMissing.length > 0) {
      generated.push({
        id: `q_jd_${Date.now()}_2`,
        category: "jd_custom",
        question: `[JD 缺口防御题] This role requires ${topMissing.join(" / ")}. How does your background transfer to this requirement?`,
        situation: `While my resume emphasizes core backend systems, I frequently bridge into adjacent areas like ${topMissing[0]}.`,
        task: `Rapidly ramp up and deliver production-grade results when adopting new stack requirements.`,
        action: `Applied transferable systems engineering principles and built rapid validated prototypes.`,
        result: `Consistently ramped up on new domain tools within 2 weeks and hit 100% of sprint milestones.`,
        opener: `My core engineering foundation transfers directly to ${topMissing[0]}, and I've repeatedly ramped up on adjacent tools in days.`,
        bullets: [
          `Bridge: Strong foundation in core systems maps directly to ${topMissing[0]}.`,
          `Execution: Proven track record of 2-week ramp-up on new production toolchains.`,
          `Impact: Delivered 100% of milestone targets with zero quality trade-offs.`,
        ],
        keywords: `Fast Ramp-Up · Transferable Architecture · ${topMissing[0]}`,
        practicedCount: 0,
      });
    }

    if (generated.length > 0) {
      setPrepData((prev) => ({
        ...prev,
        questions: [...generated, ...prev.questions],
      }));
      setSelectedQId(generated[0].id);
      setSubTab("star_bank");
      showToast(`已根据 JD 自动生成 ${generated.length} 道定制押题与防御小抄！`, "success");
    }
  }, [jdAnalysis, prepData.company, prepData.roleTitle]);

  const filteredQuestions = useMemo(() => {
    if (categoryFilter === "all") return prepData.questions;
    return prepData.questions.filter((q) => q.category === categoryFilter);
  }, [prepData.questions, categoryFilter]);

  const selectedQuestion = useMemo(
    () =>
      prepData.questions.find((q) => q.id === selectedQId) ??
      prepData.questions[0] ??
      null,
    [prepData.questions, selectedQId]
  );

  const updateSelectedQuestion = useCallback(
    (patch: Partial<StarQuestionItem>) => {
      if (!selectedQuestion) return;
      setPrepData((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === selectedQuestion.id ? { ...q, ...patch } : q
        ),
      }));
    },
    [selectedQuestion]
  );

  const handleAutoBuildThreeBullets = useCallback(() => {
    if (!selectedQuestion) return;
    const s = selectedQuestion.situation.trim() || "Production challenge under tight SLA";
    const a = selectedQuestion.action.trim() || "Designed and executed targeted technical fix";
    const r = selectedQuestion.result.trim() || "Delivered measurable % improvement";
    updateSelectedQuestion({
      opener: `Let me share a concrete example: ${s.slice(0, 70)}...`,
      bullets: [
        `S/T: ${s.slice(0, 65)}`,
        `Action: ${a.slice(0, 65)}`,
        `Result: ${r.slice(0, 65)}`,
      ],
    });
    showToast("已根据 STAR 四格自动浓缩生成「面中 3-Bullet 小抄卡」！", "success");
  }, [selectedQuestion, updateSelectedQuestion]);

  const handleAddCustomQuestion = useCallback(() => {
    const trimmed = newQuestionText.trim();
    if (!trimmed) return;
    const item: StarQuestionItem = {
      id: `q_custom_${Date.now()}`,
      category: newQuestionCat,
      question: trimmed,
      situation: "",
      task: "",
      action: "",
      result: "",
      opener: "",
      bullets: ["", "", ""],
      keywords: "",
      practicedCount: 0,
    };
    setPrepData((prev) => ({
      ...prev,
      questions: [item, ...prev.questions],
    }));
    setSelectedQId(item.id);
    setNewQuestionText("");
    showToast("已添加新题目至押题库！", "success");
  }, [newQuestionText, newQuestionCat]);

  // ── Real-Time Speech & STAR Delivery Mechanics Audit (Yoodli + star-answer-checker style) ──
  const deliveryMetrics = useMemo(() => {
    const text = practiceTranscript.trim();
    const words = text ? text.split(/\s+/) : [];
    const wordCount = words.length;
    const lower = text.toLowerCase();

    // Count filler words
    const fillerBreakdown: { word: string; count: number }[] = [];
    let totalFillers = 0;
    for (const fw of FILLER_WORDS) {
      const regex = new RegExp(`\\b${fw}\\b`, "gi");
      const matches = lower.match(regex);
      const count = matches ? matches.length : 0;
      if (count > 0) {
        fillerBreakdown.push({ word: fw, count });
        totalFillers += count;
      }
    }

    // Check STAR 4-light signals + quantified metric presence
    const hasSituation =
      /\b(when|in my|during|project|team|faced|background|context)\b/i.test(text);
    const hasTask =
      /\b(needed to|responsible|goal|objective|task|challenged|had to|sla)\b/i.test(
        text
      );
    const hasAction =
      /\b(i built|i designed|i profiled|i implemented|i led|replaced|created|developed|migrated|analyzed)\b/i.test(
        text
      );
    const hasQuantifiedResult =
      /(\d+%|\d+x|\$\d+|\d+\s*(ms|seconds|hours|days|users|queries))/i.test(text) &&
      /\b(reduced|improved|increased|saved|achieved|cut|delivered|result)\b/i.test(
        text
      );

    // Estimated WPM (based on elapsed timer or 140 WPM baseline estimation)
    const elapsedSec = Math.max(120 - timerSeconds, 30);
    const estimatedWpm = Math.round((wordCount / elapsedSec) * 60);

    const starScore =
      (hasSituation ? 25 : 0) +
      (hasTask ? 25 : 0) +
      (hasAction ? 25 : 0) +
      (hasQuantifiedResult ? 25 : 0);

    return {
      wordCount,
      totalFillers,
      fillerBreakdown,
      hasSituation,
      hasTask,
      hasAction,
      hasQuantifiedResult,
      estimatedWpm,
      starScore,
    };
  }, [practiceTranscript, timerSeconds]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 py-4 space-y-4">
      {/* ── Top Sub-Navigation Bar for Module 1 ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/30 bg-card/40 p-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSubTab("analyzer")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              subTab === "analyzer"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            ① 岗位 Goal & 简历×JD 押题诊断
          </button>
          <button
            onClick={() => setSubTab("star_bank")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              subTab === "star_bank"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            ② 押题库 & STAR 故事小抄 ({prepData.questions.length})
          </button>
          <button
            onClick={() => setSubTab("mock_coach")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              subTab === "mock_coach"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            ③ AI 模拟对练 & 口头禅/STAR 体检仪
          </button>
        </div>

        <button
          onClick={handleSyncToLiveCopilot}
          className="flex items-center gap-1.5 rounded-lg border border-success/40 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/20 transition-all cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          一键同步至「面中提词引擎」
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          SUB-TAB 1: RESUME vs. JD GAP ANALYZER & QUESTION GENERATOR
         ════════════════════════════════════════════════════════════════ */}
      {subTab === "analyzer" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Inputs */}
          <div className="lg:col-span-7 space-y-3 rounded-xl border border-border/30 bg-card/30 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                🎯 目标岗位档案 (Job Goal Profile)
              </h3>
              <span className="text-meta text-muted-foreground">自动本地保存</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-meta font-medium text-muted-foreground mb-1">
                  目标公司 (Company)
                </label>
                <input
                  type="text"
                  value={prepData.company}
                  onChange={(e) =>
                    setPrepData((p) => ({ ...p, company: e.target.value }))
                  }
                  className="w-full rounded-lg border border-border/30 bg-background/60 px-2.5 py-1.5 text-xs text-foreground focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-meta font-medium text-muted-foreground mb-1">
                  目标岗位 (Role Title)
                </label>
                <input
                  type="text"
                  value={prepData.roleTitle}
                  onChange={(e) =>
                    setPrepData((p) => ({ ...p, roleTitle: e.target.value }))
                  }
                  className="w-full rounded-lg border border-border/30 bg-background/60 px-2.5 py-1.5 text-xs text-foreground focus:border-primary/50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-meta font-medium text-muted-foreground mb-1">
                📄 你的核心简历亮点 / 项目经历 (Resume Summary & Achievements)
              </label>
              <textarea
                rows={4}
                value={prepData.resumeText}
                onChange={(e) =>
                  setPrepData((p) => ({ ...p, resumeText: e.target.value }))
                }
                placeholder="粘贴你的简历核心经历、技术栈与量化成果..."
                className="w-full rounded-lg border border-border/30 bg-background/60 p-2.5 text-xs text-foreground focus:border-primary/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-meta font-medium text-muted-foreground mb-1">
                📋 目标岗位 JD (Job Description)
              </label>
              <textarea
                rows={4}
                value={prepData.jdText}
                onChange={(e) =>
                  setPrepData((p) => ({ ...p, jdText: e.target.value }))
                }
                placeholder="粘贴目标公司的 Job Description 要求..."
                className="w-full rounded-lg border border-border/30 bg-background/60 p-2.5 text-xs text-foreground focus:border-primary/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Right: Instant ATS Match & Question Generator */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3 rounded-xl border border-border/30 bg-card/30 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  📊 简历 × JD 关键词雷达
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    jdAnalysis.score >= 70
                      ? "bg-success/15 text-success"
                      : "bg-warning/15 text-warning"
                  }`}
                >
                  匹配度 {jdAnalysis.score}%
                </span>
              </div>

              <div>
                <div className="text-meta font-semibold text-success mb-1.5">
                  🟢 简历已命中优势词 ({jdAnalysis.matched.length}) — 面试重点展开：
                </div>
                <div className="flex flex-wrap gap-1">
                  {jdAnalysis.matched.length > 0 ? (
                    jdAnalysis.matched.map((w) => (
                      <span
                        key={w}
                        className="rounded-md border border-success/30 bg-success/10 px-2 py-0.5 text-meta font-medium text-success"
                      >
                        ✓ {w}
                      </span>
                    ))
                  ) : (
                    <span className="text-meta text-muted-foreground">
                      暂无重合关键词
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-meta font-semibold text-warning mb-1.5">
                  🔴 JD 要求但简历未出现 ({jdAnalysis.missing.length}) — 需准备防御话术：
                </div>
                <div className="flex flex-wrap gap-1">
                  {jdAnalysis.missing.length > 0 ? (
                    jdAnalysis.missing.map((w) => (
                      <span
                        key={w}
                        className="rounded-md border border-warning/30 bg-warning/10 px-2 py-0.5 text-meta font-medium text-warning"
                      >
                        ! {w}
                      </span>
                    ))
                  ) : (
                    <span className="text-meta text-success">
                      太棒了！核心词已全部覆盖！
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/20">
              <button
                onClick={handleGenerateJdQuestions}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                根据 JD 优势与缺口自动押题 (生成 STAR 小抄)
              </button>
              <button
                onClick={() => setSubTab("star_bank")}
                className="w-full rounded-xl border border-border/40 bg-secondary/40 px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary/70 transition-all cursor-pointer"
              >
                进入押题库编辑 3-Bullet 小抄卡 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          SUB-TAB 2: QUESTION BANK & STAR 4-BOX CHEAT CARD BUILDER
         ════════════════════════════════════════════════════════════════ */}
      {subTab === "star_bank" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Question List */}
          <div className="lg:col-span-5 flex flex-col space-y-2.5 rounded-xl border border-border/30 bg-card/30 p-3.5">
            <div className="flex items-center gap-1 flex-wrap">
              {(
                [
                  { id: "all", label: "全部" },
                  { id: "behavioral", label: "Behavioral" },
                  { id: "technical", label: "Technical" },
                  { id: "jd_custom", label: "JD 押题" },
                  { id: "mistake_book", label: "🔴 错题本" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`rounded-md px-2 py-1 text-meta font-semibold transition-all cursor-pointer ${
                    categoryFilter === tab.id
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Add Question Input */}
            <div className="flex gap-1.5">
              <select
                value={newQuestionCat}
                onChange={(e) =>
                  setNewQuestionCat(e.target.value as StarQuestionItem["category"])
                }
                className="rounded-lg border border-border/30 bg-background/60 px-2 py-1.5 text-meta text-foreground"
              >
                <option value="behavioral">行为面</option>
                <option value="technical">技术面</option>
                <option value="jd_custom">JD押题</option>
                <option value="mistake_book">错题本</option>
              </select>
              <input
                type="text"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="输入新面试题..."
                className="flex-1 rounded-lg border border-border/30 bg-background/60 px-2.5 py-1.5 text-xs text-foreground"
              />
              <button
                onClick={handleAddCustomQuestion}
                className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-white hover:bg-primary/90 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {filteredQuestions.map((q) => (
                <div
                  key={q.id}
                  onClick={() => setSelectedQId(q.id)}
                  className={`group flex items-start justify-between gap-2 rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                    selectedQuestion?.id === q.id
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/20 bg-background/40 hover:border-border/40"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        {q.category === "mistake_book" ? "🔴 错题" : q.category}
                      </span>
                      {/\d+%|\d+x|\$\d+/i.test(q.result) && (
                        <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                          含数字化指标
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-foreground line-clamp-2">
                      {q.question}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrepData((prev) => ({
                        ...prev,
                        questions: prev.questions.filter((item) => item.id !== q.id),
                      }));
                    }}
                    className="opacity-0 group-hover:opacity-100 rounded p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: STAR 4-Box Editor + 3-Bullet Cheat Card */}
          {selectedQuestion && (
            <div className="lg:col-span-7 space-y-3 rounded-xl border border-border/30 bg-card/30 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-foreground">
                  🗂️ STAR 故事打磨 & 面中 3-Bullet 小抄生成
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleAutoBuildThreeBullets}
                    className="flex items-center gap-1 rounded-lg bg-primary/15 px-2.5 py-1 text-meta font-semibold text-primary hover:bg-primary/25 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" />
                    从 STAR 自动提炼 3-Bullet
                  </button>
                  <button
                    onClick={() => {
                      setPracticeTranscript(
                        `${selectedQuestion.opener} ${selectedQuestion.situation} ${selectedQuestion.task} ${selectedQuestion.action} ${selectedQuestion.result}`
                      );
                      setSubTab("mock_coach");
                    }}
                    className="flex items-center gap-1 rounded-lg bg-success/15 px-2.5 py-1 text-meta font-semibold text-success hover:bg-success/25 cursor-pointer"
                  >
                    <Mic className="h-3 w-3" />
                    拿这题去开口演练 →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-primary mb-0.5">
                    S — Situation (背景与挑战)
                  </label>
                  <textarea
                    rows={2}
                    value={selectedQuestion.situation}
                    onChange={(e) =>
                      updateSelectedQuestion({ situation: e.target.value })
                    }
                    className="w-full rounded-lg border border-border/30 bg-background/60 p-2 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-primary mb-0.5">
                    T — Task (你的核心目标/SLA)
                  </label>
                  <textarea
                    rows={2}
                    value={selectedQuestion.task}
                    onChange={(e) =>
                      updateSelectedQuestion({ task: e.target.value })
                    }
                    className="w-full rounded-lg border border-border/30 bg-background/60 p-2 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-primary mb-0.5">
                    A — Action (你亲手做的 2-3 个硬核动作)
                  </label>
                  <textarea
                    rows={2}
                    value={selectedQuestion.action}
                    onChange={(e) =>
                      updateSelectedQuestion({ action: e.target.value })
                    }
                    className="w-full rounded-lg border border-border/30 bg-background/60 p-2 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-success mb-0.5">
                    R — Result (必须包含 % / $ / 倍数 等量化指标!)
                  </label>
                  <textarea
                    rows={2}
                    value={selectedQuestion.result}
                    onChange={(e) =>
                      updateSelectedQuestion({ result: e.target.value })
                    }
                    className="w-full rounded-lg border border-success/40 bg-background/60 p-2 text-xs text-foreground"
                  />
                </div>
              </div>

              {/* Live 3-Bullet Preview Card */}
              <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-meta font-bold uppercase tracking-wider text-warning">
                    ⚡ 面中极简提词卡预览 (1秒扫视小抄)
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    点右上角「一键同步」即刻注入面中悬浮窗
                  </span>
                </div>
                <input
                  type="text"
                  value={selectedQuestion.opener}
                  onChange={(e) =>
                    updateSelectedQuestion({ opener: e.target.value })
                  }
                  placeholder="🗣️ 首句自然开口 (Opener)..."
                  className="w-full rounded-lg border border-border/30 bg-background/70 px-2.5 py-1 text-xs font-medium text-foreground"
                />
                <div className="space-y-1">
                  {[0, 1, 2].map((idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={selectedQuestion.bullets[idx] ?? ""}
                      onChange={(e) => {
                        const next: [string, string, string] = [
                          ...selectedQuestion.bullets,
                        ] as [string, string, string];
                        next[idx] = e.target.value;
                        updateSelectedQuestion({ bullets: next });
                      }}
                      placeholder={`• 要点 ${idx + 1} (不超过 12 个词)...`}
                      className="w-full rounded-lg border border-border/20 bg-background/50 px-2.5 py-1 text-xs text-foreground"
                    />
                  ))}
                </div>
                <input
                  type="text"
                  value={selectedQuestion.keywords}
                  onChange={(e) =>
                    updateSelectedQuestion({ keywords: e.target.value })
                  }
                  placeholder="🔑 3 个必提量化指标与关键词..."
                  className="w-full rounded-lg border border-border/30 bg-background/70 px-2.5 py-1 text-xs font-semibold text-primary"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          SUB-TAB 3: AI VOICE MOCK SIMULATOR & DELIVERY MECHANICS COACH
         ════════════════════════════════════════════════════════════════ */}
      {subTab === "mock_coach" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Simulator Controls & Live Transcript Input */}
          <div className="lg:col-span-7 space-y-3 rounded-xl border border-border/30 bg-card/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground">
                  面试官风格：
                </span>
                {(
                  [
                    { id: "hr", label: "😊 温和 HR 筛面" },
                    { id: "tech_lead", label: "🧐 硬核 Tech Lead" },
                    { id: "bar_raiser", label: "🔥 挑刺 Bar Raiser" },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPersona(p.id)}
                    className={`rounded-lg px-2.5 py-1 text-meta font-semibold cursor-pointer ${
                      persona === p.id
                        ? "bg-primary text-white"
                        : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* 2-Minute Countdown Timer */}
              <div className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-background/60 px-2.5 py-1">
                <Clock className="h-3.5 w-3.5 text-warning" />
                <span
                  className={`font-mono text-xs font-bold ${
                    timerSeconds <= 20 ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:
                  {String(timerSeconds % 60).padStart(2, "0")}
                </span>
                <button
                  onClick={() => setTimerRunning((r) => !r)}
                  className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary cursor-pointer"
                >
                  {timerRunning ? "暂停" : "计时"}
                </button>
                <button
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerSeconds(120);
                  }}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="text-[11px] font-semibold text-primary mb-1">
                🎙️ 当前模拟真题 ({persona.toUpperCase()} 视角)：
              </div>
              <div className="text-xs font-semibold text-foreground">
                {selectedQuestion?.question ??
                  "Tell me about your most impactful engineering project and how you handled bottlenecks."}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-meta font-medium text-muted-foreground">
                  🗣️ 你的练习回答文本（可直接口述录入或粘贴演练稿，实时检测口头禅与 STAR 完整度）：
                </label>
                <button
                  onClick={onStartLiveMock}
                  className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-meta font-bold text-white shadow-sm hover:bg-primary/90 cursor-pointer"
                >
                  <Play className="h-3 w-3" fill="white" />
                  启动双路真机语音对练浮窗
                </button>
              </div>
              <textarea
                rows={5}
                value={practiceTranscript}
                onChange={(e) => setPracticeTranscript(e.target.value)}
                className="w-full rounded-lg border border-border/30 bg-background/60 p-3 text-xs leading-relaxed text-foreground focus:border-primary/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Right: Yoodli-Style Real-Time Speech & STAR Delivery Diagnostics */}
          <div className="lg:col-span-5 space-y-3 rounded-xl border border-border/30 bg-card/30 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                🩺 表达与气场实时体检仪 (Yoodli 模式)
              </h3>
              <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
                <Award className="h-3.5 w-3.5" />
                STAR 完整度 {deliveryMetrics.starScore}/100
              </span>
            </div>

            {/* STAR 4 Lights */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { key: "S", label: "Situation", ok: deliveryMetrics.hasSituation },
                { key: "T", label: "Task/SLA", ok: deliveryMetrics.hasTask },
                { key: "A", label: "Action", ok: deliveryMetrics.hasAction },
                {
                  key: "R",
                  label: "Result+数字",
                  ok: deliveryMetrics.hasQuantifiedResult,
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className={`flex flex-col items-center rounded-lg border p-2 text-center ${
                    item.ok
                      ? "border-success/40 bg-success/10 text-success"
                      : "border-border/30 bg-background/40 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs font-bold">
                    {item.ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    )}
                    {item.key}
                  </div>
                  <span className="text-[10px]">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Filler Words & Pacing */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border/30 bg-background/50 p-2.5">
                <div className="text-meta text-muted-foreground">
                  🚨 口头禅抓虫 (Filler Words)
                </div>
                <div
                  className={`text-base font-bold ${
                    deliveryMetrics.totalFillers > 2
                      ? "text-destructive"
                      : "text-success"
                  }`}
                >
                  {deliveryMetrics.totalFillers} 次
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {deliveryMetrics.fillerBreakdown.length > 0 ? (
                    deliveryMetrics.fillerBreakdown.map((f) => (
                      <span
                        key={f.word}
                        className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold text-destructive"
                      >
                        &ldquo;{f.word}&rdquo; ×{f.count}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-success">
                      零口头禅，表达极度干脆！
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border/30 bg-background/50 p-2.5">
                <div className="text-meta text-muted-foreground">
                  ⏱️ 篇幅与语速节奏 (Pacing)
                </div>
                <div className="text-base font-bold text-foreground">
                  {deliveryMetrics.wordCount} 词 · ~{deliveryMetrics.estimatedWpm} WPM
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {deliveryMetrics.wordCount < 40
                    ? "⚠️ 偏短：建议补充具体技术动作与量化成果"
                    : deliveryMetrics.wordCount > 220
                      ? "⚠️ 偏长啰嗦：建议控制在 90 秒 (150-200 词) 内"
                      : "✅ 黄金篇幅：约 60–90 秒最佳听感区间"}
                </div>
              </div>
            </div>

            {/* Predicted Follow-Up Probes */}
            <div className="rounded-lg border border-border/30 bg-background/50 p-3 space-y-1.5">
              <div className="text-meta font-bold text-primary">
                🔮 AI 面试官动态追问预演 (Follow-Up Probes)：
              </div>
              <ul className="list-disc pl-4 space-y-1 text-xs text-foreground/90">
                <li>
                  &ldquo;If traffic increased by another 10x tomorrow, which part of your design would break first?&rdquo;
                </li>
                <li>
                  &ldquo;What trade-offs did you reject before choosing this approach, and how did you convince skeptical teammates?&rdquo;
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
