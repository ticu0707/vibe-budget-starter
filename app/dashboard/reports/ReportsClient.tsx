"use client";

import { useState, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

type Period = "current_month" | "last_3_months" | "last_6_months" | "all";

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

interface ReportsData {
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

interface Props {
  initialData: ReportsData;
  initialPeriod: Period;
}

const COLORS = [
  "#14b8a6", "#f97316", "#8b5cf6", "#ec4899",
  "#06b6d4", "#84cc16", "#f59e0b", "#ef4444",
  "#6366f1", "#10b981",
];

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "current_month", label: "Luna curentă" },
  { value: "last_3_months", label: "3 luni" },
  { value: "last_6_months", label: "6 luni" },
  { value: "all", label: "Tot" },
];

function formatRON(amount: number): string {
  return new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function CustomPieTooltip({ active, payload }: { active?: boolean; payload?: { payload: CategoryData }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-800">{d.icon} {d.name}</p>
      <p className="text-gray-600">{formatRON(d.total)} RON</p>
      <p className="text-gray-400">{d.percentage.toFixed(1)}% din total</p>
    </div>
  );
}

function CustomBarTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="text-teal-700 font-medium">{formatRON(payload[0].value)} RON</p>
    </div>
  );
}

function TrendArrow({ curr, prev }: { curr: number; prev: number }) {
  if (prev === 0) return null;
  const diff = curr - prev;
  const pct = Math.abs((diff / prev) * 100).toFixed(1);
  if (diff > 0) return <span className="text-red-500 text-xs ml-1">↑{pct}%</span>;
  if (diff < 0) return <span className="text-green-500 text-xs ml-1">↓{pct}%</span>;
  return null;
}

