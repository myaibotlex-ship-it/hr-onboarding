import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { clientName, answers, selectedServices, planData } = await req.json();

    const { data, error } = await supabase
      .from("hr_onboarding_submissions")
      .insert({
        client_name: clientName || answers?.co_name || "Unknown",
        answers,
        selected_services: selectedServices,
        plan_data: planData,
      })
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
    const { data, error } = await supabase
      .from("hr_onboarding_submissions")
      .select("id, client_name, selected_services, created_at")
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
