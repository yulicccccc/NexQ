import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  UploadCloud,
  FileText,
  FileUp,
  Wand2,
  Building2,
  Briefcase,
  Paperclip,
  Check,
} from "lucide-react";
import {
  parseJdMetadata,
  parseResumeFile,
} from "./documentParser";
import {
  analyzeJdDeeply,
  generateHealerStory,
  JdDeepAnalysisResult,
  HealerStoryResult,
} from "./interviewCourseEngine";
import {
  ShieldAlert,
  ShieldCheck,
  Flame,
  HelpCircle,
  TrendingDown,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export type AnswerSourceTier = "verified" | "adapted" | "general";

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
  sourceTier?: AnswerSourceTier;
  sourceDoc?: string;
  chineseSummary?: string;
  defenseShields?: {
    vector1_edgeCase: { question: string; counterAnswer: string };
    vector2_pushback: { question: string; counterAnswer: string };
    vector3_tradeoff: { question: string; counterAnswer: string };
  };
  antiFreeze?: {
    memoryAnchors: [string, string, string];
    goldenQuote: string;
    emergencyPivotPhrase: string;
  };
}

export interface PrepProfileData {
  company: string;
  roleTitle: string;
  resumeText: string;
  jdText: string;
  domainTerms?: string[];
  questions: StarQuestionItem[];
}

export const PRIORITY_DOMAIN_TERMS: string[] = [
  "16S rRNA",
  "ASV",
  "Metagenomics",
  "Bray-Curtis",
  "PERMANOVA",
  "Mantel-Haenszel",
  "Listeria",
  "Confounding",
  "SpatialBench",
  "Ground Truth",
  "Grader",
  "Replicate Consistency",
  "ScanRDI",
  "Poka-Yoke",
  "Triangulation",
  "Method Suitability",
];

const STORAGE_KEY = "ic_prep_studio_v1";

const DEFAULT_PREP_DATA: PrepProfileData = {
  company: "LatchBio / Target Biotech",
  roleTitle: "AI Biologist — Metagenomics & QC Systems",
  resumeText:
    "AI Biology & Regulated QC Systems specialist experienced in 16S rRNA & shotgun metagenomics (ASV, Bray-Curtis, PERMANOVA, Mantel-Haenszel confounding control), SpatialBench evaluation graders, and high-throughput pharmaceutical microbiology automation (MS Check triangulation system, 79-sample ScanRDI root-cause investigation, 48-slot Poka-Yoke ergonomic tray).",
  jdText:
    "Looking for an AI Biologist / Computational & QC Systems Scientist experienced in metagenomics, 16S rRNA amplicon analysis, confounding control, benchmark grader design, Python/R statistical workflows, root-cause investigation, and cross-functional scientific communication.",
  domainTerms: [...PRIORITY_DOMAIN_TERMS],
  questions: [
    {
      id: "q_latchbio_task1",
      category: "technical",
      question: "How did you handle confounding in Task 1?",
      situation:
        "In the 16S rRNA Listeria dataset, samples came from different sampling niches and facilities, creating strong environmental confounding that masked true biological associations.",
      task: "Isolate the true biological signal of Listeria persistence without distortion from sampling niche heterogeneity or facility-level batch effects.",
      action:
        "Restricted the primary comparison to comparable Drain-only samples to eliminate niche mismatch, then applied Cochran–Mantel–Haenszel stratified adjustment across facilities (yielding pooled OR = 1.320647) alongside Bray-Curtis & PERMANOVA community checks.",
      result:
        "Produced a biologically meaningful, unconfounded comparison (pooled Mantel–Haenszel OR = 1.320647) with full statistical reproducibility.",
      opener:
        "I addressed confounding in two stages: first controlling sampling niche heterogeneity, then stratifying by facility.",
      bullets: [
        "1. Problem — Different sampling niches created severe structural confounding.",
        "2. Approach — Restricted to Drain-only subset + Mantel–Haenszel Facility adjustment.",
        "3. Takeaway — Achieved biologically meaningful comparison (pooled OR = 1.320647).",
      ],
      keywords: "Confounding · Mantel–Haenszel · OR 1.320647",
      practicedCount: 3,
      sourceTier: "verified",
      sourceDoc: "LatchBio Task 1 — 16S rRNA Listeria Confounding Analysis",
      chineseSummary:
        "先限定 Drain-only 消除采样位点混杂，再用 Mantel–Haenszel 按 Facility 分层校正（OR = 1.320647），确保生物学可比性。",
      defenseShields: {
        vector1_edgeCase: {
          question: "Why did you restrict the analysis to Drain-only instead of keeping all sampling niches as covariates?",
          counterAnswer:
            "Non-drain niches had fundamentally different baseline microbial compositions and sparse Listeria positivity; restricting to Drain-only ensured structural positivity before stratifying by facility.",
        },
        vector2_pushback: {
          question: "Why adjust for Facility using Mantel–Haenszel instead of a simple pooled chi-square?",
          counterAnswer:
            "Each facility had distinct baseline hygiene regimes and sample volumes. Pooling naively induces Simpson's paradox, whereas Mantel–Haenszel weights within-facility strata cleanly.",
        },
        vector3_tradeoff: {
          question: "What does the pooled Odds Ratio of 1.320647 actually mean biologically here?",
          counterAnswer:
            "Within comparable drain environments after controlling for facility differences, the target condition carries ~1.32x higher odds of Listeria association—modest but directionally consistent.",
        },
      },
      antiFreeze: {
        memoryAnchors: ["Different Sampling Niches", "Drain-Only + Facility Adjustment", "OR 1.320647"],
        goldenQuote: "Statistical adjustment only works after you establish biological comparability of the sampling niche.",
        emergencyPivotPhrase: "The core insight was separating ecological niche mismatch from facility-level batch confounding.",
      },
    },
    {
      id: "q_default_1",
      category: "behavioral",
      question:
        "Tell me about a time you diagnosed a critical bottleneck or recurring failure under tight deadlines.",
      situation:
        "Across a 2-month window in our regulated QC lab, 79 ScanRDI sterility testing samples failed across multiple shifts, threatening batch release SLAs.",
      task: "Isolate the true root cause across shifts and restore 100% first-pass reliability without slowing daily throughput.",
      action:
        "Stratified all 79 failure records by shift, operator, and reagent lot; pinpointed membrane-transfer micro-contamination during peak handover; deployed standardized aseptic transfer guards.",
      result:
        "Achieved 73/73 consecutive passing validation runs (100% pass rate) and eliminated recurring shift rework.",
      opener:
        "When 79 ScanRDI samples failed over two months, I led the data-stratified root-cause investigation that restored a 73-for-73 pass rate.",
      bullets: [
        "1. Problem — 79 ScanRDI sterility failures recurred across 2 months.",
        "2. Approach — Stratified failure logs by shift/step & standardized membrane transfer.",
        "3. Takeaway — 73/73 consecutive passes (100% reliability) with zero SLA breaches.",
      ],
      keywords: "79-Sample Investigation · ScanRDI · 73/73 Passed",
      practicedCount: 2,
      sourceTier: "verified",
      sourceDoc: "Eagle Analytical — 79-Sample ScanRDI Investigation",
      chineseSummary:
        "通过对 2 个月内 79 例 ScanRDI 失败样本按班次与操作步分层溯源，锁定滤膜转移污染并标准化防呆，实现后续 73/73 全通过。",
    },
    {
      id: "q_default_2",
      category: "technical",
      question:
        "How do you design an automated verification workflow that eliminates human error in high-throughput operations?",
      situation:
        "Routine Method-Suitability (MS) checks required cross-checking 7 parameters across fragmented LIMS screens, taking 2–3 hours daily.",
      task: "Eliminate manual cross-screen comparison fatigue while maintaining 100% regulatory audit traceability.",
      action:
        "Engineered an automated MS Check triangulation tool that cross-validates LIMS exports against USP/SOP rules and flags only true anomalies for human review.",
      result:
        "Slashed daily verification time from 2–3 hours to <=30 minutes (75%+ reduction) with zero discrepancy escapes.",
      opener:
        "I replaced manual multi-screen LIMS cross-checking with an automated triangulation workflow that cut review time from 3 hours to under 30 minutes.",
      bullets: [
        "1. Problem — Manual LIMS Method-Suitability checks took 2–3h/day with fatigue risk.",
        "2. Approach — Built automated 3-way triangulation script with explicit anomaly flags.",
        "3. Takeaway — Cut review time to <=30m (75%+ faster) with zero audit discrepancies.",
      ],
      keywords: "MS Check Triangulation · 2-3h → ≤30m · Zero Escapes",
      practicedCount: 1,
      sourceTier: "verified",
      sourceDoc: "Eagle Analytical — MS Check Automation Pilot",
      chineseSummary:
        "构建 MS Check 自动三角校验原型替代跨屏幕人工比对，将每日核验耗时从 2-3 小时压缩至 30 分钟以内，零差错漏出。",
    },
  ],
};



