export interface Question {
  sub: string;
  q: string;
  key: string;
}

export interface Service {
  id: string;
  iconId: string;
  name: string;
  desc: string;
}

export interface PlanRow {
  id: string;
  service_line: string;
  task: string;
  current_state: string;
  goal: string;
  owner: string;
  target_date: string;
  status: "Not Started" | "In Progress" | "Complete" | "Blocked";
  notes: string;
  assigned_user_id?: string;
  due_date?: string;
}

export interface Submission {
  id: string;
  client_name: string;
  answers: Record<string, string>;
  selected_services: string[];
  plan_data: Record<string, PlanRow[]>;
  created_at: string;
  paycom_client_code?: string;
  go_live_date?: string;
  contract_start_date?: string;
  hcm_platform?: string;
  industry?: string;
  employee_count?: number;
  implementation_phase?: string;
  assigned_consultant_id?: string;
  internal_notes?: string;
}

export interface TeamUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "consultant";
  avatar_color: string;
}

export const HCM_PLATFORMS = ["Paycom", "Paylocity", "ADP", "UKG", "Ceridian", "Other"] as const;
export const IMPLEMENTATION_PHASES = ["Discovery", "Active", "Complete", "On Hold"] as const;

export const PHASE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Discovery": { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  "Active":    { bg: "#e8f7f9", text: "#0e7490", border: "#a5f3fc" },
  "Complete":  { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  "On Hold":   { bg: "#f3f4f6", text: "#6b7280", border: "#d1d5db" },
};

export const SERVICES: Service[] = [
  { id: "payroll",  iconId: "payroll",     name: "Payroll Administration",       desc: "Payroll processing, tax compliance, GL" },
  { id: "hrcomp",  iconId: "compliance",  name: "HR Compliance & Risk Mgmt.",   desc: "Handbook, I-9, leave, OSHA, M&A" },
  { id: "talent",  iconId: "talent",      name: "Talent Management",            desc: "Performance, training, succession" },
  { id: "rewards", iconId: "benefits",    name: "Total Rewards",                 desc: "Compensation & benefits" },
  { id: "acq",     iconId: "acquisition", name: "Talent Acquisition",           desc: "Recruiting & onboarding" },
  { id: "engage",  iconId: "engage",      name: "Employee Engagement",          desc: "Culture, recognition, communication" },
  { id: "peo",     iconId: "peo",         name: "PEO Transition",               desc: "Transitioning off a PEO" },
];

export const SERVICE_TAB_NAMES: Record<string, string> = {
  payroll: "Payroll Administration",
  hrcomp: "HR Compliance & Risk Mgmt.",
  talent: "Talent Management",
  rewards: "Total Rewards",
  acq: "Talent Acquisition",
  engage: "Employee Engagement",
  peo: "PEO Transition",
};

