"use client";

import { useState, useCallback, useRef } from "react";
import {
  SERVICES, QUESTIONS, SECTION_META,
  SERVICE_TAB_NAMES, STATUS_COLORS,
  type PlanRow, type Submission,
} from "@/lib/data";

type Answers = Record<string, string>;

const SECTION_VIEWS = ["q-general", "q-payroll", "q-hrcomp", "q-talent", "q-rewards", "q-acq", "q-peo"];
const SECTION_KEYS  = ["general",   "payroll",   "hrcomp",   "talent",   "rewards",   "acq",   "peo"];

type AppView = "welcome" | "services" | typeof SECTION_VIEWS[number] | "generate" | "plan" | "clients";

export default function OnboardingApp() {
  const [view, setView]                     = useState<AppView>("welcome");
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set(["payroll", "hrcomp", "talent", "rewards", "acq"])
  );
  const [answers, setAnswers]               = useState<Answers>({});
  const [clientName, setClientName]         = useState("");
  const [generating, setGenerating]         = useState(false);
  const [genStep, setGenStep]               = useState(0);
  const [genError, setGenError]             = useState("");

  // Active plan state
  const [submission, setSubmission]         = useState<Submission | null>(null);
  const [activeTab, setActiveTab]           = useState<string>("");
  const [saving, setSaving]                 = useState<Record<string, boolean>>({});

  // Clients list
  const [clients, setClients]               = useState<Submission[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  const mainRef = useRef<HTMLDivElement>(null);

  // ── Helpers ──────────────────────────────────────────────

  const isPeoActive = useCallback(() =>
    QUESTIONS.peo.some((q) => answers[q.key]?.trim()), [answers]
  );

  const answeredCount = (section: string) =>
    QUESTIONS[section]?.filter((q) => answers[q.key]?.trim()).length ?? 0;

  const totalCount = (section: string) => QUESTIONS[section]?.length ?? 0;

  const goTo = (v: AppView) => {
    setView(v);
    mainRef.current?.scrollTo(0, 0);
  };

  const VIEW_ORDER: AppView[] = [
    "welcome", "services",
    ...SECTION_VIEWS as AppView[],
    "generate",
  ];

  const goNext = () => {
    const idx = VIEW_ORDER.indexOf(view);
    if (idx >= 0 && idx < VIEW_ORDER.length - 1) goTo(VIEW_ORDER[idx + 1]);
  };
  const goPrev = () => {
    const idx = VIEW_ORDER.indexOf(view);
    if (idx > 0) goTo(VIEW_ORDER[idx - 1]);
  };

  const stepNum = SECTION_VIEWS.indexOf(view) + 1;
  const totalSteps = 7;
  const progressPct = stepNum > 0 ? Math.round((stepNum / totalSteps) * 100) : 0;

  // ── Generation ───────────────────────────────────────────

  const startGeneration = async () => {
    setGenerating(true);
    setGenStep(1);
    setGenError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          selectedServices: Array.from(selectedServices),
          clientName,
        }),
      });

      setGenStep(2);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const { planData, clientLabel } = await res.json();
      setGenStep(3);

      // Save to Supabase
      const saveRes = await fetch("/api/save-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientLabel,
          answers,
          selectedServices: Array.from(selectedServices),
          planData,
        }),
      });

      setGenStep(4);
      const { id } = await saveRes.json();

      const newSubmission: Submission = {
        id,
        client_name: clientLabel,
        answers,
        selected_services: Array.from(selectedServices),
        plan_data: planData,
        created_at: new Date().toISOString(),
      };

      setSubmission(newSubmission);
      const firstTab = Object.keys(planData)[0];
      setActiveTab(firstTab);
      setGenerating(false);
      goTo("plan");
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : "Unknown error");
      setGenerating(false);
      setGenStep(0);
    }
  };

  // ── Plan row update ──────────────────────────────────────

  const updateRow = async (rowId: string, field: keyof PlanRow, value: string) => {
    if (!submission) return;
    const tabName = activeTab;

    // Optimistic update
    setSubmission((prev) => {
      if (!prev) return prev;
      const tab = prev.plan_data[tabName];
      const idx = tab.findIndex((r) => r.id === rowId);
      if (idx === -1) return prev;
      const updated = [...tab];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, plan_data: { ...prev.plan_data, [tabName]: updated } };
    });

    setSaving((prev) => ({ ...prev, [rowId]: true }));

    try {
      await fetch("/api/update-row", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submission.id,
          tabName,
          rowId,
          updates: { [field]: value },
        }),
      });
    } catch (e) {
      console.error("Save failed:", e);
    } finally {
      setSaving((prev) => ({ ...prev, [rowId]: false }));
    }
  };

  // ── Load clients ─────────────────────────────────────────

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const res = await fetch("/api/save-submission");
      const data = await res.json();
      setClients(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingClients(false);
    }
  };

  // ── Reset ────────────────────────────────────────────────

  const resetAll = () => {
    setView("welcome");
    setSelectedServices(new Set(["payroll", "hrcomp", "talent", "rewards", "acq"]));
    setAnswers({});
    setClientName("");
    setGenerating(false);
    setGenStep(0);
    setGenError("");
    setSubmission(null);
    setActiveTab("");
  };

  // ── Render ───────────────────────────────────────────────

  const planTabs = submission ? Object.keys(submission.plan_data) : [];

  const statusCounts = useCallback((tab: string) => {
    if (!submission) return {};
    const rows = submission.plan_data[tab] || [];
    return rows.reduce((acc: Record<string, number>, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
  }, [submission]);

  const overallProgress = useCallback(() => {
    if (!submission) return 0;
    const all = Object.values(submission.plan_data).flat();
    if (!all.length) return 0;
    const done = all.filter((r) => r.status === "Complete").length;
    return Math.round((done / all.length) * 100);
  }, [submission]);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--gray-bg)" }}>
      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-8 shrink-0 shadow-md z-20"
        style={{ background: "var(--blue)", height: 64 }}
      >
        <button
          onClick={() => goTo("welcome")}
          className="text-white font-bold text-lg tracking-wide hover:opacity-80 transition-opacity flex items-center gap-3"
        >
          <span>Calibrate<span style={{ color: "var(--teal)" }}>HCM</span></span>
          <span className="text-white/40 font-normal text-sm">HR Services Onboarding</span>
        </button>
        <div className="flex items-center gap-3">
          {submission && (
            <button
              onClick={() => goTo("plan")}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
              style={{ background: "rgba(59,180,193,0.2)", color: "var(--teal-light)", border: "1px solid rgba(59,180,193,0.35)" }}
            >
              View Active Plan
            </button>
          )}
          <button
            onClick={() => { goTo("clients"); loadClients(); }}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            All Clients
          </button>
          <div
            className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full border"
            style={{ color: "var(--teal-light)", borderColor: "rgba(59,180,193,0.4)", background: "rgba(59,180,193,0.12)" }}
          >
            Client Kickoff Tool
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        {view !== "plan" && view !== "clients" && (
          <nav
            className="w-64 shrink-0 overflow-y-auto py-6 flex flex-col gap-0.5"
            style={{ background: "#163d6e" }}
          >
            <SidebarLabel>Navigation</SidebarLabel>
            <SidebarItem active={view === "welcome"} onClick={() => goTo("welcome")}>Getting Started</SidebarItem>
            <SidebarItem active={view === "services"} onClick={() => goTo("services")}>Service Selection</SidebarItem>

            <SidebarLabel>Questionnaire</SidebarLabel>
            {SECTION_VIEWS.map((sv, i) => {
              const sk = SECTION_KEYS[i];
              const cnt = answeredCount(sk);
              const tot = totalCount(sk);
              return (
                <SidebarItem key={sv} active={view === sv} onClick={() => goTo(sv as AppView)}>
                  {SECTION_META[sk]?.title ?? sk}
                  {sk === "peo" ? (
                    <span className="ml-auto text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-full border" style={{ color: "rgba(59,180,193,0.8)", borderColor: "rgba(59,180,193,0.3)" }}>Optional</span>
                  ) : cnt > 0 ? (
                    <span className="ml-auto text-[10px]" style={{ color: view === sv ? "var(--teal-light)" : "rgba(255,255,255,0.35)" }}>{cnt}/{tot}</span>
                  ) : null}
                </SidebarItem>
              );
            })}

            <SidebarLabel>Output</SidebarLabel>
            <SidebarItem active={view === "generate"} onClick={() => goTo("generate")}>Generate Project Plan</SidebarItem>
          </nav>
        )}

        {/* ── Main ── */}
        <main ref={mainRef} className="flex-1 overflow-y-auto flex flex-col">

          {/* WELCOME */}
          {view === "welcome" && (
            <div className="flex flex-col items-center justify-center flex-1 px-10 py-16 text-center">
              {/* Hero gradient bar */}
              <div className="w-full max-w-2xl h-1 rounded-full mb-10 calibrate-gradient" />

              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-7 shadow-lg text-4xl calibrate-gradient">
                📋
              </div>
              <h1 className="text-3xl font-bold mb-3 calibrate-text-gradient">
                Client Onboarding Kickoff Tool
              </h1>
              <p className="text-gray-500 max-w-lg mb-10 text-sm leading-relaxed">
                Complete the questionnaire during or after the client kickoff meeting. Claude will generate a fully-populated, interactive project plan — living right here in the portal.
              </p>
              <div className="grid grid-cols-3 gap-4 max-w-2xl w-full mb-10">
                {[
                  { n: 1, title: "Select Services", desc: "Choose which HR service suites the client is enrolling in." },
                  { n: 2, title: "Complete Questionnaire", desc: "Answer questions across each relevant service area." },
                  { n: 3, title: "Live Project Plan", desc: "Claude builds an interactive plan. Update status, owners, and dates in real time." },
                ].map(({ n, title, desc }) => (
                  <div key={n} className="bg-white rounded-xl border p-5 text-left shadow-sm" style={{ borderColor: "#e2e8f0" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white mb-3 calibrate-gradient">{n}</div>
                    <h4 className="font-semibold text-sm mb-1" style={{ color: "var(--blue)" }}>{title}</h4>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => goTo("services")}
                className="px-9 py-3.5 rounded-xl text-white font-medium shadow-md hover:opacity-90 transition-all calibrate-gradient"
              >
                Start New Client →
              </button>
            </div>
          )}

          {/* SERVICES */}
          {view === "services" && (
            <div className="flex flex-col flex-1">
              <div className="flex-1 px-10 py-10">
                <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--blue)" }}>Which services is this client enrolling in?</h2>
                <p className="text-gray-500 text-sm mb-8">Select all that apply. Only relevant questionnaire sections and project plan tabs will be generated.</p>
                <div className="grid grid-cols-3 gap-4">
                  {SERVICES.map((svc) => {
                    const sel = selectedServices.has(svc.id);
                    return (
                      <button
                        key={svc.id}
                        onClick={() => {
                          setSelectedServices((prev) => {
                            const next = new Set(prev);
                            if (next.has(svc.id)) next.delete(svc.id);
                            else next.add(svc.id);
                            return next;
                          });
                        }}
                        className="relative bg-white rounded-xl border-2 p-5 text-left cursor-pointer transition-all hover:shadow-md"
                        style={{
                          borderColor: sel ? "var(--blue)" : "#e2e8f0",
                          background: sel ? "rgba(26,75,132,0.04)" : "white",
                        }}
                      >
                        <div
                          className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white transition-all"
                          style={{
                            background: sel ? "var(--blue)" : "transparent",
                            border: sel ? "2px solid var(--blue)" : "2px solid #cbd5e0",
                          }}
                        >
                          {sel && "✓"}
                        </div>
                        <div className="text-2xl mb-2">{svc.icon}</div>
                        <h4 className="font-semibold text-sm mb-1" style={{ color: "var(--blue)" }}>{svc.name}</h4>
                        <p className="text-xs text-gray-500">{svc.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <FooterNav onBack={() => goTo("welcome")} onNext={() => goTo("q-general")} />
            </div>
          )}

          {/* QUESTIONNAIRE SECTIONS */}
          {SECTION_VIEWS.map((sv, i) => {
            if (view !== sv) return null;
            const sk = SECTION_KEYS[i];
            const meta = SECTION_META[sk];
            const isOptional = sk === "peo";
            const qs = QUESTIONS[sk];
            let lastSub = "";

            return (
              <div key={sv} className="flex flex-col flex-1">
                {sk === "general" && (
                  <div className="flex items-center gap-4 px-10 py-3 bg-white border-b" style={{ borderColor: "#e2e8f0" }}>
                    <label className="text-sm font-medium text-gray-500 whitespace-nowrap">Client Name:</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Renew Wellness Brands"
                      className="max-w-xs px-3 py-2 rounded-lg border text-sm outline-none bg-gray-50"
                      style={{ borderColor: "#e2e8f0" }}
                    />
                  </div>
                )}

                <div className="px-10 py-7 bg-white border-b shadow-sm sticky top-0 z-10" style={{ borderColor: "#e2e8f0" }}>
                  <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "var(--teal)" }}>{meta.eyebrow}</div>
                  <div className="text-xl font-bold" style={{ color: "var(--blue)" }}>{meta.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{meta.subtitle}</div>
                </div>

                {isOptional && (
                  <div className="mx-10 mt-5 rounded-xl border px-5 py-4 flex gap-3 text-sm" style={{ background: "var(--teal-pale)", borderColor: "rgba(59,180,193,0.3)", color: "var(--blue)" }}>
                    <span className="text-base mt-0.5">💡</span>
                    <div><strong>Optional section.</strong> If this client is not leaving a PEO, leave all questions blank and the PEO Transition tab will be excluded from the project plan.</div>
                  </div>
                )}

                <div className="px-10 py-6 flex-1">
                  {qs.map((q) => {
                    const isNewSub = q.sub !== lastSub;
                    if (isNewSub) lastSub = q.sub;
                    const hasAnswer = !!answers[q.key]?.trim();
                    return (
                      <div key={q.key}>
                        {isNewSub && (
                          <div
                            className="text-[10px] font-bold tracking-widest uppercase mt-7 mb-3.5 pb-1.5 border-b-2"
                            style={{ color: "var(--blue)", borderColor: "var(--teal)" }}
                          >
                            {q.sub}
                          </div>
                        )}
                        <div
                          className="bg-white rounded-xl border mb-2.5 px-5 py-4 transition-all focus-within:shadow-sm"
                          style={{ borderColor: hasAnswer ? "var(--teal)" : "#e2e8f0" }}
                        >
                          <div className="flex gap-2 items-start mb-2">
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                              style={{ background: "var(--teal-pale)", color: "var(--blue)" }}
                            >Q</span>
                            <span className="text-sm font-medium" style={{ color: "var(--text-dark)" }}>{q.q}</span>
                          </div>
                          <textarea
                            value={answers[q.key] || ""}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
                            placeholder="Enter answer here..."
                            rows={3}
                            className="w-full text-sm px-3 py-2.5 rounded-lg border bg-gray-50 outline-none resize-y transition-all focus:bg-white"
                            style={{ borderColor: "#e2e8f0", minHeight: 72 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {isOptional ? (
                  <FooterNav onBack={goPrev} onNext={() => goTo("generate")} nextLabel="Review & Generate →" progress={progressPct} progressLabel={`${stepNum} of ${totalSteps}`} />
                ) : (
                  <FooterNav onBack={goPrev} onNext={goNext} progress={progressPct} progressLabel={`${stepNum} of ${totalSteps}`} />
                )}
              </div>
            );
          })}

          {/* GENERATE */}
          {view === "generate" && (
            <div className="flex items-center justify-center flex-1 px-10 py-16">
              <div className="bg-white rounded-2xl border shadow-xl p-12 max-w-xl w-full text-center" style={{ borderColor: "#e2e8f0" }}>

                {!generating && (
                  <>
                    <h2 className="text-2xl font-bold mb-2 calibrate-text-gradient">Ready to Generate</h2>
                    <p className="text-gray-500 text-sm mb-8">Claude will interpret your answers and build a fully-structured, interactive project plan inside this portal.</p>

                    <div className="flex flex-wrap gap-2 justify-center mb-6">
                      {SERVICES.filter((s) => selectedServices.has(s.id)).map((s) => (
                        <span
                          key={s.id}
                          className="text-xs font-medium px-3 py-1 rounded-full border"
                          style={{ color: "var(--blue)", background: "var(--teal-pale)", borderColor: "rgba(59,180,193,0.3)" }}
                        >
                          {s.icon} {s.name}
                        </span>
                      ))}
                    </div>

                    <div className="rounded-xl border text-left p-4 mb-7 text-sm" style={{ background: "#f7fafc", borderColor: "#e2e8f0" }}>
                      {[
                        ["Client", clientName || answers["co_name"] || "Not entered"],
                        ["Services", selectedServices.size.toString()],
                        ["Answers", `${Object.values(answers).filter(v => v?.trim()).length} of ${Object.values(QUESTIONS).flat().length}`],
                        ["PEO Transition", isPeoActive() ? "✓ Will be included" : "Skipped"],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between items-center py-1.5 border-b last:border-0" style={{ borderColor: "#f0f4f8" }}>
                          <span className="text-gray-500">{label}</span>
                          <span className="font-semibold" style={{ color: "var(--blue)" }}>{val}</span>
                        </div>
                      ))}
                    </div>

                    {genError && (
                      <div className="mb-4 p-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">{genError}</div>
                    )}

                    <button
                      onClick={startGeneration}
                      className="px-8 py-3.5 rounded-xl text-white font-medium shadow-lg hover:opacity-90 transition-all text-sm calibrate-gradient"
                    >
                      ✦ Generate Project Plan
                    </button>
                  </>
                )}

                {generating && (
                  <div className="flex flex-col items-center gap-5">
                    <div className="w-12 h-12 border-4 border-gray-100 rounded-full animate-spin" style={{ borderTopColor: "var(--teal)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--blue)" }}>Building your project plan…</p>
                    <div className="flex flex-col gap-2.5 text-left min-w-72">
                      {[
                        "Reading questionnaire answers...",
                        "Asking Claude to analyze responses...",
                        "Saving to portal...",
                        "Loading project plan...",
                      ].map((text, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 text-sm"
                          style={{
                            color: i + 1 < genStep ? "#15803d" : i + 1 === genStep ? "var(--blue)" : "#cbd5e0",
                            fontWeight: i + 1 === genStep ? 500 : 400,
                          }}
                        >
                          <span className="w-5 text-center">{i + 1 < genStep ? "✅" : i + 1 === genStep ? "⏳" : "○"}</span>
                          {text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROJECT PLAN */}
          {view === "plan" && submission && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Plan header */}
              <div className="px-8 py-5 bg-white border-b shadow-sm" style={{ borderColor: "#e2e8f0" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "var(--teal)" }}>Project Plan</div>
                    <h2 className="text-xl font-bold" style={{ color: "var(--blue)" }}>{submission.client_name}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Generated {new Date(submission.created_at).toLocaleDateString()} · {Object.values(submission.plan_data).flat().length} action items
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Overall progress */}
                    <div className="text-right">
                      <div className="text-xs text-gray-400 mb-1">Overall Progress</div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all calibrate-gradient"
                            style={{ width: `${overallProgress()}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold" style={{ color: "var(--blue)" }}>{overallProgress()}%</span>
                      </div>
                    </div>
                    <button
                      onClick={resetAll}
                      className="px-4 py-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                    >
                      + New Client
                    </button>
                  </div>
                </div>

                {/* Service tabs */}
                <div className="flex gap-1 mt-5 overflow-x-auto pb-1">
                  {planTabs.map((tab) => {
                    const counts = statusCounts(tab);
                    const done = counts["Complete"] || 0;
                    const total = (submission.plan_data[tab] || []).length;
                    const active = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: active ? "var(--blue)" : "rgba(26,75,132,0.05)",
                          color: active ? "white" : "#4a5568",
                          border: active ? "2px solid var(--blue)" : "2px solid transparent",
                        }}
                      >
                        {tab}
                        {total > 0 && (
                          <span
                            className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{
                              background: active ? "rgba(255,255,255,0.2)" : "#e2e8f0",
                              color: active ? "white" : "#718096",
                            }}
                          >
                            {done}/{total}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Plan table */}
              <div className="flex-1 overflow-auto px-8 py-6">
                <PlanTable
                  rows={submission.plan_data[activeTab] || []}
                  tabName={activeTab}
                  saving={saving}
                  onUpdate={updateRow}
                />
              </div>
            </div>
          )}

          {/* CLIENTS LIST */}
          {view === "clients" && (
            <div className="flex-1 px-10 py-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: "var(--blue)" }}>All Client Onboardings</h2>
                  <p className="text-sm text-gray-500 mt-1">Click a client to view their project plan</p>
                </div>
                <button
                  onClick={() => goTo("welcome")}
                  className="px-5 py-2.5 rounded-xl text-white font-medium text-sm shadow-sm hover:opacity-90 transition-all calibrate-gradient"
                >
                  + New Client
                </button>
              </div>

              {loadingClients ? (
                <div className="flex items-center gap-3 text-gray-400 text-sm">
                  <div className="w-5 h-5 border-2 border-gray-100 rounded-full animate-spin" style={{ borderTopColor: "var(--teal)" }} />
                  Loading clients...
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <div className="text-4xl mb-4">📋</div>
                  <p>No clients onboarded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {clients.map((c) => (
                    <button
                      key={c.id}
                      onClick={async () => {
                        const res = await fetch(`/api/save-submission/${c.id}`);
                        if (res.ok) {
                          const full = await res.json();
                          setSubmission(full);
                          setActiveTab(Object.keys(full.plan_data)[0]);
                          goTo("plan");
                        }
                      }}
                      className="bg-white rounded-xl border p-5 text-left hover:shadow-md transition-all cursor-pointer"
                      style={{ borderColor: "#e2e8f0" }}
                    >
                      <div className="font-semibold text-sm mb-1" style={{ color: "var(--blue)" }}>{c.client_name}</div>
                      <div className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {(c.selected_services || []).slice(0, 3).map((id: string) => (
                          <span
                            key={id}
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: "var(--teal-pale)", color: "var(--blue)" }}
                          >{SERVICE_TAB_NAMES[id] || id}</span>
                        ))}
                        {(c.selected_services || []).length > 3 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">+{c.selected_services.length - 3} more</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// ── Plan Table ──────────────────────────────────────────────

function PlanTable({
  rows, saving, onUpdate,
}: {
  rows: PlanRow[];
  tabName: string;
  saving: Record<string, boolean>;
  onUpdate: (id: string, field: keyof PlanRow, value: string) => void;
}) {
  let lastSvcLine = "";

  if (!rows.length) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        No tasks in this section.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const isNewSection = row.service_line !== lastSvcLine;
        if (isNewSection) lastSvcLine = row.service_line;
        const sc = STATUS_COLORS[row.status] || STATUS_COLORS["Not Started"];

        return (
          <div key={row.id}>
            {isNewSection && (
              <div
                className="text-[10px] font-bold tracking-widest uppercase mt-6 mb-2 pb-1.5 border-b-2"
                style={{ color: "var(--blue)", borderColor: "var(--teal)" }}
              >
                {row.service_line}
              </div>
            )}
            <div className="bg-white rounded-xl border p-4 transition-all hover:shadow-sm" style={{ borderColor: "#e2e8f0" }}>
              <div className="flex items-start gap-4">
                {/* Status */}
                <div className="shrink-0 pt-0.5">
                  <select
                    value={row.status}
                    onChange={(e) => onUpdate(row.id, "status", e.target.value)}
                    className="text-[11px] font-semibold px-2 py-1 rounded-full border cursor-pointer outline-none"
                    style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}
                  >
                    {["Not Started", "In Progress", "Complete", "Blocked"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm mb-1" style={{ color: "var(--blue)" }}>{row.task}</div>

                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Current State</div>
                      <p className="text-xs text-gray-600 leading-relaxed">{row.current_state}</p>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Goal / Action Item</div>
                      <p className="text-xs text-gray-600 leading-relaxed">{row.goal}</p>
                    </div>
                  </div>

                  {row.notes && (
                    <div
                      className="mt-2.5 px-3 py-2 rounded-lg text-xs"
                      style={{ background: "var(--teal-pale)", color: "var(--blue)", borderLeft: "3px solid var(--teal)" }}
                    >
                      💡 {row.notes}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400 font-medium">Owner:</span>
                      <input
                        type="text"
                        value={row.owner || ""}
                        onChange={(e) => onUpdate(row.id, "owner", e.target.value)}
                        placeholder="Assign..."
                        className="text-xs px-2 py-1 rounded border bg-gray-50 outline-none focus:bg-white w-32 transition-all"
                        style={{ borderColor: "#e2e8f0" }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400 font-medium">Target Date:</span>
                      <input
                        type="date"
                        value={row.target_date || ""}
                        onChange={(e) => onUpdate(row.id, "target_date", e.target.value)}
                        className="text-xs px-2 py-1 rounded border bg-gray-50 outline-none focus:bg-white transition-all"
                        style={{ borderColor: "#e2e8f0" }}
                      />
                    </div>
                    {saving[row.id] && (
                      <span className="text-[10px] animate-pulse" style={{ color: "var(--teal)" }}>Saving…</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function SidebarLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold tracking-widest uppercase px-5 pt-4 pb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
      {children}
    </div>
  );
}

function SidebarItem({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-5 py-2.5 cursor-pointer transition-all text-sm text-left"
      style={{
        color: active ? "white" : "rgba(255,255,255,0.65)",
        background: active ? "rgba(59,180,193,0.15)" : "transparent",
        borderLeft: `3px solid ${active ? "var(--teal)" : "transparent"}`,
        fontWeight: active ? 500 : 400,
      }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0 transition-all"
        style={{ background: active ? "var(--teal)" : "rgba(255,255,255,0.2)" }}
      />
      {children}
    </button>
  );
}

function FooterNav({
  onBack, onNext, nextLabel = "Next →", progress, progressLabel,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  progress?: number;
  progressLabel?: string;
}) {
  return (
    <div
      className="flex items-center gap-4 px-10 py-4 bg-white border-t shrink-0"
      style={{ borderColor: "#e2e8f0", boxShadow: "0 -2px 8px rgba(0,0,0,0.04)" }}
    >
      <button
        onClick={onBack}
        className="px-5 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-all"
      >
        ← Back
      </button>
      {progress !== undefined ? (
        <>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 calibrate-gradient"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">{progressLabel}</span>
        </>
      ) : (
        <div className="flex-1" />
      )}
      <button
        onClick={onNext}
        className="px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm hover:opacity-90 transition-all calibrate-gradient"
      >
        {nextLabel}
      </button>
    </div>
  );
}
