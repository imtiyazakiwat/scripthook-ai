"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAiStatus } from "@/hooks/use-ai-status";
import { useAnalyzer } from "@/hooks/use-analyzer";
import { AUTORUN_PARAM, clearHistory, DRAFT_KEY, loadHistory, PREFS_KEY, saveToHistory, VOICE_KEY } from "@/lib/history";
import { FORMATS, MIN_SCRIPT_WORDS, PACES, type AnalysisResult, type ScriptFormat, type SpeakingPace } from "@/lib/schema";
import { countWords, getWpm, locateQuote, splitBeats, stripDirectorNotes } from "@/lib/script";
import { cn } from "@/lib/utils";
import { AnalysisDeck, type DeckTab } from "./analysis-deck";
import { BatchDialog } from "./batch-dialog";
import { HistoryDialog } from "./history-dialog";
import { RewriteDialog, type RewriteRequest } from "./rewrite-dialog";
import { ScriptEditor, type EditorTab } from "./script-editor";
import { Sidebar } from "./sidebar";
import { Teleprompter } from "./teleprompter";
import { TopBar } from "./top-bar";
import { VoiceDialog } from "./voice-dialog";

interface Prefs {
  format: ScriptFormat;
  pace: SpeakingPace;
  strip: boolean;
  depth: "fast" | "deep";
}