const VERIFIED_STORY_TEMPLATES: {
  name: string;
  question: string;
  sourceDoc: string;
  chineseSummary: string;
  story: HealerStoryResult;
}[] = [
  {
    name: "LatchBio Task 1 (Confounding · OR 1.320647)",
    question: "How did you handle confounding in Task 1?",
    sourceDoc: "LatchBio Task 1 — 16S rRNA Listeria Confounding Analysis",
    chineseSummary:
      "先限定 Drain-only 消除采样位点混杂，再用 Mantel–Haenszel 按 Facility 分层校正（OR = 1.320647），确保生物学可比性。",
    story: {
      question: "How did you handle confounding in Task 1?",
      hook: "I addressed confounding in two stages: first controlling sampling niche heterogeneity, then stratifying by facility.",
      emergency:
        "In the 16S rRNA Listeria dataset, samples came from different sampling niches and facilities, creating strong environmental confounding that masked true biological associations.",
      approach:
        "Isolate the true biological signal of Listeria persistence without distortion from sampling niche heterogeneity or facility-level batch effects.",
      launch:
        "Restricted the primary comparison to comparable Drain-only samples to eliminate niche mismatch, then applied Cochran–Mantel–Haenszel stratified adjustment across facilities (yielding pooled OR = 1.320647) alongside Bray-Curtis & PERMANOVA community checks.",
      effect:
        "Produced a biologically meaningful, unconfounded comparison (pooled Mantel–Haenszel OR = 1.320647) with full statistical reproducibility.",
      reflection:
        "Statistical adjustment only works after you establish biological comparability of the sampling niche.",
      teleprompterBullets: [
        "1. Problem — Different sampling niches created severe structural confounding.",
        "2. Approach — Restricted to Drain-only subset + Mantel–Haenszel Facility adjustment.",
        "3. Takeaway — Achieved biologically meaningful comparison (pooled OR = 1.320647).",
      ],
      defenseShields: {
        vector1_edgeCase: {
          question:
            "Why did you restrict the analysis to Drain-only instead of keeping all sampling niches as covariates?",
          counterAnswer:
            "Non-drain niches had fundamentally different baseline microbial compositions and sparse Listeria positivity; restricting to Drain-only ensured structural positivity before stratifying by facility.",
        },
        vector2_pushback: {
          question:
            "Why adjust for Facility using Mantel–Haenszel instead of a simple pooled chi-square?",
          counterAnswer:
            "Each facility had distinct baseline hygiene regimes and sample volumes. Pooling naively induces Simpson's paradox, whereas Mantel–Haenszel weights within-facility strata cleanly.",
        },
        vector3_tradeoff: {
          question:
            "What does the pooled Odds Ratio of 1.320647 actually mean biologically here?",
          counterAnswer:
            "Within comparable drain environments after controlling for facility differences, the target condition carries ~1.32x higher odds of Listeria association—modest but directionally consistent.",
        },
      },
      antiFreeze: {
        memoryAnchors: [
          "Different Sampling Niches",
          "Drain-Only + Facility Adjustment",
          "OR 1.320647",
        ],
        goldenQuote:
          "Statistical adjustment only works after you establish biological comparability of the sampling niche.",
        emergencyPivotPhrase:
          "The core insight was separating ecological niche mismatch from facility-level batch confounding.",
      },
    },
  },
  {
    name: "79-Sample ScanRDI 溯源调查 (73/73 通过)",
    question:
      "Tell me about a time you investigated a high-volume recurring failure across shifts.",
    sourceDoc: "Eagle Analytical — 79-Sample ScanRDI Investigation",
    chineseSummary:
      "通过对 2 个月内 79 例 ScanRDI 失败样本按班次与操作步分层溯源，锁定滤膜转移污染并标准化防呆，实现后续 73/73 全通过。",
    story: {
      question:
        "Tell me about a time you investigated a high-volume recurring failure across shifts.",
      hook: "When 79 ScanRDI samples failed over two months, I led the data-stratified root-cause investigation that restored a 73-for-73 pass rate.",
      emergency:
        "Across a 2-month window in our regulated QC lab, 79 ScanRDI sterility testing samples failed across multiple shifts, threatening batch release SLAs.",
      approach:
        "Instead of blaming individual operators, I stratified all 79 failure records by shift, operator, and reagent lot to isolate systemic physical friction.",
      launch:
        "Pinpointed membrane-transfer micro-contamination during peak handover and deployed standardized aseptic transfer guards across all shifts.",
      effect:
        "Achieved 73/73 consecutive passing validation runs (100% pass rate) and eliminated recurring shift rework.",
      reflection:
        "Data stratification turns cross-shift finger-pointing into objective, reproducible process engineering.",
      teleprompterBullets: [
        "1. Problem — 79 ScanRDI sterility failures recurred across 2 months.",
        "2. Approach — Stratified failure logs by shift/step & standardized membrane transfer.",
        "3. Takeaway — 73/73 consecutive passes (100% reliability) with zero SLA breaches.",
      ],
      defenseShields: {
        vector1_edgeCase: {
          question: "How did you rule out reagent batch defects before focusing on membrane transfer?",
          counterAnswer:
            "Negative controls on the same reagent lots passed consistently on low-volume days; failures clustered strictly around high-volume shift handovers.",
        },
        vector2_pushback: {
          question: "How did you get all three shifts to adopt the new transfer step without feeling blamed?",
          counterAnswer:
            "I showed the shift-stratified heat map proving the bottleneck was an ergonomic handover trap, not personal carelessness.",
        },
        vector3_tradeoff: {
          question: "Did the extra aseptic guard slow down per-sample processing time?",
          counterAnswer:
            "It added 8 seconds per membrane, which saved hours of multi-day OOS retest investigations.",
        },
      },
      antiFreeze: {
        memoryAnchors: ["79 ScanRDI Failures", "Shift/Step Stratification", "73/73 Passed"],
        goldenQuote: "Data stratification turns shift finger-pointing into objective process control.",
        emergencyPivotPhrase: "Once we mapped all 79 failures by handover window, the physical root cause became undeniable.",
      },
    },
  },
  {
    name: "MS Check 自动化校验 (Pilot)",
    question: "Tell me about a high-stakes disagreement with leadership on whether to redesign a workflow.",
    sourceDoc: "Eagle Analytical — MS Check Automation Pilot",
    chineseSummary:
      "构建 MS Check 自动三角校验原型替代跨屏幕人工比对，将每日核验耗时从 2-3 小时压缩至 30 分钟以内，零差错漏出。",
    story: {
      question: "Tell me about a high-stakes disagreement with leadership on whether to redesign a workflow.",
      hook: "We agreed that the quality check mattered. What we disagreed on was whether the cumulative cost and risk justified a system-level redesign.",
      emergency: "Routine Method-Suitability checks were manual and fragmented across separate LIMS screens. Multiple functions repeated the same check, but repetition didn't equal independent control—it increased cognitive fatigue and risk exposure.",
      approach: "Instead of arguing abstractly, I didn't push for an immediate mandate. I built an interactive triangulation verification prototype in Excel, mapped error pathways, and proved the concept in a zero-risk sandbox.",
      launch: "I formally presented the data to our QA Director, demonstrating how automated triangulation eliminated human comparison error while preserving manual sign-off for edge cases, then launched a controlled pilot.",
      effect: "Cut verification cycle time by over 50% (from 2–3 hours to <=30 minutes), completely eliminated cross-system discrepancy backlog, and earned director praise as a scalable quality blueprint.",
      reflection: "Personal expertise only truly scales when you turn it into a repeatable system that elevates the entire organization.",
      teleprompterBullets: [
        "1. Problem — Manual LIMS suitability verification took 2–3h/day with fatigue risk.",
        "2. Approach — Built automated 3-way triangulation prototype & led pilot presentation.",
        "3. Takeaway — Cut review to <=30m (50%+ faster), zero discrepancy backlog.",
      ],
      defenseShields: {
        vector1_edgeCase: {
          question: "What if a legacy product has non-standard suitability requirements?",
          counterAnswer: "We built explicit fallback flags: any legacy record missing standard tags is flagged for rapid manual sign-off without interrupting automated batches."
        },
        vector2_pushback: {
          question: "How did you handle the supervisor's initial hesitation that multiple people already checked it?",
          counterAnswer: "I showed empirical data: three tired reviewers comparing 7 parameters across 4 tabs still let subtle mismatches slip through. Automation provides absolute consistency."
        },
        vector3_tradeoff: {
          question: "Did building this tool distract you from daily sample throughput?",
          counterAnswer: "I time-boxed prototyping to 45 minutes before morning peak volume, using the first wave of time savings to fund the remaining validation."
        }
      },
      antiFreeze: {
        memoryAnchors: ["Fragmented LIMS Check", "Triangulation Prototype", "2-3h → ≤30m"],
        goldenQuote: "Repetition is not independent control; triangulation builds true trust.",
        emergencyPivotPhrase: "The turning point was moving from verbal debate to a concrete working prototype."
      }
    }
  },
  {
    name: "48-Slot 视觉防呆托盘 (0 漏样)",
    question: "Describe a time your initial solution failed or received critical feedback. How did you adapt?",
    sourceDoc: "Eagle Analytical — 48-Slot Poka-Yoke Container",
    chineseSummary:
      "放弃繁琐纸质检查表，听取一线反馈联合设计 48 孔视觉防呆托盘（45 样品 + 1 空白 + 2 对照），实现连续 60 天 0 漏样。",
    story: {
      question: "Describe a time your initial solution failed or received critical feedback. How did you adapt?",
      hook: "Early on, I learned that a process control that looks perfect on paper often fails when it clashes with the physical floor reality.",
      emergency: "In our high-volume testing line (~45 samples/batch), missing or misplaced samples occurred roughly once every two weeks, risking turnaround delays.",
      approach: "My first solution was a detailed paper checklist, but analysts gave frank feedback that it slowed them down and added paperwork without stopping errors. I accepted the critique and observed their physical hand movements.",
      launch: "I partnered with a 3D-modeling colleague to co-design an ergonomic 48-slot visual grid tray (45 active samples + 1 blank + 2 controls). One missing slot immediately created an unmissable visual gap.",
      effect: "Zero missing or misplaced samples observed across the first two months, with 100% enthusiastic daily adoption from the analyst team.",
      reflection: "When human error occurs repeatedly, redesign the physical architecture to make compliance natural—never blame the operator.",
      teleprompterBullets: [
        "1. Problem — Initial paper checklist added burden without preventing misplacement.",
        "2. Approach — Accepted analyst critique; co-designed 48-slot Poka-Yoke visual tray.",
        "3. Takeaway — 0 missing samples in 60 days; physical ergonomics beat paper checklists.",
      ],
      defenseShields: {
        vector1_edgeCase: {
          question: "What if batch volume exceeded 45 samples during rush periods?",
          counterAnswer: "We serialized trays into A/B modular blocks with color-coded tags, preserving instant visual accountability across split batches."
        },
        vector2_pushback: {
          question: "Did analysts resist changing how they placed tubes on the bench?",
          counterAnswer: "Because we designed the tray around their natural left-to-right hand reach, analysts found it faster than their old habits on Day 1."
        },
        vector3_tradeoff: {
          question: "Was 3D printing trays compliant with cleanroom sanitization standards?",
          counterAnswer: "We selected autoclavable and isopropyl-resistant resin, validating surface sanitization before placing trays into active production."
        }
      },
      antiFreeze: {
        memoryAnchors: ["Paper Checklist Flaw", "48-Slot Visual Tray", "Zero Missing Samples"],
        goldenQuote: "When human error recurs, fix the ergonomic layout—never blame the operator.",
        emergencyPivotPhrase: "The breakthrough happened when I stopped defending my checklist and watched how analysts actually moved their hands."
      }
    }
  },
  {
    name: "实验室排班重构 (Demand × Proficiency × Strength)",
    question: "Tell me about a time you demonstrated leadership without formal authority to resolve team burnout.",
    sourceDoc: "Eagle Analytical — Lab Staffing Matrix Redesign",
    chineseSummary:
      "基于样本量预测与「需求 × 熟练度 × 个人强项」三维矩阵重构排班与结对交叉培训，消除高峰期积压并获总监推广。",
    story: {
      question: "Tell me about a time you demonstrated leadership without formal authority to resolve team burnout.",
      hook: "The laboratory had simply outgrown its old staffing model, creating silent training and demand mismatches.",
      emergency: "Rapid volume growth under an old rigid rotation schedule caused three locked mismatches: junior staff felt thrown into deep water, experienced analysts carried hidden burdens, and peak-rush turnaround was jeopardized.",
      approach: "I didn't request a blanket headcount increase. Instead, I combined sample-volume forecasting with qualification matrices and 1-on-1 conversations on individual technical strengths.",
      launch: "I presented a dynamic 'Demand × Proficiency × Strength' staffing framework to our Director: establishing stable primary task ownership, agile backup cross-training, and paired mentoring.",
      effect: "Substantially smoothed turnaround during peak seasons, eliminated shift friction, and the Director recommended using the model across broader departments.",
      reflection: "Leadership without authority is about illuminating shared friction with clear data and offering an operational design that makes everyone's day easier.",
      teleprompterBullets: [
        "1. Problem — Rapid growth broke rigid rotation, causing burnout and SLA risk.",
        "2. Approach — Mapped volume forecasts against Demand × Proficiency × Strength.",
        "3. Takeaway — Eliminated peak-season bottlenecks & adopted by lab leadership.",
      ],
      defenseShields: {
        vector1_edgeCase: {
          question: "What if an analyst refused to cross-train into a new testing domain?",
          counterAnswer: "We paired cross-training with a buddy system on lower-volume days, so they never felt isolated or held accountable for initial learning hiccups."
        },
        vector2_pushback: {
          question: "How did you present this to senior peers without sounding like you were telling them how to work?",
          counterAnswer: "I framed it entirely around solving their top headache: eliminating unexpected emergency coverage calls by building reliable backup depth."
        },
        vector3_tradeoff: {
          question: "Did pairing analysts temporarily lower single-day throughput?",
          counterAnswer: "Yes, by about 10% for two weeks, but it permanently prevented multi-day turnaround freezes caused by single-point personnel dependencies."
        }
      },
      antiFreeze: {
        memoryAnchors: ["Outgrown Rotation", "Demand × Proficiency Matrix", "Sustainable Throughput"],
        goldenQuote: "Leadership without authority means solving shared pain with clear operational data.",
        emergencyPivotPhrase: "I focused entirely on removing single-point dependencies rather than pointing fingers at scheduling gaps."
      }
    }
  }
];

