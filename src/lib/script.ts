import type { ScriptFormat, SpeakingPace } from "./schema";

/** Words-per-minute per platform & pace (PRD FR-1.2 / §6). */
export const WPM_TABLE: Record<ScriptFormat, Record<SpeakingPace, number>> = {
  youtube_longform: { slow: 130, normal: 150, fast: 180 },
  youtube_shorts: { slow: 150, normal: 170, fast: 190 },
  tiktok_shop: { slow: 145, normal: 165, fast: 185 },
};

export function getWpm(format: ScriptFormat, pace: SpeakingPace): number {
  return WPM_TABLE[format]?.[pace] ?? 150;
}

/** Keywords that mark a parenthetical as a production note rather than speech. */
const NOTE_KEYWORDS =
  "b-?roll|broll|sfx|sound(?:\\s*effect)?|music|cut(?:\\s*to)?|camera|cam|on[- ]screen|text(?:\\s*overlay)?|graphic|visual|transition|zoom|pause|beat|insert|overlay|footage|clip|scene|shot|title|caption|lower third|vo|v\\.o\\.|note|director|edit(?:or)?|show|screen|whoosh|ding";

const BRACKET_RE = /\[[^\]\n]{0,300}\]/g;
const BRACE_RE = /\{[^}\n]{0,300}\}/g;
const PAREN_NOTE_RE = new RegExp(`\\((?:\\s*)(?:${NOTE_KEYWORDS})\\b[^)\\n]{0,300}\\)`, "gi");
const LINE_LABEL_RE = new RegExp(`^\\s*(?:${NOTE_KEYWORDS})\\s*:.*$`, "gim");

export interface DirectorNote {
  text: string;
  index: number;
}

/** Detect non-spoken director notes (FR-1.3). */
export function detectDirectorNotes(script: string): DirectorNote[] {
  const notes: DirectorNote[] = [];
  for (const re of [BRACKET_RE, BRACE_RE, PAREN_NOTE_RE, LINE_LABEL_RE]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(script))) {
      if (!notes.some((n) => m!.index >= n.index && m!.index < n.index + n.text.length)) {
        notes.push({ text: m[0], index: m.index });
      }
    }
  }
  return notes.sort((a, b) => a.index - b.index);
}

/** Strip director notes and normalise whitespace while preserving paragraphs. */
export function stripDirectorNotes(script: string): string {
  return script
    .replace(LINE_LABEL_RE, "")
    .replace(BRACKET_RE, "")
    .replace(BRACE_RE, "")
    .replace(PAREN_NOTE_RE, "")
    .replace(/[ \t]+([,.!?;:])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/^[ \t]+|[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function countWords(text: string): number {
  const m = text.trim().match(/[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu);
  return m ? m.length : 0;
}

export function estimateSeconds(words: number, format: ScriptFormat, pace: SpeakingPace): number {
  return Math.max(1, Math.round((words / getWpm(format, pace)) * 60));
}

/** 75 -> "1:15" */
export function formatTimestamp(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** 135 -> "~2m 15s" */
export function formatRuntime(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return `~${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `~${m}m ${r}s` : `~${m}m`;
}

/** Parse "1:05" / "01:05" / "65" into seconds. */
export function parseTimestamp(ts: string): number | null {
  const t = ts.trim();
  if (/^\d+(\.\d+)?$/.test(t)) return Number(t);
  const m = t.match(/^(\d{1,3}):(\d{1,2})(?::(\d{1,2}))?$/);
  if (!m) return null;
  if (m[3] !== undefined) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  return Number(m[1]) * 60 + Number(m[2]);
}

export interface Beat {
  index: number;
  text: string;
  start: number;
  end: number;
  words: number;
  /** character offset in the source script */
  offset: number;
  paragraph: number;
}

/**
 * Split a script into spoken "beats" (sentences) with estimated start/end
 * timestamps based on cumulative word count and WPM.
 */
export function splitBeats(script: string, wpm: number): Beat[] {
  const beats: Beat[] = [];
  const re = /[^.!?…\n]+(?:[.!?…]+["'”’)]*)?/g;
  let elapsedWords = 0;
  let paragraph = 0;
  let scanned = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(script))) {
    const raw = m[0];
    const text = raw.trim();
    if (!text) continue;
    const words = countWords(text);
    if (words === 0) continue;
    const offset = m.index + raw.indexOf(text);
    paragraph += (script.slice(scanned, offset).match(/\n[ \t]*\n/g) || []).length;
    scanned = offset;
    const start = (elapsedWords / wpm) * 60;
    elapsedWords += words;
    const end = (elapsedWords / wpm) * 60;
    beats.push({ index: beats.length, text, start, end, words, offset, paragraph });
  }
  return beats;
}

export interface ScriptStats {
  chars: number;
  words: number;
  seconds: number;
  wpm: number;
  notes: number;
}

export function getScriptStats(script: string, format: ScriptFormat, pace: SpeakingPace, strip: boolean): ScriptStats {
  const notes = detectDirectorNotes(script).length;
  const spoken = strip ? stripDirectorNotes(script) : script;
  const words = countWords(spoken);
  const wpm = getWpm(format, pace);
  return { chars: script.length, words, seconds: words ? estimateSeconds(words, format, pace) : 0, wpm, notes };
}

/** Normalise whitespace/quotes for fuzzy quote matching. */
export function normaliseForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\p{L}\p{N}' ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Find a flagged quote inside the script, tolerant to punctuation/case drift.
 * Returns [start, end) character offsets or null.
 */
export function locateQuote(script: string, quote: string): [number, number] | null {
  if (!quote.trim()) return null;
  const direct = script.indexOf(quote.trim());
  if (direct >= 0) return [direct, direct + quote.trim().length];
  const lower = script.toLowerCase().indexOf(quote.trim().toLowerCase());
  if (lower >= 0) return [lower, lower + quote.trim().length];

  // Fuzzy: map normalised script back to original offsets.
  const target = normaliseForMatch(quote);
  if (target.length < 4) return null;
  const map: number[] = [];
  let norm = "";
  let prevSpace = true;
  for (let i = 0; i < script.length; i++) {
    let ch = script[i].toLowerCase();
    if (ch === "“" || ch === "”") ch = '"';
    if (ch === "‘" || ch === "’") ch = "'";
    const keep = /[\p{L}\p{N}']/u.test(ch);
    if (keep) {
      norm += ch;
      map.push(i);
      prevSpace = false;
    } else if (!prevSpace) {
      norm += " ";
      map.push(i);
      prevSpace = true;
    }
  }
  let idx = norm.indexOf(target);
  let len = target.length;
  if (idx < 0) {
    // try the first ~8 words as a prefix anchor
    const prefix = target.split(" ").slice(0, 8).join(" ");
    if (prefix.length < 12) return null;
    idx = norm.indexOf(prefix);
    len = Math.min(target.length, norm.length - idx);
    if (idx < 0) return null;
  }
  const start = map[idx];
  const endIdx = Math.min(map.length - 1, idx + len - 1);
  return [start, map[endIdx] + 1];
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
