import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import Anthropic from "@anthropic-ai/sdk";

interface CategorySummary {
  name: string;
  icon: string;
  total: number;
  percentage: number;
}

interface MonthSummary {
  label: string;
  total: number;
}

interface CoachRequest {
  period: string;
  expensesByCategory: CategorySummary[];
  expensesByMonth: MonthSummary[];
  summary: { totalExpense: number; totalIncome: number };
}

interface CoachResponse {
  healthScore: number;
  scoreExplanation: string;
  tips: string[];
  positiveObservation: string;
}

function buildPrompt(data: CoachRequest): string {
  const { period, expensesByCategory, expensesByMonth, summary } = data;

  const periodLabel: Record<string, string> = {
    current_month: "luna curentă",
    last_3_months: "ultimele 3 luni",
    last_6_months: "ultimele 6 luni",
    all: "toată perioada disponibilă",
  };

  const balance = summary.totalIncome - summary.totalExpense;
  const savingsRate =
    summary.totalIncome > 0
      ? ((balance / summary.totalIncome) * 100).toFixed(1)
      : "N/A";

  const categoryLines = expensesByCategory
    .map((c) => `  - ${c.icon} ${c.name}: ${c.total.toFixed(2)} RON (${c.percentage.toFixed(1)}%)`)
    .join("\n");

  const monthLines = expensesByMonth
    .map((m) => `  - ${m.label}: ${m.total.toFixed(2)} RON`)
    .join("\n");

  return `Ești un coach financiar personal pentru un utilizator român. Analizează DOAR datele agregate de mai jos și oferă feedback util și personalizat.

PERIOADĂ ANALIZATĂ: ${periodLabel[period] ?? period}

REZUMAT FINANCIAR:
- Total cheltuieli: ${summary.totalExpense.toFixed(2)} RON
- Total venituri: ${summary.totalIncome.toFixed(2)} RON
- Balanță: ${balance.toFixed(2)} RON
- Rată de economisire: ${savingsRate}%

CHELTUIELI PE CATEGORII:
${categoryLines || "  (nicio cheltuială înregistrată)"}

TREND LUNAR:
${monthLines || "  (date insuficiente)"}

Răspunde STRICT în format JSON valid, fără text în afara JSON-ului:
{
  "healthScore": <număr între 0 și 100>,
  "scoreExplanation": "<explicație scurtă a scorului, 1-2 propoziții, în română>",
  "tips": [
    "<sfat personalizat 1, bazat pe datele reale>",
    "<sfat personalizat 2>",
    "<sfat personalizat 3>"
  ],
  "positiveObservation": "<un lucru pozitiv observat în comportamentul financiar, în română>"
}

Criterii pentru healthScore:
- 80-100: balanță pozitivă, cheltuieli diversificate sănătos, rată economisire >20%
- 60-79: balanță pozitivă sau neutră, câteva categorii dominante
- 40-59: balanță negativă sau rată economisire mică
- 0-39: cheltuieli depășesc veniturile semnificativ sau date insuficiente

Sfaturile trebuie să fie concrete, bazate pe categoriile specifice din date, în română.`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const body: CoachRequest = await request.json();

    const { expensesByCategory, expensesByMonth, summary, period } = body;
    if (!period || !summary) {
      return NextResponse.json({ error: "Date lipsă" }, { status: 400 });
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: buildPrompt({ period, expensesByCategory, expensesByMonth, summary }),
        },
      ],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let coachData: CoachResponse;
    try {
      // Extract JSON even if Claude adds markdown code fences
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      coachData = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("[AI-COACH] Failed to parse Claude response:", rawText);
      return NextResponse.json(
        { error: "Răspuns invalid de la AI" },
        { status: 500 }
      );
    }

    return NextResponse.json(coachData);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[AI-COACH] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