const SAMPLE_JDS = [
  {
    name: "Netflix (Streaming Core)",
    company: "Netflix",
    roleTitle: "Senior Distributed Systems Engineer",
    jdText: `Company: Netflix\nJob Title: Senior Distributed Systems Engineer\n\nAbout the Role:\nAt Netflix, we want to entertain the world. We are looking for a Senior Distributed Systems Engineer to scale our global streaming pipeline and real-time telemetry services.\n\nKey Responsibilities:\n- Architect high-throughput, low-latency distributed microservices in Rust, Go, or C++\n- Optimize real-time media ingestion and telemetry pipeline with sub-3s P99 latency\n- Collaborate with cross-functional teams across AWS cloud infrastructure, Kafka, and Kubernetes\n- Lead incident response, root cause diagnostics, and resilient failure recovery\n\nQualifications:\n- 5+ years building high-concurrency production backends\n- Deep knowledge of multithreading, event loops, WASAPI/audio-video streaming, and memory profiling\n- Experience with Kafka, Redis, Docker, Kubernetes, and AWS cloud architectures\n- Strong ownership and data-driven problem solving`,
  },
  {
    name: "Anthropic (AI Systems)",
    company: "Anthropic",
    roleTitle: "Staff AI Inference & Systems Engineer",
    jdText: `Staff AI Inference & Systems Engineer at Anthropic\n\nAbout Anthropic:\nAnthropic is an AI safety and research company dedicated to building reliable, beneficial AI systems. We are seeking a Staff Engineer to architect low-latency LLM serving pipelines and real-time reasoning runtimes.\n\nResponsibilities:\n- Design low-latency inference engines for frontier Claude models\n- Optimize GPU/CPU memory bandwidth, KV cache reuse, and speculative decoding\n- Build real-time streaming APIs handling tens of thousands of concurrent token streams\n\nRequirements:\n- Strong production experience in Python, Rust, PyTorch, and CUDA/C++\n- Proven track record optimizing distributed inference, latency SLAs, and high-reliability APIs`,
  },
  {
    name: "Google (Cloud / Real-Time)",
    company: "Google",
    roleTitle: "Senior Software Engineer - Real-Time Infrastructure",
    jdText: `Google - Senior Software Engineer - Real-Time Infrastructure\n\nAbout the Team:\nGoogle Cloud Real-Time Communications powers Google Meet, Voice, and live media pipelines for over 300 million daily users.\n\nMinimum Qualifications:\n- Bachelor's degree in CS or equivalent practical experience\n- 5+ years of software development experience in Python, C++, Go, or Rust\n- Experience building distributed systems, RPC services, and high-availability cloud backends\n\nPreferred Qualifications:\n- Experience with WebRTC, WASAPI audio loopback, socket streaming, and low-latency protocols\n- Experience optimizing P95/P99 latency bottlenecks and production reliability to 99.99%`,
  },
  {
    name: "Stripe (Payments Core)",
    company: "Stripe",
    roleTitle: "Senior Backend Engineer - Core Processing",
    jdText: `Stripe is hiring a Senior Backend Engineer to join our Core Payment Processing team.\n\nAbout Stripe:\nStripe is a financial infrastructure platform for the internet. Millions of companies use Stripe to accept payments and grow their revenue.\n\nRole Requirements:\n- Build robust distributed transaction pipelines with 99.999% SLA reliability\n- Profile and optimize microsecond database latency across distributed databases\n- Lead system design for resilient distributed transactions, idempotency, and fraud detection\n- Tech stack: Java, Go, Ruby, distributed SQL, Kafka, AWS, Kubernetes`,
  },
];

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
    const loadedQuestions: StarQuestionItem[] = Array.isArray(parsed.questions)
      ? parsed.questions
      : DEFAULT_PREP_DATA.questions;
    const hasLatchBio = loadedQuestions.some((q) => q.id === "q_latchbio_task1");
    const mergedQuestions = hasLatchBio
      ? loadedQuestions
      : [DEFAULT_PREP_DATA.questions[0], ...loadedQuestions];
    return {
      ...DEFAULT_PREP_DATA,
      ...parsed,
      domainTerms:
        Array.isArray(parsed.domainTerms) && parsed.domainTerms.length > 0
          ? parsed.domainTerms
          : DEFAULT_PREP_DATA.domainTerms,
      questions: mergedQuestions,
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
  // File upload & JD parsing state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    sizeStr: string;
    charCount: number;
    wordCount: number;
  } | null>(null);
  const [isDraggingResume, setIsDraggingResume] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [detectedSkills, setDetectedSkills] = useState<string[]>([]);
  const [sampleJdIndex, setSampleJdIndex] = useState(0);
  const [jdDeepAnalysis, setJdDeepAnalysis] = useState<JdDeepAnalysisResult | null>(null);
  const [showPsycheDrawer, setShowPsycheDrawer] = useState(true);
  const [showDefenseShields, setShowDefenseShields] = useState(true);
  const [showAntiFreeze, setShowAntiFreeze] = useState(true);

  // Phase 2 P1 Differentiators: Domain Vocab + 3-Bullet/Full Toggle + Chinese Summary + No-Hint Recall
  const [customTermInput, setCustomTermInput] = useState("");
  const [answerDisplayMode, setAnswerDisplayMode] = useState<"bullets" | "full">("bullets");
  const [showChineseSummary, setShowChineseSummary] = useState(true);
  const [noHintRecallMode, setNoHintRecallMode] = useState(false);
  const [noHintRevealed, setNoHintRevealed] = useState(false);

  const activeDomainTerms = useMemo(
    () => prepData.domainTerms ?? PRIORITY_DOMAIN_TERMS,
    [prepData.domainTerms]
  );

  const vocabPromptString = useMemo(
    () => activeDomainTerms.join(", ").slice(0, 400),
    [activeDomainTerms]
  );

  const handleToggleDomainTerm = useCallback((term: string) => {
    setPrepData((prev) => {
      const current = prev.domainTerms ?? PRIORITY_DOMAIN_TERMS;
      const exists = current.includes(term);
      const next = exists ? current.filter((t) => t !== term) : [...current, term];
      return { ...prev, domainTerms: next };
    });
  }, []);

  const handleAddCustomDomainTerm = useCallback(() => {
    const clean = customTermInput.trim();
    if (!clean) return;
    setPrepData((prev) => {
      const current = prev.domainTerms ?? PRIORITY_DOMAIN_TERMS;
      if (current.includes(clean)) return prev;
      return { ...prev, domainTerms: [...current, clean] };
    });
    setCustomTermInput("");
    showToast(`已添加岗位专业术语「${clean}」至 STT 识别偏置词库`, "success");
  }, [customTermInput]);

  const handleSyncDomainVocabToWhisper = useCallback(async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("update_whisper_dual_pass_config", {
        shortChunkSecs: 3.5,
        longChunkSecs: 7.0,
        pauseSecs: 1.5,
        vocabularyPrompt: vocabPromptString,
      });
      showToast(
        `🎯 已将 ${activeDomainTerms.length} 个专业术语 (${vocabPromptString.length}/400 字符) 注入本地 Whisper STT 引擎！`,
        "success"
      );
    } catch {
      showToast(
        `✅ 已保存 ${activeDomainTerms.length} 个专业术语 (${vocabPromptString.length}/400 字符) 至本地词库配置！`,
        "info"
      );
    }
  }, [activeDomainTerms.length, vocabPromptString]);

  // ── Auto-analyze JD on load or JD change ──
  useEffect(() => {
    if (prepData.jdText.trim().length > 30) {
      const res = analyzeJdDeeply(prepData.jdText, prepData.company, prepData.roleTitle);
      setJdDeepAnalysis(res);
    }
  }, [prepData.jdText, prepData.company, prepData.roleTitle]);

  // ── Engine 1: JD 转面试问题 (一键生成全套押题) ──
  const handleGenerateFullJdQuestionSet = useCallback(() => {
    const analysis = analyzeJdDeeply(prepData.jdText, prepData.company, prepData.roleTitle);
    setJdDeepAnalysis(analysis);

    const newQuestions: StarQuestionItem[] = [];

    // 1. Common Core (必考通用)
    analysis.questions.commonQuestions.forEach((q, idx) => {
      newQuestions.push({
        id: `q_common_${Date.now()}_${idx}`,
        category: "behavioral",
        question: q,
        situation: "Facing mission-critical delivery targets with limited timeline.",
        task: "Ensure high SLA reliability and align stakeholders.",
        action: "Executed phased rollout, profiled dependencies, and communicated transparently.",
        result: "Delivered 50%+ measurable improvement with zero production regressions.",
        opener: `Let me share a concrete example that illustrates my approach to this.`,
        bullets: [
          "Situation: High-stakes delivery under strict production SLA.",
          "Action: Targeted bottleneck fix & aligned cross-functional partners.",
          "Result: 50%+ cycle time reduction with zero defect escapes.",
        ],
        keywords: "Systemic Execution · Cross-functional Alignment",
        practicedCount: 0,
      });
    });

    // 2. Role Specific Deep-Dives (岗位定制深挖)
    analysis.questions.roleSpecificQuestions.forEach((q, idx) => {
      newQuestions.push({
        id: `q_role_${Date.now()}_${idx}`,
        category: "jd_custom",
        question: q,
        situation: `At ${prepData.company}, handling scaling bottlenecks under high throughput is paramount.`,
        task: "Architect an automated and resilient workflow eliminating manual choke-points.",
        action: "Designed automated verification and streaming pipeline with robust failure domains.",
        result: "Slashed latency/turnaround by over 50% across peak volume.",
        opener: `In my previous work, I spearheaded this exact challenge by building a scalable automated pipeline.`,
        bullets: [
          `Context: High-volume workload required robust architectural controls.`,
          `Action: Implemented automated verification & standardized SOPs.`,
          `Impact: 50%+ throughput gain with complete audit agreement.`,
        ],
        keywords: `${analysis.competencies[0]?.name || "Problem Solving"} · Scalable Automation`,
        practicedCount: 0,
      });
    });

    // 3. Red Flag Defusal (避坑高危防御)
    analysis.questions.redFlagQuestions.forEach((q, idx) => {
      newQuestions.push({
        id: `q_redflag_${Date.now()}_${idx}`,
        category: "mistake_book",
        question: q,
        situation: "Early in my career, I realized that rigid theoretical controls often clash with floor realities.",
        task: "Pivot rapidly from defending my initial draft to solving the root ergonomic friction.",
        action: "Gathered direct stakeholder critique and co-designed an intuitive physical visual tray.",
        result: "Eliminated recurring errors to zero for 60 consecutive days.",
        opener: `I believe the greatest strength an engineer can have is knowing when to let go of an initial idea to fit operational reality.`,
        bullets: [
          "Defusal: Paper controls fail when they ignore floor human factors.",
          "Action: Embraced feedback & deployed ergonomic visual accountability.",
          "Outcome: 0 errors in 60 days; built enduring psychological safety.",
        ],
        keywords: "Self-Correction · Systems Thinking · Zero Blame",
        practicedCount: 0,
      });
    });

    setPrepData((prev) => ({
      ...prev,
      questions: [...newQuestions, ...prev.questions],
    }));
    setSelectedQId(newQuestions[0]?.id || "");
    setSubTab("star_bank");
    showToast(
      `🎉 已通过「JD转面试问题神器」生成全套 ${newQuestions.length} 道针对性押题并注入题库！`,
      "success"
    );
  }, [prepData.jdText, prepData.company, prepData.roleTitle]);



  // ── Load Real Story Bank Preset ──
  const handleLoadRealStory = useCallback((templateIndex: number) => {
    const item = VERIFIED_STORY_TEMPLATES[templateIndex];
    if (!item) return;

    const newQ: StarQuestionItem = {
      id: `q_verified_${Date.now()}`,
      category: "behavioral",
      question: item.question,
      opener: item.story.hook,
      situation: item.story.emergency,
      task: item.story.approach,
      action: item.story.launch,
      result: item.story.effect,
      bullets: item.story.teleprompterBullets,
      keywords: item.story.antiFreeze.memoryAnchors.join(" · "),
      practicedCount: 1,
      sourceTier: "verified",
      sourceDoc: item.sourceDoc,
      chineseSummary: item.chineseSummary,
      defenseShields: item.story.defenseShields,
      antiFreeze: item.story.antiFreeze,
    };

    setPrepData((prev) => ({
      ...prev,
      questions: [newQ, ...prev.questions],
    }));
    setSelectedQId(newQ.id);
    setNoHintRevealed(false);
    showToast(`🟢 已载入已验证真实答案 (Verified)：${item.name}`, "info");
  }, []);

  // ── Auto-Parse JD on demand or on paste ──
  const handleParseJd = useCallback(
    (customText?: string) => {
      const textToParse = customText ?? prepData.jdText;
      if (!textToParse.trim()) {
        showToast("请先在下方输入框粘贴或输入 JD 文本", "warning");
        return;
      }
      const meta = parseJdMetadata(textToParse);

      setPrepData((prev) => {
        const newCompany = meta.company || prev.company;
        const newRole = meta.roleTitle || prev.roleTitle;
        return {
          ...prev,
          company: newCompany,
          roleTitle: newRole,
          jdText: customText ? customText : prev.jdText,
        };
      });

      setDetectedSkills(meta.extractedSkills);

      if (meta.company && meta.roleTitle) {
        showToast(
          `🎉 智能提取成功：公司「${meta.company}」· 职位「${meta.roleTitle}」！`,
          "success"
        );
      } else if (meta.company || meta.roleTitle) {
        showToast(
          `✨ 已自动识别并填充：${meta.company ? `公司「${meta.company}」` : `职位「${meta.roleTitle}」`}`,
          "info"
        );
      } else {
        showToast("💡 已完成文本分析，未发现固定格式标题，您可在上方直接微调", "info");
      }
    },
    [prepData.jdText]
  );

  // ── On Paste into JD textarea: Instant Auto-fill ──
  const handleJdPaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const pasted = e.clipboardData.getData("text");
      if (pasted && pasted.trim().length > 30) {
        handleParseJd(pasted);
      }
    },
    [handleParseJd]
  );

  // ── Quick Load Sample JD ──
  const handleLoadNextSampleJd = useCallback(() => {
    const sample = SAMPLE_JDS[sampleJdIndex % SAMPLE_JDS.length];
    setSampleJdIndex((prev) => prev + 1);
    setPrepData((prev) => ({
      ...prev,
      company: sample.company,
      roleTitle: sample.roleTitle,
      jdText: sample.jdText,
    }));
    const meta = parseJdMetadata(sample.jdText);
    setDetectedSkills(meta.extractedSkills);
    showToast(`已加载大厂 JD 样例：${sample.name}`, "info");
  }, [sampleJdIndex]);

  // ── Handle Resume File Upload ──
  const handleProcessResumeFile = useCallback(async (file: File) => {
    setIsParsingFile(true);
    try {
      const res = await parseResumeFile(file);
      setUploadedFile({
        name: res.fileName,
        sizeStr: res.fileSizeStr,
        charCount: res.charCount,
        wordCount: res.wordCount,
      });
      setPrepData((prev) => ({
        ...prev,
        resumeText: res.text,
      }));
      showToast(
        `📄 简历文件「${res.fileName}」解析成功 (${res.fileSizeStr} · ${res.charCount} 字符)！`,
        "success"
      );
    } catch (err) {
      console.error("[ResumeUpload] Error parsing file:", err);
      showToast("简历文件解析失败，请检查文件格式是否有效", "error");
    } finally {
      setIsParsingFile(false);
    }
  }, []);

  const handleClearResume = useCallback(() => {
    setUploadedFile(null);
    setPrepData((prev) => ({ ...prev, resumeText: "" }));
    showToast("已清空简历经历文本", "info");
  }, []);


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

  // ── Sync Resume + JD + Domain Vocab + Verified STAR Cheat Cards into Live CoPilot AI Context ──
  const handleSyncToLiveCopilot = useCallback(() => {
    const starCardsSummary = prepData.questions
      .slice(0, 8)
      .map(
        (q, i) =>
          `[Q${i + 1} (${(q.sourceTier ?? "verified").toUpperCase()} — ${q.sourceDoc || "Verified Story"}): ${q.question}] -> Opener: ${q.opener} | Bullets: ${q.bullets.join(" ; ")} | Locked Metrics/Keywords: ${q.keywords}`
      )
      .join("\n");

    const composedContext =
      `[CANDIDATE TARGET ROLE]: ${prepData.roleTitle} @ ${prepData.company}\n` +
      `[PRIORITY DOMAIN VOCABULARY]: ${vocabPromptString}\n` +
      `[CANDIDATE RESUME HIGHLIGHTS]: ${prepData.resumeText.slice(0, 600)}\n` +
      `[TARGET JD KEYWORDS]: ${prepData.jdText.slice(0, 400)}\n` +
      `[VERIFIED STAR CHEAT CARDS (VERIFIED ANSWER FIRST)]:\n${starCardsSummary}\n` +
      `CRITICAL GROUNDING RULE (IC-ANSWER-03): Always prioritize Verified answers above first. Never invent or alter locked metrics (e.g., OR = 1.320647, 73/73 passed, 2-3h -> <=30m).`;

    setCustomInstructions(composedContext);
    void handleSyncDomainVocabToWhisper();
    showToast("已将简历、JD、专业术语词库与 Verified 原答案小抄同步至面中提词引擎！", "success");
  }, [prepData, vocabPromptString, setCustomInstructions, handleSyncDomainVocabToWhisper]);

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

  // ── Engine 2: 面试故事 Generator (HEALER 6-Step Story Architect) ──
  const handleGenerateHealerStoryForCurrent = useCallback(() => {
    if (!selectedQuestion) return;
    const healer = generateHealerStory(
      selectedQuestion.question,
      prepData.resumeText,
      prepData.company,
      prepData.roleTitle,
      selectedQuestion.category
    );

    updateSelectedQuestion({
      opener: healer.hook,
      situation: healer.emergency,
      task: healer.approach,
      action: healer.launch,
      result: healer.effect,
      bullets: healer.teleprompterBullets,
      keywords: `${healer.antiFreeze.memoryAnchors.join(" · ")}`,
      defenseShields: healer.defenseShields,
      antiFreeze: healer.antiFreeze,
    });

    showToast("✨ 已通过「面试故事 Generator」生成 HEALER 黄金小抄、3-Vector 防守盾与防卡壳卡！", "success");
  }, [selectedQuestion, prepData.resumeText, prepData.company, prepData.roleTitle, updateSelectedQuestion]);

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
        <div className="space-y-4">
          {/* Top: 2 Clear Portals Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 📋 PORTAL 1: 目标岗位 JD (Job Description) */}
            <div className="flex flex-col space-y-2.5 rounded-xl border border-border/30 bg-card/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/20 text-primary text-[11px] font-bold">
                    ①
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    📋 入口一：目标岗位 JD (Job Description)
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleLoadNextSampleJd}
                    className="flex items-center gap-1 rounded bg-secondary/70 px-2 py-0.5 text-meta font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all cursor-pointer"
                    title="切换大厂真实 JD 样例进行测试"
                  >
                    🎲 换个大厂 JD
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const clipText = await navigator.clipboard.readText();
                        if (clipText) {
                          setPrepData((p) => ({ ...p, jdText: clipText }));
                          handleParseJd(clipText);
                        }
                      } catch (err) {
                        console.warn("Clipboard access:", err);
                      }
                    }}
                    className="flex items-center gap-1 rounded bg-primary/15 px-2 py-0.5 text-meta font-semibold text-primary hover:bg-primary/25 transition-all cursor-pointer"
                  >
                    📋 粘贴剪贴板
                  </button>
                </div>
              </div>

              <textarea
                rows={6}
                value={prepData.jdText}
                onChange={(e) =>
                  setPrepData((p) => ({ ...p, jdText: e.target.value }))
                }
                onPaste={handleJdPaste}
                placeholder="直接粘贴目标职位的 Job Description（系统将自动识别提取目标公司、职位名称、核心胜任力要求与高频技术栈）..."
                className="w-full rounded-lg border border-border/30 bg-background/60 p-3 text-xs text-foreground focus:border-primary/50 focus:outline-none resize-none leading-relaxed"
              />

              {/* Detected Company & Role Bar */}
              <div className="flex items-center justify-between gap-2 rounded-lg bg-secondary/40 border border-border/20 px-3 py-2 text-xs flex-wrap">
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-[11px] font-bold text-muted-foreground shrink-0">自动识别:</span>
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <input
                      type="text"
                      value={prepData.company}
                      onChange={(e) => setPrepData((p) => ({ ...p, company: e.target.value }))}
                      placeholder="公司名 (自动提取)"
                      className="bg-transparent text-xs font-semibold text-foreground focus:outline-none border-b border-dashed border-border/40 focus:border-primary w-28 truncate"
                      title="点击可直接手动修改公司名"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                    <input
                      type="text"
                      value={prepData.roleTitle}
                      onChange={(e) => setPrepData((p) => ({ ...p, roleTitle: e.target.value }))}
                      placeholder="岗位 Title (自动提取)"
                      className="bg-transparent text-xs font-semibold text-foreground focus:outline-none border-b border-dashed border-border/40 focus:border-primary w-40 truncate"
                      title="点击可直接手动修改职位名称"
                    />
                  </div>
                </div>
                {detectedSkills.length > 0 && (
                  <span className="text-[10px] text-primary/80 font-medium shrink-0">
                    已提取 {detectedSkills.length} 项关键技术
                  </span>
                )}
              </div>
            </div>

            {/* 📄 PORTAL 2: 我的个人简历 (Resume) */}
            <div className="flex flex-col space-y-2.5 rounded-xl border border-border/30 bg-card/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/20 text-primary text-[11px] font-bold">
                    ②
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    📄 入口二：我的个人简历 (Resume)
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.md,.json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProcessResumeFile(file);
                      if (e.target) e.target.value = "";
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 rounded bg-primary/15 px-2 py-0.5 text-meta font-semibold text-primary hover:bg-primary/25 transition-all cursor-pointer"
                  >
                    <FileUp className="h-3 w-3" />
                    上传文件 (PDF/Word)
                  </button>
                  {uploadedFile && (
                    <button
                      type="button"
                      onClick={handleClearResume}
                      className="rounded bg-secondary/70 px-2 py-0.5 text-meta font-medium text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                    >
                      清空
                    </button>
                  )}
                </div>
              </div>

              {/* Upload Dropzone or File Card */}
              {uploadedFile ? (
                <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs transition-all">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground truncate">{uploadedFile.name}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      ({uploadedFile.sizeStr} · 已解析 {uploadedFile.charCount} 字符)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer shrink-0"
                  >
                    更换文件
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingResume(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingResume(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingResume(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleProcessResumeFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`group flex items-center justify-center gap-2.5 rounded-lg border border-dashed py-2.5 px-3 text-center transition-all cursor-pointer ${
                    isDraggingResume
                      ? "border-primary bg-primary/20 scale-[0.99]"
                      : "border-border/40 bg-background/40 hover:border-primary/50 hover:bg-background/80"
                  }`}
                >
                  <UploadCloud className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    {isParsingFile
                      ? "⏳ 正在极速解析简历文本..."
                      : "拖拽 PDF / Word (.docx) 简历到此处，或点击浏览上传"}
                  </span>
                  <span className="rounded bg-secondary/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    离线保密解析
                  </span>
                </div>
              )}

              <textarea
                rows={uploadedFile ? 5 : 4}
                value={prepData.resumeText}
                onChange={(e) =>
                  setPrepData((p) => ({ ...p, resumeText: e.target.value }))
                }
                placeholder="上传文件后内容自动在此显示；也可直接在此粘贴简历项目经历、量化成就与技术亮点..."
                className="w-full rounded-lg border border-border/30 bg-background/60 p-3 text-xs text-foreground focus:border-primary/50 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* 🌟 Centerpiece: Prominent Hero Action Button */}
          <div className="rounded-xl border border-primary/40 bg-gradient-to-r from-primary/15 via-primary/10 to-primary/20 p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                <span className="text-sm font-bold text-foreground">🎯 JD × 简历 智能对齐引擎已就绪</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                  jdAnalysis.score >= 70
                    ? "bg-success/20 text-success border-success/30"
                    : "bg-primary/20 text-primary border-primary/30"
                }`}>
                  匹配度 {jdAnalysis.score}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                一键生成：胜任力频次雷达 · 招聘经理心理透视 · 3-Tier 高频押题库 · 匹配专属 HEALER 故事小抄
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateFullJdQuestionSet}
              className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-500 px-6 py-3 text-xs font-extrabold text-white shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4 animate-pulse" />
              ✨ 一键智能诊断 & 生成全套押题 →
            </button>
          </div>

          {/* Bottom Insights: Match Radar & Hiring Manager Psyche (Side-by-Side) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: 📊 简历 × JD 关键词雷达 */}
            <div className="flex flex-col space-y-2.5 rounded-xl border border-border/30 bg-card/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    📊 简历 × JD 关键词雷达
                  </h3>
                  <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                    Jonathan JD分析神器
                  </span>
                </div>
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
                <div className="text-meta font-semibold text-success mb-1">
                  🟢 简历优势词 ({jdAnalysis.matched.length}) — 面试重点展开：
                </div>
                <div className="flex flex-wrap gap-1">
                  {jdAnalysis.matched.length > 0 ? (
                    jdAnalysis.matched.slice(0, 10).map((w) => (
                      <span
                        key={w}
                        className="rounded-md border border-success/30 bg-success/10 px-2 py-0.5 text-meta font-medium text-success"
                      >
                        ✓ {w}
                      </span>
                    ))
                  ) : (
                    <span className="text-meta text-muted-foreground">暂无重合词</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-meta font-semibold text-warning mb-1">
                  🔴 JD 需提防缺口词 ({jdAnalysis.missing.length}) — 提前准备防御：
                </div>
                <div className="flex flex-wrap gap-1">
                  {jdAnalysis.missing.length > 0 ? (
                    jdAnalysis.missing.slice(0, 8).map((w) => (
                      <span
                        key={w}
                        className="rounded-md border border-warning/30 bg-warning/10 px-2 py-0.5 text-meta font-medium text-warning"
                      >
                        ! {w}
                      </span>
                    ))
                  ) : (
                    <span className="text-meta text-success">太棒了！核心词全部覆盖！</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: 🎯 招聘经理心理透视 & 核心痛点 */}
            {jdDeepAnalysis && (
              <div className="rounded-xl border border-primary/25 bg-background/50 p-3 space-y-2">
                <div
                  onClick={() => setShowPsycheDrawer(!showPsycheDrawer)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      🎯 招聘经理心理透视 & 核心痛点
                    </span>
                  </div>
                  {showPsycheDrawer ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>

                {showPsycheDrawer && (
                  <div className="space-y-2 pt-1 text-xs text-muted-foreground">
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2 text-foreground">
                      <span className="font-bold text-destructive text-[11px] block mb-0.5">
                        🚨 团队当前核心痛点与业务威胁:
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        {jdDeepAnalysis.hiringManager.biggestPainPoint}
                      </p>
                    </div>

                    <div className="rounded-lg bg-secondary/50 p-2">
                      <span className="font-semibold text-foreground text-[11px] block mb-0.5">
                        👥 招聘经理最喜欢和谁共事:
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        {jdDeepAnalysis.hiringManager.whoTheyEnjoyWorkingWith}
                      </p>
                    </div>

                    <div className="rounded-lg bg-success/10 border border-success/20 p-2 text-foreground">
                      <span className="font-bold text-success text-[11px] block mb-0.5">
                        🏆 50%+ 降本增效超能力 (Superpower at Work):
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        {jdDeepAnalysis.hiringManager.superpowerAtWork}
                      </p>
                    </div>

                    {/* Top Competencies Ranked by Frequency */}
                    <div className="pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                        📋 JD 胜任力频次排序 (Top Competencies):
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {jdDeepAnalysis.competencies.slice(0, 4).map((c) => (
                          <div
                            key={c.name}
                            className="flex items-center justify-between rounded border border-border/25 bg-background/80 px-2 py-1 text-[10px]"
                          >
                            <span className="font-medium text-foreground truncate">{c.name}</span>
                            <span className="text-primary font-bold">{c.count}次</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 🧬 Phase 2 P1: Job-Specific Domain Vocabulary (IC-VOCAB-01 ~ IC-VOCAB-06) */}
          <div className="rounded-xl border border-primary/30 bg-card/30 p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-foreground">
                  🧬 岗位专属专业术语识别库 (Domain Vocabulary Bias · IC-VOCAB)
                </span>
                <span className="rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary">
                  已启用 {activeDomainTerms.length} 词 · {vocabPromptString.length} / 400 字符 STT 预算
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customTermInput}
                  onChange={(e) => setCustomTermInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCustomDomainTerm();
                  }}
                  placeholder="+ 添加专属科研/业务术语 (如 SpatialBench)..."
                  className="rounded-lg border border-border/30 bg-background/60 px-2.5 py-1 text-xs text-foreground w-56"
                />
                <button
                  type="button"
                  onClick={handleAddCustomDomainTerm}
                  className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-secondary/80 cursor-pointer"
                >
                  添加
                </button>
                <button
                  type="button"
                  onClick={handleSyncDomainVocabToWhisper}
                  className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-xs font-bold text-white hover:bg-primary/90 shadow-sm cursor-pointer"
                >
                  ⚡ 注入本地 Whisper STT 引擎
                </button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              剔除无关通用 AI 工程热词（如 TensorRT/PagedAttention），仅保留你在面试中真正会讲的核心科研与业务高频词，直接写入本地 Whisper `initial_prompt` 偏置：
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(new Set([...PRIORITY_DOMAIN_TERMS, ...activeDomainTerms])).map(
                (term) => {
                  const isActive = activeDomainTerms.includes(term);
                  return (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleToggleDomainTerm(term)}
                      className={`rounded-md border px-2 py-0.5 text-meta font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "border-primary/40 bg-primary/15 text-primary"
                          : "border-border/20 bg-background/40 text-muted-foreground line-through opacity-60"
                      }`}
                      title="点击切换是否启用该术语的 STT 偏置识别"
                    >
                      {isActive ? "✓ " : ""}
                      {term}
                    </button>
                  );
                }
              )}
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
              {filteredQuestions.map((q) => {
                const tier = q.sourceTier ?? (q.id.startsWith("q_verified") || q.id === "q_latchbio_task1" ? "verified" : q.category === "jd_custom" ? "adapted" : "verified");
                return (
                <div
                  key={q.id}
                  onClick={() => {
                    setSelectedQId(q.id);
                    setNoHintRevealed(false);
                  }}
                  className={`group flex items-start justify-between gap-2 rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                    selectedQuestion?.id === q.id
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/20 bg-background/40 hover:border-border/40"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        {q.category === "mistake_book" ? "🔴 错题" : q.category}
                      </span>
                      {tier === "verified" ? (
                        <span className="rounded bg-success/15 border border-success/30 px-1.5 py-0.5 text-[10px] font-bold text-success">
                          🟢 Verified 原答案
                        </span>
                      ) : tier === "adapted" ? (
                        <span className="rounded bg-warning/15 border border-warning/30 px-1.5 py-0.5 text-[10px] font-bold text-warning">
                          🟡 Adapted 重组
                        </span>
                      ) : (
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          ⚪ General 通用
                        </span>
                      )}
                      {/\d+%|\d+x|\$\d+|1\.320647|73\/73|30m/i.test(q.result + " " + q.keywords) && (
                        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          含锁定证据
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
                );
              })}
            </div>
          </div>

          {/* Right: STAR 4-Box Editor + 3-Bullet Cheat Card */}
          {selectedQuestion && (
            <div className="lg:col-span-7 space-y-3 rounded-xl border border-border/30 bg-card/30 p-4">
              <div className="space-y-2 border-b border-border/20 pb-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-foreground">
                      🗂️ HEALER 故事打磨 & 3-Vector 防守盾
                    </h3>
                    <span className="rounded bg-primary/15 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                      Jonathan V2.0 黄金结构
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleGenerateHealerStoryForCurrent}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-xs font-bold text-white hover:bg-primary/90 shadow-sm cursor-pointer"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      ✨ 一键生成 HEALER 故事小抄
                    </button>
                    <button
                      type="button"
                      onClick={handleAutoBuildThreeBullets}
                      className="flex items-center gap-1 rounded-lg bg-secondary/80 px-2 py-1 text-meta font-medium text-foreground hover:bg-secondary cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3" />
                      提炼 3-Bullet
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPracticeTranscript(
                          `${selectedQuestion.opener} ${selectedQuestion.situation} ${selectedQuestion.task} ${selectedQuestion.action} ${selectedQuestion.result}`
                        );
                        setSubTab("mock_coach");
                      }}
                      className="flex items-center gap-1 rounded-lg bg-success/15 px-2.5 py-1 text-meta font-semibold text-success hover:bg-success/25 cursor-pointer"
                    >
                      <Mic className="h-3 w-3" />
                      去演练 →
                    </button>
                  </div>
                </div>

                {/* Preset Real Story Pills */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-0.5">
                  <span className="text-muted-foreground font-medium shrink-0">🎲 载入实战经典故事:</span>
                  {VERIFIED_STORY_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={tmpl.name}
                      type="button"
                      onClick={() => handleLoadRealStory(idx)}
                      className="rounded-md border border-border/30 bg-background/60 px-2 py-0.5 text-foreground hover:border-primary/50 hover:bg-primary/10 transition-all cursor-pointer"
                    >
                      {tmpl.name}
                    </button>
                  ))}
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

              {/* Live 3-Bullet / Full Answer Card with Verified Source & No-Hint Mode (IC-ANSWER-02~03, IC-LANG-04, IC-COACH-01~02) */}
              <div className="rounded-xl border border-warning/30 bg-warning/5 p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-meta font-bold uppercase tracking-wider text-warning">
                      ⚡ 面中极简提词卡 (1秒扫视小抄)
                    </span>
                    <span className="rounded-md border border-success/40 bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
                      {(selectedQuestion.sourceTier ?? "verified") === "verified"
                        ? `🟢 Verified — ${selectedQuestion.sourceDoc || "真实经历原答案"}`
                        : selectedQuestion.sourceTier === "adapted"
                          ? `🟡 Adapted — ${selectedQuestion.sourceDoc || "基于真实资料重组"}`
                          : "⚪ General — 通用回答思路"}
                    </span>
                  </div>

                  {/* Clean Mode Toggles: 3-Bullet vs Full Script | 1-Line Chinese | No-Hint Blind Recall */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center rounded-lg border border-border/30 bg-background/70 p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setAnswerDisplayMode("bullets")}
                        className={`rounded-md px-2 py-0.5 font-bold transition-all cursor-pointer ${
                          answerDisplayMode === "bullets"
                            ? "bg-primary text-white"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        ⚡ 提词要点 (3-Bullet)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnswerDisplayMode("full")}
                        className={`rounded-md px-2 py-0.5 font-bold transition-all cursor-pointer ${
                          answerDisplayMode === "full"
                            ? "bg-primary text-white"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        📝 完整回答
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowChineseSummary((v) => !v)}
                      className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                        showChineseSummary
                          ? "border-primary/40 bg-primary/15 text-primary"
                          : "border-border/30 bg-background/60 text-muted-foreground"
                      }`}
                      title="可选单行中文要旨解释，不挤占英文主视野"
                    >
                      🌐 中文快译
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNoHintRecallMode((m) => !m);
                        setNoHintRevealed(false);
                      }}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                        noHintRecallMode
                          ? "border-warning bg-warning/20 text-warning"
                          : "border-border/30 bg-background/60 text-muted-foreground hover:text-foreground"
                      }`}
                      title="先隐藏答案自主口述，再揭晓核对 4 大得分点"
                    >
                      {noHintRecallMode ? "🙈 盲答训练中" : "🙈 无提示盲答"}
                    </button>
                  </div>
                </div>

                {/* No-Hint Blind Recall Gate (IC-COACH-01 ~ IC-COACH-02) */}
                {noHintRecallMode && !noHintRevealed ? (
                  <div className="rounded-xl border border-dashed border-warning/50 bg-background/80 p-4 text-center space-y-2.5">
                    <div className="text-xs font-bold text-foreground">
                      🎙️ 无提示独立回答训练：请先不看提示，自己完整口述一遍本题回答！
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      题目：<span className="font-semibold text-foreground">{selectedQuestion.question}</span>
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setNoHintRevealed(true)}
                        className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary/90 shadow-sm cursor-pointer"
                      >
                        👁️ 我已讲完，揭晓答案并核对得分点
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={selectedQuestion.opener}
                      onChange={(e) =>
                        updateSelectedQuestion({ opener: e.target.value })
                      }
                      placeholder="🗣️ 首句自然开口 (Opener)..."
                      className="w-full rounded-lg border border-border/30 bg-background/70 px-2.5 py-1.5 text-xs font-semibold text-foreground"
                    />

                    {answerDisplayMode === "bullets" ? (
                      <div className="space-y-1.5">
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
                            className="w-full rounded-lg border border-border/30 bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border/30 bg-background/80 p-3 text-xs leading-relaxed text-foreground space-y-1.5">
                        <p><strong className="text-primary">Hook:</strong> {selectedQuestion.opener}</p>
                        <p><strong className="text-primary">Problem:</strong> {selectedQuestion.situation}</p>
                        <p><strong className="text-primary">Approach:</strong> {selectedQuestion.task} {selectedQuestion.action}</p>
                        <p><strong className="text-success">Impact:</strong> {selectedQuestion.result}</p>
                      </div>
                    )}

                    <input
                      type="text"
                      value={selectedQuestion.keywords}
                      onChange={(e) =>
                        updateSelectedQuestion({ keywords: e.target.value })
                      }
                      placeholder="🔑 3 个必提量化指标与关键词..."
                      className="w-full rounded-lg border border-border/30 bg-background/70 px-2.5 py-1 text-xs font-bold text-primary"
                    />

                    {showChineseSummary && (
                      <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/25 px-2.5 py-1.5 text-[11px] text-foreground">
                        <span className="font-bold text-primary shrink-0">🇨🇳 一句话要旨:</span>
                        <input
                          type="text"
                          value={
                            selectedQuestion.chineseSummary ??
                            "围绕问题背景、核心分层/防呆动作与真实量化结果三点展开。"
                          }
                          onChange={(e) =>
                            updateSelectedQuestion({ chineseSummary: e.target.value })
                          }
                          className="w-full bg-transparent text-[11px] text-foreground focus:outline-none"
                        />
                      </div>
                    )}

                    {noHintRecallMode && noHintRevealed && (
                      <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/10 px-3 py-1.5 text-[11px]">
                        <span className="font-bold text-success">
                          ✅ 盲答自检清单：你刚才口述时是否完整覆盖了以下 4 点？
                        </span>
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                          <span>☑ Problem</span>
                          <span>☑ Approach</span>
                          <span>☑ Evidence ({selectedQuestion.keywords.split("·")[0]?.trim()})</span>
                          <span>☑ Takeaway</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ── 3-Vector Follow-Up Defense Shields ── */}
              {selectedQuestion.defenseShields && (
                <div className="rounded-xl border border-primary/30 bg-card/40 p-3 space-y-2">
                  <div
                    onClick={() => setShowDefenseShields(!showDefenseShields)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">
                        🛡️ 3-Vector 刁钻追问防守盾 (Follow-Up Defense Shields)
                      </span>
                    </div>
                    {showDefenseShields ? (
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>

                  {showDefenseShields && (
                    <div className="space-y-2 pt-1 text-xs">
                      {/* Vector 1: Edge Case */}
                      <div className="rounded-lg border border-border/30 bg-background/60 p-2 space-y-1">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
                          <span>🎯 Vector 1: 极端边界与容错深挖:</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground italic">
                          "{selectedQuestion.defenseShields.vector1_edgeCase.question}"
                        </p>
                        <div className="text-[11px] text-foreground font-medium bg-primary/5 rounded p-1.5 mt-0.5">
                          <span className="font-bold text-primary mr-1">30秒反击口模:</span>
                          {selectedQuestion.defenseShields.vector1_edgeCase.counterAnswer}
                        </div>
                      </div>

                      {/* Vector 2: Pushback */}
                      <div className="rounded-lg border border-border/30 bg-background/60 p-2 space-y-1">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-warning">
                          <span>🤝 Vector 2: 团队阻力与推力:</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground italic">
                          "{selectedQuestion.defenseShields.vector2_pushback.question}"
                        </p>
                        <div className="text-[11px] text-foreground font-medium bg-warning/5 rounded p-1.5 mt-0.5">
                          <span className="font-bold text-warning mr-1">30秒反击口模:</span>
                          {selectedQuestion.defenseShields.vector2_pushback.counterAnswer}
                        </div>
                      </div>

                      {/* Vector 3: Trade-off */}
                      <div className="rounded-lg border border-border/30 bg-background/60 p-2 space-y-1">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-success">
                          <span>⚖️ Vector 3: 架构取舍与成本代价:</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground italic">
                          "{selectedQuestion.defenseShields.vector3_tradeoff.question}"
                        </p>
                        <div className="text-[11px] text-foreground font-medium bg-success/5 rounded p-1.5 mt-0.5">
                          <span className="font-bold text-success mr-1">30秒反击口模:</span>
                          {selectedQuestion.defenseShields.vector3_tradeoff.counterAnswer}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Anti-Freeze Flashcard ── */}
              {selectedQuestion.antiFreeze && (
                <div className="rounded-xl border border-secondary bg-background/50 p-3 space-y-1.5 text-xs">
                  <div
                    onClick={() => setShowAntiFreeze(!showAntiFreeze)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-bold text-foreground">
                        🧊 Anti-Freeze 防卡壳小抄卡 (记忆锚点 & 救急话术)
                      </span>
                    </div>
                    {showAntiFreeze ? (
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>

                  {showAntiFreeze && (
                    <div className="space-y-1.5 pt-1 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-muted-foreground shrink-0">3 个记忆锚点:</span>
                        <div className="flex gap-1 flex-wrap">
                          {selectedQuestion.antiFreeze.memoryAnchors.map((anchor) => (
                            <span
                              key={anchor}
                              className="rounded bg-primary/10 border border-primary/20 px-2 py-0.5 font-bold text-primary"
                            >
                              {anchor}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="rounded bg-secondary/40 p-2">
                        <span className="font-bold text-foreground block mb-0.5">✨ 黄金金句 (Golden Quote):</span>
                        <p className="italic text-foreground">{selectedQuestion.antiFreeze.goldenQuote}</p>
                      </div>
                      <div className="rounded bg-secondary/40 p-2">
                        <span className="font-bold text-warning block mb-0.5">🚨 救急兜底句 (Emergency Pivot):</span>
                        <p className="text-muted-foreground">{selectedQuestion.antiFreeze.emergencyPivotPhrase}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
