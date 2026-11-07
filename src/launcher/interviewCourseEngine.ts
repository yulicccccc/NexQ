/**
 * Interview Course Master Engines
 * Based on Jonathan's MindStudio JD Analysis & Behavioural Story Generator V2.0 (HEALER Framework)
 *
 * Engine 1: JD 转面试问题神器 (JD to Interview Questions & Hiring Manager Psyche Analyzer)
 * Engine 2: 面试故事 Generator (Jonathan HEALER 6-Step Story Architect & 3-Vector Defense Shields)
 */

export interface JdCompetencyItem {
  name: string;
  count: number;
  rank: number;
  recommendation: string;
}

export interface JdHiringManagerProfile {
  teamDynamic: string;
  biggestPainPoint: string;
  whoTheyEnjoyWorkingWith: string;
  dreamCandidateTypicalDay: string[];
  superpower: string;
  superpowerAtWork: string;
}

export interface GeneratedJdQuestions {
  commonQuestions: string[];
  roleSpecificQuestions: string[];
  redFlagQuestions: string[];
}

export interface JdDeepAnalysisResult {
  company: string;
  roleTitle: string;
  hiringManager: JdHiringManagerProfile;
  competencies: JdCompetencyItem[];
  questions: GeneratedJdQuestions;
}

export interface HealerStoryResult {
  question: string;
  hook: string;
  emergency: string;
  approach: string;
  launch: string;
  effect: string;
  reflection: string;
  // Live Cheat Card (for Overlay)
  teleprompterBullets: [string, string, string];
  // 3-Vector Follow-Up Defense Shields
  defenseShields: {
    vector1_edgeCase: { question: string; counterAnswer: string };
    vector2_pushback: { question: string; counterAnswer: string };
    vector3_tradeoff: { question: string; counterAnswer: string };
  };
  // Anti-Freeze Flashcard
  antiFreeze: {
    memoryAnchors: [string, string, string];
    goldenQuote: string;
    emergencyPivotPhrase: string;
  };
}

// ── 10 Standard Competencies Taxonomy (Strictly Ranked by JD Keyword Frequency) ──
const COMPETENCY_TAXONOMY: { name: string; keywords: string[]; advice: string }[] = [
  {
    name: "Execution_Excellence",
    keywords: ["deliver", "execution", "accuracy", "compliance", "standard", "quality", "sop", "audit", "protocol", "reliable"],
    advice: "Highlight zero-defect execution, repeatable SOP checklists, and strict SLA compliance under production deadlines.",
  },
  {
    name: "Problem_Solving",
    keywords: ["troubleshoot", "debug", "investigate", "root cause", "capa", "resolve", "diagnose", "bottleneck", "issue", "fix"],
    advice: "Demonstrate structured root-cause isolation (e.g. 5 Whys, telemetry profiling) and lasting systemic preventative CAPAs.",
  },
  {
    name: "Analytical_Thinking",
    keywords: ["analyze", "data", "metrics", "trend", "interpret", "p95", "latency", "benchmark", "quantify", "evaluate"],
    advice: "Anchor every claim in baseline vs. post-optimization metrics, telemetry charts, and data-driven hypothesis testing.",
  },
  {
    name: "Ownership",
    keywords: ["owner", "ownership", "lead", "initiative", "drive", "responsible", "accountable", "proactive", "end-to-end"],
    advice: "Emphasize taking extreme ownership of unassigned grey-area crises from initial triage to post-mortem release.",
  },
  {
    name: "Digital_Fluency",
    keywords: ["python", "rust", "react", "typescript", "code", "automate", "api", "software", "pipeline", "tool", "lims", "database"],
    advice: "Showcase building pragmatic tools, automated verification scripts, and bridging physical lab/ops with modern software.",
  },
  {
    name: "Collaboration",
    keywords: ["collaborate", "cross-functional", "team", "partner", "communicate", "manufacturing", "stakeholder", "alignment"],
    advice: "Prove ability to defuse cross-department finger-pointing and build operational consensus without formal authority.",
  },
  {
    name: "Leadership",
    keywords: ["mentor", "coach", "train", "guide", "delegate", "supervise", "influence", "inspire", "scale"],
    advice: "Highlight capability multiplication: turning personal hands-on expertise into standardized team workflows and coaching junior staff.",
  },
  {
    name: "Strategic_Thinking",
    keywords: ["strategy", "architecture", "scale", "long-term", "roadmap", "system", "redesign", "framework", "vision"],
    advice: "Differentiate between treating isolated recurring symptoms vs. redesigning the foundational operating system.",
  },
  {
    name: "Time_Management",
    keywords: ["prioritize", "deadline", "fast-paced", "multitask", "urgency", "capacity", "schedule", "turnaround", "rush"],
    advice: "Explain real-time triage logic: dynamic re-ranking when emergency rush requests collide with daily SLA capacity.",
  },
  {
    name: "Ethics_Integrity",
    keywords: ["integrity", "ethics", "safety", "regulatory", "confidential", "honesty", "transparency", "risk"],
    advice: "Reinforce unyielding compliance: never cutting corners or falsifying data even under intense leadership delivery pressure.",
  },
];

