import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

// PATCH: update a specific row within a submission's plan_data
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { submissionId, tabName, rowId, updates } = await req.json();

    // Fetch current plan_data
    const { data: submission, error: fetchErr } = await supabase
      .from("hr_onboarding_submissions")
      .select("plan_data")
      .eq("id", submissionId)
      .single();

    if (fetchErr) throw fetchErr;

    const planData = submission.plan_data as Record<string, Array<Record<string, string>>>;
    const tab = planData[tabName];
    if (!tab) throw new Error(`Tab "${tabName}" not found`);

    const rowIdx = tab.findIndex((r) => r.id === rowId);
    if (rowIdx === -1) throw new Error(`Row "${rowId}" not found`);

    planData[tabName][rowIdx] = { ...planData[tabName][rowIdx], ...updates };

    const { error: updateErr } = await supabase
      .from("hr_onboarding_submissions")
      .update({ plan_data: planData, updated_at: new Date().toISOString() })
      .eq("id", submissionId);

    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("Update row error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