export const QUESTIONS: Record<string, Question[]> = {
  general: [
    { sub: "Company Profile", q: "Company Legal Name (also DBA, if applicable):", key: "co_name" },
    { sub: "Company Profile", q: "How many total active employees does your company have?", key: "ee_count" },
    { sub: "Company Profile", q: "Which states do your employees work in?", key: "ee_states" },
    { sub: "Company Profile", q: "Which states do you have physical office locations?", key: "office_states" },
    { sub: "Company Profile", q: "Who are the primary points of contact?", key: "poc" },
  ],
  payroll: [
    { sub: "Payroll Processing", q: "How many employees are on payroll?", key: "pr_ee_count" },
    { sub: "Payroll Processing", q: "How frequently do you process payroll?", key: "pr_frequency" },
    { sub: "Payroll Processing", q: "How many EINs or business entities require separate payrolls?", key: "pr_eins" },
    { sub: "Payroll Processing", q: "Are hourly and salaried employees on the same pay period? Provide context.", key: "pr_ee_types" },
    { sub: "Payroll Processing", q: "Do you process in arrears? If so, provide context.", key: "pr_arrears" },
    { sub: "Payroll Processing", q: "Will you use a system (e.g. Paycom) for timekeeping and time-off requests?", key: "pr_timekeeping" },
    { sub: "Payroll Processing", q: "Are hourly employees required to take an unpaid lunch break? How long?", key: "pr_breaks" },
    { sub: "Payroll Processing", q: "Do you have employees with multiple pay rates, job codes, or shift differentials? Context.", key: "pr_rates" },
    { sub: "Payroll Processing", q: "Do you pay bonuses, commissions, or variable compensation? Provide context.", key: "pr_bonuses" },
    { sub: "Payroll Processing", q: "Do you process off-cycle or manual checks? Provide context.", key: "pr_manual" },
    { sub: "Payroll Processing", q: "What kinds of pre-tax or post-tax deductions do you currently utilize?", key: "pr_deductions" },
    { sub: "Payroll Processing", q: "Who currently reviews and approves payroll before submission?", key: "pr_approver" },
    { sub: "Wage Garnishments", q: "Do you have employees with active garnishment orders? If so, how are they managed?", key: "pr_garnish" },
    { sub: "Tax Compliance", q: "Which states do you currently pay employer taxes?", key: "pr_tax_states" },
    { sub: "Tax Compliance", q: "Are you looking to expand into any new states within the next 30 days?", key: "pr_new_states" },
    { sub: "GL Mapping / Posting", q: "What is your current process for GL reporting?", key: "pr_gl" },
    { sub: "GL Mapping / Posting", q: "Will you be using the GL report from your payroll system?", key: "pr_gl_system" },
    { sub: "Employee Payroll Inquiries", q: "How do employees currently notify you of payroll questions?", key: "pr_inquiries" },
  ],
  hrcomp: [
    { sub: "Handbook & Policy", q: "Do you have an employee handbook? If yes, when was it last updated?", key: "hb_exists" },
    { sub: "Handbook & Policy", q: "Do you have any company policies that exist outside the handbook? If yes, provide details.", key: "hb_outside" },
    { sub: "Handbook & Policy", q: "Do employees work in states outside your company's operational states? Provide context.", key: "hb_remote_states" },
    { sub: "Labor Law Compliance", q: "Do you have concerns with FLSA classifications for your exempt positions?", key: "ll_flsa" },
    { sub: "Labor Law Compliance", q: "How do you currently handle ADA accommodation requests?", key: "ll_ada" },
    { sub: "Labor Law Compliance", q: "Do you report the EEO-1? (Required if 100+ employees.)", key: "ll_eeo" },
    { sub: "I-9 & Work Authorizations", q: "How do you currently manage I-9 completion?", key: "i9_process" },
    { sub: "I-9 & Work Authorizations", q: "How do you verify ID documents?", key: "i9_verify" },
    { sub: "I-9 & Work Authorizations", q: "Do you currently utilize E-Verify?", key: "i9_everify" },
    { sub: "Harassment & Discrimination", q: "Do you provide harassment/discrimination training on hire and/or ongoing?", key: "hd_training" },
    { sub: "Harassment & Discrimination", q: "Have you had previous claims of harassment or discrimination? Provide context.", key: "hd_claims" },
    { sub: "Harassment & Discrimination", q: "How are employees instructed to report these types of claims?", key: "hd_reporting" },
    { sub: "Harassment & Discrimination", q: "How do you currently handle investigation, documentation, and communication?", key: "hd_investigation" },
    { sub: "Terminations & RIF", q: "How are involuntary terminations currently handled?", key: "term_process" },
    { sub: "Leave Administration", q: "What is your current process for tracking leave requests?", key: "leave_tracking" },
    { sub: "Leave Administration", q: "Does your company carry 3rd-party, state-equivalent coverage for paid leave?", key: "leave_3rdparty" },
    { sub: "Unemployment Claims", q: "How do you currently track unemployment claims?", key: "ui_tracking" },
    { sub: "Unemployment Claims", q: "How many claims did you receive over the last year?", key: "ui_count" },
    { sub: "Unemployment Claims", q: "Are you registered for SUTA with each worked-in state?", key: "ui_suta" },
    { sub: "Unemployment Claims", q: "Does your company maintain prompt disciplinary and termination documentation?", key: "ui_docs" },
    { sub: "OSHA, Safety & Workers Comp.", q: "How do you currently track workplace injuries / incidents?", key: "osha_tracking" },
    { sub: "OSHA, Safety & Workers Comp.", q: "Does your company carry Workers' Comp. Insurance? 3rd party or state-sponsored?", key: "osha_wc" },
    { sub: "OSHA, Safety & Workers Comp.", q: "How are employees trained on safety and reporting unsafe conditions?", key: "osha_training" },
    { sub: "Mergers & Acquisitions", q: "Has your company participated in a merger or acquisition since inception?", key: "ma_history" },
    { sub: "Mergers & Acquisitions", q: "Are there any mergers or acquisitions coming up?", key: "ma_upcoming" },
    { sub: "Mergers & Acquisitions", q: "How do you plan to evaluate the total rewards of any incoming company?", key: "ma_rewards" },
  ],
  talent: [
    { sub: "Employee Relations", q: "How do you currently handle employee grievances/conflicts?", key: "er_grievances" },
    { sub: "Employee Relations", q: "How do you currently handle performance and disciplinary issues?", key: "er_discipline" },
    { sub: "Performance Management", q: "Does your company have a history of conducting performance reviews? Provide context.", key: "pm_history" },
    { sub: "Performance Management", q: "Has your company used Key Performance Indicators within specific job functions?", key: "pm_kpi" },
    { sub: "Performance Management", q: "How does your company track each employee's ongoing performance?", key: "pm_tracking" },
    { sub: "Training & Development", q: "What training currently exists for employees, voluntary or required?", key: "td_existing" },
    { sub: "Training & Development", q: "Do you provide cross-training or upskilling opportunities? Provide context.", key: "td_cross" },
    { sub: "Training & Development", q: "What specific areas could benefit most from improved training?", key: "td_gaps" },
    { sub: "Succession Planning", q: "How does your company identify high-potential employees for leadership?", key: "sp_identify" },
    { sub: "Succession Planning", q: "How does your company prepare employees for higher-level positions?", key: "sp_prepare" },
    { sub: "Succession Planning", q: "Does your company have career progression paths in place? Provide context.", key: "sp_paths" },
  ],
  rewards: [
    { sub: "Compensation", q: "How do you ensure compensation competitiveness within your labor market?", key: "comp_market" },
    { sub: "Compensation", q: "How do you track pay equity across positions and management levels?", key: "comp_equity" },
    { sub: "Benefits Administration", q: "Do you have a current benefit broker? Who?", key: "ben_broker" },
    { sub: "Benefits Administration", q: "What is your plan year?", key: "ben_planyear" },
    { sub: "Benefits Administration", q: "What are your open enrollment dates?", key: "ben_oe" },
    { sub: "Benefits Administration", q: "How many benefit-eligible employees do you have?", key: "ben_eligible" },
    { sub: "Benefits Administration", q: "What plans are currently offered?", key: "ben_plans" },
    { sub: "Benefits Administration", q: "How involved is your broker with enrollment, education, and document creation?", key: "ben_broker_role" },
    { sub: "Benefits Administration", q: "Are you using a benefits administration system (e.g. Paycom BA)?", key: "ben_system" },
    { sub: "Benefits Administration", q: "Will file feeds be used? If not, how are enrollment changes sent to carriers?", key: "ben_feeds" },
    { sub: "Benefits Administration", q: "Will you utilize an ACA compliance tool?", key: "ben_aca" },
    { sub: "Benefits Administration", q: "Will you utilize a COBRA administration tool or service?", key: "ben_cobra" },
    { sub: "Work-Life Balance", q: "Do you currently offer Wellness, EAP, or Employee Discount Programs? Provide context.", key: "wlb_programs" },
  ],
  acq: [
    { sub: "Full-Cycle Recruiting", q: "How do you currently create and maintain employee job descriptions?", key: "ta_jd" },
    { sub: "Full-Cycle Recruiting", q: "How do you currently advertise job openings?", key: "ta_advertise" },
    { sub: "Full-Cycle Recruiting", q: "What does the current hiring process look like?", key: "ta_process" },
    { sub: "Full-Cycle Recruiting", q: "What kind of background check / drug screening do you require?", key: "ta_bgcheck" },
    { sub: "Full-Cycle Recruiting", q: "How do you currently create and distribute offer letters?", key: "ta_offers" },
    { sub: "Executive Search", q: "How do you currently recruit for leadership / executive-level positions?", key: "ta_exec" },
    { sub: "Employer Branding", q: "How do you maintain an employer presence on social media (LinkedIn, Glassdoor, Google)?", key: "ta_brand" },
    { sub: "Skills / Technical Testing", q: "Do you require skills-based or personality testing for new hires? Provide context.", key: "ta_testing" },
    { sub: "Onboarding", q: "What does your current onboarding process look like?", key: "ta_onboard" },
    { sub: "Onboarding", q: "How are you notified of a need to add a new hire?", key: "ta_notify" },
    { sub: "Onboarding", q: "What information is provided to an employee during orientation?", key: "ta_orientation" },
  ],
  peo: [
    { sub: "PEO Profile", q: "Who is your current PEO provider?", key: "peo_provider" },
    { sub: "PEO Profile", q: "What is the PEO termination date?", key: "peo_term_date" },
    { sub: "PEO Profile", q: "What is the reason for leaving the PEO?", key: "peo_reason" },
    { sub: "PEO Profile", q: "What are your main concerns with transitioning off the PEO?", key: "peo_concerns" },
    { sub: "PEO Profile", q: "What is the target go-live date with your new system?", key: "peo_golive" },
    { sub: "PEO Profile", q: "What is the first scheduled check date with the new system?", key: "peo_firstcheck" },
    { sub: "PEO Payroll", q: "How was payroll processed under the PEO?", key: "peo_payroll" },
    { sub: "PEO Payroll", q: "Have you registered for state and local tax accounts outside of the PEO?", key: "peo_tax_reg" },
    { sub: "PEO Benefits", q: "What benefits do you currently offer under the PEO?", key: "peo_benefits" },
    { sub: "PEO Benefits", q: "What is the plan for existing benefits? Keeping or moving to a new broker/carrier?", key: "peo_ben_plan" },
    { sub: "PEO Benefits", q: "Who will administer COBRA post-PEO?", key: "peo_cobra" },
    { sub: "PEO HR Compliance", q: "Who managed I-9 compliance under the PEO?", key: "peo_i9" },
    { sub: "PEO HR Compliance", q: "Was the PEO handling ACA reporting?", key: "peo_aca" },
    { sub: "PEO HR Compliance", q: "Were you under the PEO's SUTA account? Have you established your own?", key: "peo_suta" },
    { sub: "PEO HRIS", q: "Who will manage the new HRIS system internally?", key: "peo_hris" },
  ],
};

