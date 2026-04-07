"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  SERVICES, QUESTIONS, SECTION_META,
  SERVICE_TAB_NAMES, STATUS_COLORS, PHASE_COLORS,
  type PlanRow, type Submission, type TeamUser,
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
import { useCurrentUser } from "@/components/UserContext";
import ClientDetails from "@/components/ClientDetails";

type Answers = Record<string, string>;

const SECTION_VIEWS = ["q-general", "q-payroll", "q-hrcomp", "q-talent", "q-rewards", "q-acq", "q-peo"];
const SECTION_KEYS  = ["general",   "payroll",   "hrcomp",   "talent",   "rewards",   "acq",   "peo"];

type AppView = "welcome" | "services" | "client-details" | typeof SECTION_VIEWS[number] | "generate" | "plan" | "clients";

// ── Avatar helper ──────────────────────────────────────────
function UserAvatar({ name, color, size = 32 }: { name: string; color?: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38, background: color || "var(--blue)" }}
    >
      {initials}
    </div>
  );
}

// ── Logout icon ────────────────────────────────────────────
function LogoutIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" />
    </svg>
  );
}

// ── Print icon ─────────────────────────────────────────────
function PrintIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6V2h8v4M4 12H2V8h12v4h-2" />
      <rect x="4" y="10" width="8" height="4" />
    </svg>
  );
}

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

  // Client details fields
  const [paycomClientCode, setPaycomClientCode]       = useState("");
  const [hcmPlatform, setHcmPlatform]                 = useState("");
  const [industry, setIndustry]                       = useState("");
  const [employeeCount, setEmployeeCount]             = useState("");
  const [goLiveDate, setGoLiveDate]                   = useState("");
  const [contractStartDate, setContractStartDate]     = useState("");
  const [assignedConsultantId, setAssignedConsultantId] = useState("");
  const [implementationPhase, setImplementationPhase] = useState("Discovery");
  const [internalNotes, setInternalNotes]             = useState("");

  // Team users for assignment
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);

  // User context (null if guest)
  let currentUser: ReturnType<typeof useCurrentUser> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    currentUser = useCurrentUser();
  } catch {
    // Not wrapped in UserProvider (guest mode)
  }

  const mainRef = useRef<HTMLDivElement>(null);

  // Load team users
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTeamUsers(data); })
      .catch(() => {});
  }, []);

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
    "welcome", "services", "client-details",
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
          paycomClientCode,
          goLiveDate: goLiveDate || null,
          contractStartDate: contractStartDate || null,
          hcmPlatform,
          industry,
          employeeCount: employeeCount || null,
          implementationPhase,
          assignedConsultantId: assignedConsultantId || null,
          internalNotes,
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
        paycom_client_code: paycomClientCode,
        go_live_date: goLiveDate,
        contract_start_date: contractStartDate,
        hcm_platform: hcmPlatform,
        industry,
        employee_count: employeeCount ? Number(employeeCount) : undefined,
        implementation_phase: implementationPhase,
        assigned_consultant_id: assignedConsultantId || undefined,
        internal_notes: internalNotes,
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
    setPaycomClientCode("");
    setHcmPlatform("");
    setIndustry("");
    setEmployeeCount("");
    setGoLiveDate("");
    setContractStartDate("");
    setAssignedConsultantId("");
    setImplementationPhase("Discovery");
    setInternalNotes("");
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

  const getOverdueCount = useCallback((planData: Record<string, PlanRow[]>) => {
    const today = new Date().toISOString().split("T")[0];
    return Object.values(planData).flat().filter(
      (r) => r.due_date && r.due_date < today && r.status !== "Complete"
    ).length;
  }, []);

  const getConsultantName = (consultantId: string | undefined) => {
    if (!consultantId) return null;
    return teamUsers.find((u) => u.id === consultantId) ?? null;
  };

  // ── PDF Export ───────────────────────────────────────────

  const handlePdfExport = () => {
    window.print();
  };

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen overflow-hidden print-container" style={{ background: "var(--gray-bg)" }}>

      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-4 md:px-8 shrink-0 z-20 print-hide"
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
            className="h-5 w-px mx-1 hidden sm:block"
            style={{ background: "rgba(255,255,255,0.2)" }}
          />
          <span
            className="text-sm font-medium tracking-wide hidden sm:inline"
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
              <span className="hidden sm:inline">Active Plan</span>
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
            <span className="hidden sm:inline">All Clients</span>
          </button>

          {/* User avatar + name (when logged in) */}
          {currentUser?.user && (
            <div className="flex items-center gap-2 ml-1">
              <UserAvatar
                name={currentUser.user.full_name}
                color={currentUser.user.avatar_color}
                size={28}
              />
              <span
                className="text-xs font-medium hidden md:inline"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                {currentUser.user.full_name}
              </span>
              <button
                onClick={currentUser.signOut}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
                title="Sign out"
              >
                <LogoutIcon size={14} color="rgba(255,255,255,0.5)" />
              </button>
            </div>
          )}

          <div
            className="text-[11px] font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full ml-1 hidden sm:block"
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
            className="w-60 shrink-0 overflow-y-auto py-5 flex-col hidden md:flex print-hide"
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
              <SidebarItem
                active={view === "client-details"}
                onClick={() => goTo("client-details")}
                icon={<SectionIcon sectionKey="general" size={15} color="currentColor" />}
              >
                Client Details
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

        {/* ── Mobile bottom nav ── */}
        {view !== "plan" && view !== "clients" && (
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around bg-white border-t px-2 py-2 print-hide"
            style={{ borderColor: "var(--border)", boxShadow: "0 -2px 12px rgba(0,0,0,0.08)" }}
          >
            {([
              { v: "welcome",  icon: <ClipboardIcon size={20} color="currentColor" />, label: "Start" },
              { v: "services", icon: <UsersIcon size={20} color="currentColor" />,    label: "Services" },
              { v: "client-details", icon: <SectionIcon sectionKey="general" size={20} color="currentColor" />, label: "Details" },
              { v: "q-general",icon: <SectionIcon sectionKey="general" size={20} color="currentColor" />, label: "Questions" },
              { v: "generate", icon: <SparkIcon size={20} color="currentColor" />,    label: "Generate" },
            ] as { v: AppView; icon: React.ReactNode; label: string }[]).map(({ v, icon, label }) => {
              const isActive = view === v || (v === "q-general" && SECTION_VIEWS.includes(view as string));
              return (
                <button
                  key={v}
                  onClick={() => goTo(v)}
                  className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all"
                  style={{ color: isActive ? "var(--blue)" : "#9ca3af" }}
                >
                  {icon}
                  <span className="text-[10px] font-semibold">{label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Main ── */}
        <main ref={mainRef} className="flex-1 overflow-y-auto flex flex-col pb-16 md:pb-0">

          {/* ── WELCOME ── */}
          {view === "welcome" && (
            <div className="flex flex-col items-center justify-center flex-1 px-5 md:px-10 py-10 md:py-16 text-center">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-2xl w-full mb-12">
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
                eyebrow="Step 1 of 3"
                title="Service Selection"
                subtitle="Choose which HR service suites this client is enrolling in. Only relevant sections will be included in the questionnaire and project plan."
              />

              <div className="flex-1 px-4 md:px-10 py-5 md:py-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
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
                        <div
                          className="absolute top-4 right-4 w-5 h-5 rounded-full flex items-center justify-center transition-all"
                          style={{
                            background: sel ? "var(--blue)" : "transparent",
                            border: sel ? "2px solid var(--blue)" : "2px solid #cbd5e0",
                          }}
                        >
                          {sel && <CheckCircleIcon size={12} color="white" />}
                        </div>
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

              <FooterNav onBack={() => goTo("welcome")} onNext={() => goTo("client-details")} />
            </div>
          )}

          {/* ── CLIENT DETAILS ── */}
          {view === "client-details" && (
            <div className="flex flex-col flex-1">
              <ClientDetails
                clientName={clientName} setClientName={setClientName}
                paycomClientCode={paycomClientCode} setPaycomClientCode={setPaycomClientCode}
                hcmPlatform={hcmPlatform} setHcmPlatform={setHcmPlatform}
                industry={industry} setIndustry={setIndustry}
                employeeCount={employeeCount} setEmployeeCount={setEmployeeCount}
                goLiveDate={goLiveDate} setGoLiveDate={setGoLiveDate}
                contractStartDate={contractStartDate} setContractStartDate={setContractStartDate}
                assignedConsultantId={assignedConsultantId} setAssignedConsultantId={setAssignedConsultantId}
                implementationPhase={implementationPhase} setImplementationPhase={setImplementationPhase}
                internalNotes={internalNotes} setInternalNotes={setInternalNotes}
              />
              <FooterNav onBack={() => goTo("services")} onNext={() => goTo("q-general")} />
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
                <PageHeader
                  eyebrow={meta.eyebrow}
                  title={meta.title}
                  subtitle={meta.subtitle}
                  icon={<SectionIcon sectionKey={sk} size={20} color="var(--teal)" />}
                  progress={stepNum > 0 ? { current: stepNum, total: totalSteps } : undefined}
                />

                {isOptional && (
                  <div
                    className="mx-4 md:mx-10 mt-5 rounded-xl border px-4 py-3 flex gap-3 text-sm"
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

                <div className="px-4 md:px-10 py-4 md:py-6 flex-1">
                  {qs.map((q) => {
                    const isNewSub = q.sub !== lastSub;
                    if (isNewSub) lastSub = q.sub;
                    const hasAnswer = !!answers[q.key]?.trim();

                    return (
                      <div key={q.key}>
                        {isNewSub && (
                          <div className="flex items-center gap-2 mt-8 mb-4">
                            <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                            <span
                              className="text-[10px] font-bold tracking-widest uppercase px-3"
                              style={{ color: "var(--blue)", whiteSpace: "nowrap" }}
                            >
                              {q.sub}
                            </span>
                            <div className="h-px flex-1" style={{ background: "var(--border)" }} />
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
            <div className="flex items-center justify-center flex-1 px-4 md:px-10 py-8 md:py-16">
              <div
                className="bg-white rounded-2xl border shadow-lg p-5 md:p-10 max-w-lg w-full"
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

                    <div
                      className="rounded-xl border mb-6 overflow-hidden"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {[
                        ["Client", clientName || answers["co_name"] || "Not entered"],
                        ["Paycom Code", paycomClientCode || "—"],
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
                                ? <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--teal)" }} />
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
              {/* Print header — only visible when printing */}
              <div className="hidden print-header">
                <h1>{submission.client_name}</h1>
                <p>
                  {submission.paycom_client_code ? `Paycom Code: ${submission.paycom_client_code} · ` : ""}
                  Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>

              {/* Plan header */}
              <div
                className="px-4 md:px-8 py-4 md:py-5 bg-white border-b print-hide"
                style={{ borderColor: "var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    <div
                      className="text-[10px] font-bold tracking-widest uppercase mb-1"
                      style={{ color: "var(--teal)" }}
                    >
                      Project Plan
                    </div>
                    <h2 className="text-xl font-bold" style={{ color: "var(--blue)" }}>
                      {submission.client_name}
                      {submission.paycom_client_code && (
                        <span className="text-sm font-normal text-gray-400 ml-2">
                          ({submission.paycom_client_code})
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Generated {new Date(submission.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}{Object.values(submission.plan_data).flat().length} action items
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                        Progress
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 md:w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
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
                      onClick={handlePdfExport}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all border border-gray-200 whitespace-nowrap"
                      title="Export PDF"
                    >
                      <PrintIcon size={13} color="currentColor" />
                      Export PDF
                    </button>
                    <button
                      onClick={resetAll}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all border border-gray-200 whitespace-nowrap"
                    >
                      + New
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
              <div className="flex-1 overflow-auto px-3 md:px-8 py-4 md:py-6">
                <PlanTable
                  rows={submission.plan_data[activeTab] || []}
                  tabName={activeTab}
                  saving={saving}
                  onUpdate={updateRow}
                  teamUsers={teamUsers}
                />
              </div>
            </div>
          )}

          {/* ── CLIENTS LIST ── */}
          {view === "clients" && (
            <div className="flex-1 px-4 md:px-10 py-6 md:py-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clients.map((c) => {
                    const consultant = getConsultantName(c.assigned_consultant_id);
                    const phase = c.implementation_phase || "Discovery";
                    const phaseColor = PHASE_COLORS[phase] || PHASE_COLORS["Discovery"];
                    const planData = c.plan_data || {};
                    const allRows = Object.values(planData).flat();
                    const totalRows = allRows.length;
                    const completeRows = allRows.filter((r: PlanRow) => r.status === "Complete").length;
                    const progressPctClient = totalRows > 0 ? Math.round((completeRows / totalRows) * 100) : 0;
                    const overdueCount = getOverdueCount(planData);

                    return (
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
                        {/* Client name + Paycom code */}
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <div
                              className="font-semibold text-sm group-hover:underline"
                              style={{ color: "var(--blue)" }}
                            >
                              {c.client_name}
                            </div>
                            {c.paycom_client_code && (
                              <div className="text-[10px] text-gray-400 font-mono">
                                {c.paycom_client_code}
                              </div>
                            )}
                          </div>
                          {/* Phase badge */}
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                            style={{ background: phaseColor.bg, color: phaseColor.text, border: `1px solid ${phaseColor.border}` }}
                          >
                            {phase}
                          </span>
                        </div>

                        {/* Assigned consultant */}
                        {consultant && (
                          <div className="flex items-center gap-1.5 mt-2 mb-2">
                            <UserAvatar name={consultant.full_name} color={consultant.avatar_color} size={18} />
                            <span className="text-xs text-gray-500">{consultant.full_name}</span>
                          </div>
                        )}

                        {/* Go-live date */}
                        {c.go_live_date && (
                          <div className="text-xs text-gray-400 mb-2">
                            Go-live: {new Date(c.go_live_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                        )}

                        {/* Progress bar */}
                        {totalRows > 0 && (
                          <div className="mb-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-gray-400">Progress</span>
                              <span className="text-[10px] font-semibold tabular-nums" style={{ color: "var(--blue)" }}>
                                {progressPctClient}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full calibrate-gradient"
                                style={{ width: `${progressPctClient}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Overdue badge + date */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-gray-400">
                            {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                          {overdueCount > 0 && (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}
                            >
                              {overdueCount} Overdue
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
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
  rows, saving, onUpdate, teamUsers,
}: {
  rows: PlanRow[];
  tabName: string;
  saving: Record<string, boolean>;
  onUpdate: (id: string, field: keyof PlanRow, value: string) => void;
  teamUsers: TeamUser[];
}) {
  let lastSvcLine = "";
  const today = new Date().toISOString().split("T")[0];

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
        const isOverdue = row.due_date && row.due_date < today && row.status !== "Complete";
        const assignedUser = teamUsers.find((u) => u.id === row.assigned_user_id);

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
              className="bg-white rounded-xl border p-5 transition-all hover:shadow-sm plan-row-card"
              style={{
                borderColor: "var(--border)",
                borderLeft: isOverdue ? "3px solid #ef4444" : undefined,
              }}
            >
              <div className="flex items-start gap-5">
                {/* Status select */}
                <div className="shrink-0 pt-0.5">
                  <div className="flex items-center gap-2">
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
                    {isOverdue && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}
                      >
                        Overdue
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm mb-3" style={{ color: "var(--blue)" }}>
                    {row.task}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
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

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {/* Assignee dropdown */}
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: "var(--text-light)" }}
                      >
                        Owner
                      </span>
                      <div className="flex items-center gap-1.5">
                        {assignedUser && (
                          <UserAvatar name={assignedUser.full_name} color={assignedUser.avatar_color} size={20} />
                        )}
                        <select
                          value={row.assigned_user_id || ""}
                          onChange={(e) => onUpdate(row.id, "assigned_user_id", e.target.value)}
                          className="text-xs px-2.5 py-1 rounded-lg border bg-gray-50 outline-none focus:bg-white w-36 transition-all"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <option value="">Unassigned</option>
                          {teamUsers.map((u) => (
                            <option key={u.id} value={u.id}>{u.full_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {/* Due Date */}
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: "var(--text-light)" }}
                      >
                        Due Date
                      </span>
                      <input
                        type="date"
                        value={row.due_date || ""}
                        onChange={(e) => onUpdate(row.id, "due_date", e.target.value)}
                        className="text-xs px-2.5 py-1 rounded-lg border bg-gray-50 outline-none focus:bg-white transition-all"
                        style={{
                          borderColor: isOverdue ? "#fecaca" : "var(--border)",
                          color: isOverdue ? "#b91c1c" : undefined,
                        }}
                      />
                    </div>
                    {/* Legacy target date (read-only display if exists) */}
                    {row.target_date && (
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-semibold uppercase tracking-widest"
                          style={{ color: "var(--text-light)" }}
                        >
                          Target
                        </span>
                        <span className="text-xs text-gray-500">{row.target_date}</span>
                      </div>
                    )}
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
      className="px-4 md:px-10 py-4 md:py-6 bg-white border-b sticky top-0 z-10"
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
      className="flex items-center gap-3 px-4 md:px-10 py-4 bg-white border-t shrink-0 print-hide"
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
