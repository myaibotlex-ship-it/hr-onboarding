import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const body = await req.json();
    const {
      clientName, answers, selectedServices, planData,
      paycomClientCode, goLiveDate, contractStartDate,
      hcmPlatform, industry, employeeCount,
      implementationPhase, assignedConsultantId, internalNotes,
    } = body;

    const insertData: Record<string, unknown> = {
      client_name: clientName || answers?.co_name || "Unknown",
      answers,
      selected_services: selectedServices,
      plan_data: planData,
    };

    if (paycomClientCode !== undefined) insertData.paycom_client_code = paycomClientCode;
    if (goLiveDate) insertData.go_live_date = goLiveDate;
    if (contractStartDate) insertData.contract_start_date = contractStartDate;
    if (hcmPlatform) insertData.hcm_platform = hcmPlatform;
    if (industry) insertData.industry = industry;
    if (employeeCount !== undefined) insertData.employee_count = employeeCount ? Number(employeeCount) : null;
    if (implementationPhase) insertData.implementation_phase = implementationPhase;
    if (assignedConsultantId) insertData.assigned_consultant_id = assignedConsultantId;
    if (internalNotes !== undefined) insertData.internal_notes = internalNotes;

    const { data, error } = await supabase
      .from("hr_onboarding_submissions")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id });
  } catch (err: unknown) {
    console.error("Save error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("hr_onboarding_submissions")
      .select("id, client_name, selected_services, created_at, paycom_client_code, go_live_date, implementation_phase, assigned_consultant_id, employee_count, plan_data")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