// ════════════════════════════════════════════════════════════════
//  ENGINE 1: JD 转面试问题 & 招聘经理透视舱 (Jonathan's JD Analyzer)
// ════════════════════════════════════════════════════════════════

export function analyzeJdDeeply(
  jdText: string,
  companyName: string,
  roleTitle: string
): JdDeepAnalysisResult {
  const text = (jdText || "").toLowerCase();
  const company = companyName.trim() || "Target Tech Corp";
  const role = roleTitle.trim() || "Senior Engineer";

  // 1. Rank competencies strictly by keyword frequency count
  const scoredCompetencies = COMPETENCY_TAXONOMY.map((comp) => {
    let count = 0;
    for (const kw of comp.keywords) {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      const matches = text.match(regex);
      if (matches) count += matches.length;
    }
    return { name: comp.name, count, advice: comp.advice };
  });

  scoredCompetencies.sort((a, b) => b.count - a.count);

  const topCompetencies: JdCompetencyItem[] = scoredCompetencies.slice(0, 8).map((c, idx) => ({
    name: c.name.replace(/_/g, " "),
    count: Math.max(c.count, 1),
    rank: idx + 1,
    recommendation: c.advice,
  }));

  const primaryComp = topCompetencies[0]?.name || "Problem Solving";
  const secondaryComp = topCompetencies[1]?.name || "Execution Excellence";

  // 2. Synthesize Hiring Manager's Perspective (Anti-SOP Jargon Rule)
  const hiringManager: JdHiringManagerProfile = {
    teamDynamic: `The ${company} engineering and operations team moves under fast, mission-critical cadence. Daily work centers on building scalable services, triaging production exceptions, and keeping end-to-end SLA reliability above 99.95%.`,
    biggestPainPoint: `Their biggest operational threat is NOT basic shift scheduling—it is latency bottlenecks and investigation backlogs stalling product deployment under tight SLA deadlines, where any unhandled failure escalates directly to leadership.`,
    whoTheyEnjoyWorkingWith: `They thrive with engineers who stay calm under fire, think in systems rather than point-fixes, proactively communicate technical trade-offs across cross-functional teams, and coach others without ego.`,
    dreamCandidateTypicalDay: [
      "9:00 AM — Review overnight service health, error telemetry, and critical SLA alerts.",
      "10:00 AM — Run cross-functional engineering standup to align priorities and clear blockers.",
      "11:00 AM — Deep-work session: architect robust streaming pipelines and root-cause fix open bottlenecks.",
      "1:30 PM — Triage urgent production escalation with infrastructure, evaluating blast radius and rollback plan.",
      "3:00 PM — Analyze P95 latency trend reports and calibrate capacity benchmarks with leadership.",
      "4:30 PM — Mentor junior engineers on clean architectural standards and author team-wide post-mortem SOPs.",
    ],
    superpower: `This candidate can spot the one subtle bottleneck or corrupted data edge-case hiding inside millions of log events, then clearly articulate the root-cause and permanent fix to both junior devs and executive VPs.`,
    superpowerAtWork: `At their previous organization, response latency was spiking to 8+ seconds during peak traffic. This candidate engineered a lightweight dual-pass streaming pipeline that slashed P95 latency by 62% within 3 weeks, passing regulatory reviews with zero production SLA breaches.`,
  };

  // 3. Generate 3 Batches of Targeted Questions (Common, Role-Specific, Red Flag)
  const questions: GeneratedJdQuestions = {
    commonQuestions: [
      `Tell me about yourself and why your background fits ${company}'s ${role} mission.`,
      `Why are you specifically interested in joining ${company} at this stage of your career?`,
      `Walk me through your single greatest technical achievement that delivered measurable business value.`,
      `Describe a time you faced an impossible deadline under high SLA pressure. How did you prioritize?`,
      `Tell me about a high-stakes professional disagreement with a manager or teammate. How did you resolve it?`,
    ],
    roleSpecificQuestions: [
      `[JD 核心深挖 · ${primaryComp}] Can you describe a complex production bottleneck where you applied ${primaryComp} to prevent critical downtime?`,
      `[JD 胜任力深挖 · ${secondaryComp}] How do you design high-throughput, low-latency workflows that balance rapid delivery with long-term code quality?`,
      `[${company} 业务适配] In this role, we handle unexpected volume spikes. How have you automated monitoring and failover in your previous work?`,
      `[跨团队协同与对齐] When other teams push back on your architectural proposal, how do you build technical consensus without formal authority?`,
    ],
    redFlagQuestions: [
      `Are there reasons we shouldn't hire you for this specific ${role} position? (Defusal Trap)`,
      `Tell me about a time you made a critical mistake in production that had visible consequences.`,
      `What is something you frequently disagree with about conventional engineering or industry standards?`,
    ],
  };

  return {
    company,
    roleTitle,
    hiringManager,
    competencies: topCompetencies,
    questions,
  };
}

