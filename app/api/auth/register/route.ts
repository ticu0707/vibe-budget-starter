import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, parolă și nume sunt obligatorii" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Înregistrare prin Supabase Auth
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error("[REGISTER] Supabase auth error:", error.message);
      const msg = error.message ?? "";
      let friendly = "Eroare la înregistrare. Încearcă din nou.";
      if (msg.includes("already registered") || msg.includes("already exists")) {
        friendly = "Există deja un cont cu această adresă de email.";
      } else if (msg.includes("Password should be at least")) {
        friendly = "Parola trebuie să aibă minim 6 caractere.";
      } else if (msg.includes("Invalid email") || msg.includes("invalid email")) {
        friendly = "Adresă de email invalidă.";
      } else if (msg.includes("rate limit") || msg.includes("too many")) {
        friendly = "Prea multe încercări. Încearcă din nou mai târziu.";
      }
      return NextResponse.json({ error: friendly }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: "Eroare la creare cont" }, { status: 500 });
    }

    // Insert în public.users
    await db.insert(schema.users).values({
      id: data.user.id,
      email,
      name,
      nativeCurrency: "RON",
    });

    return NextResponse.json({ message: "Cont creat cu succes" }, { status: 201 });
  } catch (error) {
    console.error("[REGISTER] Error:", error);
    return NextResponse.json({ error: "Eroare internă server" }, { status: 500 });
  }
}
