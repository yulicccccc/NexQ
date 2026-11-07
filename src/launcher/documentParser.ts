/**
 * Document & Job Description Parser Utility
 * Supports:
 * - Smart JD text extraction (Company, Role Title, Key Skills)
 * - Multi-format Resume Parsing (TXT, Markdown, Word DOCX via native DecompressionStream, and PDF)
 */

export interface ParsedJdMeta {
  company: string;
  roleTitle: string;
  extractedSkills: string[];
}

export interface ParsedResumeResult {
  fileName: string;
  fileSizeStr: string;
  text: string;
  charCount: number;
  wordCount: number;
}

const COMMON_SKILLS = [
  "Python", "Rust", "React", "TypeScript", "JavaScript", "Go", "Golang", "C++", "Java",
  "AWS", "GCP", "Azure", "Docker", "Kubernetes", "K8s", "Kafka", "Redis", "PostgreSQL",
  "MySQL", "SQL", "MongoDB", "Distributed Systems", "Microservices", "CI/CD", "Linux",
  "GraphQL", "REST", "LLM", "PyTorch", "TensorFlow", "FastAPI", "Next.js", "Node.js",
  "Tauri", "Vite", "TailwindCSS", "System Architecture", "Latency Optimization",
];

export function parseJdMetadata(rawText: string): ParsedJdMeta {
  const text = (rawText || "").trim();
  if (!text) {
    return { company: "", roleTitle: "", extractedSkills: [] };
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const firstLine = lines[0] || "";

  let company = "";
  let roleTitle = "";

  // ── 1. Match "Company - Role" or "Role at Company" in First Line ──
  // Example: "Google - Senior Software Engineer, Infrastructure"
  const dashMatch = firstLine.match(/^([A-Z0-9][A-Za-z0-9\s&.,\-]+?)\s*[-–—|•]\s*([A-Za-z0-9\s,/\-]+)$/);
  if (dashMatch && dashMatch[1].length <= 40) {
    company = dashMatch[1].trim();
    roleTitle = dashMatch[2].trim();
  }

  // Example: "Senior Machine Learning Engineer at Anthropic"
  if (!company) {
    const atMatch = firstLine.match(/^(.+?)\s+\b(?:at|@)\s+([A-Z0-9][A-Za-z0-9\s&.,\-]+)$/i);
    if (atMatch) {
      roleTitle = atMatch[1].trim();
      company = atMatch[2].trim();
    }
  }

  // ── 2. Match Company via Keywords in Full Body ──
  if (!company) {
    const compLabelMatch = text.match(/(?:Company|Employer|Organization|Hiring Company):\s*([^\n\r,;]+)/i);
    if (compLabelMatch) {
      company = compLabelMatch[1].trim();
    }
  }

  if (!company) {
    const hiringMatch = text.match(/\b([A-Z0-9][A-Za-z0-9\s&.,\-]{1,30})\s+(?:is looking for|is hiring|is seeking|welcomes)\b/);
    if (hiringMatch && !/^(The|Our|This|We|They)$/i.test(hiringMatch[1].trim())) {
      company = hiringMatch[1].trim();
    }
  }

  if (!company) {
    const aboutMatch = text.match(/(?:About|At|Join(?:\s+the)?)\s+([A-Z0-9][A-Za-z0-9\s&.,\-]+?)(?:\s+(?:is|was|we|team)|[:\n\r])/);
    if (aboutMatch && !/^(Our|The|This|A|An)$/i.test(aboutMatch[1].trim())) {
      company = aboutMatch[1].trim();
    }
  }

  // Clean company name
  if (company) {
    company = company.replace(/^(About|At|Join)\s+/i, "").replace(/[:,\.\-]$/, "").trim();
  }

  // ── 3. Match Role Title via Keywords or Regex in Full Body ──
  if (!roleTitle) {
    const roleLabelMatch = text.match(/(?:Job\s+Title|Title|Position|Role|Target Role):\s*([^\n\r]+)/i);
    if (roleLabelMatch) {
      roleTitle = roleLabelLabel(roleLabelMatch[1]);
    }
  }

  if (!roleTitle) {
    const roleRegex = /\b((?:Senior|Staff|Principal|Lead|Junior|Entry-level|Mid-level|Head of|VP of|Director of|Associate)?\s*(?:Distributed Systems|Software|Data|Backend|Frontend|Full[\s-]?Stack|Systems|DevOps|Site Reliability|SRE|Cloud|Machine Learning|ML|AI|Product|Platform|Security|QA|Mobile|iOS|Android|Embedded)?\s*(?:Engineer|Developer|Architect|Scientist|Specialist|Manager|Lead|Analyst|Consultant))\b/i;
    const match = text.match(roleRegex);
    if (match) {
      roleTitle = match[1].trim();
    }
  }

  if (!roleTitle && lines.length > 0 && lines[0].length < 60 && !company.includes(lines[0])) {
    if (/\b(Engineer|Developer|Architect|Manager|Lead|Scientist|Specialist)\b/i.test(lines[0])) {
      roleTitle = lines[0];
    }
  }

  // Clean role title
  if (roleTitle) {
    roleTitle = roleTitle.replace(/^[-–—#*\s]+/, "").replace(/[:,\.\-]$/, "").trim();
  }

  // ── 4. Extract Detected Skills ──
  const lower = text.toLowerCase();
  const extractedSkills = COMMON_SKILLS.filter((skill) => {
    const regex = new RegExp(`\\b${escapeRegExp(skill)}\\b`, "i");
    return regex.test(lower);
  });

  return { company, roleTitle, extractedSkills };
}

function roleLabelLabel(str: string): string {
  return str.split(/[,;\n\r]/)[0].trim();
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Extracts plain text from a Word .docx ArrayBuffer using native DecompressionStream
 */
export async function extractDocxTextFromBuffer(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  let offset = 0;

  while (offset < bytes.length - 30) {
    // Check for Local File Header signature 0x04034b50 (PK\x03\x04)
    if (
      bytes[offset] === 0x50 &&
      bytes[offset + 1] === 0x4b &&
      bytes[offset + 2] === 0x03 &&
      bytes[offset + 3] === 0x04
    ) {
      const compMethod = bytes[offset + 8] | (bytes[offset + 9] << 8);
      const compSize =
        bytes[offset + 18] |
        (bytes[offset + 19] << 8) |
        (bytes[offset + 20] << 16) |
        (bytes[offset + 21] << 24);
      const nameLen = bytes[offset + 26] | (bytes[offset + 27] << 8);
      const extraLen = bytes[offset + 28] | (bytes[offset + 29] << 8);

      const nameBytes = bytes.subarray(offset + 30, offset + 30 + nameLen);
      const fileName = new TextDecoder().decode(nameBytes);
      const dataStart = offset + 30 + nameLen + extraLen;

      if (fileName === "word/document.xml") {
        const compressedData = bytes.subarray(dataStart, dataStart + compSize);
        let xmlStr = "";
        if (compMethod === 8 && typeof DecompressionStream !== "undefined") {
          try {
            const ds = new DecompressionStream("deflate-raw");
            const response = new Response(
              new Blob([compressedData]).stream().pipeThrough(ds)
            );
            xmlStr = await response.text();
          } catch (e) {
            console.warn("DecompressionStream error:", e);
          }
        } else if (compMethod === 0) {
          xmlStr = new TextDecoder().decode(compressedData);
        }

        if (xmlStr) {
          return xmlStr
            .replace(/<w:p[^>]*>/gi, "\n")
            .replace(/<w:tab[^>]*\/?>/gi, "\t")
            .replace(/<[^>]+>/g, "")
            .replace(/[ \t]+/g, " ")
            .replace(/\n\s*\n+/g, "\n")
            .trim();
        }
      }
      offset = dataStart + compSize;
    } else {
      offset++;
    }
  }
  return "";
}

/**
 * Lightweight client-side text extractor for PDF ArrayBuffer (extracts text strings and Tj/TJ blocks)
 */
export function extractPdfTextFromBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const latin1 = new TextDecoder("latin1").decode(bytes);
  const chunks: string[] = [];

  // Extract from BT ... ET blocks
  const btRegex = /BT[\s\S]*?ET/g;
  let match;
  while ((match = btRegex.exec(latin1)) !== null) {
    const block = match[0];
    const strRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
    let sm;
    while ((sm = strRegex.exec(block)) !== null) {
      chunks.push(sm[1]);
    }
    const tjRegex = /\[(.*?)\]\s*TJ/g;
    let tm;
    while ((tm = tjRegex.exec(block)) !== null) {
      const inner = tm[1];
      const innerStrRegex = /\(([^)]+)\)/g;
      let im;
      while ((im = innerStrRegex.exec(inner)) !== null) {
        chunks.push(im[1]);
      }
    }
  }

  if (chunks.length > 0) {
    return chunks
      .join(" ")
      .replace(/\\([()\\])/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Fallback: look for common plaintext strings in PDF if uncompressed
  const streamMatch = latin1.match(/\/Filter\s*\/FlateDecode/);
  if (!streamMatch) {
    const words = latin1.match(/[A-Za-z0-9,.\-_]{4,}/g) || [];
    return words.slice(0, 300).join(" ");
  }

  return "";
}

/**
 * Universal Resume File Parser (handles .pdf, .docx, .txt, .md)
 */
export async function parseResumeFile(file: File): Promise<ParsedResumeResult> {
  const fileName = file.name;
  const fileSizeStr = formatFileSize(file.size);
  const lowerName = fileName.toLowerCase();
  let text = "";

  if (lowerName.endsWith(".txt") || lowerName.endsWith(".md") || lowerName.endsWith(".json")) {
    text = await file.text();
  } else if (lowerName.endsWith(".docx")) {
    const buffer = await file.arrayBuffer();
    text = await extractDocxTextFromBuffer(buffer);
  } else if (lowerName.endsWith(".pdf")) {
    const buffer = await file.arrayBuffer();
    text = extractPdfTextFromBuffer(buffer);
    if (!text || text.length < 50) {
      text = `[已成功上传简历: ${fileName} (${fileSizeStr})]\n\n提示：当前 PDF 文件已读取。如需针对具体经历精细调优，您可在本输入框中补充或直接粘贴重点经历与量化成果。`;
    }
  } else {
    text = await file.text();
  }

  text = text.trim();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];

  return {
    fileName,
    fileSizeStr,
    text,
    charCount: text.length,
    wordCount: words.length,
  };
}