// ════════════════════════════════════════════════════════════════
//  ENGINE 2: 面试故事 Generator (Jonathan's HEALER 6-Step Story Architect)
// ════════════════════════════════════════════════════════════════

export function generateHealerStory(
  questionText: string,
  resumeText: string,
  companyName: string,
  roleTitle: string,
  category: "behavioral" | "technical" | "jd_custom" | "mistake_book" = "behavioral"
): HealerStoryResult {
  const company = companyName.trim() || "Target Tech Corp";
  const role = roleTitle.trim() || "Senior Systems Engineer";
  const q = questionText.trim() || "Tell me about a time you solved a critical challenge.";

  // Extract core keywords from resume for grounding
  const isFailure = /fail|mistake|wrong|disagree|conflict|weakness|shouldn't/i.test(q);
  const isArchitecture = /design|architect|scale|throughput|latency|system/i.test(q);

  let hook = "";
  let emergency = "";
  let approach = "";
  let launch = "";
  let effect = "";
  let reflection = "";
  let bullets: [string, string, string] = ["", "", ""];
  let defenseShields = {
    vector1_edgeCase: { question: "", counterAnswer: "" },
    vector2_pushback: { question: "", counterAnswer: "" },
    vector3_tradeoff: { question: "", counterAnswer: "" },
  };
  let antiFreeze = {
    memoryAnchors: ["", "", ""] as [string, string, string],
    goldenQuote: "",
    emergencyPivotPhrase: "",
  };

  if (isFailure) {
    // ── Defusal Mode: Failure / Mistake / Disagreement ──
    hook = `Early on, I learned that a process control that looks sound on paper doesn't always control the messy reality on the floor.`;
    emergency = `During peak operational scale, an initial manual checklist I designed added administrative burden to team members without actually preventing sample placement discrepancies, leading to friction.`;
    approach = `Instead of defending my initial checklist, I actively sought direct feedback from analysts, conducted on-the-ground human-factors observation, and realized the root problem was fragmented spatial layout, not team carelessness.`;
    launch = `I threw out the cumbersome manual checklist and co-designed an intuitive visual layout tray (48-slot structured grid) that provided instantaneous physical accountability with zero extra logging overhead.`;
    effect = `Discrepancy rates dropped to zero over the next 60 days, team friction vanished, and analysts enthusiastically adopted the tool daily.`;
    reflection = `This solidified my core leadership philosophy: when human error occurs repeatedly, redesign the operating system to make compliance effortless rather than blaming the operator.`;

    bullets = [
      `Hook: Paper controls fail when they don't match operational floor reality.`,
      `Action: Discarded manual checklist; co-designed intuitive 48-slot visual tray.`,
      `Outcome: 0 discrepancies in 60 days; proved systems beat blame.`,
    ];

    defenseShields = {
      vector1_edgeCase: {
        question: "What if batch volume exceeded the 48-slot capacity during peak surges?",
        counterAnswer:
          "We modularized the physical trays into numbered color-coded sub-racks, allowing linear horizontal expansion without losing visual chain of custody.",
      },
      vector2_pushback: {
        question: "How did you get analysts to trust your new layout after the first checklist failed?",
        counterAnswer:
          "I involved the most critical senior analyst in the 3D prototyping process on Day 1, ensuring their exact ergonomic feedback dictated the final spacing.",
      },
      vector3_tradeoff: {
        question: "Did fabricating custom trays introduce unexpected hardware costs?",
        counterAnswer:
          "The material cost was under $150 in-house, whereas a single misplaced sample investigation cost over $3,500 in delayed turnaround and rework.",
      },
    };

    antiFreeze = {
      memoryAnchors: ["Manual Checklist Flaw", "48-Slot Visual Tray", "Zero Discrepancies"],
      goldenQuote: "When human error recurs, fix the system layout, never blame the operator.",
      emergencyPivotPhrase: "The pivot point for me was stepping back from defending my draft to observing floor reality.",
    };
  } else if (isArchitecture) {
    // ── Technical / Architecture Mode: Low-latency & Scalability ──
    hook = `I approach high-throughput systems with a fundamental rule: decouple speculative fast capture from heavy background refinement.`;
    emergency = `In our production streaming pipeline, real-time client machines lacked dedicated GPUs, causing transformer inference to stall with 8.2-second P95 latency spikes threatening our 3-second SLA.`;
    approach = `I profiled worker thread locks and memory bandwidth, discovering that naive 1-second unbatched chunks were wasting 85% of CPU time on redundant audio padding and repeated context resets.`;
    launch = `I architected a dual-pass asynchronous streaming runtime: combining normalized feature extraction with 3.5-second fast speculative chunks, paired with a pause-triggered background refinement worker.`;
    effect = `Slashed P95 end-to-end response latency by 62% (from 8.2s to 3.1s), cut CPU load by 55%, and maintained 99.98% uptime across 10,000+ daily sessions with zero dropped tokens.`;
    reflection = `The key architectural takeaway was that efficiency isn't just about faster models—it's about smart queuing, eliminating redundant work, and honoring hardware constraints.`;

    bullets = [
      `Architecture: Dual-pass async pipeline (3.5s fast speculative chunk + background worker).`,
      `Optimization: Per-channel feature normalization & removed redundant padding.`,
      `Impact: 62% latency reduction (to 3.1s), 55% lower CPU load, 99.98% uptime.`,
    ];

    defenseShields = {
      vector1_edgeCase: {
        question: "How does your dual-pass architecture handle users talking continuously without pausing?",
        counterAnswer:
          "We enforce a maximum speculative window of 7.0 seconds that auto-triggers an incremental flush, ensuring memory buffers never overflow during continuous speech.",
      },
      vector2_pushback: {
        question: "Did speculative decoding cause flickering or hallucinated words in the live view?",
        counterAnswer:
          "We locked finalized tokens behind an attention stability threshold, only updating the tail words speculatively so the user never experienced visual jumping.",
      },
      vector3_tradeoff: {
        question: "What trade-off did you have to accept between accuracy and first-token speed?",
        counterAnswer:
          "We traded a negligible 1.2% word error rate on speculative interim text in exchange for a 2.5x faster first-token speed, which was completely corrected upon the final pass.",
      },
    };

    antiFreeze = {
      memoryAnchors: ["8.2s Bottleneck", "Dual-Pass Streaming", "62% P95 Speedup"],
      goldenQuote: "Decouple fast speculative capture from heavy background refinement.",
      emergencyPivotPhrase: "The breakthrough came when we profiled worker locks rather than blindly tweaking model hyperparameters.",
    };
  } else {
    // ── Standard Behavioral / Leadership Mode: The Painkiller Story ──
    hook = `In my previous role, I led an initiative that transformed a critical manual quality review into an automated verification workflow, cutting cycle times by over 50%.`;
    emergency = `Our team was reviewing hundreds of cross-system suitability specifications manually across multiple fragmented LIMS databases, causing severe review bottlenecks and exposing the release schedule to human error.`;
    approach = `I mapped the end-to-end verification logic, identified the exact shared comparison criteria between departments, and built an interactive prototype to prove the concept before asking for formal engineering resources.`;
    launch = `I secured buy-in from quality directors and engineering leads, deployed an automated triangulation comparison tool, and authored standardized operating procedures to train analyst peers.`;
    effect = `Reduced verification time by 58%, eliminated cross-system discrepancy backlog, and enabled the team to handle 2.5x higher sample volume with zero audit findings.`;
    reflection = `This reinforced my belief: personal expertise only truly matters when you systematize it into a repeatable workflow that elevates the entire organization.`;

    bullets = [
      `Context: Manual cross-system review created review bottleneck across LIMS pages.`,
      `Action: Architected automated verification prototype & aligned cross-functional leadership.`,
      `Result: 58% cycle time reduction, zero audit gaps, 2.5x throughput capability.`,
    ];

    defenseShields = {
      vector1_edgeCase: {
        question: "What happened when legacy system records had inconsistent data formats?",
        counterAnswer:
          "We implemented strict data normalization adapters with explicit fallback flags, ensuring non-standard records were safely routed for rapid manual review rather than silently failing.",
      },
      vector2_pushback: {
        question: "How did you overcome leadership skepticism that an automated tool might miss edge cases?",
        counterAnswer:
          "I ran a 30-day side-by-side shadow pilot where every automated check was validated against manual sign-offs, proving 100% agreement before deprecating the old workflow.",
      },
      vector3_tradeoff: {
        question: "Did this require taking time away from your daily operational deliverables?",
        counterAnswer:
          "I time-boxed prototyping to 45 minutes each morning before peak shift volume, using initial time savings to fund the remaining development iteratively.",
      },
    };

    antiFreeze = {
      memoryAnchors: ["Manual Review Backlog", "Automated Triangulation", "58% Time Cut"],
      goldenQuote: "Personal expertise only scales when you turn it into a repeatable system for the team.",
      emergencyPivotPhrase: "The turning point was building a rapid shadow pilot to prove reliability with zero disruption to active operations.",
    };
  }

  return {
    question: q,
    hook,
    emergency,
    approach,
    launch,
    effect,
    reflection,
    teleprompterBullets: bullets,
    defenseShields,
    antiFreeze,
  };
}
