import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, eq, isNull, ilike } from "drizzle-orm";

function extractKeyword(description: string): string | null {
  const cleaned = description
    .replace(/^Card:\d+\s+[X\d ]+\s+/i, "")
    .replace(/^POS comerciant\s+[\d.,]+\s+\w+\s+[\d-]+\s+/i, "")
    .replace(/^MOBILE-/i, "")
    .replace(/^Plata\s+/i, "")
    .replace(/Curs\*.*$/i, "")
    .replace(/IBAN\s+Platitor:.*/i, "")
    .replace(/Platitor:.*/i, "")
    .trim();

  const words = cleaned.split(/[\s,./\\|]+/);
  const keyword = words.find((w) => w.length >= 3 && !/^\d+$/.test(w));
  return keyword ? keyword.toLowerCase() : null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { description, categoryId } = await request.json();

    if (!description || !categoryId) {
      return NextResponse.json({ error: "description și categoryId sunt obligatorii" }, { status: 400 });
    }

    const keyword = extractKeyword(description);
    if (!keyword) {
      return NextResponse.json({ error: "Nu s-a putut extrage un keyword din descriere" }, { status: 400 });
    }

    // Salvează keyword-ul în user_keywords
    const existing = await db
      .select()
      .from(schema.userKeywords)
      .where(and(eq(schema.userKeywords.userId, user.id), eq(schema.userKeywords.keyword, keyword)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.userKeywords).values({ userId: user.id, keyword, categoryId });
    } else if (existing[0].categoryId !== categoryId) {
      await db.update(schema.userKeywords).set({ categoryId }).where(eq(schema.userKeywords.id, existing[0].id));
    }

    // Găsește toate tranzacțiile necategorizate cu descriere similară
    const toUpdate = await db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, user.id),
          isNull(schema.transactions.categoryId),
          ilike(schema.transactions.description, `%${keyword}%`)
        )
      );

    for (const tx of toUpdate) {
      await db
        .update(schema.transactions)
        .set({ categoryId, updatedAt: new Date() })
        .where(eq(schema.transactions.id, tx.id));
    }

    return NextResponse.json({
      updated: toUpdate.length,
      keyword,
      message: `${toUpdate.length} tranzacții similare categorizate (keyword: "${keyword}")`,
    });
  } catch (error) {
    console.error("[APPLY-SIMILAR] Error:", error);
    return NextResponse.json({ error: "Eroare internă server" }, { status: 500 });
  }
}
