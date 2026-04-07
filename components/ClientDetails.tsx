"use client";

import { useEffect, useState } from "react";
import { HCM_PLATFORMS, IMPLEMENTATION_PHASES, type TeamUser } from "@/lib/data";
import { BuildingIcon } from "@/components/icons";

interface ClientDetailsProps {
  clientName: string;
  setClientName: (v: string) => void;
  paycomClientCode: string;
  setPaycomClientCode: (v: string) => void;
  hcmPlatform: string;
  setHcmPlatform: (v: string) => void;
  industry: string;
  setIndustry: (v: string) => void;
  employeeCount: string;
  setEmployeeCount: (v: string) => void;
  goLiveDate: string;
  setGoLiveDate: (v: string) => void;
  contractStartDate: string;
  setContractStartDate: (v: string) => void;
  assignedConsultantId: string;
  setAssignedConsultantId: (v: string) => void;
  implementationPhase: string;
  setImplementationPhase: (v: string) => void;
  internalNotes: string;
  setInternalNotes: (v: string) => void;
}

export default function ClientDetails(props: ClientDetailsProps) {
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTeamUsers(data); })
      .catch(() => {});
  }, []);

  const fieldClass = "w-full px-3 py-2.5 rounded-lg border text-sm outline-none bg-gray-50 focus:bg-white transition-all";
  const fieldStyle = { borderColor: "var(--border)" };
  const labelClass = "block text-xs font-semibold uppercase tracking-widest mb-1.5";
  const labelStyle = { color: "var(--text-light)" };

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div
        className="px-4 md:px-10 py-4 md:py-6 bg-white border-b sticky top-0 z-10"
        style={{ borderColor: "var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "var(--teal-pale)" }}
          >
            <BuildingIcon size={20} color="var(--teal)" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "var(--teal)" }}>
              Client Setup
            </div>
            <h2 className="text-xl font-bold leading-tight" style={{ color: "var(--blue)" }}>
              Client Details
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter key client information before proceeding to the questionnaire.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-10 py-4 md:py-8 flex-1">
        <div className="max-w-3xl space-y-6">
          {/* Row 1: Client Name + Paycom Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={labelStyle}>Client Name *</label>
              <input
                type="text"
                value={props.clientName}
                onChange={(e) => props.setClientName(e.target.value)}
                placeholder="e.g. Renew Wellness Brands"
                className={fieldClass}
                style={fieldStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Paycom Client Code</label>
              <input
                type="text"
                value={props.paycomClientCode}
                onChange={(e) => props.setPaycomClientCode(e.target.value)}
                placeholder="e.g. RWB-2026"
                className={fieldClass}
                style={fieldStyle}
              />
            </div>
          </div>

          {/* Row 2: HCM Platform + Industry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={labelStyle}>HCM Platform</label>
              <select
                value={props.hcmPlatform}
                onChange={(e) => props.setHcmPlatform(e.target.value)}
                className={fieldClass}
                style={fieldStyle}
              >
                <option value="">Select platform…</option>
                {HCM_PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Industry</label>
              <input
                type="text"
                value={props.industry}
                onChange={(e) => props.setIndustry(e.target.value)}
                placeholder="e.g. Healthcare, Manufacturing"
                className={fieldClass}
                style={fieldStyle}
              />
            </div>
          </div>

          {/* Row 3: Employee Count + Implementation Phase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={labelStyle}>Employee Count</label>
              <input
                type="number"
                value={props.employeeCount}
                onChange={(e) => props.setEmployeeCount(e.target.value)}
                placeholder="e.g. 250"
                className={fieldClass}
                style={fieldStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Implementation Phase</label>
              <select
                value={props.implementationPhase}
                onChange={(e) => props.setImplementationPhase(e.target.value)}
                className={fieldClass}
                style={fieldStyle}
              >
                {IMPLEMENTATION_PHASES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Go-Live Date + Contract Start Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={labelStyle}>Go-Live Date</label>
              <input
                type="date"
                value={props.goLiveDate}
                onChange={(e) => props.setGoLiveDate(e.target.value)}
                className={fieldClass}
                style={fieldStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Contract Start Date</label>
              <input
                type="date"
                value={props.contractStartDate}
                onChange={(e) => props.setContractStartDate(e.target.value)}
                className={fieldClass}
                style={fieldStyle}
              />
            </div>
          </div>

          {/* Assigned Consultant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={labelStyle}>Assigned Consultant</label>
              <select
                value={props.assignedConsultantId}
                onChange={(e) => props.setAssignedConsultantId(e.target.value)}
                className={fieldClass}
                style={fieldStyle}
              >
                <option value="">Unassigned</option>
                {teamUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className={labelClass} style={labelStyle}>Internal Notes</label>
            <textarea
              value={props.internalNotes}
              onChange={(e) => props.setInternalNotes(e.target.value)}
              placeholder="Any internal notes about this client onboarding…"
              rows={4}
              className={fieldClass + " resize-y"}
              style={{ ...fieldStyle, minHeight: 100 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
