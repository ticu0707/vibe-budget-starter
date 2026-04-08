import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { keyword, categoryId } = await request.json();

    if (!keyword?.trim() || !categoryId) {
      return NextResponse.json({ error: "Keyword și categoryId sunt obligatorii" }, { status: 400 });
    }

    const cleanKeyword = keyword.trim().toLowerCase();

    // Verificăm dacă keyword-ul există deja pentru acest utilizator
    const existing = await db
      .select()
      .from(schema.userKeywords)
      .where(
        and(
          eq(schema.userKeywords.userId, user.id),
          eq(schema.userKeywords.keyword, cleanKeyword)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Dacă există dar cu altă categorie, îl actualizăm
      if (existing[0].categoryId !== categoryId) {
        await db
          .update(schema.userKeywords)
          .set({ categoryId })
          .where(eq(schema.userKeywords.id, existing[0].id));
        return NextResponse.json({ saved: true, updated: true, keyword: cleanKeyword });
      }
      // Dacă există cu aceeași categorie, nu facem nimic
      return NextResponse.json({ saved: false, duplicate: true, keyword: cleanKeyword });
    }

    await db.insert(schema.userKeywords).values({
      userId: user.id,
      keyword: cleanKeyword,
      categoryId,
    });

    return NextResponse.json({ saved: true, keyword: cleanKeyword }, { status: 201 });
  } catch (error) {
    console.error("[KEYWORDS POST] Error:", error);
    return NextResponse.json({ error: "Eroare internă server" }, { status: 500 });
  }
}
