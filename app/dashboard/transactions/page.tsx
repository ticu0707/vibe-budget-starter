import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import TransactionsClient from "./TransactionsClient";

export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [transactions, banks, categories, currencies] = await Promise.all([
    db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, user.id))
      .orderBy(sql`${schema.transactions.date} DESC, ${schema.transactions.createdAt} DESC`),
    db
      .select()
      .from(schema.banks)
      .where(eq(schema.banks.userId, user.id))
      .orderBy(schema.banks.name),
    db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.userId, user.id))
      .orderBy(schema.categories.type, schema.categories.name),
    db
      .select()
      .from(schema.currencies)
      .where(eq(schema.currencies.userId, user.id))
      .orderBy(schema.currencies.code),
  ]);

  return (
    <TransactionsClient
      initialTransactions={transactions}
      banks={banks}
      categories={categories}
      currencies={currencies}
    />
  );
}
