"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAnalyzer } from "@/hooks/use-analyzer";
import { useSession } from "@/hooks/use-session";
import { clearHistory, DRAFT_KEY, loadHistory, PREFS_KEY, saveToHistory, VOICE_KEY } from "@/lib/history";
import { FORMAT_META, PLANS } from "@/lib/plans";
import type { SampleScript } from "@/lib/samples";
import { FORMATS, MIN_SCRIPT_WORDS, PACES, type AnalysisResult, type ScriptFormat, type SpeakingPace } from "@/lib/schema";
import { countWords, getWpm, locateQuote, splitBeats, stripDirectorNotes } from "@/lib/script";
import { AnalysisDeck, type DeckTab } from "./analysis-deck";
import { BatchDialog } from "./batch-dialog";
import { HistoryDialog } from "./history-dialog";
import { PricingDialog, type UpgradeReason } from "./pricing-dialog";
import { RewriteDialog, type RewriteRequest } from "./rewrite-dialog";
import { ScriptEditor, type EditorTab } from "./script-editor";
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
  const { session, setSession, refresh } = useSession();
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
  const [pricing, setPricing] = useState<{ open: boolean; reason: UpgradeReason }>({ open: false, reason: "manual" });
  const [teleprompterOpen, setTeleprompterOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [rewriteReq, setRewriteReq] = useState<RewriteRequest | null>(null);
  const undoStack = useRef<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const plan = PLANS[session?.plan ?? "free"];

  const analyzer = useAnalyzer({
    onMeta: (runs_left) => setSession((s) => (s ? { ...s, runs_left, used: s.used + 1 } : s)),
  });
  const { result, status } = analyzer;

  const openUpgrade = useCallback((reason: UpgradeReason) => setPricing({ open: true, reason }), []);

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
    } catch {
      /* ignore */
    }
    setHydrated(true);
    // checkout redirects
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (checkout === "success") {
      const p = params.get("plan");
      toast.success(`Welcome to ${p === "pro" ? "Pro" : "Creator"}!`, { description: "Your plan is active on this browser." });
    } else if (checkout === "cancelled") toast("Checkout cancelled — you’re still on your current plan.");
    else if (checkout === "error") toast.error("We couldn’t verify that checkout. Contact support if you were charged.");
    if (checkout) window.history.replaceState(null, "", "/studio");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Downgrade gracefully if the stored format/depth isn't in the current plan
  useEffect(() => {
    if (!session) return;
    if (!plan.formats.includes(format)) setFormat("youtube_longform");
    if (session.plan === "free" && depth === "deep") setDepth("fast");
  }, [session, plan, format, depth]);

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

  /* ── errors → upgrade modal ────────────────────────────────── */
  useEffect(() => {
    if (status !== "error" || !analyzer.error) return;
    if (analyzer.error.status === 429) {
      openUpgrade("limit");
      void refresh();
    } else if (analyzer.error.status === 403) openUpgrade("format");
    else toast.error(analyzer.error.message);
  }, [status, analyzer.error, openUpgrade, refresh]);

  /* ── actions ───────────────────────────────────────────────── */
  const analyze = useCallback(async () => {
    if (status === "analyzing") return;
    const words = countWords(strip ? stripDirectorNotes(script) : script);
    if (words < MIN_SCRIPT_WORDS) {
      toast.error(`Add at least ${MIN_SCRIPT_WORDS} spoken words to analyze.`);
      return;
    }
    if (!plan.formats.includes(format)) return openUpgrade("format");
    if (session && session.runs_left !== null && session.runs_left <= 0) return openUpgrade("limit");
    const snapshot = script;
    const r = await analyzer.run({
      script,
      format,
      speaking_pace: pace,
      strip_director_notes: strip,
      voice_profile: plan.voiceProfiles && voice ? voice : undefined,
      depth: session?.plan === "free" ? "fast" : depth,
    });
    if (r) {
      setHistory(saveToHistory(r));
      setAnalyzedScript(snapshot);
      setActiveFlag(null);
      setDeckTab("leaks");
      setEditorTab("annotated");
      if (r.source === "heuristic") toast("AI engine busy — used the offline retention engine.", { description: "Results are approximate. Try again for full AI analysis." });
    }
  }, [status, script, strip, plan, format, session, analyzer, pace, voice, depth, openUpgrade]);

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
      if (!flag) return;
      if (flag.locked) return openUpgrade("fixes");
      const loc = locateQuote(script, flag.flagged_text);
      if (!loc) return void toast.error("That line was edited — couldn’t find it in your script.");
      applyScriptChange(script.slice(0, loc[0]) + flag.recommended_fix + script.slice(loc[1]), "Beat fixed");
    },
    [result, script, applyScriptChange, openUpgrade],
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

  const gateRewrite = useCallback(
    (mode: "fix" | "deslop") => {
      if (mode === "deslop" && !plan.deslop) {
        openUpgrade("deslop");
        return false;
      }
      if (mode === "fix" && session?.plan === "free") {
        openUpgrade("fixes");
        return false;
      }
      return true;
    },
    [plan, session, openUpgrade],
  );

  const moreOptions = useCallback(
    (i: number, mode: "fix" | "deslop") => {
      const flag = result?.drop_off_flags[i];
      if (!flag || !gateRewrite(mode)) return;
      const loc = locateQuote(script, flag.flagged_text);
      if (!loc) return void toast.error("That line was edited — couldn’t find it in your script.");
      setRewriteReq({ mode, text: script.slice(loc[0], loc[1]), start: loc[0], end: loc[1] });
    },
    [result, script, gateRewrite],
  );

  const selectionRewrite = useCallback(
    (mode: "fix" | "deslop", start: number, end: number) => {
      if (!gateRewrite(mode)) return;
      setRewriteReq({ mode, text: script.slice(start, end), start, end });
    },
    [script, gateRewrite],
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

  const loadSample = useCallback(
    (s: SampleScript) => {
      if (script.trim() && script !== s.script) undoStack.current.push(script);
      setScript(s.script);
      setEditorTab("write");
      if (plan.formats.includes(s.format)) setFormat(s.format);
      else toast(`This sample is written for ${FORMAT_META[s.format].label}.`, { description: "Upgrade to use that preset — or analyze it as Long-form.", action: { label: "Unlock", onClick: () => openUpgrade("format") } });
    },
    [script, plan, openUpgrade],
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

  const manageBilling = useCallback(async () => {
    try {
      const res = await fetch("/api/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; mode?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.mode === "demo") {
        toast(`You’re on ${plan.name} (demo billing)`, {
          description: "In production this opens the Stripe customer portal.",
          action: {
            label: "Switch to Free",
            onClick: async () => {
              const r = await fetch("/api/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "downgrade" }),
              });
              if (r.ok) {
                setSession(await r.json());
                toast.success("Switched to the Free plan");
              }
            },
          },
        });
        return;
      }
      toast.error(data.error || "Couldn’t open billing.");
    } catch {
      toast.error("Couldn’t open billing.");
    }
  }, [plan, setSession]);

  const locatable = useMemo(() => (result ? result.drop_off_flags.map((f) => !!locateQuote(script, f.flagged_text)) : []), [result, script]);
  const stale = !!result && analyzedScript !== null && analyzedScript !== script && status === "done";

  return (
    <div className="relative min-h-dvh">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -left-40 -top-40 size-[520px] rounded-full bg-brand-600/[0.12] blur-[120px]" />
        <div className="absolute -right-40 top-1/3 size-[520px] rounded-full bg-flare-500/[0.07] blur-[120px]" />
      </div>
      <TopBar
        format={format}
        onFormatChange={(f) => (plan.formats.includes(f) ? setFormat(f) : openUpgrade("format"))}
        session={session}
        onUpgrade={() => openUpgrade("manual")}
        onManageBilling={manageBilling}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenBatch={() => (plan.batch ? setBatchOpen(true) : openUpgrade("batch"))}
        onOpenVoice={() => setVoiceOpen(true)}
        historyCount={history.length}
      />
      <main className="mx-auto grid max-w-[1680px] gap-4 p-3 sm:p-5 lg:grid-cols-2">
        <section aria-label="Script editor" className="h-[68dvh] min-h-[460px] lg:sticky lg:top-[76px] lg:h-[calc(100dvh-96px)]">
          <ScriptEditor
            value={script}
            onChange={setScript}
            format={format}
            pace={pace}
            onPaceChange={setPace}
            strip={strip}
            onStripChange={setStrip}
            depth={depth}
            onDepthChange={(d) => (d === "deep" && session?.plan === "free" ? openUpgrade("deep") : setDepth(d))}
            canDeep={session?.plan !== "free" && !!session}
            tab={editorTab}
            onTabChange={setEditorTab}
            result={result}
            activeFlag={activeFlag}
            onFlagClick={selectFlag}
            onAnalyze={analyze}
            analyzing={status === "analyzing"}
            onCancel={analyzer.cancel}
            onLoadSample={loadSample}
            onOpenTeleprompter={() => (plan.teleprompter ? setTeleprompterOpen(true) : openUpgrade("teleprompter"))}
            onSelectionRewrite={selectionRewrite}
            textareaRef={textareaRef}
          />
        </section>
        <section aria-label="Retention analytics" className="min-w-0 pb-16">
          <AnalysisDeck
            status={status}
            progress={analyzer.progress}
            result={result}
            error={analyzer.error}
            tab={deckTab}
            onTabChange={setDeckTab}
            activeFlag={activeFlag}
            onSelectFlag={selectFlag}
            onApplyFix={applyFix}
            onMoreOptions={moreOptions}
            onUseHook={applyHook}
            onUpgrade={() => openUpgrade(deckTab === "hooks" ? "hooks" : "fixes")}
            onRetry={analyze}
            onLoadSample={loadSample}
            locatable={locatable}
            stale={stale}
          />
        </section>
      </main>

      <PricingDialog open={pricing.open} onOpenChange={(o) => setPricing((p) => ({ ...p, open: o }))} reason={pricing.reason} session={session} onChanged={refresh} />
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
          voiceProfile={plan.voiceProfiles ? voice : undefined}
          onOpenResult={(r) => {
            setHistory(saveToHistory(r));
            loadFromHistory(r);
          }}
          onFinished={refresh}
        />
      )}
      <VoiceDialog
        open={voiceOpen}
        onOpenChange={setVoiceOpen}
        value={voice}
        isPro={plan.voiceProfiles}
        onUpgrade={() => {
          setVoiceOpen(false);
          openUpgrade("voice");
        }}
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
        voiceProfile={plan.voiceProfiles ? voice : undefined}
        onApply={applyRewrite}
        onPlanRequired={(m) => openUpgrade(m === "deslop" ? "deslop" : "fixes")}
      />
    </div>
  );
}
