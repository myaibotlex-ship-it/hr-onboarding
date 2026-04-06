import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { QUESTIONS, SERVICES, SERVICE_TAB_NAMES } from "@/lib/data";

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const { answers, selectedServices, clientName } = await req.json();

    const clientLabel = clientName || answers["co_name"] || "Client";
    const peoActive = QUESTIONS.peo.some((q: { key: string }) => answers[q.key]?.trim());

    const activeSvcIds: string[] = [...selectedServices];
    if (peoActive && !activeSvcIds.includes("peo")) activeSvcIds.push("peo");

    const svcNames = activeSvcIds
      .map((id: string) => SERVICES.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join(", ");

    // Build answer block — only include sections relevant to selected services
    const sectionMap: Record<string, string> = {
      general: "All Services",
      payroll: "Payroll Administration",
      hrcomp: "HR Compliance & Risk Mgmt.",
      talent: "Talent Management",
      rewards: "Total Rewards",
      acq: "Talent Acquisition",
      peo: "PEO Transition",
    };

    const answerLines: string[] = [];
    Object.keys(QUESTIONS).forEach((section) => {
      if (section !== "general" && !activeSvcIds.some((id: string) => {
        if (section === "payroll") return id === "payroll";
        if (section === "hrcomp") return id === "hrcomp";
        if (section === "talent") return id === "talent";
        if (section === "rewards") return id === "rewards";
        if (section === "acq") return id === "acq";
        if (section === "peo") return id === "peo";
        return false;
      })) return;
      answerLines.push(`\n[${sectionMap[section] || section}]`);
      QUESTIONS[section].forEach((q: { q: string; key: string }) => {
        const val = answers[q.key];
        if (val?.trim()) {
          answerLines.push(`Q: ${q.q}\nA: ${val}`);
        }
      });
    });

    const tabInstructions = activeSvcIds
      .filter((id: string) => id !== "general")
      .map((id: string) => `- "${SERVICE_TAB_NAMES[id] || id}"`)
      .join("\n");

    const prompt = `You are a senior HR consultant at Calibrate HCM building a client project plan for a new HR services engagement.

CLIENT: ${clientLabel}
SERVICES ENROLLED: ${svcNames}

QUESTIONNAIRE ANSWERS:
${answerLines.join("\n")}

Generate a project plan JSON object. Create an entry for each service tab listed below:
${tabInstructions}

Each tab maps to an array of project plan rows. Each row must have:
- "id": unique string like "row_001", "row_002" etc (sequential across all tabs)
- "service_line": category/section grouping within this tab (e.g. "Payroll Processing", "Tax Compliance")
- "task": specific associated task name (concise, 3-8 words)
- "current_state": what the client told us — be specific, reference actual answers. If blank: "Not yet confirmed — gather at kickoff"
- "goal": concrete, actionable next step tailored to their situation (not generic)
- "owner": leave empty string ""
- "target_date": leave empty string ""
- "status": "Not Started"
- "notes": brief flags, risks, or follow-up items (1-2 sentences max, empty string if none)

Rules:
1. Use actual client answers — don't fabricate specifics not in the data
2. Generate 8-14 rows per tab
3. Group rows by service_line within each tab (3-6 rows per service_line group)
4. Goals must be actionable — "Do X so that Y" not "Evaluate and consider"
5. Flag real compliance risks in notes (multi-state, CA law, garnishments, etc.)
6. Return ONLY valid JSON — no markdown, no explanation, no code fences

Output format:
{
  "Payroll Administration": [
    {"id":"row_001","service_line":"...","task":"...","current_state":"...","goal":"...","owner":"","target_date":"","status":"Not Started","notes":""}
  ]
}`;

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .map((b) => ("text" in b ? b.text : ""))
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    const planData = JSON.parse(text);

    return NextResponse.json({ planData, clientLabel, peoActive });
  } catch (err: unknown) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