export const VIEW_ORDER = [
  "welcome", "services", "client-details", "q-general", "q-payroll", "q-hrcomp",
  "q-talent", "q-rewards", "q-acq", "q-peo", "generate", "plan",
];

export const SECTION_META: Record<string, { title: string; subtitle: string; eyebrow: string }> = {
  general: { eyebrow: "General", title: "Company Overview", subtitle: "Basic information applicable to all service areas." },
  payroll: { eyebrow: "Service Suite", title: "Payroll Administration", subtitle: "Payroll processing, tax compliance, GL mapping, and employee inquiries." },
  hrcomp: { eyebrow: "Service Suite", title: "HR Compliance & Risk Management", subtitle: "Handbook, I-9, harassment, terminations, leave, unemployment, OSHA, and M&A." },
  talent: { eyebrow: "Service Suite", title: "Talent Management", subtitle: "Employee relations, performance management, training, and succession planning." },
  rewards: { eyebrow: "Service Suite", title: "Total Rewards", subtitle: "Compensation, benefits administration, and work-life balance programs." },
  acq: { eyebrow: "Service Suite", title: "Talent Acquisition", subtitle: "Recruiting, onboarding, employer branding, and skills testing." },
  peo: { eyebrow: "Optional", title: "PEO Transition", subtitle: "Only complete if the client is transitioning off a Professional Employer Organization." },
};

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Not Started": { bg: "#f3f4f6", text: "#6b7280", border: "#d1d5db" },
  "In Progress": { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  "Complete":    { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  "Blocked":     { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
};
