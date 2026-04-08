import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { autoCategorize } from "@/lib/auto-categorization";
import { getAIICategories } from "@/lib/auto-categorization/categories-rules";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    // Fetch toate categoriile userului
    let categories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.userId, user.id));

    // Seed automat dacă nu există cele 12 categorii de sistem
    const systemNames = getAIICategories().map((c) => c.name);
    const existingNames = categories.map((c) => c.name);
    const missingSystems = systemNames.filter((n) => !existingNames.includes(n));

    if (missingSystems.length > 0) {
      const toInsert = getAIICategories().filter((c) => missingSystems.includes(c.name));
      await db.insert(schema.categories).values(
        toInsert.map((cat) => ({
          userId: user.id,
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          description: cat.description,
          isSystemCategory: true,
        }))
      );
      // Re-fetch după seed
      categories = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.userId, user.id));
    }

    // Mapping: nume categorie → id
    const categoryNameToId: Record<string, string> = {};
    for (const cat of categories) {
      categoryNameToId[cat.name] = cat.id;
    }

    // Fetch keyword-urile salvate de user
    const userKeywords = await db
      .select()
      .from(schema.userKeywords)
      .where(eq(schema.userKeywords.userId, user.id));

    // Fetch tranzacțiile NECATEGORIZATE ale userului
    const uncategorized = await db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, user.id),
          isNull(schema.transactions.categoryId)
        )
      );

    let updated = 0;

    for (const tx of uncategorized) {
      const categoryId = autoCategorize(
        tx.description,
        userKeywords,
        categoryNameToId
      );

      if (categoryId) {
        await db
          .update(schema.transactions)
          .set({ categoryId })
          .where(eq(schema.transactions.id, tx.id));
        updated++;
      }
    }

    return NextResponse.json({
      updated,
      total: uncategorized.length,
      message: `${updated} din ${uncategorized.length} tranzacții categorizate`,
    });
  } catch (error) {
    console.error("[AUTO-CATEGORIZE] Error:", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}