export function Studio() {
  const [script, setScript] = useState("");
  const [format, setFormat] = useState<ScriptFormat>("youtube_longform");
  const [pace, setPace] = useState<SpeakingPace>("normal");
  const [strip, setStrip] = useState(true);
  const [depth, setDepth] = useState<"fast" | "deep">("fast");
  const [voice, setVoice] = useState("");
  const [editorTab, setEditorTab] = useState<EditorTab>("write");
  const [deckTab, setDeckTab] = useState<DeckTab>("leaks");
  const [activeFlag, setActiveFlag] = useState<number | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [analyzedScript, setAnalyzedScript] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [teleprompterOpen, setTeleprompterOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [rewriteReq, setRewriteReq] = useState<RewriteRequest | null>(null);
  const [lastRun, setLastRun] = useState<"none" | "ok" | "failed">("none");
  const [autoRun, setAutoRun] = useState(false);
  const undoStack = useRef<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const aiStatus = useAiStatus();
  const analyzer = useAnalyzer();
  const { result, status } = analyzer;
  const unavailableReason = aiStatus.state === "missing" ? "AI isn’t configured on this server" : undefined;

  /* ── hydrate from localStorage ─────────────────────────────── */
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) setScript(draft);
      const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") as Partial<Prefs>;
      if (prefs.format && FORMATS.includes(prefs.format)) setFormat(prefs.format);
      if (prefs.pace && PACES.includes(prefs.pace)) setPace(prefs.pace);
      if (typeof prefs.strip === "boolean") setStrip(prefs.strip);
      if (prefs.depth === "fast" || prefs.depth === "deep") setDepth(prefs.depth);
      setVoice(localStorage.getItem(VOICE_KEY) || "");
      const h = loadHistory();
      setHistory(h);
      if (h[0] && draft && h[0].script === stripDirectorNotes(draft)) {
        analyzer.load(h[0]);
        setAnalyzedScript(draft);
      }
      // Handed off from the landing page: analyze the pasted script once.
      const params = new URLSearchParams(window.location.search);
      if (params.has(AUTORUN_PARAM)) {
        if (draft) setAutoRun(true);
        window.history.replaceState(null, "", "/studio");
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, script);
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [script, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(PREFS_KEY, JSON.stringify({ format, pace, strip, depth } satisfies Prefs));
  }, [format, pace, strip, depth, hydrated]);

  useEffect(() => {
    if (status === "error" && analyzer.error) {
      setLastRun("failed");
      toast.error(analyzer.error.code === "ai_not_configured" ? "AI analysis is unavailable" : "Analysis failed", {
        description: analyzer.error.message,
      });
    }
  }, [status, analyzer.error]);

  /* ── actions ───────────────────────────────────────────────── */
  const analyze = useCallback(async () => {
    if (status === "analyzing" || unavailableReason) return;
    const words = countWords(strip ? stripDirectorNotes(script) : script);
    if (words < MIN_SCRIPT_WORDS) {
      toast.error(`Add at least ${MIN_SCRIPT_WORDS} spoken words to analyze.`);
      return;
    }
    const snapshot = script;
    const r = await analyzer.run({
      script,
      format,
      speaking_pace: pace,
      strip_director_notes: strip,
      voice_profile: voice || undefined,
      depth,
    });
    if (r) {
      setLastRun("ok");
      setHistory(saveToHistory(r));
      setAnalyzedScript(snapshot);
      setActiveFlag(null);
      setDeckTab("leaks");
      setEditorTab("annotated");
    }
  }, [status, unavailableReason, script, strip, format, analyzer, pace, voice, depth]);

  // Landing-page handoff. Waits for the AI check so a missing provider shows its notice instead.
  useEffect(() => {
    if (!autoRun || !hydrated || aiStatus.state === "checking") return;
    setAutoRun(false);
    void analyze();
  }, [autoRun, hydrated, aiStatus.state, analyze]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void analyze();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [analyze]);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (prev !== undefined) {
      setScript(prev);
      toast("Change undone");
    }
  }, []);

  const applyScriptChange = useCallback(
    (next: string, message: string) => {
      undoStack.current.push(script);
      if (undoStack.current.length > 30) undoStack.current.shift();
      setScript(next);
      toast.success(message, { action: { label: "Undo", onClick: undo } });
    },
    [script, undo],
  );

  const selectFlag = useCallback((i: number) => {
    setActiveFlag(i);
    setDeckTab("leaks");
    requestAnimationFrame(() => {
      setTimeout(() => document.getElementById(`flag-${i}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
    });
  }, []);

  const applyFix = useCallback(
    (i: number) => {
      const flag = result?.drop_off_flags[i];
      // `locked` only appears when plans are enforced (OPEN_ACCESS=false); its fix text is a placeholder.
      if (!flag || flag.locked || !flag.recommended_fix) return;
      const loc = locateQuote(script, flag.flagged_text);
      if (!loc) return void toast.error("That line was edited — couldn’t find it in your script.");
      applyScriptChange(script.slice(0, loc[0]) + flag.recommended_fix + script.slice(loc[1]), "Beat fixed");
    },
    [result, script, applyScriptChange],
  );

  const applyHook = useCallback(
    (text: string) => {
      const beats = splitBeats(script, getWpm(format, pace));
      const first = beats.find((b) => !/^\s*[[({]/.test(b.text));
      if (!first) return applyScriptChange(text, "Hook added");
      applyScriptChange(script.slice(0, first.offset) + text + script.slice(first.offset + first.text.length), "Opener replaced with new hook");
      setEditorTab("write");
    },
    [script, format, pace, applyScriptChange],
  );

  const moreOptions = useCallback(
    (i: number, mode: "fix" | "deslop") => {
      const flag = result?.drop_off_flags[i];
      if (!flag) return;
      const loc = locateQuote(script, flag.flagged_text);
      if (!loc) return void toast.error("That line was edited — couldn’t find it in your script.");
      setRewriteReq({ mode, text: script.slice(loc[0], loc[1]), start: loc[0], end: loc[1] });
    },
    [result, script],
  );

  const selectionRewrite = useCallback(
    (mode: "fix" | "deslop", start: number, end: number) => setRewriteReq({ mode, text: script.slice(start, end), start, end }),
    [script],
  );

  const applyRewrite = useCallback(
    (req: RewriteRequest, text: string) => {
      let [s, e] = [req.start, req.end];
      if (script.slice(s, e) !== req.text) {
        const loc = locateQuote(script, req.text);
        if (!loc) return void toast.error("The original text changed — copy the rewrite instead.");
        [s, e] = loc;
      }
      applyScriptChange(script.slice(0, s) + text + script.slice(e), "Segment rewritten");
      setRewriteReq(null);
    },
    [script, applyScriptChange],
  );

  const loadFromHistory = useCallback(
    (r: AnalysisResult) => {
      setScript(r.script);
      setFormat(r.format);
      setPace(r.speaking_pace);
      analyzer.load(r);
      setAnalyzedScript(r.script);
      setEditorTab("annotated");
      setActiveFlag(null);
      setHistoryOpen(false);
    },
    [analyzer],
  );

  /** Run a sidebar action and close the mobile drawer. */
  const fromSidebar = useCallback((fn: () => void) => {
    fn();
    setSidebarOpen(false);
  }, []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const locatable = useMemo(() => (result ? result.drop_off_flags.map((f) => !!locateQuote(script, f.flagged_text)) : []), [result, script]);
  const stale = !!result && analyzedScript !== null && analyzedScript !== script && status === "done";

  return (
    <>
      <div className={cn("flex h-dvh overflow-hidden bg-background", teleprompterOpen && "print:hidden")}>
        <Sidebar
          open={sidebarOpen}
          onClose={closeSidebar}
          format={format}
          onFormatChange={(f) => fromSidebar(() => setFormat(f))}
          onOpenBatch={() => fromSidebar(() => setBatchOpen(true))}
          onOpenVoice={() => fromSidebar(() => setVoiceOpen(true))}
          onOpenHistory={() => fromSidebar(() => setHistoryOpen(true))}
          historyCount={history.length}
          hasVoice={!!voice}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopBar onMenuClick={() => setSidebarOpen(true)} menuOpen={sidebarOpen} format={format} aiStatus={aiStatus} depth={depth} lastRun={lastRun} />

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto grid max-w-[1600px] gap-4 px-4 py-5 sm:gap-6 sm:py-6 lg:px-8 xl:grid-cols-2">
              <section aria-label="Script editor" className="h-[62dvh] min-h-[440px] xl:sticky xl:top-6 xl:h-[calc(100dvh-7rem)] xl:self-start">
                <ScriptEditor
                  value={script}
                  onChange={setScript}
                  format={format}
                  pace={pace}
                  onPaceChange={setPace}
                  strip={strip}
                  onStripChange={setStrip}
                  depth={depth}
                  onDepthChange={setDepth}
                  tab={editorTab}
                  onTabChange={setEditorTab}
                  result={result}
                  activeFlag={activeFlag}
                  onFlagClick={selectFlag}
                  onAnalyze={analyze}
                  analyzing={status === "analyzing"}
                  onCancel={analyzer.cancel}
                  onOpenTeleprompter={() => setTeleprompterOpen(true)}
                  onSelectionRewrite={selectionRewrite}
                  textareaRef={textareaRef}
                  unavailableReason={unavailableReason}
                />
              </section>
              <section aria-label="Retention analytics" className="min-w-0 pb-10">
                <AnalysisDeck
                  status={status}
                  progress={analyzer.progress}
                  result={result}
                  error={analyzer.error}
                  aiStatus={aiStatus}
                  tab={deckTab}
                  onTabChange={setDeckTab}
                  activeFlag={activeFlag}
                  onSelectFlag={selectFlag}
                  onApplyFix={applyFix}
                  onMoreOptions={moreOptions}
                  onUseHook={applyHook}
                  onRetry={analyze}
                  locatable={locatable}
                  stale={stale}
                />
              </section>
            </div>
          </main>
        </div>
      </div>

      <Teleprompter open={teleprompterOpen} onClose={() => setTeleprompterOpen(false)} script={script} format={format} pace={pace} />
      <HistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        history={history}
        onLoad={loadFromHistory}
        onClear={() => {
          clearHistory();
          setHistory([]);
        }}
      />
      {batchOpen && (
        <BatchDialog
          open={batchOpen}
          onOpenChange={setBatchOpen}
          initialScript={script}
          format={format}
          pace={pace}
          strip={strip}
          voiceProfile={voice || undefined}
          unavailableReason={unavailableReason}
          onOpenResult={(r) => {
            setHistory(saveToHistory(r));
            loadFromHistory(r);
          }}
        />
      )}
      <VoiceDialog
        open={voiceOpen}
        onOpenChange={setVoiceOpen}
        value={voice}
        onSave={(v) => {
          setVoice(v);
          localStorage.setItem(VOICE_KEY, v);
        }}
      />
      <RewriteDialog
        request={rewriteReq}
        onClose={() => setRewriteReq(null)}
        format={format}
        context={script}
        voiceProfile={voice || undefined}
        onApply={applyRewrite}
      />
    </>
  );
}
