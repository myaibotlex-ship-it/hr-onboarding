"use client";

import { useState, useCallback, useRef } from "react";
import {
  SERVICES, QUESTIONS, SECTION_META,
  SERVICE_TAB_NAMES, STATUS_COLORS,
  type PlanRow, type Submission,
} from "@/lib/data";
import {
  CalibrateLogoWhite,
  ServiceIcon,
  SectionIcon,
  ClipboardIcon,
  ChartIcon,
  UsersIcon,
  SparkIcon,
  InfoIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from "@/components/icons";

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

  const [submission, setSubmission]         = useState<Submission | null>(null);
  const [activeTab, setActiveTab]           = useState<string>("");
  const [saving, setSaving]                 = useState<Record<string, boolean>>({});

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
      setActiveTab(Object.keys(planData)[0]);
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

  // ── Derived ──────────────────────────────────────────────

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

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--gray-bg)" }}>

      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-8 shrink-0 z-20"
        style={{
          background: "var(--blue)",
          height: 64,
          boxShadow: "0 1px 0 rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.18)",
        }}
      >
        <button
          onClick={() => goTo("welcome")}
          className="flex items-center gap-3 hover:opacity-85 transition-opacity"
        >
          <CalibrateLogoWhite height={28} />
          <div
            className="h-5 w-px mx-1"
            style={{ background: "rgba(255,255,255,0.2)" }}
          />
          <span
            className="text-sm font-medium tracking-wide"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            HR Services Onboarding
          </span>
        </button>

        <div className="flex items-center gap-2">
          {submission && (
            <button
              onClick={() => goTo("plan")}
              className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg font-medium transition-all hover:opacity-80"
              style={{
                background: "rgba(59,180,193,0.18)",
                color: "var(--teal-light)",
                border: "1px solid rgba(59,180,193,0.3)",
              }}
            >
              <ChartIcon size={13} color="currentColor" />
              Active Plan
            </button>
          )}
          <button
            onClick={() => { goTo("clients"); loadClients(); }}
            className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg font-medium transition-all hover:opacity-80"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.65)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <UsersIcon size={13} color="currentColor" />
            All Clients
          </button>
          <div
            className="text-[11px] font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full ml-1"
            style={{
              color: "var(--teal-light)",
              background: "rgba(59,180,193,0.12)",
              border: "1px solid rgba(59,180,193,0.3)",
              letterSpacing: "0.08em",
            }}
          >
            Client Kickoff Tool
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        {view !== "plan" && view !== "clients" && (
          <nav
            className="w-60 shrink-0 overflow-y-auto py-5 flex flex-col"
            style={{ background: "#163d6e" }}
          >
            <SidebarSection label="Navigation">
              <SidebarItem
                active={view === "welcome"}
                onClick={() => goTo("welcome")}
                icon={<ClipboardIcon size={15} color="currentColor" />}
              >
                Getting Started
              </SidebarItem>
              <SidebarItem
                active={view === "services"}
                onClick={() => goTo("services")}
                icon={<UsersIcon size={15} color="currentColor" />}
              >
                Service Selection
              </SidebarItem>
            </SidebarSection>

            <SidebarSection label="Questionnaire">
              {SECTION_VIEWS.map((sv, i) => {
                const sk = SECTION_KEYS[i];
                const cnt = answeredCount(sk);
                const tot = totalCount(sk);
                const isActive = view === sv;
                return (
                  <SidebarItem
                    key={sv}
                    active={isActive}
                    onClick={() => goTo(sv as AppView)}
                    icon={<SectionIcon sectionKey={sk} size={15} color="currentColor" />}
                    badge={
                      sk === "peo" ? (
                        <span
                          className="text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-full"
                          style={{ color: "rgba(59,180,193,0.75)", background: "rgba(59,180,193,0.12)", border: "1px solid rgba(59,180,193,0.25)" }}
                        >
                          Opt.
                        </span>
                      ) : cnt > 0 ? (
                        <span
                          className="text-[10px] tabular-nums"
                          style={{ color: isActive ? "var(--teal-light)" : "rgba(255,255,255,0.35)" }}
                        >
                          {cnt}/{tot}
                        </span>
                      ) : undefined
                    }
                  >
                    {SECTION_META[sk]?.title ?? sk}
                  </SidebarItem>
                );
              })}
            </SidebarSection>

            <SidebarSection label="Output">
              <SidebarItem
                active={view === "generate"}
                onClick={() => goTo("generate")}
                icon={<SparkIcon size={15} color="currentColor" />}
              >
                Generate Project Plan
              </SidebarItem>
            </SidebarSection>
          </nav>
        )}

        {/* ── Main ── */}
        <main ref={mainRef} className="flex-1 overflow-y-auto flex flex-col">

          {/* ── WELCOME ── */}
          {view === "welcome" && (
            <div className="flex flex-col items-center justify-center flex-1 px-10 py-16 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg calibrate-gradient"
              >
                <ClipboardIcon size={28} color="white" />
              </div>

              <h1 className="text-3xl font-bold mb-3 calibrate-text-gradient">
                Client Onboarding Kickoff Tool
              </h1>
              <p className="text-gray-500 max-w-lg mb-12 text-sm leading-relaxed">
                Complete the questionnaire during or after the client kickoff meeting.
                Claude will generate a fully-populated, interactive project plan — living
                right here in the portal.
              </p>

              <div className="grid grid-cols-3 gap-5 max-w-2xl w-full mb-12">
                {[
                  {
                    n: 1,
                    icon: <UsersIcon size={20} color="white" />,
                    title: "Select Services",
                    desc: "Choose which HR service suites the client is enrolling in.",
                  },
                  {
                    n: 2,
                    icon: <ClipboardIcon size={20} color="white" />,
                    title: "Complete Questionnaire",
                    desc: "Answer questions across each relevant service area.",
                  },
                  {
                    n: 3,
                    icon: <ChartIcon size={20} color="white" />,
                    title: "Live Project Plan",
                    desc: "Claude builds an interactive plan with status, owners, and dates.",
                  },
                ].map(({ n, icon, title, desc }) => (
                  <div
                    key={n}
                    className="bg-white rounded-xl border p-6 text-left shadow-sm"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 calibrate-gradient shadow-sm"
                    >
                      {icon}
                    </div>
                    <div
                      className="text-[10px] font-bold uppercase tracking-widest mb-1"
                      style={{ color: "var(--teal)" }}
                    >
                      Step {n}
                    </div>
                    <h4 className="font-semibold text-sm mb-1.5" style={{ color: "var(--blue)" }}>{title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => goTo("services")}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-medium shadow-md hover:opacity-90 transition-all calibrate-gradient"
              >
                Start New Client
                <ArrowRightIcon size={15} color="white" />
              </button>
            </div>
          )}

          {/* ── SERVICES ── */}
          {view === "services" && (
            <div className="flex flex-col flex-1">
              <PageHeader
                eyebrow="Step 1 of 2"
                title="Service Selection"
                subtitle="Choose which HR service suites this client is enrolling in. Only relevant sections will be included in the questionnaire and project plan."
              />

              <div className="flex-1 px-10 py-8">
                <div className="grid grid-cols-3 gap-4 max-w-4xl">
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
                        className="relative bg-white rounded-xl border-2 p-5 text-left cursor-pointer transition-all hover:shadow-md group"
                        style={{
                          borderColor: sel ? "var(--blue)" : "var(--border)",
                          background: sel ? "rgba(26,75,132,0.03)" : "white",
                        }}
                      >
                        {/* Checkbox */}
                        <div
                          className="absolute top-4 right-4 w-5 h-5 rounded-full flex items-center justify-center transition-all"
                          style={{
                            background: sel ? "var(--blue)" : "transparent",
                            border: sel ? "2px solid var(--blue)" : "2px solid #cbd5e0",
                          }}
                        >
                          {sel && <CheckCircleIcon size={12} color="white" />}
                        </div>

                        {/* Icon */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all"
                          style={{
                            background: sel ? "var(--blue)" : "var(--teal-pale)",
                            color: sel ? "white" : "var(--blue)",
                          }}
                        >
                          <ServiceIcon iconId={svc.iconId} size={20} color="currentColor" />
                        </div>

                        <h4 className="font-semibold text-sm mb-1" style={{ color: "var(--blue)" }}>
                          {svc.name}
                        </h4>
                        <p className="text-xs text-gray-500">{svc.desc}</p>
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-gray-400 mt-5">
                  {selectedServices.size} service{selectedServices.size !== 1 ? "s" : ""} selected
                </p>
              </div>

              <FooterNav onBack={() => goTo("welcome")} onNext={() => goTo("q-general")} />
            </div>
          )}

          {/* ── QUESTIONNAIRE SECTIONS ── */}
          {SECTION_VIEWS.map((sv, i) => {
            if (view !== sv) return null;
            const sk = SECTION_KEYS[i];
            const meta = SECTION_META[sk];
            const isOptional = sk === "peo";
            const qs = QUESTIONS[sk];
            let lastSub = "";

            return (
              <div key={sv} className="flex flex-col flex-1">
                {/* Client name bar — only on general */}
                {sk === "general" && (
                  <div
                    className="flex items-center gap-3 px-10 py-3 bg-white border-b"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                      Client Name
                    </label>
                    <div
                      className="h-4 w-px"
                      style={{ background: "var(--border)" }}
                    />
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Renew Wellness Brands"
                      className="flex-1 max-w-sm px-3 py-1.5 rounded-lg border text-sm outline-none bg-gray-50 focus:bg-white transition-all"
                      style={{ borderColor: "var(--border)" }}
                    />
                  </div>
                )}

                <PageHeader
                  eyebrow={meta.eyebrow}
                  title={meta.title}
                  subtitle={meta.subtitle}
                  icon={<SectionIcon sectionKey={sk} size={20} color="var(--teal)" />}
                  progress={stepNum > 0 ? { current: stepNum, total: totalSteps } : undefined}
                />

                {isOptional && (
                  <div
                    className="mx-10 mt-6 rounded-xl border px-5 py-4 flex gap-3 text-sm"
                    style={{
                      background: "var(--teal-pale)",
                      borderColor: "rgba(59,180,193,0.3)",
                      color: "var(--blue)",
                    }}
                  >
                    <InfoIcon size={18} color="var(--teal)" className="shrink-0 mt-0.5" />
                    <p>
                      <strong>Optional section.</strong> If this client is not leaving a PEO,
                      leave all questions blank — the PEO Transition tab will be excluded from
                      the generated project plan.
                    </p>
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
                            className="flex items-center gap-2 mt-8 mb-4"
                          >
                            <div
                              className="h-px flex-1"
                              style={{ background: "var(--border)" }}
                            />
                            <span
                              className="text-[10px] font-bold tracking-widest uppercase px-3"
                              style={{ color: "var(--blue)", whiteSpace: "nowrap" }}
                            >
                              {q.sub}
                            </span>
                            <div
                              className="h-px flex-1"
                              style={{ background: "var(--border)" }}
                            />
                          </div>
                        )}
                        <div
                          className="bg-white rounded-xl border mb-3 px-5 py-4 transition-all focus-within:shadow-sm"
                          style={{ borderColor: hasAnswer ? "var(--teal)" : "var(--border)" }}
                        >
                          <label className="block text-sm font-medium mb-2.5" style={{ color: "var(--text-dark)" }}>
                            {q.q}
                          </label>
                          <textarea
                            value={answers[q.key] || ""}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
                            placeholder="Enter answer here..."
                            rows={3}
                            className="w-full text-sm px-3 py-2.5 rounded-lg border bg-gray-50 outline-none resize-y transition-all focus:bg-white focus:border-teal-400"
                            style={{ borderColor: "var(--border)", minHeight: 72 }}
                          />
                          {hasAnswer && (
                            <div className="flex justify-end mt-1.5">
                              <CheckCircleIcon size={14} color="var(--teal)" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {isOptional ? (
                  <FooterNav
                    onBack={goPrev}
                    onNext={() => goTo("generate")}
                    nextLabel="Review & Generate"
                    progress={progressPct}
                    progressLabel={`${stepNum} of ${totalSteps}`}
                  />
                ) : (
                  <FooterNav
                    onBack={goPrev}
                    onNext={goNext}
                    progress={progressPct}
                    progressLabel={`${stepNum} of ${totalSteps}`}
                  />
                )}
              </div>
            );
          })}

          {/* ── GENERATE ── */}
          {view === "generate" && (
            <div className="flex items-center justify-center flex-1 px-10 py-16">
              <div
                className="bg-white rounded-2xl border shadow-lg p-10 max-w-lg w-full"
                style={{ borderColor: "var(--border)" }}
              >
                {!generating ? (
                  <>
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 calibrate-gradient shadow-md"
                    >
                      <SparkIcon size={26} color="white" />
                    </div>

                    <h2 className="text-2xl font-bold mb-2 text-center calibrate-text-gradient">
                      Ready to Generate
                    </h2>
                    <p className="text-gray-500 text-sm text-center mb-7">
                      Claude will interpret your answers and build a fully-structured,
                      interactive project plan inside this portal.
                    </p>

                    {/* Summary card */}
                    <div
                      className="rounded-xl border mb-6 overflow-hidden"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {[
                        ["Client", clientName || answers["co_name"] || "Not entered"],
                        ["Services selected", selectedServices.size.toString()],
                        ["Questions answered", `${Object.values(answers).filter(v => v?.trim()).length} of ${Object.values(QUESTIONS).flat().length}`],
                        ["PEO Transition", isPeoActive() ? "Included" : "Skipped"],
                      ].map(([label, val], i, arr) => (
                        <div
                          key={label}
                          className="flex justify-between items-center px-4 py-3 text-sm"
                          style={{
                            background: i % 2 === 0 ? "#f7fafc" : "white",
                            borderBottom: i < arr.length - 1 ? `1px solid var(--border)` : "none",
                          }}
                        >
                          <span className="text-gray-500">{label}</span>
                          <span className="font-semibold" style={{ color: "var(--blue)" }}>{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Selected services pills */}
                    <div className="flex flex-wrap gap-2 mb-7">
                      {SERVICES.filter((s) => selectedServices.has(s.id)).map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                          style={{
                            color: "var(--blue)",
                            background: "var(--teal-pale)",
                            border: "1px solid rgba(59,180,193,0.25)",
                          }}
                        >
                          <ServiceIcon iconId={s.iconId} size={12} color="var(--blue)" />
                          {s.name}
                        </span>
                      ))}
                    </div>

                    {genError && (
                      <div className="mb-5 p-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">
                        {genError}
                      </div>
                    )}

                    <button
                      onClick={startGeneration}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-medium shadow-md hover:opacity-90 transition-all calibrate-gradient"
                    >
                      <SparkIcon size={16} color="white" />
                      Generate Project Plan
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-6 py-4">
                    <div
                      className="w-14 h-14 rounded-full border-4 animate-spin"
                      style={{ borderColor: "var(--teal-pale)", borderTopColor: "var(--teal)" }}
                    />
                    <div className="text-center">
                      <p className="font-semibold mb-1" style={{ color: "var(--blue)" }}>
                        Building your project plan…
                      </p>
                      <p className="text-xs text-gray-400">This takes about 30 seconds</p>
                    </div>
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                      {[
                        "Reading questionnaire answers",
                        "Analyzing responses with Claude",
                        "Saving to portal",
                        "Loading project plan",
                      ].map((text, i) => {
                        const done = i + 1 < genStep;
                        const active = i + 1 === genStep;
                        return (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all"
                              style={{
                                background: done ? "#f0fdf4" : active ? "var(--teal-pale)" : "#f3f4f6",
                                border: done ? "2px solid #86efac" : active ? "2px solid var(--teal)" : "2px solid #e5e7eb",
                              }}
                            >
                              {done
                                ? <CheckCircleIcon size={14} color="#15803d" />
                                : active
                                ? <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" style={{ background: "var(--teal)" }} />
                                : <div className="w-2 h-2 rounded-full bg-gray-300" />
                              }
                            </div>
                            <span style={{
                              color: done ? "#15803d" : active ? "var(--blue)" : "#9ca3af",
                              fontWeight: active ? 500 : 400,
                            }}>
                              {text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PROJECT PLAN ── */}
          {view === "plan" && submission && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Plan header */}
              <div
                className="px-8 py-5 bg-white border-b"
                style={{ borderColor: "var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div
                      className="text-[10px] font-bold tracking-widest uppercase mb-1"
                      style={{ color: "var(--teal)" }}
                    >
                      Project Plan
                    </div>
                    <h2 className="text-xl font-bold" style={{ color: "var(--blue)" }}>
                      {submission.client_name}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Generated {new Date(submission.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}{Object.values(submission.plan_data).flat().length} action items
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Progress */}
                    <div className="text-right">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                        Overall Progress
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-36 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 calibrate-gradient"
                            style={{ width: `${overallProgress()}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold tabular-nums" style={{ color: "var(--blue)" }}>
                          {overallProgress()}%
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={resetAll}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all border border-gray-200"
                    >
                      + New Client
                    </button>
                  </div>
                </div>

                {/* Service tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                  {planTabs.map((tab) => {
                    const counts = statusCounts(tab);
                    const done = counts["Complete"] || 0;
                    const total = (submission.plan_data[tab] || []).length;
                    const active = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: active ? "var(--blue)" : "rgba(26,75,132,0.05)",
                          color: active ? "white" : "var(--text-mid)",
                          border: active ? "1.5px solid var(--blue)" : "1.5px solid transparent",
                        }}
                      >
                        {tab}
                        {total > 0 && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full tabular-nums font-semibold"
                            style={{
                              background: active ? "rgba(255,255,255,0.2)" : "var(--border)",
                              color: active ? "white" : "var(--text-light)",
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

              {/* Plan rows */}
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

          {/* ── CLIENTS LIST ── */}
          {view === "clients" && (
            <div className="flex-1 px-10 py-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: "var(--blue)" }}>
                    All Client Onboardings
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Click a client to view their project plan
                  </p>
                </div>
                <button
                  onClick={() => goTo("welcome")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm shadow-sm hover:opacity-90 transition-all calibrate-gradient"
                >
                  + New Client
                </button>
              </div>

              {loadingClients ? (
                <div className="flex items-center gap-3 text-gray-400 text-sm py-10">
                  <div
                    className="w-5 h-5 rounded-full border-2 animate-spin"
                    style={{ borderColor: "var(--teal-pale)", borderTopColor: "var(--teal)" }}
                  />
                  Loading clients…
                </div>
              ) : clients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                  <UsersIcon size={40} color="#d1d5db" />
                  <p className="mt-4 text-sm">No clients onboarded yet.</p>
                  <button
                    onClick={() => goTo("welcome")}
                    className="mt-4 text-sm font-medium hover:opacity-80 transition-all"
                    style={{ color: "var(--blue)" }}
                  >
                    Start your first client →
                  </button>
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
                      className="bg-white rounded-xl border p-5 text-left hover:shadow-md transition-all group"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div
                        className="font-semibold text-sm mb-0.5 group-hover:underline"
                        style={{ color: "var(--blue)" }}
                      >
                        {c.client_name}
                      </div>
                      <div className="text-xs text-gray-400 mb-3">
                        {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(c.selected_services || []).slice(0, 3).map((id: string) => (
                          <span
                            key={id}
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "var(--teal-pale)", color: "var(--blue)" }}
                          >
                            {SERVICE_TAB_NAMES[id] || id}
                          </span>
                        ))}
                        {(c.selected_services || []).length > 3 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            +{c.selected_services.length - 3} more
                          </span>
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

// ── Plan Table ─────────────────────────────────────────────

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
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-sm gap-3">
        <ChartIcon size={32} color="#d1d5db" />
        <p>No tasks in this section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-w-5xl">
      {rows.map((row) => {
        const isNewSection = row.service_line !== lastSvcLine;
        if (isNewSection) lastSvcLine = row.service_line;
        const sc = STATUS_COLORS[row.status] || STATUS_COLORS["Not Started"];

        return (
          <div key={row.id}>
            {isNewSection && (
              <div className="flex items-center gap-3 mt-7 mb-3">
                <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                <span
                  className="text-[10px] font-bold tracking-widest uppercase px-3 whitespace-nowrap"
                  style={{ color: "var(--blue)" }}
                >
                  {row.service_line}
                </span>
                <div className="h-px flex-1" style={{ background: "var(--border)" }} />
              </div>
            )}

            <div
              className="bg-white rounded-xl border p-5 transition-all hover:shadow-sm"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-start gap-5">
                {/* Status select */}
                <div className="shrink-0 pt-0.5">
                  <select
                    value={row.status}
                    onChange={(e) => onUpdate(row.id, "status", e.target.value)}
                    className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full border cursor-pointer outline-none appearance-none"
                    style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}
                  >
                    {["Not Started", "In Progress", "Complete", "Blocked"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm mb-3" style={{ color: "var(--blue)" }}>
                    {row.task}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div
                        className="text-[9px] font-bold uppercase tracking-widest mb-1"
                        style={{ color: "var(--text-light)" }}
                      >
                        Current State
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-mid)" }}>
                        {row.current_state}
                      </p>
                    </div>
                    <div>
                      <div
                        className="text-[9px] font-bold uppercase tracking-widest mb-1"
                        style={{ color: "var(--text-light)" }}
                      >
                        Goal / Action Item
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-mid)" }}>
                        {row.goal}
                      </p>
                    </div>
                  </div>

                  {row.notes && (
                    <div
                      className="flex gap-2 items-start px-3 py-2.5 rounded-lg text-xs mb-3"
                      style={{
                        background: "var(--teal-pale)",
                        color: "var(--blue)",
                        borderLeft: "3px solid var(--teal)",
                      }}
                    >
                      <InfoIcon size={13} color="var(--teal)" className="shrink-0 mt-0.5" />
                      {row.notes}
                    </div>
                  )}

                  <div className="flex items-center gap-5 pt-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: "var(--text-light)" }}
                      >
                        Owner
                      </span>
                      <input
                        type="text"
                        value={row.owner || ""}
                        onChange={(e) => onUpdate(row.id, "owner", e.target.value)}
                        placeholder="Assign..."
                        className="text-xs px-2.5 py-1 rounded-lg border bg-gray-50 outline-none focus:bg-white w-32 transition-all"
                        style={{ borderColor: "var(--border)" }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: "var(--text-light)" }}
                      >
                        Target Date
                      </span>
                      <input
                        type="date"
                        value={row.target_date || ""}
                        onChange={(e) => onUpdate(row.id, "target_date", e.target.value)}
                        className="text-xs px-2.5 py-1 rounded-lg border bg-gray-50 outline-none focus:bg-white transition-all"
                        style={{ borderColor: "var(--border)" }}
                      />
                    </div>
                    {saving[row.id] && (
                      <span
                        className="text-[10px] animate-pulse"
                        style={{ color: "var(--teal)" }}
                      >
                        Saving…
                      </span>
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

function PageHeader({
  eyebrow, title, subtitle, icon, progress,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  progress?: { current: number; total: number };
}) {
  return (
    <div
      className="px-10 py-6 bg-white border-b sticky top-0 z-10"
      style={{ borderColor: "var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {icon && (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "var(--teal-pale)" }}
            >
              {icon}
            </div>
          )}
          <div>
            <div
              className="text-[10px] font-bold tracking-widest uppercase mb-1"
              style={{ color: "var(--teal)" }}
            >
              {eyebrow}
            </div>
            <h2 className="text-xl font-bold leading-tight" style={{ color: "var(--blue)" }}>
              {title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
        </div>
        {progress && (
          <div className="text-right shrink-0 ml-8">
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: "var(--text-light)" }}
            >
              {progress.current} of {progress.total}
            </div>
            <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all calibrate-gradient"
                style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div
        className="text-[9px] font-bold tracking-widest uppercase px-5 pt-4 pb-2"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function SidebarItem({
  active, onClick, icon, badge, children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-all"
      style={{
        color: active ? "white" : "rgba(255,255,255,0.6)",
        background: active ? "rgba(59,180,193,0.15)" : "transparent",
        borderLeft: `3px solid ${active ? "var(--teal)" : "transparent"}`,
        fontWeight: active ? 500 : 400,
      }}
    >
      <span
        className="shrink-0 transition-all"
        style={{ color: active ? "var(--teal-light)" : "rgba(255,255,255,0.35)" }}
      >
        {icon}
      </span>
      <span className="flex-1 min-w-0 truncate">{children}</span>
      {badge}
    </button>
  );
}

function FooterNav({
  onBack, onNext, nextLabel = "Next", progress, progressLabel,
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
      style={{ borderColor: "var(--border)", boxShadow: "0 -2px 8px rgba(0,0,0,0.04)" }}
    >
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-all"
      >
        <ArrowLeftIcon size={14} color="currentColor" />
        Back
      </button>

      {progress !== undefined ? (
        <>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 calibrate-gradient"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap tabular-nums">
            {progressLabel}
          </span>
        </>
      ) : (
        <div className="flex-1" />
      )}

      <button
        onClick={onNext}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm hover:opacity-90 transition-all calibrate-gradient"
      >
        {nextLabel}
        <ArrowRightIcon size={14} color="white" />
      </button>
    </div>
  );
}


