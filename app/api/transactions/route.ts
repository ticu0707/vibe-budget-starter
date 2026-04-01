import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, eq, ilike, gte, lte, gt, lt, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type"); // "income" | "expense" | null
    const bankId = searchParams.get("bankId");
    const categoryId = searchParams.get("categoryId");
    const currency = searchParams.get("currency");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const conditions = [eq(schema.transactions.userId, user.id)];

    if (search) {
      conditions.push(ilike(schema.transactions.description, `%${search}%`));
    }
    if (type === "income") {
      conditions.push(gt(schema.transactions.amount, 0));
    }
    if (type === "expense") {
      conditions.push(lt(schema.transactions.amount, 0));
    }
    if (bankId) {
      conditions.push(eq(schema.transactions.bankId, bankId));
    }
    if (categoryId) {
      conditions.push(eq(schema.transactions.categoryId, categoryId));
    }
    if (currency) {
      conditions.push(eq(schema.transactions.currency, currency));
    }
    if (dateFrom) {
      conditions.push(gte(schema.transactions.date, dateFrom));
    }
    if (dateTo) {
      conditions.push(lte(schema.transactions.date, dateTo));
    }

    const transactions = await db
      .select()
      .from(schema.transactions)
      .where(and(...conditions))
      .orderBy(sql`${schema.transactions.date} DESC, ${schema.transactions.createdAt} DESC`);

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("[TRANSACTIONS GET] Error:", error);
    return NextResponse.json({ error: "Eroare internă server" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { date, description, amount, currency, bankId, categoryId } = await request.json();

    if (!date || !description || amount === undefined || amount === null || !currency) {
      return NextResponse.json(
        { error: "Data, descriere, sumă și valută sunt obligatorii" },
        { status: 400 }
      );
    }

    const [transaction] = await db
      .insert(schema.transactions)
      .values({
        userId: user.id,
        date,
        description: description.trim(),
        amount: Number(amount),
        currency: currency.toUpperCase().trim(),
        bankId: bankId || null,
        categoryId: categoryId || null,
      })
      .returning();

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("[TRANSACTIONS POST] Error:", error);
    return NextResponse.json({ error: "Eroare internă server" }, { status: 500 });
  }
}
