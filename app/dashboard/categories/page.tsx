import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import CategoriesClient from "./CategoriesClient";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const categories = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.userId, user.id))
    .orderBy(schema.categories.createdAt);

  return <CategoriesClient initialCategories={categories} />;
}
