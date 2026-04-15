import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import Anthropic from "@anthropic-ai/sdk";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface FinancialContext {
  summary: { totalExpense: number; totalIncome: number };
  topCategories: Array<{ name: string; icon: string; total: number; percentage: number }>;
  period: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  financialContext: FinancialContext;
}

function buildSystemPrompt(ctx: FinancialContext): string {
  const { summary, topCategories, period } = ctx;
  const balance = summary.totalIncome - summary.totalExpense;
  const savingsRate =
    summary.totalIncome > 0
      ? ((balance / summary.totalIncome) * 100).toFixed(1)
      : "N/A";

  const categoryLines = topCategories
    .slice(0, 5)
    .map((c) => `  - ${c.icon} ${c.name}: ${c.total.toFixed(2)} RON (${c.percentage.toFixed(1)}%)`)
    .join("\n");

  return `Ești Barista Bot ☕, asistentul financiar personal al utilizatorului, creat de Vibe Budget.
Ești prietenos, concis și practic — ca un barista care îți dă sfaturi financiare simple și clare.

CONTEXTUL FINANCIAR AL UTILIZATORULUI (${period}):
- Total cheltuieli: ${summary.totalExpense.toFixed(2)} RON
- Total venituri: ${summary.totalIncome.toFixed(2)} RON
- Balanță: ${balance.toFixed(2)} RON
- Rată economisire: ${savingsRate}%

Top categorii cheltuieli:
${categoryLines || "  (nicio cheltuială înregistrată)"}

REGULI STRICTE:
1. Răspunzi DOAR în română.
2. Răspunsurile sunt scurte (max 3-4 propoziții), cu excepția cazului când utilizatorul cere detalii.
3. Folosești datele financiare reale de mai sus pentru a personaliza răspunsurile.
4. Nu inventezi date financiare care nu sunt în context.
5. Ești empatic, nu critic — chiar dacă datele sunt negative.
6. Poți sugera acțiuni concrete (ex: "Setează un buget de X RON pentru Transport").
7. Nu discuți subiecte în afara finanțelor personale.
8. Dacă nu ai date suficiente pentru a răspunde, spune asta sincer și sugerează să încarce mai multe tranzacții.`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const body: ChatRequest = await request.json();
    const { messages, financialContext } = body;

    if (!messages || !financialContext) {
      return NextResponse.json({ error: "Date lipsă" }, { status: 400 });
    }

    // Limitează la ultimele 10 mesaje pentru cost control
    const recentMessages = messages.slice(-10);

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: buildSystemPrompt(financialContext),
      messages: recentMessages,
    });

    const reply =
      message.content[0].type === "text" ? message.content[0].text : "Nu am putut genera un răspuns.";

    return NextResponse.json({ reply });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[AI-CHAT] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
