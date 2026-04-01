import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const currencies = await db
      .select()
      .from(schema.currencies)
      .where(eq(schema.currencies.userId, user.id))
      .orderBy(schema.currencies.createdAt);

    return NextResponse.json({ currencies });
  } catch (error) {
    console.error("[CURRENCIES GET] Error:", error);
    return NextResponse.json({ error: "Eroare internă server" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { code, name, symbol } = await request.json();

    if (!code || !name || !symbol) {
      return NextResponse.json({ error: "Code, nume și simbol sunt obligatorii" }, { status: 400 });
    }

    // Verifică dacă valuta există deja
    const existing = await db
      .select()
      .from(schema.currencies)
      .where(
        and(
          eq(schema.currencies.userId, user.id),
          eq(schema.currencies.code, code.toUpperCase())
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Valuta există deja" }, { status: 409 });
    }

    const [currency] = await db
      .insert(schema.currencies)
      .values({
        userId: user.id,
        code: code.toUpperCase().trim(),
        name: name.trim(),
        symbol: symbol.trim(),
      })
      .returning();

    return NextResponse.json({ currency }, { status: 201 });
  } catch (error) {
    console.error("[CURRENCIES POST] Error:", error);
    return NextResponse.json({ error: "Eroare internă server" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { id } = await request.json();

    await db
      .delete(schema.currencies)
      .where(and(eq(schema.currencies.id, id), eq(schema.currencies.userId, user.id)));

    return NextResponse.json({ message: "Valută ștearsă" });
  } catch (error) {
    console.error("[CURRENCIES DELETE] Error:", error);
    return NextResponse.json({ error: "Eroare internă server" }, { status: 500 });
  }
}
