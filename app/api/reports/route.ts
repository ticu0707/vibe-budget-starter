import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, eq, lt, gte, gt, sql, desc } from "drizzle-orm";
import { startOfMonth, subMonths, format } from "date-fns";
import { ro } from "date-fns/locale";

type Period = "current_month" | "last_3_months" | "last_6_months" | "all";

function getDateFrom(period: Period): string | null {
  const now = new Date();
  switch (period) {
    case "current_month":
      return format(startOfMonth(now), "yyyy-MM-dd");
    case "last_3_months":
      return format(subMonths(now, 3), "yyyy-MM-dd");
    case "last_6_months":
      return format(subMonths(now, 6), "yyyy-MM-dd");
    case "all":
      return null;
  }
}

function monthLabel(yearMonth: string): string {
  // "2026-01" → "Ian 2026"
  const [year, month] = yearMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return format(date, "MMM yyyy", { locale: ro });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") ?? "current_month") as Period;
    const dateFrom = getDateFrom(period);

    const dateCondition = dateFrom
      ? gte(schema.transactions.date, dateFrom)
      : undefined;

    const [categoryRows, monthRows, incomeRows, incomeMonthRows] = await Promise.all([
      // Query A: cheltuieli grupate pe categorie
      db
        .select({
          categoryId: schema.transactions.categoryId,
          name: schema.categories.name,
          icon: schema.categories.icon,
          total: sql<number>`SUM(ABS(${schema.transactions.amount}))`,
        })
        .from(schema.transactions)
        .leftJoin(
          schema.categories,
          eq(schema.transactions.categoryId, schema.categories.id)
        )
        .where(
          and(
            eq(schema.transactions.userId, user.id),
            lt(schema.transactions.amount, 0),
            dateCondition
          )
        )
        .groupBy(
          schema.transactions.categoryId,
          schema.categories.name,
          schema.categories.icon
        )
        .orderBy(desc(sql`SUM(ABS(${schema.transactions.amount}))`)),

      // Query B: cheltuieli grupate pe lună
      db
        .select({
          month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${schema.transactions.date}::date), 'YYYY-MM')`,
          total: sql<number>`SUM(ABS(${schema.transactions.amount}))`,
        })
        .from(schema.transactions)
        .where(
          and(
            eq(schema.transactions.userId, user.id),
            lt(schema.transactions.amount, 0),
            dateCondition
          )
        )
        .groupBy(sql`DATE_TRUNC('month', ${schema.transactions.date}::date)`)
        .orderBy(sql`DATE_TRUNC('month', ${schema.transactions.date}::date)`),

      // Query C: total venituri
      db
        .select({
          total: sql<number>`COALESCE(SUM(${schema.transactions.amount}), 0)`,
        })
        .from(schema.transactions)
        .where(
          and(
            eq(schema.transactions.userId, user.id),
            gt(schema.transactions.amount, 0),
            dateCondition
          )
        ),

      // Query D: venituri grupate pe lună
      db
        .select({
          month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${schema.transactions.date}::date), 'YYYY-MM')`,
          total: sql<number>`SUM(${schema.transactions.amount})`,
        })
        .from(schema.transactions)
        .where(
          and(
            eq(schema.transactions.userId, user.id),
            gt(schema.transactions.amount, 0),
            dateCondition
          )
        )
        .groupBy(sql`DATE_TRUNC('month', ${schema.transactions.date}::date)`)
        .orderBy(sql`DATE_TRUNC('month', ${schema.transactions.date}::date)`),
    ]);

    const totalExpense = categoryRows.reduce((sum, r) => sum + Number(r.total), 0);
    const totalIncome = Number(incomeRows[0]?.total ?? 0);

    // Construiește pivot lunar (cheltuieli + venituri per lună)
    const incomeByMonth = new Map(incomeMonthRows.map((r) => [r.month, Number(r.total)]));
    const expenseByMonth = new Map(monthRows.map((r) => [r.month, Number(r.total)]));
    const allMonths = Array.from(new Set([...incomeByMonth.keys(), ...expenseByMonth.keys()])).sort();
    const monthlyPivot = allMonths.map((month) => {
      const expense = expenseByMonth.get(month) ?? 0;
      const income = incomeByMonth.get(month) ?? 0;
      return {
        month,
        label: monthLabel(month),
        year: month.slice(0, 4),
        expense,
        income,
        balance: income - expense,
      };
    });

    const expensesByCategory = categoryRows.map((r) => ({
      categoryId: r.categoryId ?? null,
      name: r.name ?? "Necategorizat",
      icon: r.icon ?? "📁",
      total: Number(r.total),
      percentage: totalExpense > 0 ? Math.round((Number(r.total) / totalExpense) * 1000) / 10 : 0,
    }));

    const expensesByMonth = monthRows.map((r) => ({
      month: r.month,
      label: monthLabel(r.month),
      total: Number(r.total),
    }));

    return NextResponse.json({
      expensesByCategory,
      expensesByMonth,
      monthlyPivot,
      summary: { totalExpense, totalIncome },
    });
  } catch (error) {
    console.error("[REPORTS GET] Error:", error);
    return NextResponse.json({ error: "Eroare internă server" }, { status: 500 });
  }
}
