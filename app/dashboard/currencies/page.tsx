import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import CurrenciesClient from "./CurrenciesClient";

export default async function CurrenciesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const currencies = await db
    .select()
    .from(schema.currencies)
    .where(eq(schema.currencies.userId, user.id))
    .orderBy(schema.currencies.createdAt);

  return <CurrenciesClient initialCurrencies={currencies} />;
}
