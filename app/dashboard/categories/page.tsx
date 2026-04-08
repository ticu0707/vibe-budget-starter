import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import CategoriesClient from "./CategoriesClient";
import { getAIICategories } from "@/lib/auto-categorization/categories-rules";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let categories = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.userId, user.id))
    .orderBy(schema.categories.createdAt);

  // Seed automat la primul acces — doar dacă nu există nicio categorie
  if (categories.length === 0) {
    const systemCategories = getAIICategories();
    await db.insert(schema.categories).values(
      systemCategories.map((cat) => ({
        userId: user.id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        description: cat.description,
        isSystemCategory: true,
      }))
    );

    categories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.userId, user.id))
      .orderBy(schema.categories.createdAt);
  }

  return <CategoriesClient initialCategories={categories} />;
}
