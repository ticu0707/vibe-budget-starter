import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ACCESS_PASSWORD = process.env.UNLOCK_PASSWORD ?? "vibe-acces-2026";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password || password !== ACCESS_PASSWORD) {
      return NextResponse.json({ error: "Cod incorect" }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    if (user.user_metadata?.unlocked === true) {
      return NextResponse.json({ error: "Codul a fost deja folosit pentru acest cont." }, { status: 409 });
    }

    const { error } = await supabase.auth.updateUser({
      data: { unlocked: true },
    });

    if (error) {
      return NextResponse.json({ error: "Eroare server" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}
