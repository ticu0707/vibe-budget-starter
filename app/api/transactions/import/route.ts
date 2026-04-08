import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { autoCategorize } from "@/lib/auto-categorization";

interface TransactionInput {
  date: string;
  description: string;
  amount: number;
  currency: string;
  type?: string;
  bankId?: string;
}

interface ImportBody {
  transactions: TransactionInput[];
  bankId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const body: ImportBody = await request.json();
    const { transactions, bankId } = body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: "Lista de tranzacții este obligatorie și nu poate fi goală" },
        { status: 400 }
      );
    }

    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      if (!t.date || !t.description || t.amount === undefined || t.amount === null || !t.currency) {
        return NextResponse.json(
          { error: `Tranzacția ${i + 1}: data, descriere, sumă și valută sunt obligatorii` },
          { status: 400 }
        );
      }
    }

    const userKeywords = await db
      .select()
      .from(schema.userKeywords)
      .where(eq(schema.userKeywords.userId, user.id));

    let categorizedCount = 0;

    const values = transactions.map((t) => {
      const categoryId = autoCategorize(t.description, userKeywords);
      if (categoryId) categorizedCount++;

      return {
        userId: user.id,
        bankId: t.bankId || bankId || null,
        categoryId: categoryId || null,
        date: t.date,
        description: t.description.trim(),
        amount: Number(t.amount),
        currency: t.currency.toUpperCase().trim(),
      };
    });

    await db.insert(schema.transactions).values(values);

    return NextResponse.json(
      {
        message: "Tranzacții importate cu succes",
        imported: transactions.length,
        categorized: categorizedCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[TRANSACTIONS IMPORT] Error:", error);
    return NextResponse.json({ error: "Eroare internă server" }, { status: 500 });
  }
}