function PivotTable({ rows, loading }: { rows: PivotRow[]; loading: boolean }) {
  if (loading) return (
    <div className="bg-white rounded-xl border border-gray-300 p-8 text-center text-gray-400 text-sm animate-pulse">
      Se încarcă tabelul...
    </div>
  );
  if (rows.length === 0) return null;

  const byYear = rows.reduce<Record<string, PivotRow[]>>((acc, row) => {
    (acc[row.year] ??= []).push(row);
    return acc;
  }, {});
  const years = Object.keys(byYear).sort();

  const grandExpense = rows.reduce((s, r) => s + r.expense, 0);
  const grandIncome  = rows.reduce((s, r) => s + r.income, 0);
  const grandBalance = grandIncome - grandExpense;
  const grandRate    = grandIncome > 0 ? ((grandBalance / grandIncome) * 100).toFixed(1) : "—";

  return (
    <div className="bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden">
      {/* Titlu + legendă */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>📋</span>
          <span className="font-bold text-gray-800 text-sm">Raport pivot — Dinamica financiară lunară</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-100 border border-green-400 inline-block" /> Venituri</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-100 border border-red-400 inline-block" /> Cheltuieli</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-400 inline-block" /> Economii</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2.5 text-left font-bold text-gray-700 bg-gray-200 w-36">Perioadă</th>
              <th className="border border-gray-300 px-4 py-2.5 text-right font-bold text-green-800 bg-green-100">Venituri (RON)</th>
              <th className="border border-gray-300 px-4 py-2.5 text-right font-bold text-red-800 bg-red-100">Cheltuieli (RON)</th>
              <th className="border border-gray-300 px-4 py-2.5 text-right font-bold text-blue-800 bg-blue-100">Economii (RON)</th>
              <th className="border border-gray-300 px-4 py-2.5 text-right font-bold text-gray-600 bg-gray-100">Rată ec. %</th>
            </tr>
          </thead>
          <tbody>
            {years.map((year) => {
              const yearRows = byYear[year];
              const yExp  = yearRows.reduce((s, r) => s + r.expense, 0);
              const yInc  = yearRows.reduce((s, r) => s + r.income, 0);
              const yBal  = yInc - yExp;
              const yRate = yInc > 0 ? ((yBal / yInc) * 100).toFixed(1) : "—";

              return (
                <>
                  {/* Header an */}
                  <tr key={`yhdr-${year}`} className="bg-gray-700">
                    <td colSpan={5} className="border border-gray-600 px-4 py-1.5 text-xs font-bold text-white uppercase tracking-widest">
                      {year}
                    </td>
                  </tr>

                  {/* Rânduri luni */}
                  {yearRows.map((row, idx) => {
                    const prev = idx > 0 ? yearRows[idx - 1] : null;
                    const rate = row.income > 0 ? ((row.balance / row.income) * 100).toFixed(1) : "—";
                    const rateNum = rate !== "—" ? Number(rate) : null;
                    return (
                      <tr key={row.month} className={idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"}>
                        <td className="border border-gray-300 px-4 py-2.5 font-semibold text-gray-700 bg-gray-50 capitalize">
                          {row.label}
                        </td>
                        {/* Venituri */}
                        <td className="border border-gray-300 px-4 py-2.5 text-right font-mono bg-green-50">
                          {row.income > 0 ? (
                            <span className="text-green-800 font-semibold">
                              +{formatRON(row.income)}
                              {prev && <TrendArrow curr={row.income} prev={prev.income} />}
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        {/* Cheltuieli */}
                        <td className="border border-gray-300 px-4 py-2.5 text-right font-mono bg-red-50">
                          {row.expense > 0 ? (
                            <span className="text-red-800 font-semibold">
                              −{formatRON(row.expense)}
                              {prev && <TrendArrow curr={row.expense} prev={prev.expense} />}
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        {/* Economii */}
                        <td className={`border border-gray-300 px-4 py-2.5 text-right font-mono ${row.balance >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
                          <span className={`font-semibold ${row.balance >= 0 ? "text-blue-800" : "text-orange-700"}`}>
                            {row.balance >= 0 ? "+" : "−"}{formatRON(Math.abs(row.balance))}
                          </span>
                        </td>
                        {/* Rată */}
                        <td className={`border border-gray-300 px-4 py-2.5 text-right text-xs font-semibold ${
                          rateNum === null ? "text-gray-300 bg-white" :
                          rateNum >= 20   ? "text-green-700 bg-green-50" :
                          rateNum >= 0    ? "text-orange-600 bg-orange-50" :
                                           "text-red-700 bg-red-50"
                        }`}>
                          {rate !== "—" ? `${rate}%` : "—"}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Subtotal an */}
                  <tr key={`ytot-${year}`}>
                    <td className="border border-gray-400 px-4 py-2.5 font-bold text-gray-800 text-xs uppercase tracking-wide bg-gray-200">
                      Total {year}
                    </td>
                    <td className="border border-gray-400 px-4 py-2.5 text-right font-mono font-bold text-green-900 bg-green-100">
                      {yInc > 0 ? `+${formatRON(yInc)}` : "—"}
                    </td>
                    <td className="border border-gray-400 px-4 py-2.5 text-right font-mono font-bold text-red-900 bg-red-100">
                      {yExp > 0 ? `−${formatRON(yExp)}` : "—"}
                    </td>
                    <td className={`border border-gray-400 px-4 py-2.5 text-right font-mono font-bold ${yBal >= 0 ? "text-blue-900 bg-blue-100" : "text-orange-800 bg-orange-100"}`}>
                      {yBal >= 0 ? "+" : "−"}{formatRON(Math.abs(yBal))}
                    </td>
                    <td className={`border border-gray-400 px-4 py-2.5 text-right text-xs font-bold ${
                      yRate === "—" ? "text-gray-400 bg-gray-100" :
                      Number(yRate) >= 20 ? "text-green-800 bg-green-100" :
                      Number(yRate) >= 0  ? "text-orange-700 bg-orange-100" :
                                           "text-red-800 bg-red-100"
                    }`}>
                      {yRate !== "—" ? `${yRate}%` : "—"}
                    </td>
                  </tr>
                </>
              );
            })}

            {/* Grand total */}
            <tr className="bg-gray-900">
              <td className="border border-gray-600 px-4 py-3 font-bold text-white text-xs uppercase tracking-widest">
                TOTAL GENERAL
              </td>
              <td className="border border-gray-600 px-4 py-3 text-right font-mono font-bold text-green-200 bg-green-900/50">
                +{formatRON(grandIncome)}
              </td>
              <td className="border border-gray-600 px-4 py-3 text-right font-mono font-bold text-red-200 bg-red-900/50">
                −{formatRON(grandExpense)}
              </td>
              <td className={`border border-gray-600 px-4 py-3 text-right font-mono font-bold ${grandBalance >= 0 ? "text-blue-200 bg-blue-900/50" : "text-orange-200 bg-orange-900/50"}`}>
                {grandBalance >= 0 ? "+" : "−"}{formatRON(Math.abs(grandBalance))}
              </td>
              <td className={`border border-gray-600 px-4 py-3 text-right text-xs font-bold ${
                grandRate === "—" ? "text-gray-400" :
                Number(grandRate) >= 20 ? "text-green-300 bg-green-900/40" :
                Number(grandRate) >= 0  ? "text-orange-300 bg-orange-900/40" :
                                         "text-red-300 bg-red-900/40"
              }`}>
                {grandRate !== "—" ? `${grandRate}%` : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

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

export default function ReportsClient({ initialData, initialPeriod }: Props) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [data, setData] = useState<ReportsData>(initialData);
  const [loading, setLoading] = useState(false);
  const [coach, setCoach] = useState<CoachResult | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  const changePeriod = async (newPeriod: Period) => {
    if (newPeriod === period) return;
    setPeriod(newPeriod);
    setLoading(true);
    setCoach(null);
    try {
      const res = await fetch(`/api/reports?period=${newPeriod}`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
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
        console.error("[AI-COACH] Server error:", json);
        setCoachError(`Eroare: ${json.error ?? "Eroare server"}`);
        return;
      }
      setCoach(json);
    } catch (err) {
      console.error("[AI-COACH] Network error:", err);
      setCoachError("Nu am putut obține analiza. Încearcă din nou.");
    } finally {
      setCoachLoading(false);
    }
  }, [period, data]);

  const { expensesByCategory, expensesByMonth, monthlyPivot, summary } = data;
  const hasData = expensesByCategory.length > 0 || expensesByMonth.length > 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rapoarte</h2>
          <p className="text-gray-500 mt-1">Analiza cheltuielilor tale</p>
        </div>

        {/* Selector perioadă */}
        <div className="flex gap-2 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 p-1.5">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => changePeriod(opt.value)}
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                period === opt.value
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-teal-50 hover:text-teal-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Cheltuieli</p>
          <p className="text-2xl font-bold text-red-600">
            {loading ? "..." : `${formatRON(summary.totalExpense)} RON`}
          </p>
        </div>
        <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Venituri</p>
          <p className="text-2xl font-bold text-green-600">
            {loading ? "..." : `${formatRON(summary.totalIncome)} RON`}
          </p>
        </div>
        <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 p-5">
          <p className="text-sm text-gray-500 mb-1">Balanță</p>
          {loading ? (
            <p className="text-2xl font-bold text-gray-400">...</p>
          ) : (() => {
            const balance = summary.totalIncome - summary.totalExpense;
            return (
              <p className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                {balance >= 0 ? "+" : ""}{formatRON(balance)} RON
              </p>
            );
          })()}
        </div>
      </div>

      {/* Stare goală */}
      {!loading && !hasData && (
        <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 p-16 text-center">
          <p className="text-5xl mb-4">📊</p>
          <p className="text-xl font-semibold text-gray-700">Nu există cheltuieli pentru această perioadă</p>
          <p className="text-gray-400 mt-2 text-sm">Importă tranzacții din pagina Upload pentru a vedea rapoarte</p>
        </div>
      )}

      {/* Grafice */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart — cheltuieli pe categorii */}
          <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-6">Cheltuieli pe categorii</h3>
            {expensesByCategory.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Nicio cheltuială în perioadă</div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={expensesByCategory as unknown as Record<string, unknown>[]}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={110}
                    innerRadius={50}
                    paddingAngle={2}
                  >
                    {expensesByCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    formatter={(value, entry) => {
                      const d = entry.payload as unknown as CategoryData;
                      return (
                        <span className="text-xs text-gray-700">
                          {d?.icon} {value}
                        </span>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar Chart — cheltuieli pe luni */}
          <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-6">Cheltuieli pe luni</h3>
            {expensesByMonth.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Nicio cheltuială în perioadă</div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={expensesByMonth} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    width={40}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(20,184,166,0.08)" }} />
                  <Bar dataKey="total" fill="#14b8a6" radius={[6, 6, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 p-6 h-80 flex items-center justify-center">
              <p className="text-gray-400 text-sm animate-pulse">Se încarcă datele...</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabel Pivot lunar */}
      <div className="mt-6">
        <PivotTable rows={monthlyPivot ?? []} loading={loading} />
      </div>

      {/* AI Financial Coach */}
      <div className="mt-8">
        {!coach && !coachLoading && (
          <div className="flex justify-center">
            <button
              onClick={analyzeWithAI}
              disabled={loading || coachLoading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <span className="text-lg">🤖</span>
              Analizează cheltuielile cu AI
            </button>
          </div>
        )}

        {coachLoading && (
          <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 p-10 text-center">
            <p className="text-3xl mb-3 animate-bounce">🤖</p>
            <p className="text-gray-600 font-medium">Claude analizează cheltuielile tale...</p>
            <p className="text-gray-400 text-sm mt-1">Câteva secunde</p>
          </div>
        )}

        {coachError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
            <p className="text-red-600 text-sm">{coachError}</p>
            <button onClick={analyzeWithAI} className="mt-3 text-sm text-teal-600 underline cursor-pointer">
              Încearcă din nou
            </button>
          </div>
        )}

        {coach && !coachLoading && (
          <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/70 p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">🤖 AI Financial Coach</h3>
                <p className="text-sm text-gray-500 mt-0.5">Analiză bazată pe datele tale reale</p>
              </div>
              <button
                onClick={() => setCoach(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer"
                title="Închide"
              >
                ×
              </button>
            </div>

            {/* Score + Explanation */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 bg-gray-50/60 rounded-xl p-5">
              <ScoreRing score={coach.healthScore} />
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Scor de sănătate financiară</p>
                <p className="text-gray-600 text-sm leading-relaxed">{coach.scoreExplanation}</p>
              </div>
            </div>

            {/* Positive observation */}
            <div className="flex gap-3 bg-green-50 border border-green-100 rounded-xl p-4 mb-4">
              <span className="text-xl">✅</span>
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Ce faci bine</p>
                <p className="text-sm text-green-800">{coach.positiveObservation}</p>
              </div>
            </div>

            {/* Tips */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Sfaturi personalizate</p>
              <ul className="space-y-3">
                {coach.tips.map((tip, i) => (
                  <li key={i} className="flex gap-3 bg-teal-50/60 rounded-xl p-4">
                    <span className="text-teal-500 font-bold text-sm mt-0.5">{i + 1}.</span>
                    <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Re-analyze */}
            <div className="mt-5 flex justify-end">
              <button
                onClick={analyzeWithAI}
                className="text-xs text-teal-600 hover:text-teal-800 underline cursor-pointer"
              >
                Regenerează analiza
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
