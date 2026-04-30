"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";

type Period = "current_month" | "last_3_months" | "last_6_months" | "all";
type ActiveTab = "analysis" | "chat" | "predictions";

interface CategoryData {
  categoryId: string | null;
  name: string;
  icon: string;
  total: number;
  percentage: number;
}

interface MonthData {
  month: string;
  label: string;
  total: number;
}

interface PivotRow {
  month: string;
  label: string;
  year: string;
  expense: number;
  income: number;
  balance: number;
}

interface InsightsData {
  expensesByCategory: CategoryData[];
  expensesByMonth: MonthData[];
  monthlyPivot: PivotRow[];
  summary: { totalExpense: number; totalIncome: number };
}

interface CoachResult {
  healthScore: number;
  scoreExplanation: string;
  tips: string[];
  positiveObservation: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface PredictionData {
  projectedExpense: number;
  avgLast3Months: number;
  currentMonthExpense: number;
  currentMonthIncome: number;
  savingsRate: number;
  isDeficit: boolean;
  topCategories: Array<{ name: string; icon: string; total: number; percentage: number }>;
}

// ─── Utilitare ───────────────────────────────────────────────────────────────

function formatRON(amount: number): string {
  return new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function computePredictions(pivot: PivotRow[], categories: CategoryData[]): PredictionData {
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const currentMonthRow = pivot.find((r) => r.month === currentYearMonth);
  const currentMonthExpense = currentMonthRow?.expense ?? 0;
  const currentMonthIncome = currentMonthRow?.income ?? 0;

  const completedMonths = pivot.filter((r) => r.month < currentYearMonth).slice(-3);
  const avgLast3Months =
    completedMonths.length > 0
      ? completedMonths.reduce((s, r) => s + r.expense, 0) / completedMonths.length
      : 0;

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const projectedExpense =
    dayOfMonth > 0 && currentMonthExpense > 0
      ? (currentMonthExpense / dayOfMonth) * daysInMonth
      : avgLast3Months;

  const totalIncome = pivot.reduce((s, r) => s + r.income, 0);
  const totalExpense = pivot.reduce((s, r) => s + r.expense, 0);
  const savingsRate =
    totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  const isDeficit = currentMonthIncome > 0 && currentMonthExpense > currentMonthIncome;

  const topCategories = categories.slice(0, 3);

  return {
    projectedExpense,
    avgLast3Months,
    currentMonthExpense,
    currentMonthIncome,
    savingsRate,
    isDeficit,
    topCategories,
  };
}

// ─── ScoreRing ────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : score >= 40 ? "#f97316" : "#ef4444";
  const label =
    score >= 80 ? "Excelent" : score >= 60 ? "Bun" : score >= 40 ? "Mediu" : "Necesită atenție";
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r="44" fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="55" cy="55" r="44" fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 55 55)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text x="55" y="50" textAnchor="middle" fontSize="22" fontWeight="700" fill={color}>
          {score}
        </text>
        <text x="55" y="68" textAnchor="middle" fontSize="10" fill="#6b7280">
          / 100
        </text>
      </svg>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

// ─── Tab Analiză AI ───────────────────────────────────────────────────────────

function AnalysisTab({ initialData }: { initialData: InsightsData }) {
  const [period, setPeriod] = useState<Period>("current_month");
  const [data, setData] = useState<InsightsData>(initialData);
  const [dataLoading, setDataLoading] = useState(false);
  const [coach, setCoach] = useState<CoachResult | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  const periodLabels: Record<Period, string> = {
    current_month: "Luna curentă",
    last_3_months: "3 luni",
    last_6_months: "6 luni",
    all: "Tot",
  };

  const changePeriod = async (newPeriod: Period) => {
    if (newPeriod === period) return;
    setPeriod(newPeriod);
    setDataLoading(true);
    setCoach(null);
    try {
      const res = await fetch(`/api/reports?period=${newPeriod}`, { credentials: "include" });
      if (res.ok) setData(await res.json());
    } finally {
      setDataLoading(false);
    }
  };

  const analyzeWithAI = useCallback(async () => {
    setCoachLoading(true);
    setCoachError(null);
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period,
          expensesByCategory: data.expensesByCategory,
          expensesByMonth: data.expensesByMonth,
          summary: data.summary,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCoachError(`Eroare: ${json.error ?? "Eroare server"}`);
        return;
      }
      setCoach(json);
    } catch {
      setCoachError("Nu am putut obține analiza. Încearcă din nou.");
    } finally {
      setCoachLoading(false);
    }
  }, [period, data]);

  const hasData = data.expensesByCategory.length > 0 || data.expensesByMonth.length > 0;

  return (
    <div className="space-y-6">
      {/* Selector perioadă */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(periodLabels) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => changePeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              period === p
                ? "bg-teal-600 text-white shadow"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-teal-50 hover:text-teal-700"
            }`}
          >
            {periodLabels[p]}
          </button>
        ))}
        {dataLoading && <span className="text-sm text-gray-400 self-center ml-2 animate-pulse">Se încarcă...</span>}
      </div>

      {/* Sumar */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total cheltuieli</p>
          <p className="text-2xl font-bold text-red-600">−{formatRON(data.summary.totalExpense)} <span className="text-sm font-normal text-gray-400">RON</span></p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total venituri</p>
          <p className="text-2xl font-bold text-green-600">+{formatRON(data.summary.totalIncome)} <span className="text-sm font-normal text-gray-400">RON</span></p>
        </div>
      </div>

      {/* Stare goală */}
      {!hasData && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-600 font-medium mb-4">Nicio tranzacție pentru perioada selectată</p>
          <a href="/dashboard/upload" className="inline-block bg-teal-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors">
            Încarcă un extras bancar
          </a>
        </div>
      )}

      {/* Buton AI */}
      {hasData && !coach && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-gray-500 text-sm mb-4">Obține o analiză personalizată a situației tale financiare</p>
          <button
            onClick={analyzeWithAI}
            disabled={coachLoading}
            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-md"
          >
            {coachLoading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Claude analizează...
              </span>
            ) : "🤖 Analizează cheltuielile cu AI"}
          </button>
          {coachError && <p className="mt-3 text-red-500 text-sm">{coachError}</p>}
        </div>
      )}

      {/* Rezultat AI */}
      {coach && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Scor financiar</h3>
            <button
              onClick={() => { setCoach(null); analyzeWithAI(); }}
              disabled={coachLoading}
              className="text-xs text-teal-600 hover:text-teal-800 border border-teal-200 px-3 py-1 rounded-lg disabled:opacity-50"
            >
              {coachLoading ? "Se regenerează..." : "↺ Regenerează analiza"}
            </button>
          </div>

          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={coach.healthScore} />
            <p className="text-sm text-gray-600 text-center max-w-md">{coach.scoreExplanation}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-green-800 mb-1">✅ Punct pozitiv</p>
            <p className="text-sm text-green-700">{coach.positiveObservation}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">💡 Sfaturi personalizate</p>
            {coach.tips.map((tip, i) => (
              <div key={i} className="bg-teal-50 border border-teal-100 rounded-xl p-3">
                <p className="text-sm text-teal-800"><span className="font-bold mr-1">{i + 1}.</span>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab Chat ─────────────────────────────────────────────────────────────────

function ChatTab({ initialData }: { initialData: InsightsData }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Bună! Sunt Barista Bot ☕🤖 Întreabă-mă orice despre finanțele tale și îți dau sfaturi personalizate!" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  const sendMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setChatInput("");
    setChatLoading(true);
    setChatError(null);

    const financialContext = {
      summary: initialData.summary,
      topCategories: initialData.expensesByCategory.slice(0, 5),
      period: "toată perioada disponibilă",
    };

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.slice(-10),
          financialContext,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: json.reply }]);
      } else {
        setChatError(json.error ?? "Eroare server");
      }
    } catch {
      setChatError("Eroare de rețea. Încearcă din nou.");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col" style={{ height: "520px" }}>
      {/* Header */}
      <div className="px-5 py-3 bg-teal-600 flex items-center gap-3">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-lg">🤖</div>
        <div>
          <p className="text-white font-semibold text-sm">Barista Bot</p>
          <p className="text-teal-100 text-xs">Asistentul tău financiar personal</p>
        </div>
      </div>

      {/* Mesaje */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5">☕</div>
            )}
            <div
              className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-teal-600 text-white rounded-2xl rounded-br-sm"
                  : "bg-white border border-gray-200 text-gray-700 rounded-2xl rounded-bl-sm shadow-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {chatLoading && (
          <div className="flex justify-start gap-2">
            <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">☕</div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
              <span className="flex gap-1 items-center text-gray-400 text-sm">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
        {chatError && (
          <div className="text-center text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {chatError}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Întreabă ceva despre finanțele tale..."
          disabled={chatLoading}
          className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-200 disabled:bg-gray-50"
        />
        <button
          onClick={sendMessage}
          disabled={chatLoading || !chatInput.trim()}
          className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          Trimite
        </button>
      </div>
    </div>
  );
}

// ─── Tab Predicții ────────────────────────────────────────────────────────────

function PredictionsTab({ initialData }: { initialData: InsightsData }) {
  const predictions = useMemo(
    () => computePredictions(initialData.monthlyPivot, initialData.expensesByCategory),
    [initialData]
  );

  const { projectedExpense, avgLast3Months, currentMonthExpense, savingsRate, isDeficit, topCategories } = predictions;

  const projectionDiff = avgLast3Months > 0 ? ((projectedExpense - avgLast3Months) / avgLast3Months) * 100 : 0;
  const projectionColor = projectionDiff <= 0 ? "text-green-700" : projectionDiff <= 15 ? "text-orange-600" : "text-red-600";
  const projectionBg = projectionDiff <= 0 ? "bg-green-50 border-green-200" : projectionDiff <= 15 ? "bg-orange-50 border-orange-200" : "bg-red-50 border-red-200";

  const savingsColor = savingsRate >= 20 ? "text-green-700" : savingsRate >= 5 ? "text-orange-600" : "text-red-600";
  const savingsBg = savingsRate >= 20 ? "bg-green-50 border-green-200" : savingsRate >= 5 ? "bg-orange-50 border-orange-200" : "bg-red-50 border-red-200";

  const circumference = 2 * Math.PI * 36;
  const savingsOffset = circumference - (Math.min(Math.max(savingsRate, 0), 100) / 100) * circumference;
  const savingsRingColor = savingsRate >= 20 ? "#10b981" : savingsRate >= 5 ? "#f59e0b" : "#ef4444";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Card 1: Proiecție lună curentă */}
      <div className={`rounded-xl border p-5 ${projectionBg}`}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">🔮 Proiecție luna aceasta</p>
        <p className={`text-3xl font-bold font-mono ${projectionColor}`}>
          {formatRON(projectedExpense)} <span className="text-base font-normal text-gray-400">RON</span>
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Realizat până azi: <span className="font-semibold">{formatRON(currentMonthExpense)} RON</span>
        </p>
        {avgLast3Months > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Media ultimelor 3 luni: <span className="font-semibold">{formatRON(avgLast3Months)} RON</span>
            {projectionDiff !== 0 && (
              <span className={`ml-1 font-bold ${projectionColor}`}>
                ({projectionDiff > 0 ? "+" : ""}{projectionDiff.toFixed(1)}%)
              </span>
            )}
          </p>
        )}
      </div>

      {/* Card 2: Alertă deficit */}
      <div className={`rounded-xl border p-5 ${isDeficit ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {isDeficit ? "⚠️ Alertă buget" : "✅ Status buget"}
        </p>
        <p className={`text-lg font-bold ${isDeficit ? "text-red-700" : "text-green-700"}`}>
          {isDeficit ? "Cheltuielile depășesc veniturile luna aceasta!" : "Balanță pozitivă luna aceasta"}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          {isDeficit
            ? "Încearcă să reduci cheltuielile sau să identifici surse suplimentare de venit."
            : "Continuă să menții acest ritm! Economiile sunt pe drumul cel bun."}
        </p>
      </div>

      {/* Card 3: Top categorii */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">📊 Top categorii cheltuieli</p>
        {topCategories.length === 0 ? (
          <p className="text-sm text-gray-400">Nicio cheltuială înregistrată</p>
        ) : (
          <div className="space-y-3">
            {topCategories.map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700">{cat.icon} {cat.name}</span>
                  <span className="text-sm font-semibold text-gray-800">{formatRON(cat.total)} RON</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5 text-right">{cat.percentage.toFixed(1)}% din total</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card 4: Rată economisire */}
      <div className={`rounded-xl border p-5 ${savingsBg}`}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">💰 Rată economisire</p>
        <div className="flex items-center gap-4">
          <svg width="90" height="90" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r="36" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="45" cy="45" r="36" fill="none"
              stroke={savingsRingColor} strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={savingsOffset}
              strokeLinecap="round"
              transform="rotate(-90 45 45)"
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
            <text x="45" y="49" textAnchor="middle" fontSize="16" fontWeight="700" fill={savingsRingColor}>
              {savingsRate.toFixed(0)}%
            </text>
          </svg>
          <div>
            <p className={`text-sm font-semibold ${savingsColor}`}>
              {savingsRate >= 20 ? "Excellent! Peste 20%" : savingsRate >= 5 ? "Aproape de țintă" : "Sub ținta de 5%"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Țintă recomandată: <span className="font-semibold">20%</span></p>
            <p className="text-xs text-gray-500 mt-0.5">
              {savingsRate >= 20
                ? "Continuă! Ești pe drumul cel bun."
                : `Mai ${(20 - savingsRate).toFixed(1)}% până la țintă.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Component principal ──────────────────────────────────────────────────────

export default function AIInsightsClient({ initialData }: { initialData: InsightsData }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("analysis");

  const tabs: { id: ActiveTab; label: string; short: string }[] = [
    { id: "analysis", label: "📊 Analiză AI", short: "📊 Analiză" },
    { id: "chat", label: "☕ Chat Barista Bot", short: "☕ Chat" },
    { id: "predictions", label: "🔮 Predicții & Alerte", short: "🔮 Predicții" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🤖 AI Insights</h1>
        <p className="text-gray-500 text-sm mt-1">Analiză financiară inteligentă bazată pe tranzacțiile tale</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1.5 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-teal-700 shadow-sm font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.short}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "analysis"    && <AnalysisTab initialData={initialData} />}
      {activeTab === "chat"        && <ChatTab initialData={initialData} />}
      {activeTab === "predictions" && <PredictionsTab initialData={initialData} />}
    </div>
  );
}
