import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, eq, lt, gt, gte, sql, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { startOfMonth, format } from "date-fns";
import { ro } from "date-fns/locale";
import ReportsClient from "./ReportsClient";

function monthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return format(date, "MMM yyyy", { locale: ro });
}

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dateFrom = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const dateCondition = gte(schema.transactions.date, dateFrom);

  const [categoryRows, monthRows, incomeRows, incomeMonthRows] = await Promise.all([
    db
      .select({
        categoryId: schema.transactions.categoryId,
        name: schema.categories.name,
        icon: schema.categories.icon,
        total: sql<number>`SUM(ABS(${schema.transactions.amount}))`,
      })
      .from(schema.transactions)
      .leftJoin(schema.categories, eq(schema.transactions.categoryId, schema.categories.id))
      .where(and(eq(schema.transactions.userId, user.id), lt(schema.transactions.amount, 0), dateCondition))
      .groupBy(schema.transactions.categoryId, schema.categories.name, schema.categories.icon)
      .orderBy(desc(sql`SUM(ABS(${schema.transactions.amount}))`)),

    db
      .select({
        month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${schema.transactions.date}::date), 'YYYY-MM')`,
        total: sql<number>`SUM(ABS(${schema.transactions.amount}))`,
      })
      .from(schema.transactions)
      .where(and(eq(schema.transactions.userId, user.id), lt(schema.transactions.amount, 0), dateCondition))
      .groupBy(sql`DATE_TRUNC('month', ${schema.transactions.date}::date)`)
      .orderBy(sql`DATE_TRUNC('month', ${schema.transactions.date}::date)`),

    db
      .select({ total: sql<number>`COALESCE(SUM(${schema.transactions.amount}), 0)` })
      .from(schema.transactions)
      .where(and(eq(schema.transactions.userId, user.id), gt(schema.transactions.amount, 0), dateCondition)),

    db
      .select({
        month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${schema.transactions.date}::date), 'YYYY-MM')`,
        total: sql<number>`SUM(${schema.transactions.amount})`,
      })
      .from(schema.transactions)
      .where(and(eq(schema.transactions.userId, user.id), gt(schema.transactions.amount, 0), dateCondition))
      .groupBy(sql`DATE_TRUNC('month', ${schema.transactions.date}::date)`)
      .orderBy(sql`DATE_TRUNC('month', ${schema.transactions.date}::date)`),
  ]);

  const totalExpense = categoryRows.reduce((sum, r) => sum + Number(r.total), 0);
  const totalIncome = Number(incomeRows[0]?.total ?? 0);

  const incomeByMonth = new Map(incomeMonthRows.map((r) => [r.month, Number(r.total)]));
  const expenseByMonth = new Map(monthRows.map((r) => [r.month, Number(r.total)]));
  const allMonths = Array.from(new Set([...incomeByMonth.keys(), ...expenseByMonth.keys()])).sort();
  const monthlyPivot = allMonths.map((month) => {
    const expense = expenseByMonth.get(month) ?? 0;
    const income = incomeByMonth.get(month) ?? 0;
    return { month, label: monthLabel(month), year: month.slice(0, 4), expense, income, balance: income - expense };
  });

  const initialData = {
    expensesByCategory: categoryRows.map((r) => ({
      categoryId: r.categoryId ?? null,
      name: r.name ?? "Necategorizat",
      icon: r.icon ?? "📁",
      total: Number(r.total),
      percentage: totalExpense > 0 ? Math.round((Number(r.total) / totalExpense) * 1000) / 10 : 0,
    })),
    expensesByMonth: monthRows.map((r) => ({
      month: r.month,
      label: monthLabel(r.month),
      total: Number(r.total),
    })),
    monthlyPivot,
    summary: { totalExpense, totalIncome },
  };

  return <ReportsClient initialData={initialData} initialPeriod="current_month" />;
}
