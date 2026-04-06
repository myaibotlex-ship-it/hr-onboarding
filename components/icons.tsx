// Professional SVG icon set for HR Onboarding
// Each icon uses Calibrate brand colors and clean line-art style

type IconProps = {
  className?: string;
  size?: number;
  color?: string;
};

export function CalibrateLogo({ className = "", height = 32 }: { className?: string; height?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/calibrate-logo-dark.png"
      alt="Calibrate HCM"
      height={height}
      style={{ height, width: "auto" }}
      className={className}
    />
  );
}

export function CalibrateLogoWhite({ className = "", height = 32 }: { className?: string; height?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/calibrate-logo-teal.png"
      alt="Calibrate HCM"
      height={height}
      style={{ height, width: "auto", filter: "brightness(0) invert(1)" }}
      className={className}
    />
  );
}

// Payroll & Tax — dollar with circuit lines
export function PayrollIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9v-.5M12 15.5V15M6 12H5M19 12h-1" />
      <path d="M7.5 8.5l-.5-.5M17 15.5l-.5-.5M7.5 15.5l-.5.5M17 8.5l-.5.5" />
    </svg>
  );
}

// HR Compliance — shield with checkmark
export function ComplianceIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2L4 5.5v6c0 4.5 3.3 8.7 8 9.5 4.7-.8 8-5 8-9.5v-6L12 2z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

// Talent & Performance — users with upward arrow
export function TalentIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 19c0-3.3 2.7-6 6-6" />
      <path d="M15 11l4-4m0 0v3m0-3h-3" />
      <path d="M14 17a4 4 0 018 0" />
      <circle cx="18" cy="13" r="2.5" />
    </svg>
  );
}

// Benefits & Rewards — gift / star
export function BenefitsIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="8" width="18" height="13" rx="1.5" />
      <path d="M12 8V21M3 13h18" />
      <path d="M8.5 8C7 8 5.5 7 5.5 5.5S7 3 8.5 4C9.3 4.5 10.5 6 12 8c1.5-2 2.7-3.5 3.5-4C17 3 18.5 4 18.5 5.5S17 8 15.5 8" />
    </svg>
  );
}

// Talent Acquisition — magnifier over person
export function AcquisitionIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="10" cy="10" r="6" />
      <path d="M20 20l-4-4" />
      <circle cx="10" cy="8" r="2" />
      <path d="M6 14c0-2.2 1.8-4 4-4s4 1.8 4 4" />
    </svg>
  );
}

// PEO Transition — arrows cycling
export function PEOIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 12a8 8 0 018-8" />
      <path d="M20 12a8 8 0 01-8 8" />
      <path d="M12 4l2-2-2-2M12 22l-2 2 2 2" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

// Clipboard — for questionnaire steps
export function ClipboardIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

// Chart — for project plan
export function ChartIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 16l3-4 3 3 4-6" />
    </svg>
  );
}

// Users — for clients list
export function UsersIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M21 19c0-2.8-1.8-5-4.5-5.5" />
    </svg>
  );
}

// Spark / AI — for generate step
export function SparkIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2l2 7h7l-5.7 4.1 2.2 7L12 16l-5.5 4.1 2.2-7L3 9h7z" />
    </svg>
  );
}

// Check circle
export function CheckCircleIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

// Info circle — for optional callout
export function InfoIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="8.5" strokeWidth="2" />
      <line x1="12" y1="11" x2="12" y2="16" />
    </svg>
  );
}

// Arrow right — for nav
export function ArrowRightIcon({ size = 16, color = "currentColor", className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

// Employee Engagement — speech bubble with heart
export function EngageIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      <path d="M12 10l-1.5 1.5L9 10a1.5 1.5 0 012.5-1.1A1.5 1.5 0 0115 10l-1.5 1.5L12 10z" />
    </svg>
  );
}

// Section icon mapper — maps SECTION_KEYS to icons
export function SectionIcon({ sectionKey, size = 18, color = "currentColor" }: { sectionKey: string; size?: number; color?: string }) {
  const props = { size, color };
  switch (sectionKey) {
    case "general":  return <BuildingIcon {...props} />;
    case "payroll":  return <PayrollIcon {...props} />;
    case "hrcomp":   return <ComplianceIcon {...props} />;
    case "talent":   return <TalentIcon {...props} />;
    case "rewards":  return <BenefitsIcon {...props} />;
    case "acq":      return <AcquisitionIcon {...props} />;
    case "peo":      return <PEOIcon {...props} />;
    default:         return <ClipboardIcon {...props} />;
  }
}

// Service icon mapper — maps service iconId to component
export function ServiceIcon({ iconId, size = 24, color = "currentColor" }: { iconId: string; size?: number; color?: string }) {
  const props = { size, color };
  switch (iconId) {
    case "payroll":     return <PayrollIcon {...props} />;
    case "compliance":  return <ComplianceIcon {...props} />;
    case "talent":      return <TalentIcon {...props} />;
    case "benefits":    return <BenefitsIcon {...props} />;
    case "acquisition": return <AcquisitionIcon {...props} />;
    case "engage":      return <EngageIcon {...props} />;
    case "peo":         return <PEOIcon {...props} />;
    default:            return <ClipboardIcon {...props} />;
  }
}

// Arrow left — for back nav
export function ArrowLeftIcon({ size = 16, color = "currentColor", className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M13 8H3M7 4L3 8l4 4" />
    </svg>
  );
}

// General / Company — building
export function BuildingIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="1.5" />
      <path d="M9 21V9h6v12M9 9h6M3 9h18" />
      <rect x="10.5" y="13" width="3" height="4" />
    </svg>
  );
}
