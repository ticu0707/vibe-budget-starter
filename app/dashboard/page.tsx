import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Luna curentă
  const now = new Date();
  const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDayDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const lastDay = `${lastDayDate.getFullYear()}-${String(lastDayDate.getMonth() + 1).padStart(2, "0")}-${String(lastDayDate.getDate()).padStart(2, "0")}`;

  // Tranzacții luna curentă
  const monthTransactions = await db
    .select()
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.userId, user.id),
        gte(schema.transactions.date, firstDay),
        lte(schema.transactions.date, lastDay)
      )
    )
    .orderBy(sql`${schema.transactions.date} DESC`)
    .limit(5);

  // Calcule stats
  const allTransactions = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.userId, user.id));

  const totalBalance = allTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const venituri = monthTransactions
    .filter((t) => Number(t.amount) > 0)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const cheltuieli = monthTransactions
    .filter((t) => Number(t.amount) < 0)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const economii = venituri + cheltuieli;

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

  const monthName = now.toLocaleDateString("ro-RO", { month: "long", year: "numeric" });

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 mt-1 capitalize">{monthName}</p>
        </div>
        <Link
          href="/dashboard/transactions"
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-5 py-2.5 transition-colors"
        >
          + Adaugă tranzacție
        </Link>
      </div>

      {/* Navigare rapidă */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Link href="/dashboard/banks" className="bg-white/40 backdrop-blur-md rounded-2xl shadow border border-white/60 p-4 flex items-center gap-3 hover:bg-white/60 transition-colors">
          <span className="text-3xl">🏦</span>
          <div>
            <p className="font-semibold text-gray-800">Bănci</p>
            <p className="text-xs text-gray-500">Gestionează conturi</p>
          </div>
        </Link>
        <Link href="/dashboard/categories" className="bg-white/40 backdrop-blur-md rounded-2xl shadow border border-white/60 p-4 flex items-center gap-3 hover:bg-white/60 transition-colors">
          <span className="text-3xl">📁</span>
          <div>
            <p className="font-semibold text-gray-800">Categorii</p>
            <p className="text-xs text-gray-500">Venituri & cheltuieli</p>
          </div>
        </Link>
        <Link href="/dashboard/currencies" className="bg-white/40 backdrop-blur-md rounded-2xl shadow border border-white/60 p-4 flex items-center gap-3 hover:bg-white/60 transition-colors">
          <span className="text-3xl">💱</span>
          <div>
            <p className="font-semibold text-gray-800">Valute</p>
            <p className="text-xs text-gray-500">RON, EUR, USD</p>
          </div>
        </Link>
      </div>

      {/* Stats carduri */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total sold"
          value={`${formatAmount(totalBalance)} RON`}
          icon="💰"
          color="teal"
        />
        <StatCard
          label="Venituri luna"
          value={`${formatAmount(venituri)} RON`}
          icon="📈"
          color="green"
        />
        <StatCard
          label="Cheltuieli luna"
          value={`${formatAmount(Math.abs(cheltuieli))} RON`}
          icon="📉"
          color="red"
        />
        <StatCard
          label="Economii luna"
          value={`${formatAmount(economii)} RON`}
          icon="🐷"
          color="orange"
        />
      </div>

      {/* Tranzacții recente */}
      <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Tranzacții recente</h3>
          <Link href="/dashboard/transactions" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
            Vezi toate →
          </Link>
        </div>

        {monthTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-medium">Nicio tranzacție încă</p>
            <p className="text-sm mt-1">Adaugă manual sau importă un extras bancar</p>
            <Link
              href="/dashboard/upload"
              className="inline-block mt-4 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl px-5 py-2 transition-colors"
            >
              📤 Upload CSV/Excel
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {monthTransactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between py-3 px-4 bg-white/50 rounded-xl"
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm">{t.description}</p>
                  <p className="text-xs text-gray-400">{t.date}</p>
                </div>
                <span
                  className={`font-semibold text-sm ${
                    Number(t.amount) >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {Number(t.amount) >= 0 ? "+" : ""}
                  {formatAmount(Number(t.amount))} {t.currency}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: "teal" | "green" | "red" | "orange";
}) {
  const colorMap = {
    teal: "text-teal-600",
    green: "text-green-600",
    red: "text-red-500",
    orange: "text-orange-500",
  };

  return (
    <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-5">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      <p className={`text-xl font-bold ${colorMap[color]}`}>{value}</p>
    </div>
  );
}
