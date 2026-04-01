import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { id } = await params;
    const { date, description, amount, currency, bankId, categoryId } = await request.json();

    if (!date || !description || amount === undefined || amount === null || !currency) {
      return NextResponse.json(
        { error: "Data, descriere, sumă și valută sunt obligatorii" },
        { status: 400 }
      );
    }

    const [transaction] = await db
      .update(schema.transactions)
      .set({
        date,
        description: description.trim(),
        amount: Number(amount),
        currency: currency.toUpperCase().trim(),
        bankId: bankId || null,
        categoryId: categoryId || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.transactions.id, id),
          eq(schema.transactions.userId, user.id)
        )
      )
      .returning();

    if (!transaction) {
      return NextResponse.json({ error: "Tranzacție negăsită" }, { status: 404 });
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("[TRANSACTIONS PUT] Error:", error);
    return NextResponse.json({ error: "Eroare internă server" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { id } = await params;

    await db
      .delete(schema.transactions)
      .where(
        and(
          eq(schema.transactions.id, id),
          eq(schema.transactions.userId, user.id)
        )
      );

    return NextResponse.json({ message: "Tranzacție ștearsă" });
  } catch (error) {
    console.error("[TRANSACTIONS DELETE] Error:", error);
    return NextResponse.json({ error: "Eroare internă server" }, { status: 500 });
  }
}
